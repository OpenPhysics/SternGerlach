/**
 * WireGeometry.ts
 *
 * The single definition of a wire's curve, shared by the WireNode visual and
 * the particle flight path so atoms visibly travel along the drawn wires. A
 * wire is a cubic bézier with horizontal tangents at both ports (beams leave
 * and enter devices horizontally).
 *
 * All coordinates are model-space; the view transforms the control points
 * (affine transforms map béziers to béziers, so the drawn curve and the flight
 * path are exactly the same shape).
 */

import { Vector2 } from "scenerystack/dot";
import { MODEL_VIEW_SCALE } from "../../SimConstants.js";

/** Minimum horizontal control-point lead, model units (20 px at the standard view scale). */
const MIN_LEAD = 20 / MODEL_VIEW_SCALE;

/** Fraction of the horizontal run used as the control-point lead. */
const LEAD_RATIO = 0.45;

/** Straight segments used to approximate a curved wire for particle flight. */
const FLIGHT_SEGMENTS = 12;

export type WireControlPoints = {
  p0: Vector2;
  c1: Vector2;
  c2: Vector2;
  p3: Vector2;
};

/** Cubic-bézier control points for a wire from an output port to an input port. */
export function wireControlPoints(start: Vector2, end: Vector2): WireControlPoints {
  const lead = Math.max(MIN_LEAD, Math.abs(end.x - start.x) * LEAD_RATIO);
  return {
    p0: start,
    c1: new Vector2(start.x + lead, start.y),
    c2: new Vector2(end.x - lead, end.y),
    p3: end,
  };
}

/**
 * The flight path along a wire as a list of waypoints (excluding the start,
 * ending exactly at `end`). Level wires fly straight; offset wires follow the
 * drawn bézier as a fine polyline.
 */
export function wireWaypoints(start: Vector2, end: Vector2): Vector2[] {
  if (start.y === end.y) {
    return [end.copy()];
  }
  const { p0, c1, c2, p3 } = wireControlPoints(start, end);
  const waypoints: Vector2[] = [];
  for (let s = 1; s <= FLIGHT_SEGMENTS; s++) {
    const t = s / FLIGHT_SEGMENTS;
    const u = 1 - t;
    const x = u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x;
    const y = u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y;
    waypoints.push(new Vector2(x, y));
  }
  return waypoints;
}
