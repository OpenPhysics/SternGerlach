/**
 * Unit tests for ComplexVector: inner-product conjugation, Born-rule weights,
 * projectOut orthogonality + normalization.
 */

import { describe, expect, it } from "vitest";
import { Complex } from "../../src/common/quantum/Complex.js";
import { ComplexVector } from "../../src/common/quantum/ComplexVector.js";

const ROOT2_INV = 1 / Math.sqrt(2);

describe("ComplexVector", () => {
  it("innerProduct conjugates the left operand: ⟨a|b⟩ = ⟨b|a⟩*", () => {
    const a = new ComplexVector(new Complex(1, 1), new Complex(0, -2), new Complex(0.5, 0));
    const b = new ComplexVector(new Complex(2, 0), new Complex(1, 1), new Complex(0, 1));
    const ab = a.innerProduct(b);
    const ba = b.innerProduct(a);
    expect(ab.re).toBeCloseTo(ba.re, 12);
    expect(ab.im).toBeCloseTo(-ba.im, 12);
  });

  it("innerProduct of |+y⟩ with itself is 1 (uses conjugation, not plain dot product)", () => {
    // |+y⟩ = (1, i)/√2 — a plain (unconjugated) dot product would give 0
    const plusY = new ComplexVector(new Complex(ROOT2_INV, 0), new Complex(0, ROOT2_INV));
    expect(plusY.innerProduct(plusY).re).toBeCloseTo(1, 12);
    expect(plusY.innerProduct(plusY).im).toBeCloseTo(0, 12);
  });

  it("dotProdSquared reproduces the Born rule: |⟨+x|+z⟩|² = ½", () => {
    const plusZ = ComplexVector.fromReal(1, 0);
    const plusX = ComplexVector.fromReal(ROOT2_INV, ROOT2_INV);
    expect(plusX.dotProdSquared(plusZ)).toBeCloseTo(0.5, 12);
  });

  it("normalize produces a unit vector and preserves direction", () => {
    const vector = new ComplexVector(new Complex(3, 0), new Complex(0, 4), new Complex(0, 0));
    const normalized = vector.normalize();
    expect(normalized.magnitudeSquared()).toBeCloseTo(1, 12);
    expect(normalized.components[0].re).toBeCloseTo(3 / 5, 12);
    expect(normalized.components[1].im).toBeCloseTo(4 / 5, 12);
  });

  it("projectOut removes the component along the eigenvector and re-normalizes", () => {
    // Project |+z⟩ out of a generic normalized state
    const e = ComplexVector.fromReal(1, 0, 0);
    const psi = new ComplexVector(new Complex(0.5, 0.5), new Complex(0.5, 0), new Complex(0, 0.5)).normalize();
    const projected = e.projectOut(psi);

    // orthogonal to e
    expect(projected.dotProdSquared(e)).toBeCloseTo(0, 12);

    // normalized
    expect(projected.magnitudeSquared()).toBeCloseTo(1, 12);

    // remaining components keep their relative amplitudes
    const ratioBefore = psi.components[1].magnitudeSquared() / psi.components[2].magnitudeSquared();
    const ratioAfter = projected.components[1].magnitudeSquared() / projected.components[2].magnitudeSquared();
    expect(ratioAfter).toBeCloseTo(ratioBefore, 12);
  });

  it("projectOut is idempotent up to normalization", () => {
    const e = new ComplexVector(new Complex(ROOT2_INV, 0), new Complex(0, ROOT2_INV), Complex.ZERO);
    const psi = new ComplexVector(new Complex(0.6, 0), new Complex(0, 0.48), new Complex(0.64, 0)).normalize();
    const once = e.projectOut(psi);
    const twice = e.projectOut(once);
    expect(twice.equalsEpsilon(once, 1e-9)).toBe(true);
  });

  it("plus and times build superpositions: (|+z⟩ + |−z⟩)/√2 = |+x⟩", () => {
    const plusZ = ComplexVector.fromReal(1, 0);
    const minusZ = ComplexVector.fromReal(0, 1);
    const superposition = plusZ.plus(minusZ).times(new Complex(ROOT2_INV, 0));
    expect(superposition.equalsEpsilon(ComplexVector.fromReal(ROOT2_INV, ROOT2_INV), 1e-12)).toBe(true);
  });
});
