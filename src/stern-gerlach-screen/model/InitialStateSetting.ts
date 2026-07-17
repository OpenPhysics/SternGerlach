/**
 * InitialStateSetting.ts
 *
 * Which initial state the particle source emits, matching the Java SPINS
 * `whichInit` variable: the four hard-coded "Unknown" mystery states for the
 * guessing game, or Random (an equal-weight statistical mixture — the
 * default). The user-defined state (Java whichInit 4) arrives with the User
 * State dialog in a later milestone.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class InitialStateSetting extends EnumerationValue {
  public static readonly UNKNOWN_1 = new InitialStateSetting(0);
  public static readonly UNKNOWN_2 = new InitialStateSetting(1);
  public static readonly UNKNOWN_3 = new InitialStateSetting(2);
  public static readonly UNKNOWN_4 = new InitialStateSetting(3);

  /** Equal-weight mixture over a fixed basis (the Java default, whichInit 5). */
  public static readonly RANDOM = new InitialStateSetting(null);

  public static readonly enumeration = new Enumeration(InitialStateSetting);

  /** Index into OperatorTable.getUnknownState (0-3), or null for RANDOM. */
  public readonly unknownIndex: number | null;

  public constructor(unknownIndex: number | null) {
    super();
    this.unknownIndex = unknownIndex;
  }
}
