/**
 * Unit tests for the Complex number primitive of the quantum math layer.
 */

import { describe, expect, it } from "vitest";
import { Complex } from "../../src/common/quantum/Complex.js";

describe("Complex", () => {
  it("adds and subtracts component-wise", () => {
    const a = new Complex(1, 2);
    const b = new Complex(3, -4);
    expect(a.plus(b).re).toBe(4);
    expect(a.plus(b).im).toBe(-2);
    expect(a.minus(b).re).toBe(-2);
    expect(a.minus(b).im).toBe(6);
  });

  it("multiplies complex values: (1+2i)(3-4i) = 11+2i", () => {
    const product = new Complex(1, 2).times(new Complex(3, -4));
    expect(product.re).toBeCloseTo(11, 12);
    expect(product.im).toBeCloseTo(2, 12);
  });

  it("i² = −1", () => {
    const iSquared = Complex.I.times(Complex.I);
    expect(iSquared.re).toBeCloseTo(-1, 12);
    expect(iSquared.im).toBeCloseTo(0, 12);
  });

  it("conjugate negates the imaginary part and preserves the modulus", () => {
    const z = new Complex(3, -4);
    const conj = z.conjugate();
    expect(conj.re).toBe(3);
    expect(conj.im).toBe(4);
    expect(conj.magnitudeSquared()).toBe(z.magnitudeSquared());
  });

  it("magnitudeSquared and magnitude: |3+4i| = 5", () => {
    const z = new Complex(3, 4);
    expect(z.magnitudeSquared()).toBe(25);
    expect(z.magnitude()).toBe(5);
  });

  it("z·z* = |z|² (real)", () => {
    const z = new Complex(2, -7);
    const product = z.times(z.conjugate());
    expect(product.re).toBeCloseTo(z.magnitudeSquared(), 12);
    expect(product.im).toBeCloseTo(0, 12);
  });

  it("timesScalar scales both components", () => {
    const z = new Complex(1, -2).timesScalar(-3);
    expect(z.re).toBe(-3);
    expect(z.im).toBe(6);
  });

  it("equalsEpsilon tolerates small differences only", () => {
    const z = new Complex(1, 1);
    expect(z.equalsEpsilon(new Complex(1 + 1e-12, 1 - 1e-12), 1e-9)).toBe(true);
    expect(z.equalsEpsilon(new Complex(1.001, 1), 1e-9)).toBe(false);
  });
});
