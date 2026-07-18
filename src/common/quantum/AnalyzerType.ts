/**
 * AnalyzerType.ts
 *
 * The measurement direction / observable that an analyzer (or magnet) is set
 * to. Shared by analyzers and magnets; available types under both spin systems
 * are Z, X, Y, and N (an arbitrary direction n̂(θ, φ)).
 *
 * Each type carries the short code used in the Java SPINS type table ("Z",
 * "X", "Y", "n"); localized display labels live in the view layer.
 *
 * An EnumerationValue (rather than a string union) so a device's
 * typeProperty can be an EnumerationProperty and views can enumerate the
 * valid values per system.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class AnalyzerType extends EnumerationValue {
  public static readonly Z = new AnalyzerType("Z");
  public static readonly X = new AnalyzerType("X");
  public static readonly Y = new AnalyzerType("Y");

  /**
   * Arbitrary direction n̂(θ, φ). Each analyzer/magnet set to this type owns its own θ, φ —
   * a departure from the Java SPINS applet, which shared one global direction across every
   * n̂-type device.
   */
  public static readonly N = new AnalyzerType("n");

  public static readonly enumeration = new Enumeration(AnalyzerType);

  /** Short code matching the Java SPINS type strings ("Z", "X", "Y", "n"). */
  public readonly code: string;

  public constructor(code: string) {
    super();
    this.code = code;
  }
}
