/**
 * Physics-invariant tests for ExperimentEngine — the port of Experiment's
 * NextComp (Monte-Carlo) and ComputeProb/BranchProb (analytic) logic.
 * All Monte-Carlo runs use a seeded RNG.
 */

import { describe, expect, it } from "vitest";
import { AnalyzerType } from "../../src/common/quantum/AnalyzerType.js";
import { OperatorTable } from "../../src/common/quantum/OperatorTable.js";
import { SpinSystem } from "../../src/common/quantum/SpinSystem.js";
import { Counter } from "../../src/stern-gerlach-screen/model/devices/Counter.js";
import { ExperimentEngine } from "../../src/stern-gerlach-screen/model/ExperimentEngine.js";
import { ExperimentGraph } from "../../src/stern-gerlach-screen/model/ExperimentGraph.js";
import { InitialStateSetting } from "../../src/stern-gerlach-screen/model/InitialStateSetting.js";
import { addAnalyzer, addCounter, addSource, seededRng, wire } from "./testUtilities.js";

const { SPIN_HALF, SPIN_ONE, SU3 } = SpinSystem;
const PLUS_Z = InitialStateSetting.UNKNOWN_1; // spin-½ unknown #1 is |+z⟩
const RANDOM = InitialStateSetting.RANDOM;

function probOf(map: Map<Counter, number>, counter: Counter): number {
  return map.get(counter) ?? Number.NaN;
}

describe("ExperimentEngine analytic path-sum", () => {
  it("|+z⟩ → Z analyzer gives (1, 0)", () => {
    const graph = new ExperimentGraph();
    const engine = new ExperimentEngine(graph, new OperatorTable());
    const source = addSource(graph);
    const analyzer = addAnalyzer(graph, AnalyzerType.Z);
    const up = addCounter(graph);
    const down = addCounter(graph);
    wire(graph, source, 0, analyzer);
    wire(graph, analyzer, 0, up);
    wire(graph, analyzer, 1, down);

    const probs = engine.computeCounterProbabilities(PLUS_Z, { system: SPIN_HALF, watch: false });
    expect(probOf(probs, up)).toBeCloseTo(1, 10);
    expect(probOf(probs, down)).toBeCloseTo(0, 10);
  });

  it("|+z⟩ → X analyzer gives (½, ½)", () => {
    const graph = new ExperimentGraph();
    const engine = new ExperimentEngine(graph, new OperatorTable());
    const source = addSource(graph);
    const analyzer = addAnalyzer(graph, AnalyzerType.X);
    const up = addCounter(graph);
    const down = addCounter(graph);
    wire(graph, source, 0, analyzer);
    wire(graph, analyzer, 0, up);
    wire(graph, analyzer, 1, down);

    const probs = engine.computeCounterProbabilities(PLUS_Z, { system: SPIN_HALF, watch: false });
    expect(probOf(probs, up)).toBeCloseTo(0.5, 10);
    expect(probOf(probs, down)).toBeCloseTo(0.5, 10);
  });

  it("|+z⟩ → Z → X chain gives (¼, ¼) after the up branch and ½ in the down counter", () => {
    const graph = new ExperimentGraph();
    const engine = new ExperimentEngine(graph, new OperatorTable());
    const source = addSource(graph);
    const zAnalyzer = addAnalyzer(graph, AnalyzerType.Z);
    const xAnalyzer = addAnalyzer(graph, AnalyzerType.X);
    const xUp = addCounter(graph);
    const xDown = addCounter(graph);
    const zDown = addCounter(graph);
    wire(graph, source, 0, zAnalyzer);
    wire(graph, zAnalyzer, 0, xAnalyzer);
    wire(graph, zAnalyzer, 1, zDown);
    wire(graph, xAnalyzer, 0, xUp);
    wire(graph, xAnalyzer, 1, xDown);

    // |+z⟩ passes Z up with probability 1, then splits ½/½ at X — but the RANDOM default
    // would send ½ down at Z first; use |+z⟩ then RANDOM to check both.
    const plusZ = engine.computeCounterProbabilities(PLUS_Z, { system: SPIN_HALF, watch: false });
    expect(probOf(plusZ, xUp)).toBeCloseTo(0.5, 10);
    expect(probOf(plusZ, xDown)).toBeCloseTo(0.5, 10);
    expect(probOf(plusZ, zDown)).toBeCloseTo(0, 10);

    const random = engine.computeCounterProbabilities(RANDOM, { system: SPIN_HALF, watch: false });
    expect(probOf(random, xUp)).toBeCloseTo(0.25, 10);
    expect(probOf(random, xDown)).toBeCloseTo(0.25, 10);
    expect(probOf(random, zDown)).toBeCloseTo(0.5, 10);
  });

  it("Random → Z is 50/50 for spin-½ and ⅓ each for spin-1", () => {
    for (const [system, expected] of [
      [SPIN_HALF, 0.5],
      [SPIN_ONE, 1 / 3],
    ] as const) {
      const graph = new ExperimentGraph();
      const engine = new ExperimentEngine(graph, new OperatorTable());
      const source = addSource(graph);
      const analyzer = addAnalyzer(graph, AnalyzerType.Z);
      wire(graph, source, 0, analyzer);
      const counters: Counter[] = [];
      for (let k = 0; k < system.stateCount; k++) {
        const counter = addCounter(graph);
        counters.push(counter);
        wire(graph, analyzer, k, counter);
      }

      const probs = engine.computeCounterProbabilities(RANDOM, { system, watch: false });
      for (const counter of counters) {
        expect(probOf(probs, counter)).toBeCloseTo(expected, 10);
      }
    }
  });

  it("interferometer (both X outputs → Z) restores |+z⟩: (1, 0) watch-off, (½, ½) watch-on", () => {
    const graph = new ExperimentGraph();
    const engine = new ExperimentEngine(graph, new OperatorTable());
    const source = addSource(graph);
    const middle = addAnalyzer(graph, AnalyzerType.X);
    const last = addAnalyzer(graph, AnalyzerType.Z);
    const up = addCounter(graph);
    const down = addCounter(graph);
    wire(graph, source, 0, middle);
    wire(graph, middle, 0, last);
    wire(graph, middle, 1, last);
    wire(graph, last, 0, up);
    wire(graph, last, 1, down);

    const coherent = engine.computeCounterProbabilities(PLUS_Z, { system: SPIN_HALF, watch: false });
    expect(probOf(coherent, up)).toBeCloseTo(1, 10);
    expect(probOf(coherent, down)).toBeCloseTo(0, 10);

    const watched = engine.computeCounterProbabilities(PLUS_Z, { system: SPIN_HALF, watch: true });
    expect(probOf(watched, up)).toBeCloseTo(0.5, 10);
    expect(probOf(watched, down)).toBeCloseTo(0.5, 10);
  });

  it("spin-1 2-of-3 recombination matches the hand-computed ProjectOut result", () => {
    // |1y⟩ → Z analyzer with UP and DOWN merged into a Y analyzer; NONE → its own counter.
    // p(NONE) = |⟨0z|1y⟩|² = ½. The merged branch carries the normalized ProjectOut state
    // (r, 0, −r), which hits the Y analyzer with |⟨±1y|·⟩|² = ½, ½ and |⟨0y|·⟩|² = 0.
    const graph = new ExperimentGraph();
    const engine = new ExperimentEngine(graph, new OperatorTable());
    const source = addSource(graph);
    const zAnalyzer = addAnalyzer(graph, AnalyzerType.Z);
    const yAnalyzer = addAnalyzer(graph, AnalyzerType.Y);
    const noneCounter = addCounter(graph);
    const yCounters = [addCounter(graph), addCounter(graph), addCounter(graph)];
    wire(graph, source, 0, zAnalyzer);
    wire(graph, zAnalyzer, 0, yAnalyzer);
    wire(graph, zAnalyzer, 1, yAnalyzer);
    wire(graph, zAnalyzer, 2, noneCounter);
    yCounters.forEach((counter, k) => {
      wire(graph, yAnalyzer, k, counter);
    });

    // Spin-1 unknown #1 is |1y⟩ (the +1 eigenstate of Sy).
    const probs = engine.computeCounterProbabilities(InitialStateSetting.UNKNOWN_1, {
      system: SPIN_ONE,
      watch: false,
    });
    expect(probOf(probs, noneCounter)).toBeCloseTo(0.5, 10);
    expect(probOf(probs, yCounters[0] as Counter)).toBeCloseTo(0.25, 10);
    expect(probOf(probs, yCounters[1] as Counter)).toBeCloseTo(0.25, 10);
    expect(probOf(probs, yCounters[2] as Counter)).toBeCloseTo(0, 10);
  });

  it("SU(3) λ₄ analyzer probabilities from the random (spin-1 Sy) mixture are ⅓ each", () => {
    const graph = new ExperimentGraph();
    const engine = new ExperimentEngine(graph, new OperatorTable());
    const source = addSource(graph);
    const analyzer = addAnalyzer(graph, AnalyzerType.LAMBDA_4);
    const counters = [addCounter(graph), addCounter(graph), addCounter(graph)];
    wire(graph, source, 0, analyzer);
    counters.forEach((counter, k) => {
      wire(graph, analyzer, k, counter);
    });

    const probs = engine.computeCounterProbabilities(RANDOM, { system: SU3, watch: false });
    let total = 0;
    for (const counter of counters) {
      total += probOf(probs, counter);
    }
    expect(total).toBeCloseTo(1, 10);

    // Hand check: λ₄ eigenvectors vs the three Sy(1) eigenstates average to ⅓ each.
    expect(probOf(probs, counters[0] as Counter)).toBeCloseTo(1 / 3, 10);
    expect(probOf(probs, counters[1] as Counter)).toBeCloseTo(1 / 3, 10);
    expect(probOf(probs, counters[2] as Counter)).toBeCloseTo(1 / 3, 10);
  });

  it("a dead-end output loses its probability; unreachable counters read 0", () => {
    const graph = new ExperimentGraph();
    const engine = new ExperimentEngine(graph, new OperatorTable());
    const source = addSource(graph);
    const analyzer = addAnalyzer(graph, AnalyzerType.X);
    const up = addCounter(graph);
    const stranded = addCounter(graph); // never wired
    wire(graph, source, 0, analyzer);
    wire(graph, analyzer, 0, up);
    // output 1 left unwired

    const probs = engine.computeCounterProbabilities(PLUS_Z, { system: SPIN_HALF, watch: false });
    expect(probOf(probs, up)).toBeCloseTo(0.5, 10);
    expect(probOf(probs, stranded)).toBe(0);
  });
});

describe("ExperimentEngine Monte-Carlo vs analytic", () => {
  it("20k seeded particles through a 3-analyzer graph agree with the analytic engine to ~1.5%", () => {
    const graph = new ExperimentGraph();
    const table = new OperatorTable();
    const engine = new ExperimentEngine(graph, table);
    const source = addSource(graph);
    const zAnalyzer = addAnalyzer(graph, AnalyzerType.Z);
    const xAnalyzer = addAnalyzer(graph, AnalyzerType.X);
    const yAnalyzer = addAnalyzer(graph, AnalyzerType.Y);
    const counters = [addCounter(graph), addCounter(graph), addCounter(graph), addCounter(graph)];
    wire(graph, source, 0, zAnalyzer);
    wire(graph, zAnalyzer, 0, xAnalyzer);
    wire(graph, zAnalyzer, 1, yAnalyzer);
    wire(graph, xAnalyzer, 0, counters[0] as Counter);
    wire(graph, xAnalyzer, 1, counters[1] as Counter);
    wire(graph, yAnalyzer, 0, counters[2] as Counter);
    wire(graph, yAnalyzer, 1, counters[3] as Counter);

    const options = { system: SPIN_HALF, watch: false };
    const analytic = engine.computeCounterProbabilities(RANDOM, options);

    const rng = seededRng(42);
    const totals = new Map<Counter, number>();
    const shots = 20000;
    for (let shot = 0; shot < shots; shot++) {
      let state = engine.sampleInitialState(RANDOM, SPIN_HALF, rng);
      let device = graph.getNext(source, 0);
      while (device !== null && !(device instanceof Counter)) {
        const result = engine.transitDevice(device, state, options, rng);
        state = result.newState;
        device = result.next;
      }
      if (device !== null) {
        totals.set(device, (totals.get(device) ?? 0) + 1);
      }
    }

    for (const counter of counters) {
      const measured = (totals.get(counter as Counter) ?? 0) / shots;
      const expected = analytic.get(counter as Counter) ?? 0;
      expect(Math.abs(measured - expected)).toBeLessThan(0.015);
    }
  });

  it("coherent 2-state pass-through returns the state unchanged (exact)", () => {
    const graph = new ExperimentGraph();
    const table = new OperatorTable();
    const engine = new ExperimentEngine(graph, table);
    const source = addSource(graph);
    const middle = addAnalyzer(graph, AnalyzerType.X);
    const last = addAnalyzer(graph, AnalyzerType.Z);
    wire(graph, source, 0, middle);
    wire(graph, middle, 0, last);
    wire(graph, middle, 1, last);

    const psi = table.getUnknownState(SPIN_HALF, 3); // a generic superposition
    const result = engine.transitDevice(middle, psi, { system: SPIN_HALF, watch: false }, seededRng(1));
    expect(result.newState).toBe(psi);
    expect(result.next).toBe(last);
  });

  it("coherent 3-state recombination collapses to the exact normalized ProjectOut state", () => {
    const graph = new ExperimentGraph();
    const table = new OperatorTable();
    const engine = new ExperimentEngine(graph, table);
    const source = addSource(graph);
    const zAnalyzer = addAnalyzer(graph, AnalyzerType.Z);
    const target = addAnalyzer(graph, AnalyzerType.Y);
    const noneCounter = addCounter(graph);
    wire(graph, source, 0, zAnalyzer);
    wire(graph, zAnalyzer, 0, target);
    wire(graph, zAnalyzer, 1, target);
    wire(graph, zAnalyzer, 2, noneCounter);

    // Force the merged branch: rand = 0.99 ≥ p(NONE) = ½.
    const psi = table.getUnknownState(SPIN_ONE, 0); // |1y⟩
    const result = engine.transitDevice(zAnalyzer, psi, { system: SPIN_ONE, watch: false }, () => 0.99);
    const expected = table.getEigenvector(7, 2).projectOut(psi);
    expect(result.newState.equalsEpsilon(expected, 1e-12)).toBe(true);
    expect(result.newState.magnitudeSquared()).toBeCloseTo(1, 12);
    expect(result.next).toBe(target);
  });
});
