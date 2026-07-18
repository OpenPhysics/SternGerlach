/**
 * OperatorTable.ts
 *
 * Observable operators, their squares, and their eigenvectors, plus the
 * hard-coded unknown initial states and the Random-state bases. Port of
 * `Experiment.initVectors()` / `Experiment.SetPhi()` from the SPINS Java
 * source, with contiguous indices after dropping the unused SU(3) slots.
 *
 * Operator indices (see SpinSystem.opFor):
 *   0-2  spin-½ Pauli Sx / Sy / Sz
 *   3-5  spin-1 Sz / Sx / Sy
 *   6-7  Sn(θ, φ) for spin-½ / spin-1
 *
 * Unlike the Java source (one global direction shared by every n̂ device),
 * each analyzer/magnet in this sim owns its own (θ, φ). The direction
 * operators are therefore PURE lookups: callers pass the angles explicitly to
 * getOperator / getOperatorSquared / getEigenvector, and the table holds no
 * mutable direction state. Results are memoized per operator on the last
 * (θ, φ) queried.
 *
 * EIGENVECTOR INDEX CONVENTION (preserve — Experiment.java:100-107):
 * for every operator, eigenvector index 0, 1, 2 corresponds to eigenvalues
 * +1, −1, 0. This matches analyzer output ports UP = 0, DOWN = 1, NONE = 2.
 * Op 6 (spin-½ Sn) defines only eigenvectors 0 and 1; index 2 is the zero
 * vector, exactly as in Java.
 *
 * Instance-owned (no mutable statics) so tests can construct independent
 * tables. Pure TypeScript apart from assert — no axon/scenery dependencies.
 */

import { assert } from "scenerystack/assert";
import type { AnalyzerType } from "./AnalyzerType.js";
import { Complex } from "./Complex.js";
import { ComplexMatrix } from "./ComplexMatrix.js";
import { ComplexVector } from "./ComplexVector.js";
import { SpinSystem } from "./SpinSystem.js";

/** Number of operator matrices (spin-½ + spin-1 fixed ops and Sn pair). */
export const OPERATOR_COUNT = 8;

/** First direction-dependent operator index (6 = spin-½ Sn, 7 = spin-1 Sn). */
const DIRECTION_OP_START = 6;

/** Default n̂ direction angles, radians (Java init: θ = π/2, φ = π/4). Devices start here. */
export const DEFAULT_DIRECTION_THETA = Math.PI / 2;
export const DEFAULT_DIRECTION_PHI = Math.PI / 4;

const ROOT2_INV = 1 / Math.sqrt(2);

/** Shorthand constructors, matching the Java cOne / ci / cMinusOne / cMinusi style. */
const c = (re: number, im: number) => new Complex(re, im);
const v = (c0: Complex, c1: Complex, c2: Complex = Complex.ZERO) => new ComplexVector(c0, c1, c2);

/** One direction operator at a specific (θ, φ): the matrix, its square, and its eigenvectors. */
type DirectionEntry = {
  key: string;
  operator: ComplexMatrix;
  operatorSquared: ComplexMatrix;
  eigenvectors: readonly ComplexVector[];
};

/** Op 6: Sn(θ, φ) spin-½ matrix and eigenvectors (Experiment.SetPhi lines 268-283). */
function spinHalfDirection(theta: number, phi: number, key: string): DirectionEntry {
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const sinP = Math.sin(phi);
  const cosP = Math.cos(phi);

  const operator = ComplexMatrix.fromEntries([
    [0, 0, c(cosT, 0)],
    [0, 1, c(sinT * cosP, -sinT * sinP)],
    [1, 0, c(sinT * cosP, sinT * sinP)],
    [1, 1, c(-cosT, 0)],
  ]);

  const sinHalfT = Math.sin(theta / 2);
  const cosHalfT = Math.cos(theta / 2);
  return {
    key,
    operator,
    operatorSquared: operator.squared(),
    eigenvectors: [
      v(c(cosHalfT, 0), c(sinHalfT * cosP, sinHalfT * sinP)),
      v(c(sinHalfT, 0), c(-cosHalfT * cosP, -cosHalfT * sinP)),
      ComplexVector.ZERO, // Java leaves the unused third eigenvector as zero
    ],
  };
}

/** Op 7: Sn(θ, φ) spin-1 matrix and eigenvectors (Experiment.SetPhi lines 284-304). */
function spinOneDirection(theta: number, phi: number, key: string): DirectionEntry {
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const sinP = Math.sin(phi);
  const cosP = Math.cos(phi);

  const operator = ComplexMatrix.fromEntries([
    [0, 0, c(cosT, 0)],
    [0, 1, c(ROOT2_INV * sinT * cosP, -ROOT2_INV * sinT * sinP)],
    [1, 0, c(ROOT2_INV * sinT * cosP, ROOT2_INV * sinT * sinP)],
    [1, 2, c(ROOT2_INV * sinT * cosP, -ROOT2_INV * sinT * sinP)],
    [2, 1, c(ROOT2_INV * sinT * cosP, ROOT2_INV * sinT * sinP)],
    [2, 2, c(-cosT, 0)],
  ]);

  return {
    key,
    operator,
    operatorSquared: operator.squared(),
    eigenvectors: [
      v(
        c(((1 + cosT) * cosP) / 2, (-(1 + cosT) * sinP) / 2),
        c(ROOT2_INV * sinT, 0),
        c(((1 - cosT) * cosP) / 2, ((1 - cosT) * sinP) / 2),
      ),
      v(
        c(((1 - cosT) * cosP) / 2, (-(1 - cosT) * sinP) / 2),
        c(-ROOT2_INV * sinT, 0),
        c(((1 + cosT) * cosP) / 2, ((1 + cosT) * sinP) / 2),
      ),
      v(
        c(-ROOT2_INV * sinT * cosP, ROOT2_INV * sinT * sinP),
        c(cosT, 0),
        c(ROOT2_INV * sinT * cosP, ROOT2_INV * sinT * sinP),
      ),
    ],
  };
}

export class OperatorTable {
  private readonly operators: ComplexMatrix[];
  private readonly operatorsSquared: ComplexMatrix[];
  private readonly eigenvectorTable: ComplexVector[][];
  private readonly unknownStates: ReadonlyMap<SpinSystem, readonly ComplexVector[]>;

  // Last-queried direction entry per direction op; recursion that interleaves different
  // angles simply recomputes (cheap 3×3 math) — correctness never depends on the cache.
  private readonly directionCache: Map<number, DirectionEntry>;

  public constructor() {
    this.operators = [];
    this.operatorsSquared = [];
    this.eigenvectorTable = [];
    this.directionCache = new Map();

    // ── Fixed operators 0-5 ───────────────────────────────────────────────────

    // op 0: Sx spin-½ Pauli matrix and eigenstates
    this.operators[0] = ComplexMatrix.fromEntries([
      [0, 1, Complex.ONE],
      [1, 0, Complex.ONE],
    ]);
    this.eigenvectorTable[0] = [
      v(c(ROOT2_INV, 0), c(ROOT2_INV, 0)),
      v(c(ROOT2_INV, 0), c(-ROOT2_INV, 0)),
      v(Complex.ZERO, Complex.ZERO, Complex.ONE),
    ];

    // op 1: Sy spin-½ Pauli matrix and eigenstates
    this.operators[1] = ComplexMatrix.fromEntries([
      [0, 1, c(0, -1)],
      [1, 0, Complex.I],
    ]);
    this.eigenvectorTable[1] = [
      v(c(ROOT2_INV, 0), c(0, ROOT2_INV)),
      v(c(ROOT2_INV, 0), c(0, -ROOT2_INV)),
      v(Complex.ZERO, Complex.ZERO, Complex.ONE),
    ];

    // op 2: Sz spin-½ Pauli matrix and eigenstates
    this.operators[2] = ComplexMatrix.fromEntries([
      [0, 0, Complex.ONE],
      [1, 1, c(-1, 0)],
    ]);
    this.eigenvectorTable[2] = [
      v(Complex.ONE, Complex.ZERO),
      v(Complex.ZERO, Complex.ONE),
      v(Complex.ZERO, Complex.ZERO, Complex.ONE),
    ];

    // op 3: Sz spin-1 matrix and eigenstates |+1⟩, |−1⟩, |0⟩
    this.operators[3] = ComplexMatrix.fromEntries([
      [0, 0, Complex.ONE],
      [2, 2, c(-1, 0)],
    ]);
    this.eigenvectorTable[3] = [
      v(Complex.ONE, Complex.ZERO),
      v(Complex.ZERO, Complex.ZERO, Complex.ONE),
      v(Complex.ZERO, Complex.ONE),
    ];

    // op 4: Sx spin-1 matrix and eigenstates
    this.operators[4] = ComplexMatrix.fromEntries([
      [0, 1, c(ROOT2_INV, 0)],
      [1, 0, c(ROOT2_INV, 0)],
      [1, 2, c(ROOT2_INV, 0)],
      [2, 1, c(ROOT2_INV, 0)],
    ]);
    this.eigenvectorTable[4] = [
      v(c(0.5, 0), c(ROOT2_INV, 0), c(0.5, 0)),
      v(c(0.5, 0), c(-ROOT2_INV, 0), c(0.5, 0)),
      v(c(ROOT2_INV, 0), Complex.ZERO, c(-ROOT2_INV, 0)),
    ];

    // op 5: Sy spin-1 matrix and eigenstates
    this.operators[5] = ComplexMatrix.fromEntries([
      [0, 1, c(0, -ROOT2_INV)],
      [1, 0, c(0, ROOT2_INV)],
      [1, 2, c(0, -ROOT2_INV)],
      [2, 1, c(0, ROOT2_INV)],
    ]);
    this.eigenvectorTable[5] = [
      v(c(0.5, 0), c(0, ROOT2_INV), c(-0.5, 0)),
      v(c(0.5, 0), c(0, -ROOT2_INV), c(-0.5, 0)),
      v(c(ROOT2_INV, 0), Complex.ZERO, c(ROOT2_INV, 0)),
    ];

    for (let i = 0; i < DIRECTION_OP_START; i++) {
      this.operatorsSquared[i] = this.getOperator(i).squared();
    }

    // ── Unknown initial states (Experiment.initVectors, lines 219-240) ────────
    const sqrt3 = Math.sqrt(3);
    const spinHalfUnknowns: readonly ComplexVector[] = [
      this.getEigenvector(2, 0), // |+z⟩
      this.getEigenvector(1, 1), // |−y⟩
      v(c(ROOT2_INV, 0), c(-ROOT2_INV / 2, (-ROOT2_INV / 2) * sqrt3)), // |n⟩ 90°, 240°
      v(c(0.5, 0), c(0.75, -sqrt3 / 4)), // |n⟩ 120°, 330°
    ];
    const spinOneUnknowns: readonly ComplexVector[] = [
      this.getEigenvector(5, 0), // |1⟩y
      v(c(0.5, 0), c(ROOT2_INV / 2, (ROOT2_INV / 2) * sqrt3), c(-0.25, sqrt3 / 4)), // |1⟩n 90°, 60°
      v(c(1 / sqrt3, 0), c(0, -1 / sqrt3), c(-1 / sqrt3, 0)), // not a directional state
      v(c(ROOT2_INV, 0), Complex.ZERO, c(0, -ROOT2_INV)), // |0⟩n 90°, 45°
    ];
    this.unknownStates = new Map([
      [SpinSystem.SPIN_HALF, spinHalfUnknowns],
      [SpinSystem.SPIN_ONE, spinOneUnknowns],
    ]);
  }

  /**
   * The operator matrix for the given operator index (0-7). Direction operators (6-7)
   * require explicit (θ, φ) — every n̂ device owns its own angles.
   */
  public getOperator(op: number, theta?: number, phi?: number): ComplexMatrix {
    assert?.(op >= 0 && op < OPERATOR_COUNT, `invalid operator index: ${op}`);
    if (op >= DIRECTION_OP_START) {
      return this.directionEntry(op, theta, phi).operator;
    }
    return this.operators[op] as ComplexMatrix;
  }

  /** The square of the operator matrix for the given operator index (0-7). See getOperator. */
  public getOperatorSquared(op: number, theta?: number, phi?: number): ComplexMatrix {
    assert?.(op >= 0 && op < OPERATOR_COUNT, `invalid operator index: ${op}`);
    if (op >= DIRECTION_OP_START) {
      return this.directionEntry(op, theta, phi).operatorSquared;
    }
    return this.operatorsSquared[op] as ComplexMatrix;
  }

  /**
   * An eigenvector of the given operator. Index 0, 1, 2 corresponds to eigenvalues +1, −1, 0
   * (analyzer outputs UP, DOWN, NONE) — the verbatim Java convention. Direction operators
   * (6-7) require explicit (θ, φ).
   */
  public getEigenvector(op: number, index: number, theta?: number, phi?: number): ComplexVector {
    assert?.(op >= 0 && op < OPERATOR_COUNT, `invalid operator index: ${op}`);
    assert?.(index >= 0 && index < 3, `invalid eigenvector index: ${index}`);
    if (op >= DIRECTION_OP_START) {
      return this.directionEntry(op, theta, phi).eigenvectors[index] as ComplexVector;
    }
    // Every fixed operator row holds exactly 3 eigenvectors.
    return (this.eigenvectorTable[op] as ComplexVector[])[index] as ComplexVector;
  }

  /** One of the four hard-coded "Unknown #1-#4" initial states for the given system. */
  public getUnknownState(system: SpinSystem, index: number): ComplexVector {
    assert?.(index >= 0 && index < 4, `invalid unknown-state index: ${index}`);
    // The map covers every SpinSystem and each entry holds exactly 4 states.
    return (this.unknownStates.get(system) as readonly ComplexVector[])[index] as ComplexVector;
  }

  /** Eigenstate of Sz or Sx for a named preparation (+Z/−Z/+X/−X). */
  public getPreparedEigenstate(system: SpinSystem, type: AnalyzerType, index: 0 | 1): ComplexVector {
    return this.getEigenvector(system.opFor(type), index);
  }

  /**
   * The equal-weight basis used for the Random initial state: the Sz eigenstates for spin-½,
   * the Sy eigenstates for spin-1. Port of Experiment.run (lines 412-420).
   */
  public getRandomBasis(system: SpinSystem): readonly ComplexVector[] {
    return system === SpinSystem.SPIN_HALF
      ? [this.getEigenvector(2, 0), this.getEigenvector(2, 1)]
      : [this.getEigenvector(5, 0), this.getEigenvector(5, 1), this.getEigenvector(5, 2)];
  }

  /** The (memoized) direction entry for op 6 or 7 at the given angles. */
  private directionEntry(op: number, theta: number | undefined, phi: number | undefined): DirectionEntry {
    assert?.(
      theta !== undefined && phi !== undefined,
      `operator ${op} is direction-dependent; pass explicit (theta, phi)`,
    );
    const t = theta ?? DEFAULT_DIRECTION_THETA;
    const p = phi ?? DEFAULT_DIRECTION_PHI;
    const key = `${t}|${p}`;
    const cached = this.directionCache.get(op);
    if (cached && cached.key === key) {
      return cached;
    }
    const entry = op === DIRECTION_OP_START ? spinHalfDirection(t, p, key) : spinOneDirection(t, p, key);
    this.directionCache.set(op, entry);
    return entry;
  }
}
