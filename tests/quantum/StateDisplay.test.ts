/**
 * Unit tests for StateDisplay helpers (Bloch vector, ket markup, probabilities).
 */

import { describe, expect, it } from "vitest";
import { Complex } from "../../src/common/quantum/Complex.js";
import { ComplexVector } from "../../src/common/quantum/ComplexVector.js";
import { SpinSystem } from "../../src/common/quantum/SpinSystem.js";
import {
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

  it("reports computational probabilities and ket markup for a superposition", () => {
    const root = 1 / Math.sqrt(2);
    const state = new ComplexVector(new Complex(root, 0), new Complex(root, 0));
    const probs = computationalProbabilities(state, 2);
    expect(probs[0]).toBeCloseTo(0.5, 10);
    expect(probs[1]).toBeCloseTo(0.5, 10);
    expect(ketMarkup(state, SpinSystem.SPIN_HALF)).toContain("|+⟩");
    expect(ketMarkup(state, SpinSystem.SPIN_HALF)).toContain("|−⟩");
  });

  it("formats pure-imaginary amplitudes without a leading zero real part", () => {
    expect(formatAmplitude(new Complex(0, 0.5))).toBe("0.50i");
    expect(formatAmplitude(new Complex(0.5, 0.5))).toBe("0.50+0.50i");
  });

  it("labels spin-1 components in (+1, 0, −1) order — m=0 is component 1, m=−1 is component 2", () => {
    // Computational basis convention (OperatorTable op 7): |+1⟩=(1,0,0), |0⟩=(0,1,0), |−1⟩=(0,0,1).
    expect(basisLabels(SpinSystem.SPIN_ONE)).toEqual(["+", "0", "−"]);
    const mZero = new ComplexVector(Complex.ZERO, Complex.ONE, Complex.ZERO);
    expect(ketMarkup(mZero, SpinSystem.SPIN_ONE)).toBe("|ψ⟩ = (1.00)|0⟩");
    const mMinus = new ComplexVector(Complex.ZERO, Complex.ZERO, Complex.ONE);
    expect(ketMarkup(mMinus, SpinSystem.SPIN_ONE)).toBe("|ψ⟩ = (1.00)|−⟩");
  });
});
