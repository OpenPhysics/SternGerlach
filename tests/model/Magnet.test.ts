/**
 * Tests for the magnet propagator U = I − i·sin(φ)H + (cos φ − 1)H²,
 * φ = 2π·fieldNumber/72 (Magnet.ComputeU).
 */

import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { AnalyzerType } from "../../src/common/quantum/AnalyzerType.js";
import { ComplexMatrix } from "../../src/common/quantum/ComplexMatrix.js";
import { OperatorTable } from "../../src/common/quantum/OperatorTable.js";
import { SpinSystem } from "../../src/common/quantum/SpinSystem.js";
import { Magnet } from "../../src/stern-gerlach-screen/model/devices/Magnet.js";

const { SPIN_HALF, SPIN_ONE }: typeof SpinSystem = SpinSystem;

describe("Magnet.computeU", () => {
  const table = new OperatorTable();

  it("U†U = I (on the active subspace) for every type, system, and a spread of fields", () => {
    const cases: Array<[SpinSystem, AnalyzerType]> = [
      [SPIN_HALF, AnalyzerType.Z],
      [SPIN_HALF, AnalyzerType.X],
      [SPIN_HALF, AnalyzerType.Y],
      [SPIN_HALF, AnalyzerType.N],
      [SPIN_ONE, AnalyzerType.Z],
      [SPIN_ONE, AnalyzerType.X],
      [SPIN_ONE, AnalyzerType.Y],
      [SPIN_ONE, AnalyzerType.N],
    ];
    for (const [system, type] of cases) {
      for (const field of [0, 7, 18, 36, 55, 72, 99]) {
        const magnet = new Magnet(new Vector2(0, 0), type);
        magnet.fieldNumberProperty.value = field;
        const u = magnet.computeU(table, system);
        // U is unitary on the full 3×3 space: spin-½ operators embed with a zero third
        // row/column, so I − i·sin(φ)H + (cosφ−1)H² keeps the third diagonal entry at 1.
        expect(u.conjugateTranspose().timesMatrix(u).equalsEpsilon(ComplexMatrix.identity(), 1e-10)).toBe(true);
      }
    }
  });

  it("field 0 and field 72 (φ = 2π) both give the identity", () => {
    for (const field of [0, 72]) {
      const magnet = new Magnet(new Vector2(0, 0), AnalyzerType.X);
      magnet.fieldNumberProperty.value = field;
      expect(magnet.computeU(table, SPIN_HALF).equalsEpsilon(ComplexMatrix.identity(), 1e-10)).toBe(true);
    }
  });

  it("field 18 (φ = π/2) about Z precesses |−y⟩ to |+y⟩ (eigenvalues ±1 double the angle)", () => {
    const magnet = new Magnet(new Vector2(0, 0), AnalyzerType.Z);
    magnet.fieldNumberProperty.value = 18;
    const u = magnet.computeU(table, SPIN_HALF);
    const minusY = table.getEigenvector(1, 1);
    const plusY = table.getEigenvector(1, 0);
    const rotated = u.timesVector(minusY);
    // Equal up to a global phase: overlap probability with |+y⟩ is 1.
    expect(plusY.dotProdSquared(rotated)).toBeCloseTo(1, 10);
    expect(table.getEigenvector(1, 1).dotProdSquared(rotated)).toBeCloseTo(0, 10);
  });

  it("caches the propagator and recomputes on a field change", () => {
    const magnet = new Magnet(new Vector2(0, 0), AnalyzerType.Z);
    magnet.fieldNumberProperty.value = 10;
    const first = magnet.computeU(table, SPIN_HALF);
    expect(magnet.computeU(table, SPIN_HALF)).toBe(first);

    magnet.fieldNumberProperty.value = 11;
    const second = magnet.computeU(table, SPIN_HALF);
    expect(second).not.toBe(first);
    expect(second.equalsEpsilon(first, 1e-12)).toBe(false);
  });
});
