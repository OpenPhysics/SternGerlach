/**
 * InitialStateSetting.ts
 *
 * Which initial state the particle source emits, matching the Java SPINS
 * `whichInit` variable: the four hard-coded "Unknown" mystery states for the
 * guessing game, the user-defined state (whichInit 4, edited in the User State
 * dialog), or Random (an equal-weight statistical mixture — the default).
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class InitialStateSetting extends EnumerationValue {
  public static readonly UNKNOWN_1 = new InitialStateSetting(0, false);
  public static readonly UNKNOWN_2 = new InitialStateSetting(1, false);
  public static readonly UNKNOWN_3 = new InitialStateSetting(2, false);
  public static readonly UNKNOWN_4 = new InitialStateSetting(3, false);

  /** The user-defined state (edited in the User State dialog, Java whichInit 4). */
  public static readonly USER = new InitialStateSetting(null, true);

  /** Equal-weight mixture over a fixed basis (the Java default, whichInit 5). */
  public static readonly RANDOM = new InitialStateSetting(null, false);

  public static readonly enumeration = new Enumeration(InitialStateSetting);

  /** Index into OperatorTable.getUnknownState (0-3), or null for USER / RANDOM. */
  public readonly unknownIndex: number | null;

  /** Whether this is the user-defined state (its vector comes from the UserStateModel). */
  public readonly isUser: boolean;

  public constructor(unknownIndex: number | null, isUser: boolean) {
    super();
    this.unknownIndex = unknownIndex;
    this.isUser = isUser;
  }
}
