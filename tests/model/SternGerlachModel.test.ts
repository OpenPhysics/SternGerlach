/**
 * Model-semantics tests: preset construction, Do-N analytic sampling,
 * auto-clearing counters on configuration changes, particle animation
 * end-to-end, and reset.
 */

import { BooleanProperty } from "scenerystack/axon";
import { describe, expect, it } from "vitest";
import { AnalyzerType } from "../../src/common/quantum/AnalyzerType.js";
import { SpinSystem } from "../../src/common/quantum/SpinSystem.js";
import { Analyzer } from "../../src/stern-gerlach-screen/model/devices/Analyzer.js";
import { SourceMode } from "../../src/stern-gerlach-screen/model/devices/ParticleSource.js";
import { ExperimentDefinition } from "../../src/stern-gerlach-screen/model/ExperimentDefinition.js";
import { InitialStateSetting } from "../../src/stern-gerlach-screen/model/InitialStateSetting.js";
import { SternGerlachModel } from "../../src/stern-gerlach-screen/model/SternGerlachModel.js";
import { seededRng } from "./testUtilities.js";

function presetByKey(nameKey: string): ExperimentDefinition {
  const preset = ExperimentDefinition.PRESETS.find((p) => p.nameKey === nameKey);
  if (!preset) {
    throw new Error(`no preset named ${nameKey}`);
  }
  return preset;
}

describe("SternGerlachModel", () => {
  it("builds the default preset: source, one Z analyzer, two counters with ½/½ expected", () => {
    const model = new SternGerlachModel(seededRng(7));
    expect(model.graph.getSource()).not.toBeNull();
    const counters = model.graph.getCounters();
    expect(counters).toHaveLength(2);
    for (const counter of counters) {
      expect(counter.probabilityProperty.value).toBeCloseTo(0.5, 10);
    }
  });

  it("doN(1000) with |+z⟩ into a Z analyzer puts all 1000 counts in the up counter", () => {
    const model = new SternGerlachModel(seededRng(11));
    model.initialStateProperty.value = InitialStateSetting.UNKNOWN_1; // |+z⟩
    model.doN(1000);
    const [up, down] = model.graph.getCounters();
    expect(up?.countProperty.value).toBe(1000);
    expect(down?.countProperty.value).toBe(0);
    expect(model.totalDetectedProperty.value).toBe(1000);
  });

  it("doN follows the analytic distribution for the Z→X chain preset", () => {
    const model = new SternGerlachModel(seededRng(23));
    model.experimentProperty.value = presetByKey("zThenX");
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

  it("single-fire particles fly the graph and land in counters (seeded, |+z⟩ → Z)", () => {
    const model = new SternGerlachModel(seededRng(5));
    model.initialStateProperty.value = InitialStateSetting.UNKNOWN_1;
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

  it("disabling SU(3) while it is active falls the system back to spin-½", () => {
    const su3Enabled = new BooleanProperty(true);
    const model = new SternGerlachModel(seededRng(37), su3Enabled);
    model.systemProperty.value = SpinSystem.SU3;
    expect(model.systemProperty.value).toBe(SpinSystem.SU3);

    su3Enabled.value = false;
    expect(model.systemProperty.value).toBe(SpinSystem.SPIN_HALF);
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
    expect(model.initialStateProperty.value).toBe(InitialStateSetting.RANDOM);
    expect(model.totalDetectedProperty.value).toBe(0);
    expect(model.graph.getCounters()).toHaveLength(2);
    expect(model.graph.getCounters()[0]).not.toBe(originalCounters[0]);
  });
});
