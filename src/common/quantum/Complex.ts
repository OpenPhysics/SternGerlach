/**
 * Complex.ts
 *
 * Immutable complex number for the quantum math layer. Direct port of the
 * SPINS Java `Complex` class (references/source/Complex.java), trimmed to the
 * operations the simulation actually uses.
 *
 * All operations return new instances; a Complex never mutates.
 *
 * This module is pure TypeScript — no axon/scenery dependencies — so it can be
 * unit-tested headlessly in vitest.
 */

export class Complex {
  /** Real part. */
  public readonly re: number;

  /** Imaginary part. */
  public readonly im: number;

  public constructor(re: number, im: number) {
    this.re = re;
    this.im = im;
  }

  /** 0 + 0i */
  public static readonly ZERO = new Complex(0, 0);

  /** 1 + 0i */
  public static readonly ONE = new Complex(1, 0);

  /** 0 + 1i */
  public static readonly I = new Complex(0, 1);

  /** This plus the other value. */
  public plus(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  /** This minus the other value. */
  public minus(other: Complex): Complex {
    return new Complex(this.re - other.re, this.im - other.im);
  }

  /** Complex product of this and the other value. */
  public times(other: Complex): Complex {
    return new Complex(this.re * other.re - this.im * other.im, this.im * other.re + this.re * other.im);
  }

  /** This scaled by a real factor. */
  public timesScalar(scalar: number): Complex {
    return new Complex(this.re * scalar, this.im * scalar);
  }

  /** Complex conjugate (re − im·i). */
  public conjugate(): Complex {
    return new Complex(this.re, -this.im);
  }

  /** Squared modulus |z|² = re² + im². */
  public magnitudeSquared(): number {
    return this.re * this.re + this.im * this.im;
  }

  /** Modulus |z|. */
  public magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  /** Whether this and the other value agree within epsilon in both components. */
  public equalsEpsilon(other: Complex, epsilon: number): boolean {
    return Math.abs(this.re - other.re) <= epsilon && Math.abs(this.im - other.im) <= epsilon;
  }
}
