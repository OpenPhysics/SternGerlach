/**
 * StateDisplay.ts
 *
 * Pure helpers for presenting a ComplexVector: Bloch-sphere coordinates for
 * spin-½, Born probabilities in a chosen basis, and a readable ket equation.
 */

import type { Complex } from "./Complex.js";
import type { ComplexVector } from "./ComplexVector.js";
import type { SpinSystem } from "./SpinSystem.js";

/** Cartesian Bloch vector (x, y, z) for a pure spin-½ state. */
export type BlochVector = { x: number; y: number; z: number };

/** One term of a ket expansion, ready for layout (coefficient + basis label). */
export type KetTerm = {
  /** Coefficient markup, empty when the amplitude is ≈ ±1 (sign absorbed into `sign`). */
  readonly coefficient: string;
  /** "+" or "−" for every term after the first; "" for the leading term when positive. */
  readonly sign: "" | "+" | "−";
  /** Basis ket without bars, e.g. "+z" or "−1". */
  readonly label: string;
};

/** Formats a complex amplitude for display, e.g. "0.71", "−0.50i", "0.50 + 0.50i". */
export function formatAmplitude(c: Complex, digits = 2): string {
  const re = round(c.re, digits);
  const im = round(c.im, digits);
  if (Math.abs(im) < 5 * 10 ** -(digits + 1)) {
    return formatReal(re, digits);
  }
  if (Math.abs(re) < 5 * 10 ** -(digits + 1)) {
    return `${formatReal(im, digits)}i`;
  }
  const imAbs = formatReal(Math.abs(im), digits);
  return im >= 0 ? `${formatReal(re, digits)} + ${imAbs}i` : `${formatReal(re, digits)} − ${imAbs}i`;
}

/**
 * Bloch vector for a pure spin-½ state in the computational Z basis:
 *   ⟨σx⟩, ⟨σy⟩, ⟨σz⟩ with |α|²+|β|² = 1.
 */
export function blochVectorFromSpinHalf(state: ComplexVector): BlochVector {
  const [a, b] = state.components;
  const ax = a.re;
  const ay = a.im;
  const bx = b.re;
  const by = b.im;
  return {
    x: 2 * (ax * bx + ay * by),
    y: 2 * (ay * bx - ax * by),
    z: a.magnitudeSquared() - b.magnitudeSquared(),
  };
}

/** Born probabilities |cᵢ|² of the state in the computational (Z) basis. */
export function computationalProbabilities(state: ComplexVector, stateCount: number): number[] {
  return state.components.slice(0, stateCount).map((c) => c.magnitudeSquared());
}

/**
 * Display labels for the computational Z-basis kets, in component order.
 * Spin-½ uses "+z" / "−z"; spin-1 uses "+1" / "0" / "−1" (m values).
 * Component order for 3-state matches OperatorTable op 3: (+1, 0, −1).
 */
export function basisLabels(system: SpinSystem): readonly string[] {
  return system.stateCount === 2 ? ["+z", "−z"] : ["+1", "0", "−1"];
}

/**
 * Labels for amplitudes entered in a chosen measurement basis (dialog rows).
 * Spin-½: |+z⟩/|−z⟩, |+x⟩/|−x⟩, |+y⟩/|−y⟩; spin-1: |+1⟩, |0⟩, |−1⟩.
 */
export function amplitudeBasisLabels(system: SpinSystem, basisCode: string): readonly string[] {
  if (system.stateCount === 2) {
    const axis = basisCode.toLowerCase();
    return [`+${axis}`, `−${axis}`];
  }
  return ["+1", "0", "−1"];
}

/**
 * Breaks a state into signed ket terms for structured layout. Near-zero amplitudes
 * are omitted; a lone ≈±1 amplitude yields a bare ket (no coefficient).
 */
export function ketTerms(state: ComplexVector, system: SpinSystem, digits = 2): KetTerm[] {
  const labels = basisLabels(system);
  const terms: KetTerm[] = [];
  for (let i = 0; i < system.stateCount; i++) {
    const amp = state.components[i] as Complex;
    if (amp.magnitudeSquared() >= 1e-8) {
      terms.push(ketTerm(amp, labels[i] as string, terms.length === 0, digits));
    }
  }
  return terms;
}

/** One signed ket term for an amplitude that survived the near-zero cut. */
function ketTerm(amp: Complex, label: string, isLeading: boolean, digits: number): KetTerm {
  const epsilon = 5 * 10 ** -(digits + 1);
  const re = round(amp.re, digits);
  const im = round(amp.im, digits);
  const almostReal = Math.abs(im) < epsilon;
  const almostOne = almostReal && Math.abs(Math.abs(re) - 1) < epsilon;
  const negative = almostReal && re < 0;

  if (almostOne) {
    return { coefficient: "", sign: negative ? "−" : isLeading ? "" : "+", label };
  }
  // For the leading term, fold a pure-real minus into the coefficient; later terms use sign.
  if (isLeading) {
    return { coefficient: formatAmplitude(amp, digits), sign: "", label };
  }
  if (negative) {
    return { coefficient: formatReal(Math.abs(re), digits), sign: "−", label };
  }
  return { coefficient: formatAmplitude(amp, digits), sign: "+", label };
}

/**
 * RichText ket equation in the Z basis. Pure eigenstates render as `|ψ⟩ = |+z⟩`;
 * superpositions stack terms on separate lines for readability.
 */
export function ketMarkup(state: ComplexVector, system: SpinSystem, digits = 2): string {
  const terms = ketTerms(state, system, digits);
  if (terms.length === 0) {
    return "|ψ⟩ = 0";
  }
  const lines = terms.map((term, index) => {
    const ket = `|${term.label}⟩`;
    const body = term.coefficient === "" ? ket : `${term.coefficient} ${ket}`;
    if (index === 0) {
      return term.sign === "−" ? `|ψ⟩ = −${body}` : `|ψ⟩ = ${body}`;
    }
    return `${term.sign} ${body}`;
  });
  return lines.join("<br>");
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatReal(value: number, digits: number): string {
  const rounded = round(value, digits);
  if (Object.is(rounded, -0)) {
    return (0).toFixed(digits);
  }
  return rounded.toFixed(digits);
}
