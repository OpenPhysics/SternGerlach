/**
 * Unit tests for OperatorTable — the port of Experiment.initVectors() and
 * SetPhi(). Verifies for every operator that the eigenvectors are orthonormal
 * eigenstates with the eigenvalue-order convention (+1, −1, 0), that
 * opSquared = op², that Sn(θ, φ) reduces to Sz / Sx at special angles, and
 * that the hard-coded unknown states and Random bases are normalized.
 */

import { describe, expect, it } from "vitest";
import { ComplexVector } from "../../src/common/quantum/ComplexVector.js";
import { OPERATOR_COUNT, OperatorTable } from "../../src/common/quantum/OperatorTable.js";
import { SpinSystem } from "../../src/common/quantum/SpinSystem.js";

const EIGENVALUES = [1, -1, 0] as const;

/** Eigenvector count per operator: op 6 (spin-½ Sn) defines only 2; all others define 3. */
function eigenvectorCount(op: number): number {
  return op === 6 ? 2 : 3;
}

describe("OperatorTable", () => {
  const table = new OperatorTable();

  it("every operator is Hermitian", () => {
    for (let op = 0; op < OPERATOR_COUNT; op++) {
      const h = table.getOperator(op);
      expect(h.conjugateTranspose().equalsEpsilon(h, 1e-12), `op ${op} Hermitian`).toBe(true);
    }
  });

  it("every eigenvector satisfies H·e = λ·e with λ order (+1, −1, 0)", () => {
    for (let op = 0; op < OPERATOR_COUNT; op++) {
      const h = table.getOperator(op);
      for (let k = 0; k < eigenvectorCount(op); k++) {
        const e = table.getEigenvector(op, k);
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
          const overlap = table.getEigenvector(op, a).innerProduct(table.getEigenvector(op, b));
          const expected = a === b ? 1 : 0;
          expect(overlap.magnitude(), `op ${op}: ⟨e${a}|e${b}⟩`).toBeCloseTo(expected, 10);
        }
      }
    }
  });

  it("operatorsSquared equals the operator squared for every operator", () => {
    for (let op = 0; op < OPERATOR_COUNT; op++) {
      expect(table.getOperatorSquared(op).equalsEpsilon(table.getOperator(op).squared(), 1e-12), `op ${op}`).toBe(true);
    }
  });

  it("OPERATOR_COUNT is 8 (spin-½ + spin-1 fixed ops and Sn pair)", () => {
    expect(OPERATOR_COUNT).toBe(8);
  });

  it("Sn(0, ·) ≡ Sz for both spin-½ and spin-1", () => {
    const rotated = new OperatorTable(0, 1.23);
    expect(rotated.getOperator(6).equalsEpsilon(rotated.getOperator(2), 1e-12)).toBe(true);
    expect(rotated.getOperator(7).equalsEpsilon(rotated.getOperator(3), 1e-12)).toBe(true);
  });

  it("Sn(π/2, 0) ≡ Sx for both spin-½ and spin-1", () => {
    const rotated = new OperatorTable(Math.PI / 2, 0);
    expect(rotated.getOperator(6).equalsEpsilon(rotated.getOperator(0), 1e-12)).toBe(true);
    expect(rotated.getOperator(7).equalsEpsilon(rotated.getOperator(4), 1e-12)).toBe(true);
  });

  it("setDirectionAngles updates θ/φ and keeps Sn eigenvectors consistent", () => {
    const mutable = new OperatorTable();
    mutable.setDirectionAngles(1.0, 2.0);
    expect(mutable.theta).toBe(1.0);
    expect(mutable.phi).toBe(2.0);
    for (const op of [6, 7]) {
      const h = mutable.getOperator(op);
      for (let k = 0; k < eigenvectorCount(op); k++) {
        const e = mutable.getEigenvector(op, k);
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
