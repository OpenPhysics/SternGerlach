/**
 * Wire.ts
 *
 * A directed connection from one device's output port to another device's
 * input port. Immutable — re-routing replaces the wire.
 */

import type { ExperimentDevice } from "./devices/ExperimentDevice.js";

export class Wire {
  /** Device the particle leaves. */
  public readonly source: ExperimentDevice;

  /** Which of the source's output ports this wire is attached to. */
  public readonly outputIndex: number;

  /** Device the particle enters (through its single input port). */
  public readonly target: ExperimentDevice;

  public constructor(source: ExperimentDevice, outputIndex: number, target: ExperimentDevice) {
    this.source = source;
    this.outputIndex = outputIndex;
    this.target = target;
  }
}
