/**
 * AnalyzerNode.ts
 *
 * Visual for a Stern–Gerlach analyzer, in the style of quantum-measurement's
 * SternGerlachNode: a black rounded box with a subtle entrance gradient, cyan
 * parabolic splitting curves from the input to each output hole (the middle
 * "0" output runs straight), dark exit holes, a white RichText label
 * (SG_Z, SG_n, …), and an optional exit-blocker wall.
 *
 * When Watch is on, a which-path light flashes at the output port each atom
 * leaves through (driven by analyzerExitEmitter, ~0.5 s fade).
 *
 * Local origin: the device's center. The curve/hole count follows the active
 * system (2 or 3 outputs); the label follows typeProperty.
 */

import type { Emitter, TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, LinearGradient, Node, Path, Rectangle, RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { AnalyzerType } from "../../../common/quantum/AnalyzerType.js";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import { MODEL_VIEW_SCALE } from "../../../SternGerlachConstants.js";
import type { Analyzer } from "../../model/devices/Analyzer.js";

const HOLE_RADIUS = 6;
const CURVE_LINE_WIDTH = 4;
const FLASH_RADIUS = 10;
/** How long a which-path flash takes to fade out, seconds. */
const FLASH_DURATION = 0.5;

/** The display label for an analyzer/magnet type: SG with a subscript. */
export function analyzerLabelMarkup(type: AnalyzerType): string {
  return `SG<sub>${type.code}</sub>`;
}

export class AnalyzerNode extends Node {
  private readonly disposeAnalyzerNode: () => void;

  // Which-path flash lights, indexed by output port; rebuilt when the system changes.
  private flashes: Circle[] = [];

  // Exit-blocker walls, indexed by output port.
  private blockers: Rectangle[] = [];

  /**
   * @param analyzer - the analyzer device
   * @param systemProperty - the active quantum system (drives output count)
   * @param watchProperty - whether which-path lights are on
   * @param analyzerExitEmitter - fires (analyzer, outputIndex) as atoms leave analyzers
   */
  public constructor(
    analyzer: Analyzer,
    systemProperty: TReadOnlyProperty<SpinSystem>,
    watchProperty: TReadOnlyProperty<boolean>,
    analyzerExitEmitter: Emitter<[Analyzer, number]>,
  ) {
    super();

    const halfWidth = analyzer.halfWidth * MODEL_VIEW_SCALE;
    const halfHeight = analyzer.halfHeight * MODEL_VIEW_SCALE;

    const bodyGradient = new LinearGradient(-halfWidth, 0, halfWidth, 0)
      .addColorStop(0, SternGerlachColors.analyzerEntranceFillProperty)
      .addColorStop(0.18, SternGerlachColors.analyzerBodyFillProperty)
      .addColorStop(1, SternGerlachColors.analyzerBodyFillProperty);
    const body = new Rectangle(-halfWidth, -halfHeight, 2 * halfWidth, 2 * halfHeight, {
      cornerRadius: 8,
      fill: bodyGradient,
    });
    this.addChild(body);

    // Beam curves and exit holes are rebuilt when the system (output count) changes.
    const curvesLayer = new Node();
    this.addChild(curvesLayer);

    const label = new RichText("", {
      font: new PhetFont({ size: 22, weight: "bold" }),
      fill: SternGerlachColors.analyzerLabelFillProperty,
    });
    this.addChild(label);

    const rebuildCurves = (system: SpinSystem) => {
      curvesLayer.removeAllChildren();
      this.flashes = [];
      this.blockers = [];

      const inputPoint = { x: -halfWidth, y: 0 };
      for (let outputIndex = 0; outputIndex < analyzer.outputCount(system); outputIndex++) {
        const offset = analyzer.getOutputPortOffset(outputIndex, system);
        // Model +y is up; the node's local frame is view-oriented (y down).
        const outY = -offset.y * MODEL_VIEW_SCALE;

        const shape = new Shape().moveTo(inputPoint.x, inputPoint.y);
        if (outY === 0) {
          shape.lineTo(halfWidth, 0);
        } else {
          shape.cubicCurveTo(0, 0, halfWidth * 0.35, outY, halfWidth, outY);
        }
        curvesLayer.addChild(
          new Path(shape, {
            stroke: SternGerlachColors.splitterCurveStrokeProperty,
            lineWidth: CURVE_LINE_WIDTH,
          }),
        );
        const holeCenterX = halfWidth - HOLE_RADIUS + 2;
        curvesLayer.addChild(
          new Circle(HOLE_RADIUS, {
            fill: SternGerlachColors.analyzerHoleFillProperty,
            stroke: SternGerlachColors.analyzerLabelFillProperty,
            lineWidth: 1,
            centerX: holeCenterX,
            centerY: outY,
          }),
        );

        // Physical wall over a blocked exit (PhET Spin exit-blocker look).
        const blocker = new Rectangle(halfWidth - 4, outY - 12, 14, 24, {
          cornerRadius: 2,
          fill: SternGerlachColors.blockerFillProperty,
          stroke: SternGerlachColors.analyzerLabelFillProperty,
          lineWidth: 1,
          visible: false,
          pickable: false,
        });
        this.blockers[outputIndex] = blocker;
        curvesLayer.addChild(blocker);

        // Which-path flash light just outside the output hole; starts invisible.
        const flash = new Circle(FLASH_RADIUS, {
          fill: SternGerlachColors.watchLightOnProperty,
          centerX: halfWidth + FLASH_RADIUS,
          centerY: outY,
          opacity: 0,
          pickable: false,
        });
        this.flashes[outputIndex] = flash;
        curvesLayer.addChild(flash);
      }

      // Entry hole on the input edge.
      curvesLayer.addChild(
        new Circle(HOLE_RADIUS, {
          fill: SternGerlachColors.analyzerHoleFillProperty,
          stroke: SternGerlachColors.analyzerLabelFillProperty,
          lineWidth: 1,
          centerX: -halfWidth + HOLE_RADIUS - 2,
          centerY: 0,
        }),
      );

      updateBlockers(analyzer.blockedOutputProperty.value);
    };

    const updateBlockers = (blocked: number) => {
      for (let i = 0; i < this.blockers.length; i++) {
        const wall = this.blockers[i];
        if (wall) {
          wall.visible = blocked === i;
        }
      }
    };

    const updateLabel = (type: AnalyzerType) => {
      label.string = analyzerLabelMarkup(type);
      label.centerX = -halfWidth * 0.35;
      label.centerY = -halfHeight * 0.45;
    };

    const systemListener = (system: SpinSystem) => rebuildCurves(system);
    const typeListener = (type: AnalyzerType) => updateLabel(type);
    const blockedListener = (blocked: number) => updateBlockers(blocked);
    systemProperty.link(systemListener);
    analyzer.typeProperty.link(typeListener);
    analyzer.blockedOutputProperty.link(blockedListener);

    // Light up the exiting output port when Watch is on.
    const exitListener = (source: Analyzer, outputIndex: number) => {
      if (source === analyzer && watchProperty.value) {
        const flash = this.flashes[outputIndex];
        if (flash) {
          flash.opacity = 1;
        }
      }
    };
    analyzerExitEmitter.addListener(exitListener);

    this.disposeAnalyzerNode = () => {
      systemProperty.unlink(systemListener);
      analyzer.typeProperty.unlink(typeListener);
      analyzer.blockedOutputProperty.unlink(blockedListener);
      analyzerExitEmitter.removeListener(exitListener);
    };
  }

  /** Fades the which-path flashes; call once per frame with the elapsed seconds. */
  public stepFlashes(dt: number): void {
    for (const flash of this.flashes) {
      if (flash && flash.opacity > 0) {
        flash.opacity = Math.max(0, flash.opacity - dt / FLASH_DURATION);
      }
    }
  }

  public override dispose(): void {
    this.disposeAnalyzerNode();
    super.dispose();
  }
}
