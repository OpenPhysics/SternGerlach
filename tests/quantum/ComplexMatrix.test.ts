/**
 * Unit tests for ComplexMatrix: identity behavior, products, squares,
 * conjugate transpose.
 */

import { describe, expect, it } from "vitest";
import { Complex } from "../../src/common/quantum/Complex.js";
import { ComplexMatrix } from "../../src/common/quantum/ComplexMatrix.js";
import { ComplexVector } from "../../src/common/quantum/ComplexVector.js";

describe("ComplexMatrix", () => {
  it("identity maps any vector to itself", () => {
    const v = new ComplexVector(new Complex(1, 2), new Complex(-3, 0), new Complex(0, 4));
    expect(ComplexMatrix.identity().timesVector(v).equalsEpsilon(v, 1e-12)).toBe(true);
  });

  it("timesVector computes M·v (Pauli Sx flips the basis states)", () => {
    const pauliX = ComplexMatrix.fromEntries([
      [0, 1, Complex.ONE],
      [1, 0, Complex.ONE],
    ]);
    const plusZ = ComplexVector.fromReal(1, 0);
    expect(pauliX.timesVector(plusZ).equalsEpsilon(ComplexVector.fromReal(0, 1), 1e-12)).toBe(true);
  });

  it("squared of Pauli Sy is the 2×2 identity (third row/column zero)", () => {
    const pauliY = ComplexMatrix.fromEntries([
      [0, 1, new Complex(0, -1)],
      [1, 0, Complex.I],
    ]);
    const expected = ComplexMatrix.fromEntries([
      [0, 0, Complex.ONE],
      [1, 1, Complex.ONE],
    ]);
    expect(pauliY.squared().equalsEpsilon(expected, 1e-12)).toBe(true);
  });

  it("plus and timesScalar act entry-wise: M + (−1)·M = 0", () => {
    const m = ComplexMatrix.fromEntries([
      [0, 1, new Complex(2, 3)],
      [2, 2, new Complex(-1, 5)],
    ]);
    const zero = m.plus(m.timesScalar(new Complex(-1, 0)));
    expect(zero.equalsEpsilon(ComplexMatrix.zero(), 1e-12)).toBe(true);
  });

  it("conjugateTranspose of a Hermitian matrix is itself", () => {
    const hermitian = ComplexMatrix.fromEntries([
      [0, 0, Complex.ONE],
      [0, 1, new Complex(0, -1)],
      [1, 0, Complex.I],
      [2, 2, new Complex(-1, 0)],
    ]);
    expect(hermitian.conjugateTranspose().equalsEpsilon(hermitian, 1e-12)).toBe(true);
  });

  it("timesMatrix matches squared", () => {
    const m = ComplexMatrix.fromEntries([
      [0, 1, new Complex(1, 1)],
      [1, 2, new Complex(0, -2)],
      [2, 0, new Complex(3, 0)],
    ]);
    expect(m.timesMatrix(m).equalsEpsilon(m.squared(), 1e-12)).toBe(true);
  });
});
