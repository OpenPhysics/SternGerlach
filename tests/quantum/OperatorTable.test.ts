/**
 * Unit tests for OperatorTable — the port of Experiment.initVectors() and
 * SetPhi(). Verifies for every operator that the eigenvectors are orthonormal
 * eigenstates with the eigenvalue-order convention (+1, −1, 0), that
 * opSquared = op², that Sn(θ, φ) reduces to Sz / Sx at special angles, and
 * that the hard-coded unknown states and Random bases are normalized.
 */

import { describe, expect, it } from "vitest";
import type { ComplexMatrix } from "../../src/common/quantum/ComplexMatrix.js";
import { ComplexVector } from "../../src/common/quantum/ComplexVector.js";
import {
  DEFAULT_DIRECTION_PHI,
  DEFAULT_DIRECTION_THETA,
  OPERATOR_COUNT,
  OperatorTable,
} from "../../src/common/quantum/OperatorTable.js";
import { SpinSystem } from "../../src/common/quantum/SpinSystem.js";

const EIGENVALUES = [1, -1, 0] as const;

/** Eigenvector count per operator: op 6 (spin-½ Sn) defines only 2; all others define 3. */
function eigenvectorCount(op: number): number {
  return op === 6 ? 2 : 3;
}

/** Angle-aware lookups: ops 6-7 require explicit (θ, φ); use the device defaults here. */
function operatorOf(table: OperatorTable, op: number): ComplexMatrix {
  return table.getOperator(op, DEFAULT_DIRECTION_THETA, DEFAULT_DIRECTION_PHI);
}
function operatorSquaredOf(table: OperatorTable, op: number): ComplexMatrix {
  return table.getOperatorSquared(op, DEFAULT_DIRECTION_THETA, DEFAULT_DIRECTION_PHI);
}
function eigenvectorOf(table: OperatorTable, op: number, index: number): ComplexVector {
  return table.getEigenvector(op, index, DEFAULT_DIRECTION_THETA, DEFAULT_DIRECTION_PHI);
}

describe("OperatorTable", () => {
  const table = new OperatorTable();

  it("every operator is Hermitian", () => {
    for (let op = 0; op < OPERATOR_COUNT; op++) {
      const h = operatorOf(table, op);
      expect(h.conjugateTranspose().equalsEpsilon(h, 1e-12), `op ${op} Hermitian`).toBe(true);
    }
  });

  it("every eigenvector satisfies H·e = λ·e with λ order (+1, −1, 0)", () => {
    for (let op = 0; op < OPERATOR_COUNT; op++) {
      const h = operatorOf(table, op);
      for (let k = 0; k < eigenvectorCount(op); k++) {
        const e = eigenvectorOf(table, op, k);
        const he = h.timesVector(e);
        const scaled = e.components.map((component) => component.timesScalar(EIGENVALUES[k]));
        const expected = new ComplexVector(scaled[0], scaled[1], scaled[2]);
        expect(he.equalsEpsilon(expected, 1e-12), `op ${op} eigenvector ${k}`).toBe(true);
      }
    }
  });

  it("each operator's eigenvectors are orthonormal", () => {
    for (let op = 0; op < OPERATOR_COUNT; op++) {
      const count = eigenvectorCount(op);
      for (let a = 0; a < count; a++) {
        for (let b = 0; b < count; b++) {
          const overlap = eigenvectorOf(table, op, a).innerProduct(eigenvectorOf(table, op, b));
          const expected = a === b ? 1 : 0;
          expect(overlap.magnitude(), `op ${op}: ⟨e${a}|e${b}⟩`).toBeCloseTo(expected, 10);
        }
      }
    }
  });

  it("operatorsSquared equals the operator squared for every operator", () => {
    for (let op = 0; op < OPERATOR_COUNT; op++) {
      expect(operatorSquaredOf(table, op).equalsEpsilon(operatorOf(table, op).squared(), 1e-12), `op ${op}`).toBe(true);
    }
  });

  it("OPERATOR_COUNT is 8 (spin-½ + spin-1 fixed ops and Sn pair)", () => {
    expect(OPERATOR_COUNT).toBe(8);
  });

  it("Sn(0, ·) ≡ Sz for both spin-½ and spin-1", () => {
    expect(table.getOperator(6, 0, 1.23).equalsEpsilon(table.getOperator(2), 1e-12)).toBe(true);
    expect(table.getOperator(7, 0, 1.23).equalsEpsilon(table.getOperator(3), 1e-12)).toBe(true);
  });

  it("Sn(π/2, 0) ≡ Sx for both spin-½ and spin-1", () => {
    expect(table.getOperator(6, Math.PI / 2, 0).equalsEpsilon(table.getOperator(0), 1e-12)).toBe(true);
    expect(table.getOperator(7, Math.PI / 2, 0).equalsEpsilon(table.getOperator(4), 1e-12)).toBe(true);
  });

  it("direction lookups are pure: interleaved (θ, φ) queries never disturb each other", () => {
    const pure = new OperatorTable();
    const before = pure.getEigenvector(6, 1, Math.PI / 2, 0);
    // Query the same op at different angles in between — the Java-era mutable table
    // would have returned this second query's eigenvectors for the first angles too.
    pure.getEigenvector(6, 0, 0.7, 1.3);
    pure.getOperator(7, 0.2, 0.9);
    const after = pure.getEigenvector(6, 1, Math.PI / 2, 0);
    expect(after.equalsEpsilon(before, 1e-15)).toBe(true);
  });

  it("Sn eigenvectors satisfy the eigen-equation at arbitrary angles", () => {
    const theta = 1.0;
    const phi = 2.0;
    for (const op of [6, 7]) {
      const h = table.getOperator(op, theta, phi);
      for (let k = 0; k < eigenvectorCount(op); k++) {
        const e = table.getEigenvector(op, k, theta, phi);
        const scaled = e.components.map((component) => component.timesScalar(EIGENVALUES[k]));
        expect(h.timesVector(e).equalsEpsilon(new ComplexVector(scaled[0], scaled[1], scaled[2]), 1e-12)).toBe(true);
      }
    }
  });

  it("unknown initial states are normalized for both spin systems", () => {
    for (const system of [SpinSystem.SPIN_HALF, SpinSystem.SPIN_ONE]) {
      for (let i = 0; i < 4; i++) {
        expect(table.getUnknownState(system, i).magnitudeSquared(), `${system.name} unknown #${i + 1}`).toBeCloseTo(
          1,
          10,
        );
      }
    }
  });

  it("unknown #1 is |+z⟩ (spin-½) and unknown #2 is |−y⟩ (spin-½)", () => {
    expect(table.getUnknownState(SpinSystem.SPIN_HALF, 0)).toBe(table.getEigenvector(2, 0));
    expect(table.getUnknownState(SpinSystem.SPIN_HALF, 1)).toBe(table.getEigenvector(1, 1));
  });

  it("Random bases: Sz eigenstates for spin-½, Sy eigenstates for spin-1", () => {
    const half = table.getRandomBasis(SpinSystem.SPIN_HALF);
    expect(half).toHaveLength(2);
    expect(half[0]).toBe(table.getEigenvector(2, 0));
    expect(half[1]).toBe(table.getEigenvector(2, 1));

    const one = table.getRandomBasis(SpinSystem.SPIN_ONE);
    expect(one).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(one[i]).toBe(table.getEigenvector(5, i));
    }
  });

  it("SpinSystem typeTable maps Z/X/Y/N onto contiguous operator indices", () => {
    const { SPIN_HALF, SPIN_ONE } = SpinSystem;
    expect(SPIN_HALF.analyzerTypes.map((t) => SPIN_HALF.opFor(t))).toEqual([2, 0, 1, 6]);
    expect(SPIN_ONE.analyzerTypes.map((t) => SPIN_ONE.opFor(t))).toEqual([3, 4, 5, 7]);
    expect(SPIN_HALF.stateCount).toBe(2);
    expect(SPIN_ONE.stateCount).toBe(3);
    expect(SPIN_HALF.defaultType.code).toBe("Z");
    expect(SPIN_ONE.defaultType.code).toBe("Z");
  });
});
