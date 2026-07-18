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
 *   6-7  Sn(θ, φ) for spin-½ / spin-1, recomputed by setDirectionAngles
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

const ROOT2_INV = 1 / Math.sqrt(2);

/** Shorthand constructors, matching the Java cOne / ci / cMinusOne / cMinusi style. */
const c = (re: number, im: number) => new Complex(re, im);
const v = (c0: Complex, c1: Complex, c2: Complex = Complex.ZERO) => new ComplexVector(c0, c1, c2);

export class OperatorTable {
  private readonly operators: ComplexMatrix[];
  private readonly operatorsSquared: ComplexMatrix[];
  private readonly eigenvectorTable: ComplexVector[][];
  private readonly unknownStates: ReadonlyMap<SpinSystem, readonly ComplexVector[]>;

  private _theta: number;
  private _phi: number;

  /**
   * @param theta - initial polar angle for the Sn(θ, φ) operators (Java init: π/2)
   * @param phi - initial azimuthal angle for the Sn(θ, φ) operators (Java init: π/4)
   */
  public constructor(theta: number = Math.PI / 2, phi: number = Math.PI / 4) {
    this.operators = [];
    this.operatorsSquared = [];
    this.eigenvectorTable = [];
    this._theta = theta;
    this._phi = phi;

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

    // ops 6-7 and their squares are filled in by setDirectionAngles
    this.setDirectionAngles(theta, phi);

    for (let i = 0; i < 6; i++) {
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

  /** Polar angle θ of the Sn(θ, φ) operators, in radians. */
  public get theta(): number {
    return this._theta;
  }

  /** Azimuthal angle φ of the Sn(θ, φ) operators, in radians. */
  public get phi(): number {
    return this._phi;
  }

  /**
   * Sets new direction angles and recomputes operators 6 (spin-½ Sn) and 7 (spin-1 Sn),
   * their squares, and their eigenvectors. Port of Experiment.SetPhi (lines 268-304).
   */
  public setDirectionAngles(theta: number, phi: number): void {
    this._theta = theta;
    this._phi = phi;

    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const sinP = Math.sin(phi);
    const cosP = Math.cos(phi);

    // op 6: Sn(θ, φ) spin-½ matrix and eigenvectors
    this.operators[6] = ComplexMatrix.fromEntries([
      [0, 0, c(cosT, 0)],
      [0, 1, c(sinT * cosP, -sinT * sinP)],
      [1, 0, c(sinT * cosP, sinT * sinP)],
      [1, 1, c(-cosT, 0)],
    ]);
    this.operatorsSquared[6] = this.operators[6].squared();

    const sinHalfT = Math.sin(theta / 2);
    const cosHalfT = Math.cos(theta / 2);
    this.eigenvectorTable[6] = [
      v(c(cosHalfT, 0), c(sinHalfT * cosP, sinHalfT * sinP)),
      v(c(sinHalfT, 0), c(-cosHalfT * cosP, -cosHalfT * sinP)),
      ComplexVector.ZERO, // Java leaves the unused third eigenvector as zero
    ];

    // op 7: Sn(θ, φ) spin-1 matrix and eigenvectors
    this.operators[7] = ComplexMatrix.fromEntries([
      [0, 0, c(cosT, 0)],
      [0, 1, c(ROOT2_INV * sinT * cosP, -ROOT2_INV * sinT * sinP)],
      [1, 0, c(ROOT2_INV * sinT * cosP, ROOT2_INV * sinT * sinP)],
      [1, 2, c(ROOT2_INV * sinT * cosP, -ROOT2_INV * sinT * sinP)],
      [2, 1, c(ROOT2_INV * sinT * cosP, ROOT2_INV * sinT * sinP)],
      [2, 2, c(-cosT, 0)],
    ]);
    this.operatorsSquared[7] = this.operators[7].squared();

    this.eigenvectorTable[7] = [
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
    ];
  }

  /** The operator matrix for the given operator index (0-7). */
  public getOperator(op: number): ComplexMatrix {
    assert?.(op >= 0 && op < OPERATOR_COUNT, `invalid operator index: ${op}`);
    return this.operators[op] as ComplexMatrix;
  }

  /** The square of the operator matrix for the given operator index (0-7). */
  public getOperatorSquared(op: number): ComplexMatrix {
    assert?.(op >= 0 && op < OPERATOR_COUNT, `invalid operator index: ${op}`);
    return this.operatorsSquared[op] as ComplexMatrix;
  }

  /**
   * An eigenvector of the given operator. Index 0, 1, 2 corresponds to eigenvalues +1, −1, 0
   * (analyzer outputs UP, DOWN, NONE) — the verbatim Java convention.
   */
  public getEigenvector(op: number, index: number): ComplexVector {
    assert?.(op >= 0 && op < OPERATOR_COUNT, `invalid operator index: ${op}`);
    assert?.(index >= 0 && index < 3, `invalid eigenvector index: ${index}`);
    // Every operator row holds exactly 3 eigenvectors.
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
}
