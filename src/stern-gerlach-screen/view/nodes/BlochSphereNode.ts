/**
 * BlochSphereNode.ts
 *
 * A compact spin-½ Bloch sphere: unit circle with X/Z axes and a state vector.
 * Drawn in local view coordinates; no PhET tandem instrumentation.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { BlochVector } from "../../../common/quantum/StateDisplay.js";
import SternGerlachColors from "../../../SternGerlachColors.js";

const RADIUS = 48;

export class BlochSphereNode extends Node {
  private readonly disposeBlochSphereNode: () => void;

  /**
   * @param blochProperty - Cartesian Bloch vector, or null when no definite state is shown
   */
  public constructor(blochProperty: TReadOnlyProperty<BlochVector | null>) {
    super({ pickable: false });

    const sphere = new Circle(RADIUS, {
      fill: SternGerlachColors.controlSurfaceColorProperty,
      stroke: SternGerlachColors.experimentAreaStrokeProperty,
      lineWidth: 1.5,
    });
    this.addChild(sphere);

    // Equator and vertical meridian suggest the 3-D sphere in 2-D.
    this.addChild(
      new Path(new Shape().ellipticalArc(0, 0, RADIUS, RADIUS * 0.35, 0, 0, 2 * Math.PI, false), {
        stroke: SternGerlachColors.experimentAreaStrokeProperty,
        lineWidth: 1,
        lineDash: [4, 3],
      }),
    );
    this.addChild(
      new Line(0, -RADIUS, 0, RADIUS, {
        stroke: SternGerlachColors.experimentAreaStrokeProperty,
        lineWidth: 1,
      }),
    );
    this.addChild(
      new Line(-RADIUS, 0, RADIUS, 0, {
        stroke: SternGerlachColors.experimentAreaStrokeProperty,
        lineWidth: 1,
      }),
    );

    const labelFont = new PhetFont(11);
    const labelFill = SternGerlachColors.controlSurfaceTextColorProperty;
    const zPlus = new RichText("|+⟩", { font: labelFont, fill: labelFill });
    zPlus.centerX = 0;
    zPlus.bottom = -RADIUS - 2;
    const zMinus = new RichText("|−⟩", { font: labelFont, fill: labelFill });
    zMinus.centerX = 0;
    zMinus.top = RADIUS + 2;
    const xPlus = new RichText("|+x⟩", { font: labelFont, fill: labelFill });
    xPlus.left = RADIUS + 4;
    xPlus.centerY = 0;
    this.addChild(zPlus);
    this.addChild(zMinus);
    this.addChild(xPlus);

    const stateArrow = new Line(0, 0, 0, 0, {
      stroke: SternGerlachColors.particleColorProperty,
      lineWidth: 3,
    });
    const stateTip = new Circle(4, { fill: SternGerlachColors.particleColorProperty });
    this.addChild(stateArrow);
    this.addChild(stateTip);

    const listener = (bloch: BlochVector | null) => {
      const visible = bloch !== null;
      stateArrow.visible = visible;
      stateTip.visible = visible;
      if (!bloch) {
        return;
      }
      // Project onto the XZ plane of the drawing (Y out of page).
      const tipX = bloch.x * RADIUS;
      const tipY = -bloch.z * RADIUS;
      stateArrow.setPoint2(tipX, tipY);
      stateTip.centerX = tipX;
      stateTip.centerY = tipY;
    };
    blochProperty.link(listener);

    this.disposeBlochSphereNode = () => blochProperty.unlink(listener);
  }

  public override dispose(): void {
    this.disposeBlochSphereNode();
    super.dispose();
  }
}
