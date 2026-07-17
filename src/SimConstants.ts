/**
 * SimConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Physics / model values use SI units (metres, seconds, kilograms, …);
 *    note the unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in SternGerlachColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 *
 * Remove the example constants below and replace them with the sim's own.
 */

import SternGerlachNamespace from "./SternGerlachNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

// ── Experiment-board model coordinates ────────────────────────────────────────
// The experiment lives in an abstract model space: +x rightward along the beam,
// +y up, roughly x ∈ [0, 4], y ∈ [−1.2, 1.2]. The view maps it to pixels with a
// ModelViewTransform2 (scale ≈ 180 px per model unit, inverted y).

/** Half-width / half-height of the particle source, model units. */
export const SOURCE_HALF_WIDTH = 0.24;
export const SOURCE_HALF_HEIGHT = 0.17;

/** Half-width / half-height of an analyzer, model units. */
export const ANALYZER_HALF_WIDTH = 0.3;
export const ANALYZER_HALF_HEIGHT = 0.26;

/** Analyzer UP/DOWN output ports sit at ±(this ratio × half-height) from center. */
export const ANALYZER_PORT_SPACING_RATIO = 0.62;

/** Half-width / half-height of a magnet, model units. */
export const MAGNET_HALF_WIDTH = 0.28;
export const MAGNET_HALF_HEIGHT = 0.2;

/** Half-width / half-height of a counter, model units. */
export const COUNTER_HALF_WIDTH = 0.2;
export const COUNTER_HALF_HEIGHT = 0.14;

// ── Particle dynamics ─────────────────────────────────────────────────────────

/** Particle travel speed along wires, model units per second. */
export const PARTICLE_SPEED = 1.8;

/** Cap on simultaneously animated particles in continuous-beam mode. */
export const MAX_LIVE_PARTICLES = 500;

/** Continuous-beam emission rate range, particles per second ("None" … "Lots"). */
export const CONTINUOUS_RATE_RANGE = { min: 0, max: 60, defaultValue: 20 } as const;

/** Maximum magnet field-dial value (two digits, 0-99); φ = 2π·n/72. */
export const MAGNET_FIELD_NUMBER_MAX = 99;

SternGerlachNamespace.register("SimConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  SOURCE_HALF_WIDTH,
  SOURCE_HALF_HEIGHT,
  ANALYZER_HALF_WIDTH,
  ANALYZER_HALF_HEIGHT,
  ANALYZER_PORT_SPACING_RATIO,
  MAGNET_HALF_WIDTH,
  MAGNET_HALF_HEIGHT,
  COUNTER_HALF_WIDTH,
  COUNTER_HALF_HEIGHT,
  PARTICLE_SPEED,
  MAX_LIVE_PARTICLES,
  CONTINUOUS_RATE_RANGE,
  MAGNET_FIELD_NUMBER_MAX,
});
