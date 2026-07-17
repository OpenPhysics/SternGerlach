/**
 * Particle.ts
 *
 * One animated atom in flight. Particles travel along the wire flight path
 * (a polyline of waypoints from WireGeometry, matching the drawn wire curve);
 * the state vector rides along and is transformed by
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

  /** Device whose input port we are flying toward. */
  public target: ExperimentDevice;

  /**
   * Remaining waypoints along the current wire, consumed front-to-back; the
   * last one is the target's input port. Empty means the particle has arrived.
   */
  public waypoints: Vector2[];

  public constructor(position: Vector2, state: ComplexVector, target: ExperimentDevice, waypoints: Vector2[]) {
    this.position = position;
    this.state = state;
    this.target = target;
    this.waypoints = waypoints;
  }
}
