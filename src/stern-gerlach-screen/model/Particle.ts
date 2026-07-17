/**
 * Particle.ts
 *
 * One animated atom in flight. Particles travel in straight rays between
 * ports; the state vector rides along and is transformed by
 * ExperimentEngine.transitDevice at each device arrival.
 *
 * Position is a plain mutable Vector2 (no Property): with up to ~500 live
 * particles updated every frame, views read positions directly in their own
 * step/paint rather than observing per-particle changes.
 */

import type { Vector2 } from "scenerystack/dot";
import type { ComplexVector } from "../../common/quantum/ComplexVector.js";
import type { ExperimentDevice } from "./devices/ExperimentDevice.js";

export class Particle {
  /** Current position, model coordinates. Mutated in place each step. */
  public position: Vector2;

  /** The quantum state carried to the next device. */
  public state: ComplexVector;

  /** Device whose input port we are flying toward (null only transiently). */
  public target: ExperimentDevice;

  /** The input-port point being flown toward, model coordinates. */
  public targetPoint: Vector2;

  public constructor(position: Vector2, state: ComplexVector, target: ExperimentDevice, targetPoint: Vector2) {
    this.position = position;
    this.state = state;
    this.target = target;
    this.targetPoint = targetPoint;
  }
}
