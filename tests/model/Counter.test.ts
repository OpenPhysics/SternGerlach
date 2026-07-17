/**
 * Unit tests for Counter helpers, in particular the detection-conditioned
 * expected fraction that keeps the green expected-value line on the same
 * denominator as the histogram bars.
 */

import { describe, expect, it } from "vitest";
import { expectedDetectedFraction } from "../../src/stern-gerlach-screen/model/devices/Counter.js";

describe("expectedDetectedFraction", () => {
  it("equals the absolute probability when nothing is lost", () => {
    expect(expectedDetectedFraction(0.5, 0)).toBeCloseTo(0.5, 10);
    expect(expectedDetectedFraction(0, 0)).toBe(0);
  });

  it("conditions on detection when probability mass is lost", () => {
    // Blocked-DOWN single-Z with a Random beam: P(up) = 0.5, half the mass lost.
    // Every detected atom lands in the up counter, so the bar converges to 1.
    expect(expectedDetectedFraction(0.5, 0.5)).toBeCloseTo(1, 10);
    expect(expectedDetectedFraction(0.25, 0.5)).toBeCloseTo(0.5, 10);
  });

  it("returns 0 when everything is lost and clamps rounding overshoot", () => {
    expect(expectedDetectedFraction(0, 1)).toBe(0);
    expect(expectedDetectedFraction(0.5000000001, 0.5)).toBe(1);
  });
});
