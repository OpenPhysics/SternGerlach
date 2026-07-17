/**
 * SpinSystem.ts
 *
 * The three quantum systems the simulation can model, matching the Java SPINS
 * `system` variable (0 = spin-½, 1 = spin-1, 2 = SU(3)).
 *
 * Each system knows:
 *   - stateCount — dimension of its state space (2 or 3), the Java `state`
 *   - analyzerTypes — which AnalyzerTypes its devices may be set to
 *   - defaultType — the type devices reset to on a system switch
 *   - opFor(type) — the operator index into OperatorTable, the Java typeTable
 *     (Experiment.java:246-261)
 */

import { assert } from "scenerystack/assert";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { AnalyzerType } from "./AnalyzerType.js";

export class SpinSystem extends EnumerationValue {
  public static readonly SPIN_HALF = new SpinSystem(
    2,
    [AnalyzerType.Z, AnalyzerType.X, AnalyzerType.Y, AnalyzerType.N],
    new Map([
      [AnalyzerType.Z, 2],
      [AnalyzerType.X, 0],
      [AnalyzerType.Y, 1],
      [AnalyzerType.N, 10],
    ]),
  );

  public static readonly SPIN_ONE = new SpinSystem(
    3,
    [AnalyzerType.Z, AnalyzerType.X, AnalyzerType.Y, AnalyzerType.N],
    new Map([
      [AnalyzerType.Z, 7],
      [AnalyzerType.X, 8],
      [AnalyzerType.Y, 9],
      [AnalyzerType.N, 11],
    ]),
  );

  public static readonly SU3 = new SpinSystem(
    3,
    [
      AnalyzerType.LAMBDA_1,
      AnalyzerType.LAMBDA_2,
      AnalyzerType.LAMBDA_3,
      AnalyzerType.LAMBDA_4,
      AnalyzerType.LAMBDA_5,
      AnalyzerType.LAMBDA_6,
      AnalyzerType.LAMBDA_7,
      AnalyzerType.LAMBDA_8,
    ],
    // The Java typeTable maps λ₁..λ₈ to operator indices 0..7. Note λ₁-λ₃ reuse the embedded
    // Pauli matrices and λ₈ reuses the spin-1 Sz matrix (eigenvalues +1, 0, −1) — Java parity.
    new Map([
      [AnalyzerType.LAMBDA_1, 0],
      [AnalyzerType.LAMBDA_2, 1],
      [AnalyzerType.LAMBDA_3, 2],
      [AnalyzerType.LAMBDA_4, 3],
      [AnalyzerType.LAMBDA_5, 4],
      [AnalyzerType.LAMBDA_6, 5],
      [AnalyzerType.LAMBDA_7, 6],
      [AnalyzerType.LAMBDA_8, 7],
    ]),
  );

  public static readonly enumeration = new Enumeration(SpinSystem);

  /** Dimension of the state space: 2 for spin-½, 3 for spin-1 and SU(3). */
  public readonly stateCount: 2 | 3;

  /** Analyzer/magnet types selectable under this system, in display order. */
  public readonly analyzerTypes: readonly AnalyzerType[];

  /** The type every analyzer/magnet resets to when this system is selected (Java setSystem). */
  public readonly defaultType: AnalyzerType;

  private readonly operatorIndices: ReadonlyMap<AnalyzerType, number>;

  public constructor(
    stateCount: 2 | 3,
    analyzerTypes: readonly AnalyzerType[],
    operatorIndices: ReadonlyMap<AnalyzerType, number>,
  ) {
    super();
    this.stateCount = stateCount;
    this.analyzerTypes = analyzerTypes;
    this.operatorIndices = operatorIndices;

    // Every system lists at least one analyzer type; the first is the reset default.
    this.defaultType = analyzerTypes[0] as AnalyzerType;
  }

  /** Operator index into OperatorTable for the given analyzer type (the Java typeTable). */
  public opFor(type: AnalyzerType): number {
    const op = this.operatorIndices.get(type);
    assert?.(op !== undefined, `analyzer type ${type.code} is not valid for this system`);
    return op as number;
  }
}
