/**
 * BeamCanvasNode.ts
 *
 * Renders the continuous-beam particles as small magenta dots on a single
 * CanvasNode (quantum-measurement's ManyParticlesCanvasNode pattern). One
 * canvas draw call per frame handles the whole beam (capped at
 * MAX_LIVE_PARTICLES), far cheaper than one scenery Circle per particle.
 *
 * Used for CONTINUOUS source mode; SINGLE mode uses the crisper
 * ParticleLayerNode circles instead.
 */

import { Bounds2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { CanvasNode } from "scenerystack/scenery";
import { EXPERIMENT_AREA_HEIGHT, EXPERIMENT_AREA_WIDTH } from "../../SimConstants.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import type { ParticleSystem } from "../model/ParticleSystem.js";

const DOT_RADIUS = 2.2;

export class BeamCanvasNode extends CanvasNode {
  private readonly particleSystem: ParticleSystem;
  private readonly mvt: ModelViewTransform2;

  public constructor(particleSystem: ParticleSystem, mvt: ModelViewTransform2) {
    super({
      canvasBounds: new Bounds2(0, 0, EXPERIMENT_AREA_WIDTH, EXPERIMENT_AREA_HEIGHT),
      pickable: false,
    });
    this.particleSystem = particleSystem;
    this.mvt = mvt;
  }

  /** Requests a repaint; call once per frame while visible. */
  public update(): void {
    this.invalidatePaint();
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    context.fillStyle = SternGerlachColors.particleColorProperty.value.toCSS();
    for (const particle of this.particleSystem.particles) {
      const view = this.mvt.modelToViewPosition(particle.position);
      context.beginPath();
      context.arc(view.x, view.y, DOT_RADIUS, 0, 2 * Math.PI);
      context.fill();
    }
  }
}
