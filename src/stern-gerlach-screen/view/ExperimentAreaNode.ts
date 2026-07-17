/**
 * ExperimentAreaNode.ts
 *
 * The light experiment board (quantum-measurement style): owns the
 * ModelViewTransform2 (inverted y, MODEL_VIEW_SCALE px per model unit) and
 * three layers — wires under devices under particles. Rebuilds the device and
 * wire nodes whenever the graph changes structurally.
 *
 * The board stays light in both color profiles, so the device colors drawn on
 * it are profile-invariant.
 */

import { Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node, Rectangle } from "scenerystack/scenery";
import {
  EXPERIMENT_AREA_HEIGHT,
  EXPERIMENT_AREA_WIDTH,
  MODEL_ORIGIN_IN_AREA_X,
  MODEL_ORIGIN_IN_AREA_Y,
  MODEL_VIEW_SCALE,
} from "../../SimConstants.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import { Analyzer } from "../model/devices/Analyzer.js";
import { Counter } from "../model/devices/Counter.js";
import type { ExperimentDevice } from "../model/devices/ExperimentDevice.js";
import { ParticleSource } from "../model/devices/ParticleSource.js";
import type { SternGerlachModel } from "../model/SternGerlachModel.js";
import { AnalyzerNode } from "./nodes/AnalyzerNode.js";
import { CounterNode } from "./nodes/CounterNode.js";
import { SourceNode } from "./nodes/SourceNode.js";
import { WireNode } from "./nodes/WireNode.js";
import { ParticleLayerNode } from "./ParticleLayerNode.js";

export class ExperimentAreaNode extends Node {
  /** Maps between experiment model coordinates and this node's local view frame. */
  public readonly mvt: ModelViewTransform2;

  private readonly model: SternGerlachModel;
  private readonly wireLayer: Node;
  private readonly deviceLayer: Node;
  private readonly particleLayer: ParticleLayerNode;

  public constructor(model: SternGerlachModel) {
    super();
    this.model = model;

    this.mvt = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      Vector2.ZERO,
      new Vector2(MODEL_ORIGIN_IN_AREA_X, MODEL_ORIGIN_IN_AREA_Y),
      MODEL_VIEW_SCALE,
    );

    const board = new Rectangle(0, 0, EXPERIMENT_AREA_WIDTH, EXPERIMENT_AREA_HEIGHT, {
      cornerRadius: 10,
      fill: SternGerlachColors.experimentAreaFillProperty,
      stroke: SternGerlachColors.experimentAreaStrokeProperty,
      lineWidth: 1.5,
    });
    this.addChild(board);

    this.wireLayer = new Node();
    this.deviceLayer = new Node();
    this.particleLayer = new ParticleLayerNode(model.particleSystem, this.mvt);
    this.addChild(this.wireLayer);
    this.addChild(this.deviceLayer);
    this.addChild(this.particleLayer);

    // Rebuild on any structural change. Preset rebuilds emit once per element; the
    // work per rebuild is small (a dozen nodes), so no debouncing is needed.
    model.graph.changedEmitter.addListener(() => this.rebuild());
    this.rebuild();
  }

  /** Call once per frame so particles track their model positions. */
  public step(): void {
    this.particleLayer.update();
  }

  /** Recreates all device and wire nodes from the current graph. */
  private rebuild(): void {
    for (const child of this.wireLayer.children.slice()) {
      child.dispose();
    }
    for (const child of this.deviceLayer.children.slice()) {
      child.dispose();
    }

    for (const device of this.model.graph.devices) {
      const node = this.createDeviceNode(device);
      node.translation = this.mvt.modelToViewPosition(device.positionProperty.value);
      this.deviceLayer.addChild(node);
    }
    for (const wire of this.model.graph.wires) {
      this.wireLayer.addChild(new WireNode(wire, this.model.systemProperty, this.mvt));
    }
  }

  private createDeviceNode(device: ExperimentDevice): Node {
    if (device instanceof ParticleSource) {
      return new SourceNode(device, () => this.model.fireSingleParticle());
    }
    if (device instanceof Analyzer) {
      return new AnalyzerNode(device, this.model.systemProperty);
    }
    if (device instanceof Counter) {
      // UP-ish ports get black bars, DOWN-ish magenta — decided by the feeding port.
      const feed = this.model.graph.getWiresInto(device)[0];
      const barFill =
        feed && feed.outputIndex === 1
          ? SternGerlachColors.counterBarDownFillProperty
          : SternGerlachColors.counterBarUpFillProperty;
      return new CounterNode(
        device,
        this.model.totalDetectedProperty,
        this.model.expectedValuesVisibleProperty,
        barFill,
      );
    }
    throw new Error(`no view for device ${device.id}`);
  }
}
