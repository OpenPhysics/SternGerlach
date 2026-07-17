/**
 * AnalyzerType.ts
 *
 * The measurement direction / observable that an analyzer (or magnet) is set
 * to. Shared by analyzers and magnets; which types are available depends on
 * the active SpinSystem:
 *   - spin-½ and spin-1: Z, X, Y, N (an arbitrary direction n̂(θ, φ))
 *   - SU(3): λ₁ … λ₈ (Gell-Mann observables)
 *
 * Each type carries the short code used in the Java SPINS type table ("Z",
 * "X", "Y", "n", "1".."8"); localized display labels live in the view layer.
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

  /** Arbitrary direction n̂(θ, φ); the angles are global model state (Java parity). */
  public static readonly N = new AnalyzerType("n");

  public static readonly LAMBDA_1 = new AnalyzerType("1");
  public static readonly LAMBDA_2 = new AnalyzerType("2");
  public static readonly LAMBDA_3 = new AnalyzerType("3");
  public static readonly LAMBDA_4 = new AnalyzerType("4");
  public static readonly LAMBDA_5 = new AnalyzerType("5");
  public static readonly LAMBDA_6 = new AnalyzerType("6");
  public static readonly LAMBDA_7 = new AnalyzerType("7");
  public static readonly LAMBDA_8 = new AnalyzerType("8");

  public static readonly enumeration = new Enumeration(AnalyzerType);

  /** Short code matching the Java SPINS type strings ("Z", "X", "Y", "n", "1".."8"). */
  public readonly code: string;

  public constructor(code: string) {
    super();
    this.code = code;
  }
}
