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
 * Every eigenvector/operator lookup passes the owning device's (θ, φ)
 * explicitly (OperatorTable direction lookups are pure), so the recursive
 * walk stays correct when several n̂ devices carry different angles.
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
  /**
   * Output port the particle leaves through (drives the watch flash and travel path).
   * On coherent (merged, watch-off) branches this is sampled Born-weighted for DISPLAY
   * only — the carried state stays coherent, and since merging never happens with watch
   * on, the sampled index can never leak which-path information into the physics.
   */
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

/** An analyzer's operator index plus its own n̂ angles (ignored by the fixed operators). */
type MeasurementOp = {
  op: number;
  theta: number;
  phi: number;
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
   * Samples the state a freshly fired particle carries. Named eigenstates and USER return a
   * definite vector; Unknown settings return the hard-coded mystery state; RANDOM picks
   * uniformly from the fixed basis (Experiment.run 410-424).
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
    if (setting.eigenstate) {
      return this.operatorTable.getPreparedEigenstate(system, setting.eigenstate.type, setting.eigenstate.index);
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
    const ref = this.measurementOpFor(analyzer, options.system);

    if (options.system.stateCount === 2) {
      return this.transitTwoState(analyzer, ref, state, options, rng);
    }
    return this.transitThreeState(analyzer, ref, state, options, rng);
  }

  /** The operator index and this analyzer's own n̂ angles, bundled for eigenvector lookups. */
  private measurementOpFor(analyzer: Analyzer, system: SpinSystem): MeasurementOp {
    return {
      op: system.opFor(analyzer.typeProperty.value),
      theta: analyzer.thetaProperty.value,
      phi: analyzer.phiProperty.value,
    };
  }

  /** Eigenvector lookup carrying the analyzer's own angles (pure — safe across recursion). */
  private eigen(ref: MeasurementOp, index: number): ComplexVector {
    return this.operatorTable.getEigenvector(ref.op, index, ref.theta, ref.phi);
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
    ref: MeasurementOp,
    state: ComplexVector,
    options: EngineOptions,
    rng: Rng,
  ): TransitResult {
    const nextAt0 = this.nextOf(analyzer, 0);
    const nextAt1 = this.nextOf(analyzer, 1);

    // Both outputs feed the same device and nobody is watching: coherent pass-through.
    // The exit port is sampled Born-weighted for display only; the state is untouched.
    if (nextAt0 === nextAt1 && !options.watch) {
      const displayIndex = rng() < this.eigen(ref, 0).dotProdSquared(state) ? 0 : 1;
      return { outputIndex: displayIndex, newState: state, next: nextAt0 };
    }

    const up = this.eigen(ref, 0);
    if (rng() < up.dotProdSquared(state)) {
      return { outputIndex: 0, newState: up, next: nextAt0 };
    }
    return { outputIndex: 1, newState: this.eigen(ref, 1), next: nextAt1 };
  }

  /** 3-state analyzer hop (NextComp lines 517-604), with the verbatim i/j/k pairing logic. */
  private transitThreeState(
    analyzer: Analyzer,
    ref: MeasurementOp,
    state: ComplexVector,
    options: EngineOptions,
    rng: Rng,
  ): TransitResult {
    const nexts = [this.nextOf(analyzer, 0), this.nextOf(analyzer, 1), this.nextOf(analyzer, 2)];
    const grouping = groupOutputs(nexts, options.watch);
    if (grouping === "all-merged") {
      // All 3 outputs go to the same place: full coherent pass-through. The exit port is
      // sampled Born-weighted for display only; the state is untouched.
      return {
        outputIndex: this.sampleDisplayIndex(ref, state, [0, 1, 2], rng),
        newState: state,
        next: nexts[0] as ExperimentDevice | null,
      };
    }
    const { i, j, k, twoTheSame } = grouping;

    const rand = rng();
    const eigenK = this.eigen(ref, k);
    const prob = eigenK.dotProdSquared(state);

    let newState: ComplexVector;
    let outputIndex: number;
    if (rand < prob) {
      newState = eigenK;
      outputIndex = k;
    } else if (twoTheSame) {
      // The merged pair (i, j) is taken coherently: remove the k component and renormalize.
      // Which of the two merged ports the particle is DRAWN leaving is Born-sampled.
      newState = eigenK.projectOut(state);
      outputIndex = this.sampleDisplayIndex(ref, state, [i, j], rng);
    } else {
      const eigenJ = this.eigen(ref, j);
      if (rand - prob < eigenJ.dotProdSquared(state)) {
        newState = eigenJ;
        outputIndex = j;
      } else {
        newState = this.eigen(ref, i);
        outputIndex = i;
      }
    }
    return { outputIndex, newState, next: nexts[outputIndex] as ExperimentDevice | null };
  }

  /**
   * Samples which of the given (merged) output ports the particle is displayed leaving,
   * Born-weighted by the state's overlap with each port's eigenvector. Display-only: callers
   * pass the state through unchanged, and all candidate ports lead to the same device.
   */
  private sampleDisplayIndex(
    ref: MeasurementOp,
    state: ComplexVector,
    candidates: readonly number[],
    rng: Rng,
  ): number {
    const weights = candidates.map((index) => this.eigen(ref, index).dotProdSquared(state));
    const total = weights.reduce((sum, w) => sum + w, 0);
    if (total < PROBABILITY_EPSILON) {
      return candidates[0] as number;
    }
    let rand = rng() * total;
    for (let c = 0; c < candidates.length; c++) {
      rand -= weights[c] as number;
      if (rand < 0) {
        return candidates[c] as number;
      }
    }
    return candidates[candidates.length - 1] as number;
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

    // Named eigenstates / USER / Unknown are definite; RANDOM averages over its fixed basis
    // with equal weights (ComputeProb lines 829-864).
    let initialStates: Array<{ state: ComplexVector; weight: number }>;
    if (setting.isUser && userState) {
      initialStates = [{ state: userState, weight: 1 }];
    } else if (setting.eigenstate) {
      initialStates = [
        {
          state: this.operatorTable.getPreparedEigenstate(
            options.system,
            setting.eigenstate.type,
            setting.eigenstate.index,
          ),
          weight: 1,
        },
      ];
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
    const ref = this.measurementOpFor(analyzer, options.system);

    if (options.system.stateCount === 2) {
      const nextAt0 = this.nextOf(analyzer, 0);
      const nextAt1 = this.nextOf(analyzer, 1);
      if (nextAt0 === nextAt1 && !options.watch) {
        // Coherent pass-through: branch probability 1, state unchanged (BranchProb line 883).
        this.visit(nextAt0, state, probability, options, result);
        return;
      }
      for (const k of [0, 1]) {
        const eigen = this.eigen(ref, k);
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
      const eigenK = this.eigen(ref, k);
      const probK = eigenK.dotProdSquared(state);
      // Compute the merged-branch state before recursing so both branches derive from
      // this analyzer's own basis regardless of what the recursion touches.
      const projected = 1 - probK > PROBABILITY_EPSILON ? eigenK.projectOut(state) : null;
      this.visit(nexts[k] as ExperimentDevice | null, eigenK, probability * probK, options, result);

      // Merged branch: probability 1 − |⟨k|ψ⟩|², state = ProjectOut (BranchProb lines 941-944).
      if (projected !== null) {
        this.visit(nexts[i] as ExperimentDevice | null, projected, probability * (1 - probK), options, result);
      }
      return;
    }
    for (const k of [0, 1, 2]) {
      const eigen = this.eigen(ref, k);
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
