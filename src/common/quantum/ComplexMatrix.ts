/**
 * ComplexMatrix.ts
 *
 * Immutable 3×3 complex matrix (an operator or magnet propagator). Direct port
 * of the SPINS Java `Matrix` class (references/source/Matrix.java).
 *
 * As with ComplexVector, matrices always carry 3×3 entries; 2-state (spin-½)
 * operators leave the third row/column at zero, so every operation runs over
 * all 9 entries and exactly reproduces the Java results.
 *
 * All operations return new instances. Pure TypeScript — no axon/scenery
 * dependencies — fully unit-testable in vitest.
 */

import { Complex } from "./Complex.js";
import { ComplexVector } from "./ComplexVector.js";

type Row = readonly [Complex, Complex, Complex];

const INDICES = [0, 1, 2] as const;

export class ComplexMatrix {
  /** Entries in row-major order: entries[row][column]. */
  public readonly entries: readonly [Row, Row, Row];

  public constructor(row0: Row, row1: Row, row2: Row) {
    this.entries = [row0, row1, row2];
  }

  /** Builds a matrix from entryOf(row, column) evaluated over all 9 positions. */
  private static build(entryOf: (row: number, column: number) => Complex): ComplexMatrix {
    const row = (i: number): Row => [entryOf(i, 0), entryOf(i, 1), entryOf(i, 2)];
    return new ComplexMatrix(row(0), row(1), row(2));
  }

  /** The entry at the given row and column (0-2 each). */
  public entry(row: number, column: number): Complex {
    // The 3×3 tuple structure guarantees indices 0-2 exist.
    return (this.entries[row] as Row)[column] as Complex;
  }

  /** The all-zero matrix. */
  public static zero(): ComplexMatrix {
    return ComplexMatrix.build(() => Complex.ZERO);
  }

  /** The 3×3 identity matrix. */
  public static identity(): ComplexMatrix {
    return ComplexMatrix.build((i, j) => (i === j ? Complex.ONE : Complex.ZERO));
  }

  /** Convenience factory from a sparse list of [row, column, value]; unspecified entries are zero. */
  public static fromEntries(sparseEntries: ReadonlyArray<[number, number, Complex]>): ComplexMatrix {
    return ComplexMatrix.build((i, j) => {
      const match = sparseEntries.find(([row, column]) => row === i && column === j);
      return match ? match[2] : Complex.ZERO;
    });
  }

  /** Matrix-vector product M·v. */
  public timesVector(v: ComplexVector): ComplexVector {
    const [v0, v1, v2] = v.components;
    const rowDot = (i: number): Complex =>
      this.entry(i, 0).times(v0).plus(this.entry(i, 1).times(v1)).plus(this.entry(i, 2).times(v2));
    return new ComplexVector(rowDot(0), rowDot(1), rowDot(2));
  }

  /** This matrix scaled entry-wise by a complex factor. */
  public timesScalar(scalar: Complex): ComplexMatrix {
    return ComplexMatrix.build((i, j) => scalar.times(this.entry(i, j)));
  }

  /** Entry-wise sum. */
  public plus(other: ComplexMatrix): ComplexMatrix {
    return ComplexMatrix.build((i, j) => this.entry(i, j).plus(other.entry(i, j)));
  }

  /** Matrix product this·other. */
  public timesMatrix(other: ComplexMatrix): ComplexMatrix {
    return ComplexMatrix.build((i, j) =>
      this.entry(i, 0)
        .times(other.entry(0, j))
        .plus(this.entry(i, 1).times(other.entry(1, j)))
        .plus(this.entry(i, 2).times(other.entry(2, j))),
    );
  }

  /** Matrix square M·M. */
  public squared(): ComplexMatrix {
    return this.timesMatrix(this);
  }

  /** Conjugate transpose M†. */
  public conjugateTranspose(): ComplexMatrix {
    return ComplexMatrix.build((i, j) => this.entry(j, i).conjugate());
  }

  /** Whether every entry of this and the other matrix agree within epsilon. */
  public equalsEpsilon(other: ComplexMatrix, epsilon: number): boolean {
    return INDICES.every((i) => INDICES.every((j) => this.entry(i, j).equalsEpsilon(other.entry(i, j), epsilon)));
  }
}
