/**
 * AnalyzerNode.ts
 *
 * Visual for a Stern–Gerlach analyzer, in the style of quantum-measurement's
 * SternGerlachNode: a black rounded box, cyan parabolic splitting curves from
 * the input to each output hole (the middle "0" output runs straight), dark
 * exit holes, and a white RichText label (SG_Z, SG_n, λ₄ …).
 *
 * Local origin: the device's center. The curve/hole count follows the active
 * system (2 or 3 outputs); the label follows typeProperty.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle, RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { AnalyzerType } from "../../../common/quantum/AnalyzerType.js";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import { MODEL_VIEW_SCALE } from "../../../SimConstants.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import type { Analyzer } from "../../model/devices/Analyzer.js";

const HOLE_RADIUS = 6;
const CURVE_LINE_WIDTH = 4;

/** The display label for an analyzer/magnet type: SG with a subscript, or λ with one. */
export function analyzerLabelMarkup(type: AnalyzerType): string {
  if (type.code >= "1" && type.code <= "8") {
    return `λ<sub>${type.code}</sub>`;
  }
  return `SG<sub>${type.code}</sub>`;
}

export class AnalyzerNode extends Node {
  private readonly disposeAnalyzerNode: () => void;

  public constructor(analyzer: Analyzer, systemProperty: TReadOnlyProperty<SpinSystem>) {
    super();

    const halfWidth = analyzer.halfWidth * MODEL_VIEW_SCALE;
    const halfHeight = analyzer.halfHeight * MODEL_VIEW_SCALE;

    const body = new Rectangle(-halfWidth, -halfHeight, 2 * halfWidth, 2 * halfHeight, {
      cornerRadius: 8,
      fill: SternGerlachColors.analyzerBodyFillProperty,
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
        curvesLayer.addChild(
          new Circle(HOLE_RADIUS, {
            fill: SternGerlachColors.analyzerHoleFillProperty,
            stroke: SternGerlachColors.analyzerLabelFillProperty,
            lineWidth: 1,
            centerX: halfWidth - HOLE_RADIUS + 2,
            centerY: outY,
          }),
        );
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
    };

    const updateLabel = (type: AnalyzerType) => {
      label.string = analyzerLabelMarkup(type);
      label.centerX = -halfWidth * 0.35;
      label.centerY = -halfHeight * 0.45;
    };

    const systemListener = (system: SpinSystem) => rebuildCurves(system);
    const typeListener = (type: AnalyzerType) => updateLabel(type);
    systemProperty.link(systemListener);
    analyzer.typeProperty.link(typeListener);

    this.disposeAnalyzerNode = () => {
      systemProperty.unlink(systemListener);
      analyzer.typeProperty.unlink(typeListener);
    };
  }

  public override dispose(): void {
    this.disposeAnalyzerNode();
    super.dispose();
  }
}
