/**
 * Analyzer.ts
 *
 * A Stern–Gerlach analyzer: measures the observable selected by typeProperty
 * and routes the particle out of one of its output ports. Under a 2-state
 * system it has outputs UP (0, eigenvalue +1, top) and DOWN (1, eigenvalue −1,
 * bottom); under a 3-state system it adds NONE (2, eigenvalue 0) in the
 * middle — matching both the Java SPINS port layout and the eigenvector index
 * convention of OperatorTable.
 *
 * The measurement itself lives in ExperimentEngine; this class is pure state.
 */

import { Property } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { AnalyzerType } from "../../../common/quantum/AnalyzerType.js";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import { ANALYZER_HALF_HEIGHT, ANALYZER_HALF_WIDTH, ANALYZER_PORT_SPACING_RATIO } from "../../../SimConstants.js";
import { ExperimentDevice } from "./ExperimentDevice.js";

export class Analyzer extends ExperimentDevice {
  /** The observable this analyzer measures (Z / X / Y / n or λ₁-λ₈, depending on the system). */
  public readonly typeProperty: Property<AnalyzerType>;

  public constructor(position: Vector2, initialType: AnalyzerType = AnalyzerType.Z) {
    super("analyzer", position, true);
    this.typeProperty = new Property(initialType);
  }

  public override get halfWidth(): number {
    return ANALYZER_HALF_WIDTH;
  }

  public override get halfHeight(): number {
    return ANALYZER_HALF_HEIGHT;
  }

  public override outputCount(system: SpinSystem): number {
    return system.stateCount;
  }

  /**
   * Output ports on the right edge. Index 0 (+1, UP) on top, index 1 (−1, DOWN) at the bottom,
   * index 2 (0, NONE — 3-state systems only) in the middle, as in the Java Analyzer drawing.
   */
  public override getOutputPortOffset(outputIndex: number, _system: SpinSystem): Vector2 {
    const spacing = this.halfHeight * ANALYZER_PORT_SPACING_RATIO;
    const y = outputIndex === 0 ? spacing : outputIndex === 1 ? -spacing : 0;
    return new Vector2(this.halfWidth, y);
  }
}
