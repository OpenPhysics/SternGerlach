/**
 * StateDisplay.ts
 *
 * Pure helpers for presenting a ComplexVector: Bloch-sphere coordinates for
 * spin-½, Born probabilities in a chosen basis, and a compact ket markup string.
 */

import type { Complex } from "./Complex.js";
import type { ComplexVector } from "./ComplexVector.js";
import type { SpinSystem } from "./SpinSystem.js";

/** Cartesian Bloch vector (x, y, z) for a pure spin-½ state. */
export type BlochVector = { x: number; y: number; z: number };

/** Formats a complex amplitude for RichText, e.g. "0.71", "−0.50i", "0.50+0.50i". */
export function formatAmplitude(c: Complex, digits = 2): string {
  const re = round(c.re, digits);
  const im = round(c.im, digits);
  if (Math.abs(im) < 5 * 10 ** -(digits + 1)) {
    return formatReal(re, digits);
  }
  if (Math.abs(re) < 5 * 10 ** -(digits + 1)) {
    return `${formatReal(im, digits)}i`;
  }
  const imPart = im >= 0 ? `+${formatReal(im, digits)}i` : `${formatReal(im, digits)}i`;
  return `${formatReal(re, digits)}${imPart}`;
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
 * RichText ket markup for a state in the Z basis, e.g.
 * `|ψ⟩ = (0.71)|+⟩ + (0.71)|−⟩`.
 */
export function ketMarkup(state: ComplexVector, system: SpinSystem, digits = 2): string {
  const labels = system.stateCount === 2 ? ["+", "−"] : ["+", "−", "0"];
  const parts: string[] = [];
  for (let i = 0; i < system.stateCount; i++) {
    const amp = state.components[i] as Complex;
    if (amp.magnitudeSquared() < 1e-8) {
      continue;
    }
    const formatted = formatAmplitude(amp, digits);
    const prefix = parts.length === 0 ? "" : formatted.startsWith("-") ? " " : " + ";
    parts.push(`${prefix}(${formatted})|${labels[i]}⟩`);
  }
  return parts.length === 0 ? "|ψ⟩ = 0" : `|ψ⟩ = ${parts.join("")}`;
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
