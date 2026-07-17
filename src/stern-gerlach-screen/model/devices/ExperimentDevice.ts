/**
 * ExperimentDevice.ts
 *
 * Abstract base for every device that can sit on the experiment board: the
 * particle source, analyzers, magnets, and counters. A device has a position
 * (model coordinates, +x rightward along the beam, +y up), an optional input
 * port on its left edge, and zero or more output ports on its right edge.
 *
 * Port positions are expressed as offsets from the device's center so views
 * and the particle system share one geometry definition. The number of
 * analyzer outputs depends on the active SpinSystem (2 or 3), so port
 * queries take the system as an argument.
 */

import { Property } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";

// Sequential id source, giving every device a stable unique identity.
let nextDeviceId = 0;

export abstract class ExperimentDevice {
  /** Unique, stable identity (useful for debugging and accessible descriptions). */
  public readonly id: string;

  /** Center of the device in model coordinates. */
  public readonly positionProperty: Property<Vector2>;

  /** Whether the user may delete this device in builder mode (the source may not be deleted). */
  public readonly isDeletable: boolean;

  protected constructor(idPrefix: string, position: Vector2, isDeletable: boolean) {
    this.id = `${idPrefix}-${nextDeviceId++}`;
    this.positionProperty = new Property(position);
    this.isDeletable = isDeletable;
  }

  /** Half of the device's model-coordinate width (ports sit at ±halfWidth). */
  public abstract get halfWidth(): number;

  /** Half of the device's model-coordinate height. */
  public abstract get halfHeight(): number;

  /** Whether particles can enter this device (everything except the source). */
  public get hasInput(): boolean {
    return true;
  }

  /** Number of output ports under the given system (0 for counters). */
  public abstract outputCount(system: SpinSystem): number;

  /** Offset of the input port from the device center (left edge, vertically centered). */
  public getInputPortOffset(): Vector2 {
    return new Vector2(-this.halfWidth, 0);
  }

  /** Offset of the given output port from the device center. */
  public abstract getOutputPortOffset(outputIndex: number, system: SpinSystem): Vector2;

  /** Absolute model position of the input port. */
  public getInputPortPosition(): Vector2 {
    return this.positionProperty.value.plus(this.getInputPortOffset());
  }

  /** Absolute model position of the given output port. */
  public getOutputPortPosition(outputIndex: number, system: SpinSystem): Vector2 {
    return this.positionProperty.value.plus(this.getOutputPortOffset(outputIndex, system));
  }
}
