/**
 * Tests for UserStateModel — basis rotation into the computational Z basis,
 * matching Spins.java getDataFromUser (~1373–1527).
 */

import { describe, expect, it } from "vitest";
import { AnalyzerType } from "../../src/common/quantum/AnalyzerType.js";
import { Complex } from "../../src/common/quantum/Complex.js";
import { OperatorTable } from "../../src/common/quantum/OperatorTable.js";
import { SpinSystem } from "../../src/common/quantum/SpinSystem.js";
import { UserStateModel } from "../../src/stern-gerlach-screen/model/UserStateModel.js";

const ROOT2_INV = 1 / Math.sqrt(2);

describe("UserStateModel.toZBasisVector", () => {
  it("|+z⟩ in the Z basis stays |+z⟩", () => {
    const table = new OperatorTable();
    const model = new UserStateModel();
    model.basisProperty.value = AnalyzerType.Z;
    model.re[0].value = 1;
    model.re[1].value = 0;

    const state = model.toZBasisVector(table, SpinSystem.SPIN_HALF);
    expect(state.components[0].re).toBeCloseTo(1, 10);
    expect(state.components[1].magnitudeSquared()).toBeCloseTo(0, 10);
  });

  it("|+x⟩ entered in the X basis rotates to (1/√2, 1/√2) in Z", () => {
    const table = new OperatorTable();
    const model = new UserStateModel();
    model.basisProperty.value = AnalyzerType.X;
    model.re[0].value = 1;
    model.re[1].value = 0;

    const state = model.toZBasisVector(table, SpinSystem.SPIN_HALF);
    expect(state.components[0].re).toBeCloseTo(ROOT2_INV, 8);
    expect(state.components[1].re).toBeCloseTo(ROOT2_INV, 8);
  });

  it("spin-1: |+1⟩ entered in normal order (index 0) maps to the Z eigenstate", () => {
    const table = new OperatorTable();
    const model = new UserStateModel();
    model.basisProperty.value = AnalyzerType.Z;
    model.re[0].value = 1;
    model.re[1].value = 0;
    model.re[2].value = 0;

    const state = model.toZBasisVector(table, SpinSystem.SPIN_ONE);
    const plusOne = table.getEigenvector(7, 0);
    expect(state.equalsEpsilon(plusOne, 1e-10)).toBe(true);
  });

  it("SU(3): amplitudes are taken directly without basis rotation", () => {
    const table = new OperatorTable();
    const model = new UserStateModel();
    model.basisProperty.value = AnalyzerType.X;
    model.re[0].value = 0.6;
    model.re[1].value = 0.8;
    model.re[2].value = 0;

    const state = model.toZBasisVector(table, SpinSystem.SU3);
    const norm = Math.sqrt(0.6 * 0.6 + 0.8 * 0.8);
    expect(state.components[0].re).toBeCloseTo(0.6 / norm, 8);
    expect(state.components[1].re).toBeCloseTo(0.8 / norm, 8);
  });

  it("a zero input falls back to |0⟩ (component 0 = 1)", () => {
    const table = new OperatorTable();
    const model = new UserStateModel();
    for (const property of model.properties) {
      property.value = 0;
    }

    const state = model.toZBasisVector(table, SpinSystem.SPIN_HALF);
    expect(state.components[0]).toEqual(Complex.ONE);
    expect(state.components[1]).toEqual(Complex.ZERO);
  });
});
