/**
 * Magnet.ts
 *
 * A uniform-field magnet that precesses the spin without measuring it. The
 * state is multiplied by the propagator
 *
 *   U = I − i·sin(φ)·H + (cos φ − 1)·H²,  φ = 2π·fieldNumber / 72
 *
 * (Magnet.ComputeU in the Java source) — valid because every operator H in
 * the table has eigenvalues in {−1, 0, +1}. fieldNumber is the two-digit
 * 0-99 dial of the original applet.
 *
 * The propagator is cached and lazily recomputed whenever the field number,
 * type, this magnet's own direction angles, or system changes (the cache key
 * covers all of these through the operator index and θ/φ).
 */

import { NumberProperty, Property } from "scenerystack/axon";
import { Range, Vector2 } from "scenerystack/dot";
import { AnalyzerType } from "../../../common/quantum/AnalyzerType.js";
import { Complex } from "../../../common/quantum/Complex.js";
import { ComplexMatrix } from "../../../common/quantum/ComplexMatrix.js";
import {
  DEFAULT_DIRECTION_PHI,
  DEFAULT_DIRECTION_THETA,
  type OperatorTable,
} from "../../../common/quantum/OperatorTable.js";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import { MAGNET_FIELD_NUMBER_MAX, MAGNET_HALF_HEIGHT, MAGNET_HALF_WIDTH } from "../../../SimConstants.js";
import { ExperimentDevice } from "./ExperimentDevice.js";

export class Magnet extends ExperimentDevice {
  /** The observable direction of the magnetic field (shares AnalyzerType with analyzers). */
  public readonly typeProperty: Property<AnalyzerType>;

  /** Field-strength dial, integer 0-99; φ = 2π·number/72, so 72 is a full revolution. */
  public readonly fieldNumberProperty: NumberProperty;

  /** Polar angle θ of this magnet's own n̂ direction, radians. Only meaningful when type is N. */
  public readonly thetaProperty: NumberProperty;

  /** Azimuthal angle φ of this magnet's own n̂ direction, radians. Only meaningful when type is N. */
  public readonly phiProperty: NumberProperty;

  // Cached propagator plus the inputs it was computed from.
  private cachedU: ComplexMatrix | null;
  private cachedKey: string;

  public constructor(position: Vector2, initialType: AnalyzerType = AnalyzerType.Z) {
    super("magnet", position, true);
    this.typeProperty = new Property(initialType);
    this.fieldNumberProperty = new NumberProperty(0, {
      numberType: "Integer",
      range: new Range(0, MAGNET_FIELD_NUMBER_MAX),
    });
    this.thetaProperty = new NumberProperty(DEFAULT_DIRECTION_THETA);
    this.phiProperty = new NumberProperty(DEFAULT_DIRECTION_PHI);
    this.cachedU = null;
    this.cachedKey = "";
  }

  public override get halfWidth(): number {
    return MAGNET_HALF_WIDTH;
  }

  public override get halfHeight(): number {
    return MAGNET_HALF_HEIGHT;
  }

  public override outputCount(_system: SpinSystem): number {
    return 1;
  }

  public override getOutputPortOffset(_outputIndex: number, _system: SpinSystem): Vector2 {
    return new Vector2(this.halfWidth, 0);
  }

  /**
   * The precession propagator U for the current field number and type. Port of Magnet.ComputeU
   * (references/source/Magnet.java:223-230). Cached; recomputed when the field number, operator
   * index (type/system), or direction angles change.
   */
  public computeU(operatorTable: OperatorTable, system: SpinSystem): ComplexMatrix {
    const op = system.opFor(this.typeProperty.value);
    const theta = this.thetaProperty.value;
    const phi = this.phiProperty.value;
    const key = `${op}|${this.fieldNumberProperty.value}|${theta}|${phi}`;
    if (this.cachedU === null || key !== this.cachedKey) {
      const precession = (2 * Math.PI * this.fieldNumberProperty.value) / 72;
      const h = operatorTable.getOperator(op, theta, phi);
      const hSquared = operatorTable.getOperatorSquared(op, theta, phi);
      this.cachedU = ComplexMatrix.identity()
        .plus(h.timesScalar(new Complex(0, -Math.sin(precession))))
        .plus(hSquared.timesScalar(new Complex(Math.cos(precession) - 1, 0)));
      this.cachedKey = key;
    }
    return this.cachedU;
  }
}
