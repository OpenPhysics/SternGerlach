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
});
