/**
 * ComplexVector.ts
 *
 * Immutable 3-component complex vector (a quantum state or eigenvector).
 * Direct port of the SPINS Java `vector` class (references/source/vector.java).
 *
 * Vectors always carry 3 components; 2-state (spin-½) systems simply leave the
 * third component at zero, so every operation can safely run over all 3
 * components (exactly reproducing the Java results, where loops ran over the
 * active state count).
 *
 * The inner product conjugates the LEFT operand: ⟨this|other⟩ = Σ this*ᵢ·otherᵢ.
 *
 * All operations return new instances. Pure TypeScript — no axon/scenery
 * dependencies — fully unit-testable in vitest.
 */

import { assert } from "scenerystack/assert";
import { Complex } from "./Complex.js";

export class ComplexVector {
  public readonly components: readonly [Complex, Complex, Complex];

  public constructor(c0: Complex, c1: Complex, c2: Complex = Complex.ZERO) {
    this.components = [c0, c1, c2];
  }

  /** The all-zero vector. */
  public static readonly ZERO = new ComplexVector(Complex.ZERO, Complex.ZERO, Complex.ZERO);

  /** Convenience factory from real components. */
  public static fromReal(r0: number, r1: number, r2 = 0): ComplexVector {
    return new ComplexVector(new Complex(r0, 0), new Complex(r1, 0), new Complex(r2, 0));
  }

  /** Inner product ⟨this|other⟩, conjugating this vector's components (conjugate-left convention). */
  public innerProduct(other: ComplexVector): Complex {
    const [a0, a1, a2] = this.components;
    const [b0, b1, b2] = other.components;
    return a0.conjugate().times(b0).plus(a1.conjugate().times(b1)).plus(a2.conjugate().times(b2));
  }

  /** Born-rule weight |⟨this|other⟩|². */
  public dotProdSquared(other: ComplexVector): number {
    return this.innerProduct(other).magnitudeSquared();
  }

  /** Component-wise sum. */
  public plus(other: ComplexVector): ComplexVector {
    return new ComplexVector(
      this.components[0].plus(other.components[0]),
      this.components[1].plus(other.components[1]),
      this.components[2].plus(other.components[2]),
    );
  }

  /** This vector scaled by a complex factor. */
  public times(scalar: Complex): ComplexVector {
    return new ComplexVector(
      scalar.times(this.components[0]),
      scalar.times(this.components[1]),
      scalar.times(this.components[2]),
    );
  }

  /** Squared norm ⟨this|this⟩ (real by construction). */
  public magnitudeSquared(): number {
    return this.innerProduct(this).re;
  }

  /** This vector scaled to unit norm. The zero vector cannot be normalized. */
  public normalize(): ComplexVector {
    const normSquared = this.magnitudeSquared();
    assert?.(normSquared > 0, "cannot normalize a zero vector");
    return this.times(new Complex(1 / Math.sqrt(normSquared), 0));
  }

  /**
   * Collapses the given vector into the plane perpendicular to this one and re-normalizes:
   * projectOut(v) = normalize(v − ⟨this|v⟩·this). Used for coherent recombination, where a
   * 3-state analyzer removes one eigencomponent without measuring the other two.
   *
   * Note: the Java source (vector.java:75-82) computed `v2.normalize()` and discarded the
   * result — an evident no-mutation slip. The normalization is required for the collapsed
   * state's subsequent Born probabilities to be correct, and the analytic branch probability
   * 1 − |⟨this|v⟩|² (Experiment.BranchProb) already accounts for the lost norm.
   */
  public projectOut(v: ComplexVector): ComplexVector {
    const overlap = this.innerProduct(v);
    return v.plus(this.times(overlap.timesScalar(-1))).normalize();
  }

  /** Whether every component of this and the other vector agree within epsilon. */
  public equalsEpsilon(other: ComplexVector, epsilon: number): boolean {
    return (
      this.components[0].equalsEpsilon(other.components[0], epsilon) &&
      this.components[1].equalsEpsilon(other.components[1], epsilon) &&
      this.components[2].equalsEpsilon(other.components[2], epsilon)
    );
  }
}
