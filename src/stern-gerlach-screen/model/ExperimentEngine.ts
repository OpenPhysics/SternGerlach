/**
 * ExperimentEngine.ts
 *
 * The quantum measurement engine, stateless over (graph, operatorTable,
 * system, watch). Two propagation paths, as in the Java SPINS source:
 *
 * 1. Monte-Carlo decide-at-arrival (transitDevice) — port of
 *    Experiment.NextComp (lines 466-605). A magnet applies its propagator U;
 *    an analyzer collapses the state via the Born rule, EXCEPT when multiple
 *    outputs feed the same device and Watch is off: a 2-state analyzer then
 *    passes the state through coherently, and a 3-state analyzer with two
 *    merged outputs projects the merged eigencomponent pair out coherently
 *    (ProjectOut recombination).
 *
 * 2. Analytic path-sum (computeCounterProbabilities) — a forward depth-first
 *    walk from the source producing exact counter probabilities. It replaces
 *    Java's backward ComputeProb/BranchProb walk (whose own comments flag
 *    multi-input bugs) but reproduces its results, including the
 *    recombination branch probability 1 − |⟨k|ψ⟩|² with a ProjectOut state.
 *    The Random initial state is averaged ½/⅓ over its fixed basis. Unlike
 *    Java, the walk is watch-aware, which keeps Do-N valid under Watch.
 *
 * The RNG is injected (production: dotRandom; tests: seeded), never global.
 */

import { assert } from "scenerystack/assert";
import type { ComplexVector } from "../../common/quantum/ComplexVector.js";
import type { OperatorTable } from "../../common/quantum/OperatorTable.js";
import type { SpinSystem } from "../../common/quantum/SpinSystem.js";
import { Analyzer } from "./devices/Analyzer.js";
import { Counter } from "./devices/Counter.js";
import type { ExperimentDevice } from "./devices/ExperimentDevice.js";
import { Magnet } from "./devices/Magnet.js";
import type { ExperimentGraph } from "./ExperimentGraph.js";
import type { InitialStateSetting } from "./InitialStateSetting.js";

/** Source of uniform random numbers in [0, 1). Injected everywhere for reproducible tests. */
export type Rng = () => number;

/** Outcome of one Monte-Carlo hop through a magnet or analyzer. */
export type TransitResult = {
  /** Output port the particle leaves through (drives the watch flash and travel path). */
  outputIndex: number;
  /** The (possibly collapsed or precessed) state after the device. */
  newState: ComplexVector;
  /** Device the chosen output's wire leads to, or null for a dead end. */
  next: ExperimentDevice | null;
};

/** Configuration shared by both propagation paths. */
export type EngineOptions = {
  system: SpinSystem;
  watch: boolean;
};

// Branches with probability below this are numerically absent; also guards the
// degenerate ProjectOut of a state that lies entirely along the removed eigenvector.
const PROBABILITY_EPSILON = 1e-12;

export class ExperimentEngine {
  private readonly graph: ExperimentGraph;
  private readonly operatorTable: OperatorTable;

  public constructor(graph: ExperimentGraph, operatorTable: OperatorTable) {
    this.graph = graph;
    this.operatorTable = operatorTable;
  }

  /**
   * Samples the state a freshly fired particle carries. USER returns the user-defined vector
   * (already rotated into the Z basis); Unknown settings return the hard-coded state; RANDOM
   * picks uniformly from the fixed basis (Experiment.run 410-424).
   */
  public sampleInitialState(
    setting: InitialStateSetting,
    system: SpinSystem,
    rng: Rng,
    userState?: ComplexVector,
  ): ComplexVector {
    if (setting.isUser && userState) {
      return userState;
    }
    if (setting.unknownIndex !== null) {
      return this.operatorTable.getUnknownState(system, setting.unknownIndex);
    }
    const basis = this.operatorTable.getRandomBasis(system);
    const index = Math.min(Math.floor(rng() * basis.length), basis.length - 1);
    return basis[index] as ComplexVector;
  }

  /**
   * Performs one Monte-Carlo hop: the particle, carrying `state`, has arrived at `device`
   * (a magnet or analyzer). Port of Experiment.NextComp (lines 466-605), including the
   * 3-state i/j/k merged-output branch logic.
   */
  public transitDevice(
    device: ExperimentDevice,
    state: ComplexVector,
    options: EngineOptions,
    rng: Rng,
  ): TransitResult {
    if (device instanceof Magnet) {
      return {
        outputIndex: 0,
        newState: device.computeU(this.operatorTable, options.system).timesVector(state),
        next: this.graph.getNext(device, 0),
      };
    }

    assert?.(device instanceof Analyzer, `cannot transit through ${device.id}`);
    const analyzer = device as Analyzer;
    const op = options.system.opFor(analyzer.typeProperty.value);

    if (options.system.stateCount === 2) {
      return this.transitTwoState(analyzer, op, state, options, rng);
    }
    return this.transitThreeState(analyzer, op, state, options, rng);
  }

  /** Effective next device for an analyzer output, treating blocked exits as dead ends. */
  private nextOf(analyzer: Analyzer, outputIndex: number): ExperimentDevice | null {
    if (analyzer.isOutputBlocked(outputIndex)) {
      return null;
    }
    return this.graph.getNext(analyzer, outputIndex);
  }

  /** 2-state analyzer hop (NextComp lines 485-515). */
  private transitTwoState(
    analyzer: Analyzer,
    op: number,
    state: ComplexVector,
    options: EngineOptions,
    rng: Rng,
  ): TransitResult {
    const nextAt0 = this.nextOf(analyzer, 0);
    const nextAt1 = this.nextOf(analyzer, 1);

    // Both outputs feed the same device and nobody is watching: coherent pass-through.
    if (nextAt0 === nextAt1 && !options.watch) {
      return { outputIndex: 0, newState: state, next: nextAt0 };
    }

    const up = this.operatorTable.getEigenvector(op, 0);
    if (rng() < up.dotProdSquared(state)) {
      return { outputIndex: 0, newState: up, next: nextAt0 };
    }
    return { outputIndex: 1, newState: this.operatorTable.getEigenvector(op, 1), next: nextAt1 };
  }

  /** 3-state analyzer hop (NextComp lines 517-604), with the verbatim i/j/k pairing logic. */
  private transitThreeState(
    analyzer: Analyzer,
    op: number,
    state: ComplexVector,
    options: EngineOptions,
    rng: Rng,
  ): TransitResult {
    const nexts = [this.nextOf(analyzer, 0), this.nextOf(analyzer, 1), this.nextOf(analyzer, 2)];
    const grouping = groupOutputs(nexts, options.watch);
    if (grouping === "all-merged") {
      // All 3 outputs go to the same place: full coherent pass-through.
      return { outputIndex: 0, newState: state, next: nexts[0] as ExperimentDevice | null };
    }
    const { i, j, k, twoTheSame } = grouping;

    const rand = rng();
    const eigenK = this.operatorTable.getEigenvector(op, k);
    const prob = eigenK.dotProdSquared(state);

    let newState: ComplexVector;
    let outputIndex: number;
    if (rand < prob) {
      newState = eigenK;
      outputIndex = k;
    } else if (twoTheSame) {
      // The merged pair (i, j) is taken coherently: remove the k component and renormalize.
      newState = eigenK.projectOut(state);
      outputIndex = i;
    } else {
      const eigenJ = this.operatorTable.getEigenvector(op, j);
      if (rand - prob < eigenJ.dotProdSquared(state)) {
        newState = eigenJ;
        outputIndex = j;
      } else {
        newState = this.operatorTable.getEigenvector(op, i);
        outputIndex = i;
      }
    }
    return { outputIndex, newState, next: nexts[outputIndex] as ExperimentDevice | null };
  }

  /**
   * Exact probability, per counter, that one fired particle is detected there — a forward
   * depth-first path-sum from the source. Counters not reachable from the source get 0
   * (dead ends lose their probability, so the map's values may sum to less than 1).
   */
  public computeCounterProbabilities(
    setting: InitialStateSetting,
    options: EngineOptions,
    userState?: ComplexVector,
  ): Map<Counter, number> {
    const result = new Map<Counter, number>();
    for (const counter of this.graph.getCounters()) {
      result.set(counter, 0);
    }

    const source = this.graph.getSource();
    const first = source === null ? null : this.graph.getNext(source, 0);
    if (first === null) {
      return result;
    }

    // USER is a definite state; Unknown is a single hard-coded state; RANDOM averages over its
    // fixed basis with equal weights (ComputeProb lines 829-864).
    let initialStates: Array<{ state: ComplexVector; weight: number }>;
    if (setting.isUser && userState) {
      initialStates = [{ state: userState, weight: 1 }];
    } else if (setting.unknownIndex !== null) {
      initialStates = [{ state: this.operatorTable.getUnknownState(options.system, setting.unknownIndex), weight: 1 }];
    } else {
      initialStates = this.operatorTable
        .getRandomBasis(options.system)
        .map((state, _index, basis) => ({ state, weight: 1 / basis.length }));
    }

    for (const { state, weight } of initialStates) {
      this.visit(first, state, weight, options, result);
    }
    return result;
  }

  /** Recursive step of the analytic path-sum. */
  private visit(
    device: ExperimentDevice | null,
    state: ComplexVector,
    probability: number,
    options: EngineOptions,
    result: Map<Counter, number>,
  ): void {
    if (device === null || probability < PROBABILITY_EPSILON) {
      return;
    }
    if (device instanceof Counter) {
      result.set(device, (result.get(device) ?? 0) + probability);
      return;
    }
    if (device instanceof Magnet) {
      const newState = device.computeU(this.operatorTable, options.system).timesVector(state);
      this.visit(this.graph.getNext(device, 0), newState, probability, options, result);
      return;
    }

    assert?.(device instanceof Analyzer, `cannot propagate through ${device.id}`);
    const analyzer = device as Analyzer;
    const op = options.system.opFor(analyzer.typeProperty.value);

    if (options.system.stateCount === 2) {
      const nextAt0 = this.nextOf(analyzer, 0);
      const nextAt1 = this.nextOf(analyzer, 1);
      if (nextAt0 === nextAt1 && !options.watch) {
        // Coherent pass-through: branch probability 1, state unchanged (BranchProb line 883).
        this.visit(nextAt0, state, probability, options, result);
        return;
      }
      for (const k of [0, 1]) {
        const eigen = this.operatorTable.getEigenvector(op, k);
        this.visit(this.nextOf(analyzer, k), eigen, probability * eigen.dotProdSquared(state), options, result);
      }
      return;
    }

    const nexts = [this.nextOf(analyzer, 0), this.nextOf(analyzer, 1), this.nextOf(analyzer, 2)];
    const grouping = groupOutputs(nexts, options.watch);
    if (grouping === "all-merged") {
      this.visit(nexts[0] as ExperimentDevice | null, state, probability, options, result);
      return;
    }
    if (grouping.twoTheSame) {
      const { i, k } = grouping;
      const eigenK = this.operatorTable.getEigenvector(op, k);
      const probK = eigenK.dotProdSquared(state);
      this.visit(nexts[k] as ExperimentDevice | null, eigenK, probability * probK, options, result);

      // Merged branch: probability 1 − |⟨k|ψ⟩|², state = ProjectOut (BranchProb lines 941-944).
      if (1 - probK > PROBABILITY_EPSILON) {
        this.visit(
          nexts[i] as ExperimentDevice | null,
          eigenK.projectOut(state),
          probability * (1 - probK),
          options,
          result,
        );
      }
      return;
    }
    for (const k of [0, 1, 2]) {
      const eigen = this.operatorTable.getEigenvector(op, k);
      this.visit(
        nexts[k] as ExperimentDevice | null,
        eigen,
        probability * eigen.dotProdSquared(state),
        options,
        result,
      );
    }
  }
}

type ThreeStateGrouping = { i: number; j: number; k: number; twoTheSame: boolean };

/**
 * Reproduces NextComp's merged-output detection for a 3-state analyzer (lines 527-554).
 * With watch off: "all-merged" if all three outputs feed one device; otherwise, if some pair
 * feeds one device, (i, j) name the merged pair and k the distinct output; else no grouping.
 * Unwired outputs (null) compare equal to each other, exactly like Java's -1 indices.
 */
function groupOutputs(
  nexts: ReadonlyArray<ExperimentDevice | null>,
  watch: boolean,
): ThreeStateGrouping | "all-merged" {
  const [nextAt0, nextAt1, nextAt2] = nexts;
  let i = 0;
  let j = 1;
  let k = 2;
  let twoTheSame = false;

  if (nextAt0 === nextAt1 && !watch) {
    if (nextAt0 === nextAt2) {
      return "all-merged";
    }
    twoTheSame = true;
  }
  if (nextAt0 === nextAt2 && !watch) {
    i = 0;
    j = 2;
    k = 1;
    twoTheSame = true;
  }
  if (nextAt1 === nextAt2 && !watch) {
    i = 1;
    j = 2;
    k = 0;
    twoTheSame = true;
  }
  return { i, j, k, twoTheSame };
}
