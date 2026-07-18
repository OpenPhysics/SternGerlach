/**
 * Unit tests for StateDisplay helpers (Bloch vector, ket markup, probabilities).
 */

import { describe, expect, it } from "vitest";
import { Complex } from "../../src/common/quantum/Complex.js";
import { ComplexVector } from "../../src/common/quantum/ComplexVector.js";
import { SpinSystem } from "../../src/common/quantum/SpinSystem.js";
import {
  amplitudeBasisLabels,
  basisLabels,
  blochVectorFromSpinHalf,
  computationalProbabilities,
  formatAmplitude,
  ketMarkup,
} from "../../src/common/quantum/StateDisplay.js";

describe("StateDisplay", () => {
  it("maps |+z⟩ to the +Z Bloch pole", () => {
    const state = new ComplexVector(Complex.ONE, Complex.ZERO);
    const bloch = blochVectorFromSpinHalf(state);
    expect(bloch.x).toBeCloseTo(0, 10);
    expect(bloch.y).toBeCloseTo(0, 10);
    expect(bloch.z).toBeCloseTo(1, 10);
  });

  it("maps |+x⟩ to the +X Bloch pole", () => {
    const root = 1 / Math.sqrt(2);
    const state = new ComplexVector(new Complex(root, 0), new Complex(root, 0));
    const bloch = blochVectorFromSpinHalf(state);
    expect(bloch.x).toBeCloseTo(1, 10);
    expect(bloch.y).toBeCloseTo(0, 10);
    expect(bloch.z).toBeCloseTo(0, 10);
  });

  it("reports computational probabilities and readable ket markup for a superposition", () => {
    const root = 1 / Math.sqrt(2);
    const state = new ComplexVector(new Complex(root, 0), new Complex(root, 0));
    const probs = computationalProbabilities(state, 2);
    expect(probs[0]).toBeCloseTo(0.5, 10);
    expect(probs[1]).toBeCloseTo(0.5, 10);
    const markup = ketMarkup(state, SpinSystem.SPIN_HALF);
    expect(markup).toContain("|+z⟩");
    expect(markup).toContain("|−z⟩");
    expect(markup).toContain("<br>");
    expect(markup).not.toContain("(0.71)");
  });

  it("renders a pure eigenstate as a bare ket", () => {
    const state = new ComplexVector(Complex.ONE, Complex.ZERO);
    expect(ketMarkup(state, SpinSystem.SPIN_HALF)).toBe("|ψ⟩ = |+z⟩");
  });

  it("formats complex amplitudes with spaced real/imaginary parts", () => {
    expect(formatAmplitude(new Complex(0, 0.5))).toBe("0.50i");
    expect(formatAmplitude(new Complex(0.5, 0.5))).toBe("0.50 + 0.50i");
    expect(formatAmplitude(new Complex(0.5, -0.5))).toBe("0.50 − 0.50i");
  });

  it("labels spin-1 components in (+1, 0, −1) order — m=0 is component 1, m=−1 is component 2", () => {
    expect(basisLabels(SpinSystem.SPIN_ONE)).toEqual(["+1", "0", "−1"]);
    const mZero = new ComplexVector(Complex.ZERO, Complex.ONE, Complex.ZERO);
    expect(ketMarkup(mZero, SpinSystem.SPIN_ONE)).toBe("|ψ⟩ = |0⟩");
    const mMinus = new ComplexVector(Complex.ZERO, Complex.ZERO, Complex.ONE);
    expect(ketMarkup(mMinus, SpinSystem.SPIN_ONE)).toBe("|ψ⟩ = |−1⟩");
  });

  it("provides basis-aware amplitude row labels for the custom-state dialog", () => {
    expect(amplitudeBasisLabels(SpinSystem.SPIN_HALF, "X")).toEqual(["+x", "−x"]);
    expect(amplitudeBasisLabels(SpinSystem.SPIN_ONE, "Z")).toEqual(["+1", "0", "−1"]);
  });
});
