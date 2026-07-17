/**
 * UserStateModel.ts
 *
 * Holds the user-defined initial state: the amplitudes the user types (real and
 * imaginary parts of each component) and the basis (X, Y, or Z) they are
 * expressed in. `toZBasisVector` normalizes the input and rotates it into the
 * computational Z basis the engine works in.
 *
 * Port of the basis-rotation logic in Spins.java (getDataFromUser, ~1373-1527),
 * including the spin-1 index remap between the user's normal eigenvalue order
 * (+1, 0, −1) and the operator table's order (+1, −1, 0).
 */

import { NumberProperty, Property } from "scenerystack/axon";
import { AnalyzerType } from "../../common/quantum/AnalyzerType.js";
import { Complex } from "../../common/quantum/Complex.js";
import { ComplexMatrix } from "../../common/quantum/ComplexMatrix.js";
import { ComplexVector } from "../../common/quantum/ComplexVector.js";
import type { OperatorTable } from "../../common/quantum/OperatorTable.js";
import { SpinSystem } from "../../common/quantum/SpinSystem.js";

/** Operator indices of the Z / X / Y eigenbases per system dimension (Java EigenVector aliases). */
const SPIN_HALF_OPS = { Z: 2, X: 0, Y: 1 };
const SPIN_ONE_OPS = { Z: 7, X: 8, Y: 9 };

/** Maps a user "normal order" index (+1, 0, −1) to the operator table's order (+1, −1, 0). */
const NORMAL_TO_TABLE = [0, 2, 1];

export class UserStateModel {
  /** Basis the amplitudes are expressed in (Z default). */
  public readonly basisProperty: Property<AnalyzerType>;

  /** Real and imaginary parts of the three components (component 2 unused for spin-½). */
  public readonly re: readonly [NumberProperty, NumberProperty, NumberProperty];
  public readonly im: readonly [NumberProperty, NumberProperty, NumberProperty];

  public constructor() {
    this.basisProperty = new Property<AnalyzerType>(AnalyzerType.Z);
    // Default |+z⟩ in the Z basis: component 0 = 1, everything else 0.
    this.re = [new NumberProperty(1), new NumberProperty(0), new NumberProperty(0)];
    this.im = [new NumberProperty(0), new NumberProperty(0), new NumberProperty(0)];
  }

  /** Every editable Property, for wiring configuration-change listeners. */
  public get properties(): NumberProperty[] {
    return [...this.re, ...this.im];
  }

  /** Restores the default |+z⟩-in-Z state. */
  public reset(): void {
    this.basisProperty.reset();
    for (const property of this.properties) {
      property.reset();
    }
  }

  /**
   * The user's amplitudes, normalized and rotated into the computational Z basis. SU(3) input is
   * taken directly (no rotation, as in Java); spin-½ and spin-1 rotate from the chosen X/Y basis.
   */
  public toZBasisVector(operatorTable: OperatorTable, system: SpinSystem): ComplexVector {
    const stateCount = system.stateCount;
    const raw = new ComplexVector(
      new Complex(this.re[0].value, this.im[0].value),
      new Complex(this.re[1].value, this.im[1].value),
      stateCount === 3 ? new Complex(this.re[2].value, this.im[2].value) : Complex.ZERO,
    );

    // A zero input has no valid direction; fall back to |0⟩ eigenstate index (component 0).
    if (raw.magnitudeSquared() === 0) {
      return new ComplexVector(Complex.ONE, Complex.ZERO, Complex.ZERO);
    }
    const value = raw.normalize();

    const basis = this.basisProperty.value;
    if (basis === AnalyzerType.Z || system === SpinSystem.SU3) {
      return value;
    }

    const rotation = this.rotationToZBasis(operatorTable, system, basis);
    return rotation.timesVector(value);
  }

  /**
   * Rotation matrix R with R[m][n] = ⟨Z_m | basis_n⟩, so R·(amplitudes in basis) gives the
   * amplitudes in the computational Z basis. Uses the spin-1 normal-order index remap.
   */
  private rotationToZBasis(operatorTable: OperatorTable, system: SpinSystem, basis: AnalyzerType): ComplexMatrix {
    const ops = system.stateCount === 2 ? SPIN_HALF_OPS : SPIN_ONE_OPS;
    const basisOp = basis === AnalyzerType.X ? ops.X : ops.Y;
    const size = system.stateCount;
    const remap = size === 3 ? (i: number) => NORMAL_TO_TABLE[i] as number : (i: number) => i;

    const entries: [number, number, Complex][] = [];
    for (let m = 0; m < size; m++) {
      for (let n = 0; n < size; n++) {
        const value = operatorTable
          .getEigenvector(ops.Z, remap(m))
          .innerProduct(operatorTable.getEigenvector(basisOp, remap(n)));
        entries.push([m, n, value]);
      }
    }
    return ComplexMatrix.fromEntries(entries);
  }
}
