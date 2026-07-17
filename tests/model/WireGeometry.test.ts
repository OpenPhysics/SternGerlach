/**
 * Unit tests for WireGeometry: the shared wire curve used by both the drawn
 * WireNode and the particle flight path.
 */

import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { wireControlPoints, wireWaypoints } from "../../src/stern-gerlach-screen/model/WireGeometry.js";

describe("WireGeometry", () => {
  it("level wires fly straight to the input port", () => {
    const waypoints = wireWaypoints(new Vector2(0, 0.3), new Vector2(1, 0.3));
    expect(waypoints).toHaveLength(1);
    expect(waypoints[0]?.x).toBeCloseTo(1, 12);
    expect(waypoints[0]?.y).toBeCloseTo(0.3, 12);
  });

  it("offset wires end exactly at the input port and stay between the ports horizontally", () => {
    const start = new Vector2(0.5, 0.2);
    const end = new Vector2(2.0, 0.8);
    const waypoints = wireWaypoints(start, end);
    const last = waypoints[waypoints.length - 1];
    expect(last?.x).toBeCloseTo(end.x, 12);
    expect(last?.y).toBeCloseTo(end.y, 12);
    for (const p of waypoints) {
      expect(p.y).toBeGreaterThanOrEqual(start.y - 1e-12);
      expect(p.y).toBeLessThanOrEqual(end.y + 1e-12);
    }
  });

  it("control points have horizontal tangents at both ports", () => {
    const { p0, c1, c2, p3 } = wireControlPoints(new Vector2(0, 0), new Vector2(1, 0.5));
    expect(c1.y).toBe(p0.y);
    expect(c2.y).toBe(p3.y);
    expect(c1.x).toBeGreaterThan(p0.x);
    expect(c2.x).toBeLessThan(p3.x);
  });
});
