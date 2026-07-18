/**
 * DirectionSphereNode.ts
 *
 * Compact unit sphere showing the n̂(θ, φ) direction with labeled X/Y/Z axes
 * and polar/azimuthal angle arcs. Used by AnglesDialog so the θ/φ controls
 * have an immediate geometric read-out.
 *
 * Projection matches the PhET Bloch-sphere convention: +Z up, equator tipped
 * slightly toward the camera, and +X offset so Y is readable in 2-D.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Multilink } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Node, Path, RichText, Text } from "scenerystack/scenery";
import { ArrowNode, PhetFont, ShadedSphereNode } from "scenerystack/scenery-phet";
import { StringManager } from "../../../i18n/StringManager.js";
import SternGerlachColors from "../../../SternGerlachColors.js";

const RADIUS = 58;
/** Camera tip of the equator ellipse (radians). */
const EQUATOR_INCLINATION = (10 * Math.PI) / 180;
/** Azimuthal offset so +X is not edge-on (radians). */
const X_AXIS_OFFSET = (20 * Math.PI) / 180;
const AXIS_DASH = [3, 3];
const LABEL_FONT = new PhetFont({ size: 12, weight: "bold" });
const ANGLE_LABEL_FONT = new PhetFont({ size: 13, weight: "bold" });

export class DirectionSphereNode extends Node {
  private readonly disposeDirectionSphereNode: () => void;

  /**
   * @param thetaProperty - polar angle from +Z, radians [0, π]
   * @param phiProperty - azimuthal angle from +X toward +Y, radians [0, 2π]
   */
  public constructor(thetaProperty: TReadOnlyProperty<number>, phiProperty: TReadOnlyProperty<number>) {
    super({ pickable: false });

    const controls = StringManager.getInstance().getControls();
    const axisStroke = SternGerlachColors.experimentAreaStrokeProperty;
    const textFill = SternGerlachColors.textColorProperty;
    const directionFill = SternGerlachColors.particleColorProperty;
    const angleStroke = SternGerlachColors.accentColorProperty;

    const sphere = new ShadedSphereNode(2 * RADIUS, {
      mainColor: SternGerlachColors.controlSurfaceColorProperty,
      highlightColor: SternGerlachColors.controlSurfaceHighlightColorProperty,
      shadowColor: SternGerlachColors.experimentAreaFillProperty,
      highlightDiameterRatio: 0.85,
    });
    this.addChild(sphere);

    const equator = new Path(new Shape().ellipse(0, 0, RADIUS, RADIUS * Math.sin(EQUATOR_INCLINATION), 0), {
      stroke: axisStroke,
      lineWidth: 1,
      lineDash: AXIS_DASH,
    });
    this.addChild(equator);

    const xAxis = new Path(null, { stroke: axisStroke, lineWidth: 1, lineDash: AXIS_DASH });
    const yAxis = new Path(null, { stroke: axisStroke, lineWidth: 1, lineDash: AXIS_DASH });
    const zAxis = new Path(null, { stroke: axisStroke, lineWidth: 1, lineDash: AXIS_DASH });
    this.addChild(xAxis);
    this.addChild(yAxis);
    this.addChild(zAxis);

    const plusX = pointOnEquator(0);
    const minusX = pointOnEquator(Math.PI);
    const plusY = pointOnEquator(Math.PI / 2);
    const minusY = pointOnEquator(-Math.PI / 2);
    xAxis.shape = new Shape().moveTo(plusX.x, plusX.y).lineTo(minusX.x, minusX.y);
    yAxis.shape = new Shape().moveTo(plusY.x, plusY.y).lineTo(minusY.x, minusY.y);
    zAxis.shape = new Shape().moveTo(0, -RADIUS).lineTo(0, RADIUS);

    const xLabel = new Text("+X", { font: LABEL_FONT, fill: textFill });
    xLabel.centerX = plusX.x + 14;
    xLabel.centerY = plusX.y + 10;
    const yLabel = new Text("+Y", { font: LABEL_FONT, fill: textFill });
    yLabel.centerX = plusY.x;
    yLabel.centerY = plusY.y - 12;
    const zLabel = new Text("+Z", { font: LABEL_FONT, fill: textFill });
    zLabel.centerX = -12;
    zLabel.centerY = -RADIUS + 4;
    this.addChild(xLabel);
    this.addChild(yLabel);
    this.addChild(zLabel);

    const thetaArc = new Path(null, { stroke: angleStroke, lineWidth: 1.5 });
    const phiArc = new Path(null, { stroke: angleStroke, lineWidth: 1.5 });
    const xyProjection = new Path(null, {
      stroke: angleStroke,
      lineWidth: 1,
      lineDash: AXIS_DASH,
    });
    const zDrop = new Path(null, {
      stroke: angleStroke,
      lineWidth: 1,
      lineDash: AXIS_DASH,
    });
    this.addChild(thetaArc);
    this.addChild(phiArc);
    this.addChild(xyProjection);
    this.addChild(zDrop);

    const thetaLabel = new RichText(controls.thetaStringProperty, {
      font: ANGLE_LABEL_FONT,
      fill: angleStroke,
    });
    const phiLabel = new RichText(controls.phiStringProperty, {
      font: ANGLE_LABEL_FONT,
      fill: angleStroke,
    });
    this.addChild(thetaLabel);
    this.addChild(phiLabel);

    const directionArrow = new ArrowNode(0, 0, 0, -RADIUS, {
      headWidth: 9,
      headHeight: 9,
      tailWidth: 2.5,
      fill: directionFill,
      stroke: directionFill,
    });
    this.addChild(directionArrow);

    const multilink = new Multilink([thetaProperty, phiProperty], (theta, phi) => {
      const tip = pointOnSphere(phi, theta);
      directionArrow.setTip(tip.x, tip.y);

      const sinTheta = Math.sin(theta);
      const showProjection = Math.abs(sinTheta) > 1e-3 && Math.abs(Math.sin(theta * 2)) > 1e-3;

      if (showProjection) {
        const xyTip = pointOnEquator(phi).timesScalar(sinTheta);
        xyProjection.visible = true;
        zDrop.visible = true;
        xyProjection.shape = new Shape().moveTo(0, 0).lineTo(xyTip.x, xyTip.y);
        zDrop.shape = new Shape().moveTo(tip.x, tip.y).lineTo(xyTip.x, xyTip.y);
      } else {
        xyProjection.visible = false;
        zDrop.visible = false;
      }

      // Polar arc in the plane of n̂ and +Z, drawn at half-radius.
      const rotationFactor = Math.sin(phi + X_AXIS_OFFSET);
      const polarRadius = RADIUS * 0.45;
      if (Math.abs(theta) > 1e-3 && Math.abs(rotationFactor) > 1e-3) {
        thetaArc.visible = true;
        thetaLabel.visible = true;
        const endAngle = Math.atan2(tip.y, tip.x / rotationFactor);
        thetaArc.shape = new Shape().ellipticalArc(
          0,
          0,
          polarRadius * rotationFactor,
          polarRadius,
          0,
          -Math.PI / 2,
          endAngle,
          false,
        );
        const midPolar = pointOnSphere(phi, theta / 2).timesScalar(0.55);
        thetaLabel.centerX = midPolar.x + (rotationFactor >= 0 ? 10 : -10);
        thetaLabel.centerY = midPolar.y;
      } else {
        thetaArc.visible = false;
        thetaLabel.visible = false;
      }

      // Azimuthal arc along the equator from +X to the n̂ projection.
      if (Math.abs(sinTheta) > 1e-3 && Math.abs(((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) > 1e-3) {
        phiArc.visible = true;
        phiLabel.visible = true;
        const equatorMajor = RADIUS * 0.5;
        const equatorMinor = equatorMajor * Math.sin(EQUATOR_INCLINATION);
        const start = -X_AXIS_OFFSET + Math.PI / 2;
        const end = -(phi + X_AXIS_OFFSET - Math.PI / 2);
        phiArc.shape = new Shape().ellipticalArc(0, 0, equatorMajor, equatorMinor, 0, start, end, true);
        const midPhi = pointOnEquator(phi / 2).timesScalar(0.62);
        phiLabel.centerX = midPhi.x;
        phiLabel.centerY = midPhi.y + 12;
      } else {
        phiArc.visible = false;
        phiLabel.visible = false;
      }
    });

    this.disposeDirectionSphereNode = () => multilink.dispose();
  }

  public override dispose(): void {
    this.disposeDirectionSphereNode();
    super.dispose();
  }
}

/** Screen point on the tipped equator at azimuthal angle φ. */
function pointOnEquator(phi: number): Vector2 {
  return new Vector2(
    RADIUS * Math.sin(phi + X_AXIS_OFFSET),
    RADIUS * Math.cos(phi + X_AXIS_OFFSET) * Math.sin(EQUATOR_INCLINATION),
  );
}

/** Screen point on the sphere for spherical (φ, θ). */
function pointOnSphere(phi: number, theta: number): Vector2 {
  return new Vector2(
    RADIUS * Math.sin(phi + X_AXIS_OFFSET) * Math.sin(theta),
    RADIUS * (-Math.cos(theta) + Math.cos(phi + X_AXIS_OFFSET) * Math.sin(EQUATOR_INCLINATION) * Math.sin(theta)),
  );
}
