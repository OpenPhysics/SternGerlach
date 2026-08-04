/**
 * Structural-invariant tests for ExperimentGraph: rejected cycles, double-wired
 * outputs, mixed-source inputs, and the single-source rule.
 */

import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { AnalyzerType } from "../../src/common/quantum/AnalyzerType.js";
import { ParticleSource } from "../../src/stern-gerlach-screen/model/devices/ParticleSource.js";
import { ExperimentGraph } from "../../src/stern-gerlach-screen/model/ExperimentGraph.js";
import { Wire } from "../../src/stern-gerlach-screen/model/Wire.js";
import { addAnalyzer, addCounter, addSource, wire } from "./testUtilities.js";

describe("ExperimentGraph invariants", () => {
  it("rejects a second wire on the same output port", () => {
    const graph = new ExperimentGraph();
    const source = addSource(graph);
    const a = addCounter(graph);
    const b = addCounter(graph);
    wire(graph, source, 0, a);
    expect(() => wire(graph, source, 0, b)).toThrow(/already wired/);
    expect(graph.canAddWire(new Wire(source, 0, b))).toBe(false);
  });

  it("rejects wires into a device from two different source devices", () => {
    const graph = new ExperimentGraph();
    const source = addSource(graph);
    const first = addAnalyzer(graph, AnalyzerType.Z);
    const second = addAnalyzer(graph, AnalyzerType.X);
    const shared = addCounter(graph);
    wire(graph, source, 0, first);
    wire(graph, first, 0, second);
    wire(graph, first, 1, shared);
    expect(() => wire(graph, second, 0, shared)).toThrow(/different device/);
  });

  it("allows recombination: two outputs of the SAME analyzer into one device", () => {
    const graph = new ExperimentGraph();
    const analyzer = addAnalyzer(graph, AnalyzerType.X);
    const target = addAnalyzer(graph, AnalyzerType.Z);
    wire(graph, analyzer, 0, target);
    expect(() => wire(graph, analyzer, 1, target)).not.toThrow();
    expect(graph.getWiresInto(target)).toHaveLength(2);
  });

  it("rejects cycles (Java would hang)", () => {
    const graph = new ExperimentGraph();
    const a = addAnalyzer(graph, AnalyzerType.Z);
    const b = addAnalyzer(graph, AnalyzerType.X);
    const c = addAnalyzer(graph, AnalyzerType.Y);
    wire(graph, a, 0, b);
    wire(graph, b, 0, c);
    expect(() => wire(graph, c, 0, a)).toThrow(/cycle/);
    expect(() => wire(graph, a, 1, a)).toThrow(/itself/);
  });

  it("rejects wiring into the source and a second source device", () => {
    const graph = new ExperimentGraph();
    const source = addSource(graph);
    const analyzer = addAnalyzer(graph, AnalyzerType.Z);
    expect(() => wire(graph, analyzer, 0, source)).toThrow(/no input/);
    expect(() => graph.addDevice(new ParticleSource(new Vector2(0, 0)))).toThrow(/already has a particle source/);
  });

  it("removing a device removes its attached wires", () => {
    const graph = new ExperimentGraph();
    const source = addSource(graph);
    const analyzer = addAnalyzer(graph, AnalyzerType.Z);
    const counter = addCounter(graph);
    wire(graph, source, 0, analyzer);
    wire(graph, analyzer, 0, counter);
    graph.removeDevice(analyzer);
    expect(graph.wires.length).toBe(0);
    expect(graph.getNext(source, 0)).toBeNull();
  });

  it("coalesces a batch into one change signal per collection", () => {
    const graph = new ExperimentGraph();
    let devicesChanged = 0;
    let wiresChanged = 0;
    let anyChanged = 0;
    graph.devicesChangedEmitter.addListener(() => devicesChanged++);
    graph.wiresChangedEmitter.addListener(() => wiresChanged++);
    graph.changedEmitter.addListener(() => anyChanged++);

    graph.batch(() => {
      const source = addSource(graph);
      const analyzer = addAnalyzer(graph, AnalyzerType.Z);
      const counter = addCounter(graph);
      wire(graph, source, 0, analyzer);
      wire(graph, analyzer, 0, counter);
    });

    expect(devicesChanged).toBe(1);
    expect(wiresChanged).toBe(1);
    expect(anyChanged).toBe(1);
  });

  it("emits per edit when not batched", () => {
    const graph = new ExperimentGraph();
    let devicesChanged = 0;
    graph.devicesChangedEmitter.addListener(() => devicesChanged++);
    addSource(graph);
    addAnalyzer(graph, AnalyzerType.Z);
    expect(devicesChanged).toBe(2);
  });

  it("nests batches, emitting only when the outermost one closes", () => {
    const graph = new ExperimentGraph();
    let devicesChanged = 0;
    graph.devicesChangedEmitter.addListener(() => devicesChanged++);

    graph.batch(() => {
      addSource(graph);
      graph.batch(() => {
        addAnalyzer(graph, AnalyzerType.Z);
      });
      expect(devicesChanged).toBe(0);
      addCounter(graph);
    });
    expect(devicesChanged).toBe(1);
  });

  it("still flushes pending changes when the batched work throws", () => {
    const graph = new ExperimentGraph();
    let devicesChanged = 0;
    graph.devicesChangedEmitter.addListener(() => devicesChanged++);

    expect(() =>
      graph.batch(() => {
        addSource(graph);
        throw new Error("boom");
      }),
    ).toThrow(/boom/);
    expect(devicesChanged).toBe(1);
    expect(graph.devices.length).toBe(1);
  });

  it("reports a device removal and its cascading wire removals as one edit", () => {
    const graph = new ExperimentGraph();
    const source = addSource(graph);
    const analyzer = addAnalyzer(graph, AnalyzerType.Z);
    const counter = addCounter(graph);
    wire(graph, source, 0, analyzer);
    wire(graph, analyzer, 0, counter);

    let devicesChanged = 0;
    let wiresChanged = 0;
    graph.devicesChangedEmitter.addListener(() => devicesChanged++);
    graph.wiresChangedEmitter.addListener(() => wiresChanged++);

    graph.removeDevice(analyzer);
    expect(devicesChanged).toBe(1);
    expect(wiresChanged).toBe(1);
  });
});
