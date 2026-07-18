/**
 * Model-semantics tests: preset construction, Do-N analytic sampling,
 * auto-clearing counters on configuration changes, particle animation
 * end-to-end, and reset.
 */

import { BooleanProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { AnalyzerType } from "../../src/common/quantum/AnalyzerType.js";
import { SpinSystem } from "../../src/common/quantum/SpinSystem.js";
import { Analyzer } from "../../src/stern-gerlach-screen/model/devices/Analyzer.js";
import { Counter } from "../../src/stern-gerlach-screen/model/devices/Counter.js";
import { Magnet } from "../../src/stern-gerlach-screen/model/devices/Magnet.js";
import { SourceMode } from "../../src/stern-gerlach-screen/model/devices/ParticleSource.js";
import { ExperimentDefinition } from "../../src/stern-gerlach-screen/model/ExperimentDefinition.js";
import { InitialStateSetting } from "../../src/stern-gerlach-screen/model/InitialStateSetting.js";
import { SternGerlachModel } from "../../src/stern-gerlach-screen/model/SternGerlachModel.js";
import { Wire } from "../../src/stern-gerlach-screen/model/Wire.js";
import { seededRng } from "./testUtilities.js";

function presetByKey(nameKey: string): ExperimentDefinition {
  const preset = ExperimentDefinition.PRESETS.find((p) => p.nameKey === nameKey);
  if (!preset) {
    throw new Error(`no preset named ${nameKey}`);
  }
  return preset;
}

describe("SternGerlachModel", () => {
  it("builds the default preset: source, one Z analyzer, two counters with |+z⟩ → (1, 0)", () => {
    const model = new SternGerlachModel(seededRng(7));
    expect(model.initialStateProperty.value).toBe(InitialStateSetting.PLUS_Z);
    expect(model.graph.getSource()).not.toBeNull();
    const [up, down] = model.graph.getCounters();
    expect(up?.probabilityProperty.value).toBeCloseTo(1, 10);
    expect(down?.probabilityProperty.value).toBeCloseTo(0, 10);
  });

  it("unknownLab preset selects Unknown #1 and builds a Z→X chain", () => {
    const model = new SternGerlachModel(seededRng(13));
    model.experimentProperty.value = presetByKey("unknownLab");
    expect(model.initialStateProperty.value).toBe(InitialStateSetting.UNKNOWN_1);
    const analyzers = model.graph.devices.filter((d) => d instanceof Analyzer) as Analyzer[];
    expect(analyzers).toHaveLength(2);
    expect(analyzers[0]?.typeProperty.value).toBe(AnalyzerType.Z);
    expect(analyzers[1]?.typeProperty.value).toBe(AnalyzerType.X);
  });

  it("magnetIdentity preset starts the magnet dial at 72 (one full turn)", () => {
    const model = new SternGerlachModel(seededRng(17));
    model.experimentProperty.value = presetByKey("magnetIdentity");
    const magnet = model.graph.devices.find((d) => d instanceof Magnet);
    expect(magnet).toBeDefined();
    expect((magnet as Magnet).fieldNumberProperty.value).toBe(72);
  });

  it("doN(1000) with |+z⟩ into a Z analyzer puts all 1000 counts in the up counter", () => {
    const model = new SternGerlachModel(seededRng(11));
    model.doN(1000);
    const [up, down] = model.graph.getCounters();
    expect(up?.countProperty.value).toBe(1000);
    expect(down?.countProperty.value).toBe(0);
    expect(model.totalDetectedProperty.value).toBe(1000);
  });

  it("doN follows the analytic distribution for the Z→X chain preset", () => {
    const model = new SternGerlachModel(seededRng(23));
    model.experimentProperty.value = presetByKey("zThenX");
    // |+z⟩ → Z → X: all mass takes the UP branch of Z, then splits ½/½ at X.
    model.doN(20000);
    const counters = model.graph.getCounters();
    expect(model.totalDetectedProperty.value).toBe(20000);
    for (const counter of counters) {
      const fraction = counter.countProperty.value / 20000;
      expect(Math.abs(fraction - counter.probabilityProperty.value)).toBeLessThan(0.015);
    }
  });

  it("any configuration change clears counts and in-flight particles", () => {
    const model = new SternGerlachModel(seededRng(3));
    model.doN(100);
    expect(model.totalDetectedProperty.value).toBe(100);

    model.watchProperty.value = true;
    expect(model.totalDetectedProperty.value).toBe(0);
    for (const counter of model.graph.getCounters()) {
      expect(counter.countProperty.value).toBe(0);
    }

    model.doN(100);
    model.initialStateProperty.value = InitialStateSetting.UNKNOWN_2;
    expect(model.totalDetectedProperty.value).toBe(0);

    // Changing an analyzer's type is also a configuration change.
    model.doN(100);
    const analyzer = model.graph.devices.find((d) => d instanceof Analyzer) as Analyzer;
    expect(analyzer).toBeDefined();
    analyzer.typeProperty.value = AnalyzerType.X;
    expect(model.totalDetectedProperty.value).toBe(0);
  });

  it("tracks dead-end probability when an analyzer exit is blocked", () => {
    const model = new SternGerlachModel(seededRng(9));
    expect(model.deadEndProbabilityProperty.value).toBeCloseTo(0, 10);

    const analyzer = model.graph.devices.find((d) => d instanceof Analyzer) as Analyzer;
    analyzer.blockedOutputProperty.value = 0; // block UP — |+z⟩ is entirely lost
    expect(model.deadEndProbabilityProperty.value).toBeCloseTo(1, 10);

    analyzer.blockedOutputProperty.value = 1; // block DOWN — |+z⟩ still detected
    expect(model.deadEndProbabilityProperty.value).toBeCloseTo(0, 10);
  });

  it("single-fire particles fly the graph and land in counters (seeded, |+z⟩ → Z)", () => {
    const model = new SternGerlachModel(seededRng(5));
    for (let shot = 0; shot < 5; shot++) {
      model.fireSingleParticle();
      // Fly until the particle lands (generous frame budget).
      for (let frame = 0; frame < 600 && model.particleSystem.particles.length > 0; frame++) {
        model.step(1 / 60);
      }
      expect(model.particleSystem.particles).toHaveLength(0);
    }
    const [up, down] = model.graph.getCounters();
    expect(up?.countProperty.value).toBe(5);
    expect(down?.countProperty.value).toBe(0);
    expect(model.totalDetectedProperty.value).toBe(5);
  });

  it("continuous mode emits at the source rate and respects pause", () => {
    const model = new SternGerlachModel(seededRng(13));
    const source = model.graph.getSource();
    expect(source).not.toBeNull();
    source?.sourceModeProperty.set(SourceMode.CONTINUOUS);
    source?.emissionRateProperty.set(30);

    model.timer.isPlayingProperty.value = false;
    model.step(1);
    expect(model.particleSystem.particles.length).toBe(0);

    model.timer.isPlayingProperty.value = true;
    model.step(0.5); // 15 particles emitted; none finished yet (speed 1.8, path ≥ ~2 units)
    expect(model.particleSystem.particles.length).toBe(15);
  });

  it("interferometer preset restores the input state when watch is off, 50/50 when on", () => {
    const model = new SternGerlachModel(seededRng(17));
    model.experimentProperty.value = presetByKey("interferometer");
    model.initialStateProperty.value = InitialStateSetting.UNKNOWN_1; // |+z⟩

    // Counters: [last-up, last-down, first-down] by construction order.
    const counters = model.graph.getCounters();
    expect(counters).toHaveLength(3);
    expect(counters[0]?.probabilityProperty.value).toBeCloseTo(1, 10);
    expect(counters[1]?.probabilityProperty.value).toBeCloseTo(0, 10);
    expect(counters[2]?.probabilityProperty.value).toBeCloseTo(0, 10);

    model.watchProperty.value = true;
    expect(counters[0]?.probabilityProperty.value).toBeCloseTo(0.5, 10);
    expect(counters[1]?.probabilityProperty.value).toBeCloseTo(0.5, 10);
  });

  it("switching to spin-1 rebuilds analyzers with three outputs (three counters on single Z)", () => {
    const model = new SternGerlachModel(seededRng(31));
    expect(model.graph.getCounters()).toHaveLength(2);
    model.systemProperty.value = SpinSystem.SPIN_ONE;
    expect(model.graph.getCounters()).toHaveLength(3);
  });

  it("disabling Spin 1 while it is active falls the system back to spin-½", () => {
    const spinOneEnabled = new BooleanProperty(true);
    const model = new SternGerlachModel(seededRng(39), { spinOneEnabledProperty: spinOneEnabled });
    model.systemProperty.value = SpinSystem.SPIN_ONE;
    expect(model.systemProperty.value).toBe(SpinSystem.SPIN_ONE);

    spinOneEnabled.value = false;
    expect(model.systemProperty.value).toBe(SpinSystem.SPIN_HALF);
  });

  it("custom mode: hand-built interferometer reproduces the preset numbers", () => {
    const model = new SternGerlachModel(seededRng(41));
    model.experimentProperty.value = ExperimentDefinition.CUSTOM;
    model.initialStateProperty.value = InitialStateSetting.UNKNOWN_1; // |+z⟩

    const graph = model.graph;
    const source = graph.getSource();
    expect(source).not.toBeNull();
    if (!source) {
      return;
    }

    const first = new Analyzer(new Vector2(1.0, 0.3), AnalyzerType.Z);
    const middle = new Analyzer(new Vector2(1.8, 0.6), AnalyzerType.X);
    const last = new Analyzer(new Vector2(2.6, 0.6), AnalyzerType.Z);
    const upCounter = new Counter(new Vector2(3.4, 0.75));
    const downCounter = new Counter(new Vector2(3.4, 0.45));
    for (const device of [first, middle, last, upCounter, downCounter]) {
      graph.addDevice(device);
    }
    graph.addWire(new Wire(source, 0, first));
    graph.addWire(new Wire(first, 0, middle));
    graph.addWire(new Wire(middle, 0, last));
    graph.addWire(new Wire(middle, 1, last)); // recombine both X outputs
    graph.addWire(new Wire(last, 0, upCounter));
    graph.addWire(new Wire(last, 1, downCounter));

    // Watch off: the middle measurement leaves no record, so |+z⟩ is restored → all up.
    expect(upCounter.probabilityProperty.value).toBeCloseTo(1, 10);
    expect(downCounter.probabilityProperty.value).toBeCloseTo(0, 10);

    // Watch on: which-path destroys coherence → 50/50.
    model.watchProperty.value = true;
    expect(upCounter.probabilityProperty.value).toBeCloseTo(0.5, 10);
    expect(downCounter.probabilityProperty.value).toBeCloseTo(0.5, 10);
  });

  it("custom build is retained when toggling to a preset and back", () => {
    const model = new SternGerlachModel(seededRng(43));
    model.experimentProperty.value = ExperimentDefinition.CUSTOM;
    const source = model.graph.getSource();
    if (!source) {
      throw new Error("no source");
    }
    const analyzer = new Analyzer(new Vector2(1.5, 0), AnalyzerType.X);
    model.graph.addDevice(analyzer);
    model.graph.addWire(new Wire(source, 0, analyzer));
    const customDeviceCount = model.graph.devices.length;

    model.experimentProperty.value = ExperimentDefinition.DEFAULT;
    model.experimentProperty.value = ExperimentDefinition.CUSTOM;
    expect(model.graph.devices.length).toBe(customDeviceCount);
    // The restored analyzer keeps its X type.
    const restored = model.graph.devices.find((d) => d instanceof Analyzer) as Analyzer | undefined;
    expect(restored?.typeProperty.value).toBe(AnalyzerType.X);
  });

  it("restoring a spin-1 custom build under spin-1/2 drops third-port wires and blockers", () => {
    const model = new SternGerlachModel(seededRng(37));

    // Custom build under spin-1: analyzer with a wire from the NONE output and a blocker on it.
    model.experimentProperty.value = ExperimentDefinition.CUSTOM;
    model.systemProperty.value = SpinSystem.SPIN_ONE;
    const source = model.graph.getSource();
    const analyzer = new Analyzer(new Vector2(1.5, 0), AnalyzerType.Z);
    const counter = new Counter(new Vector2(3, 0));
    model.graph.addDevice(analyzer);
    model.graph.addDevice(counter);
    model.graph.addWire(new Wire(source as NonNullable<typeof source>, 0, analyzer));
    model.graph.addWire(new Wire(analyzer, 2, counter));
    analyzer.blockedOutputProperty.value = 2;

    model.experimentProperty.value = ExperimentDefinition.DEFAULT;
    model.systemProperty.value = SpinSystem.SPIN_HALF;
    model.experimentProperty.value = ExperimentDefinition.CUSTOM;

    const restored = model.graph.devices.find((d) => d instanceof Analyzer) as Analyzer;
    // The wire from the (now absent) third output is gone; only the source wire remains.
    expect(model.graph.wires.filter((w) => w.outputIndex === 2)).toHaveLength(0);
    // The blocker on the absent port is cleared.
    expect(restored.blockedOutputProperty.value).toBe(-1);
  });

  it("switching a custom build from spin-1 to spin-1/2 clears a third-port blocker in place", () => {
    const model = new SternGerlachModel(seededRng(41));
    model.experimentProperty.value = ExperimentDefinition.CUSTOM;
    model.systemProperty.value = SpinSystem.SPIN_ONE;
    const analyzer = new Analyzer(new Vector2(1.5, 0), AnalyzerType.Z);
    model.graph.addDevice(analyzer);
    analyzer.blockedOutputProperty.value = 2;

    model.systemProperty.value = SpinSystem.SPIN_HALF;
    expect(analyzer.blockedOutputProperty.value).toBe(-1);
  });

  it("changing a device's direction angles clears counts", () => {
    const model = new SternGerlachModel(seededRng(43));
    model.doN(100);
    expect(model.totalDetectedProperty.value).toBe(100);

    const analyzer = model.graph.devices.find((d) => d instanceof Analyzer) as Analyzer;
    analyzer.thetaProperty.value = Math.PI / 3;
    expect(model.totalDetectedProperty.value).toBe(0);

    model.doN(100);
    expect(model.totalDetectedProperty.value).toBe(100);
    analyzer.phiProperty.value = Math.PI / 5;
    expect(model.totalDetectedProperty.value).toBe(0);
  });

  it("reset restores defaults and rebuilds fresh devices", () => {
    const model = new SternGerlachModel(seededRng(29));
    const originalCounters = model.graph.getCounters();
    model.experimentProperty.value = presetByKey("interferometer");
    model.watchProperty.value = true;
    model.doN(50);

    model.reset();
    expect(model.experimentProperty.value).toBe(ExperimentDefinition.DEFAULT);
    expect(model.watchProperty.value).toBe(false);
    expect(model.initialStateProperty.value).toBe(InitialStateSetting.PLUS_Z);
    expect(model.totalDetectedProperty.value).toBe(0);
    expect(model.graph.getCounters()).toHaveLength(2);
    expect(model.graph.getCounters()[0]).not.toBe(originalCounters[0]);
  });
});
