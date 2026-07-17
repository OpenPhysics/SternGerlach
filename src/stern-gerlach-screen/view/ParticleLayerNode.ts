/**
 * ParticleLayerNode.ts
 *
 * Renders the in-flight particles as magenta circles. Reconciled against the
 * ParticleSystem's live list once per view step — positions are plain mutable
 * vectors, not Properties, so there is nothing to observe per particle.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Node } from "scenerystack/scenery";
import SternGerlachColors from "../../SternGerlachColors.js";
import type { ParticleSystem } from "../model/ParticleSystem.js";

const PARTICLE_RADIUS = 5;

export class ParticleLayerNode extends Node {
  private readonly particleSystem: ParticleSystem;
  private readonly mvt: ModelViewTransform2;

  public constructor(particleSystem: ParticleSystem, mvt: ModelViewTransform2) {
    super({ pickable: false });
    this.particleSystem = particleSystem;
    this.mvt = mvt;
  }

  /** Syncs circle count and positions with the live particles. Call once per frame. */
  public update(): void {
    const particles = this.particleSystem.particles;

    // Grow or shrink the child pool to match.
    while (this.children.length < particles.length) {
      this.addChild(new Circle(PARTICLE_RADIUS, { fill: SternGerlachColors.particleColorProperty }));
    }
    while (this.children.length > particles.length) {
      const child = this.children[this.children.length - 1];
      if (child) {
        this.removeChild(child);
        child.dispose();
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const child = this.children[i];
      if (particle && child) {
        child.translation = this.mvt.modelToViewPosition(particle.position);
      }
    }
  }
}
