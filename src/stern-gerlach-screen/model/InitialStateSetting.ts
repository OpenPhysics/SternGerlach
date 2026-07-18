/**
 * InitialStateSetting.ts
 *
 * Which initial state the particle source emits. Named eigenstates (+Z, −Z, +X,
 * −X) are the primary preparations; the four hard-coded "Unknown" mystery
 * states support the guessing game; USER is the dialog-edited state; RANDOM is
 * an equal-weight statistical mixture.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { AnalyzerType } from "../../common/quantum/AnalyzerType.js";

/** A prepared eigenstate of Sz or Sx (index 0 = +, index 1 = −). */
export type PreparedEigenstate = {
  readonly type: AnalyzerType;
  readonly index: 0 | 1;
};

export class InitialStateSetting extends EnumerationValue {
  /** |+z⟩ — the default prepared state. */
  public static readonly PLUS_Z = new InitialStateSetting({ type: AnalyzerType.Z, index: 0 }, null, false);

  /** |−z⟩ */
  public static readonly MINUS_Z = new InitialStateSetting({ type: AnalyzerType.Z, index: 1 }, null, false);

  /** |+x⟩ */
  public static readonly PLUS_X = new InitialStateSetting({ type: AnalyzerType.X, index: 0 }, null, false);

  /** |−x⟩ */
  public static readonly MINUS_X = new InitialStateSetting({ type: AnalyzerType.X, index: 1 }, null, false);

  public static readonly UNKNOWN_1 = new InitialStateSetting(null, 0, false);
  public static readonly UNKNOWN_2 = new InitialStateSetting(null, 1, false);
  public static readonly UNKNOWN_3 = new InitialStateSetting(null, 2, false);
  public static readonly UNKNOWN_4 = new InitialStateSetting(null, 3, false);

  /** The user-defined state (edited in the User State dialog). */
  public static readonly USER = new InitialStateSetting(null, null, true);

  /** Equal-weight mixture over a fixed basis. */
  public static readonly RANDOM = new InitialStateSetting(null, null, false);

  public static readonly enumeration = new Enumeration(InitialStateSetting);

  /**
   * Named Sz/Sx eigenstate, or null for Unknown / USER / RANDOM.
   * For spin-½ and spin-1, resolved via OperatorTable eigenvectors; for SU(3),
   * Z→λ₃ and X→λ₁ (embedded Pauli matrices).
   */
  public readonly eigenstate: PreparedEigenstate | null;

  /** Index into OperatorTable.getUnknownState (0-3), or null when not an Unknown. */
  public readonly unknownIndex: number | null;

  /** Whether this is the user-defined state (its vector comes from the UserStateModel). */
  public readonly isUser: boolean;

  public constructor(eigenstate: PreparedEigenstate | null, unknownIndex: number | null, isUser: boolean) {
    super();
    this.eigenstate = eigenstate;
    this.unknownIndex = unknownIndex;
    this.isUser = isUser;
  }

  /** True for the equal-weight Random mixture. */
  public get isRandom(): boolean {
    return this.eigenstate === null && this.unknownIndex === null && !this.isUser;
  }
}
