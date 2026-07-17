/**
 * Counter.ts
 *
 * A particle detector. Tracks how many particles it has received
 * (countProperty) and the analytic probability that a fired particle lands
 * here (probabilityProperty, set by the model whenever the configuration
 * changes) — the latter drives the green expected-value line in the view.
 */

import { NumberProperty } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import { COUNTER_HALF_HEIGHT, COUNTER_HALF_WIDTH } from "../../../SimConstants.js";
import { ExperimentDevice } from "./ExperimentDevice.js";

export class Counter extends ExperimentDevice {
  /** Number of particles detected since the last clear. */
  public readonly countProperty: NumberProperty;

  /** Analytic probability (0-1) that a fired particle ends up here; drives the expected-value line. */
  public readonly probabilityProperty: NumberProperty;

  public constructor(position: Vector2) {
    super("counter", position, true);
    this.countProperty = new NumberProperty(0, { numberType: "Integer" });
    this.probabilityProperty = new NumberProperty(0);
  }

  public override get halfWidth(): number {
    return COUNTER_HALF_WIDTH;
  }

  public override get halfHeight(): number {
    return COUNTER_HALF_HEIGHT;
  }

  public override outputCount(_system: SpinSystem): number {
    return 0;
  }

  public override getOutputPortOffset(_outputIndex: number, _system: SpinSystem): never {
    throw new Error("a Counter has no output ports");
  }

  /** Records one detected particle. */
  public increment(): void {
    this.countProperty.value++;
  }

  /** Zeroes the detected count (Reset Counts / configuration change). */
  public clearCount(): void {
    this.countProperty.reset();
  }
}
