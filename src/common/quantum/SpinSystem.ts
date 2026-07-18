/**
 * SpinSystem.ts
 *
 * The two quantum systems the simulation can model: spin-½ and spin-1.
 *
 * Each system knows:
 *   - stateCount — dimension of its state space (2 or 3)
 *   - analyzerTypes — which AnalyzerTypes its devices may be set to
 *   - defaultType — the type devices reset to on a system switch
 *   - opFor(type) — the operator index into OperatorTable
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
      [AnalyzerType.N, 6],
    ]),
  );

  public static readonly SPIN_ONE = new SpinSystem(
    3,
    [AnalyzerType.Z, AnalyzerType.X, AnalyzerType.Y, AnalyzerType.N],
    new Map([
      [AnalyzerType.Z, 3],
      [AnalyzerType.X, 4],
      [AnalyzerType.Y, 5],
      [AnalyzerType.N, 7],
    ]),
  );

  public static readonly enumeration = new Enumeration(SpinSystem);

  /** Dimension of the state space: 2 for spin-½, 3 for spin-1. */
  public readonly stateCount: 2 | 3;

  /** Analyzer/magnet types selectable under this system, in display order. */
  public readonly analyzerTypes: readonly AnalyzerType[];

  /** The type every analyzer/magnet resets to when this system is selected. */
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

  /** Operator index into OperatorTable for the given analyzer type. */
  public opFor(type: AnalyzerType): number {
    const op = this.operatorIndices.get(type);
    assert?.(op !== undefined, `analyzer type ${type.code} is not valid for this system`);
    return op as number;
  }
}
