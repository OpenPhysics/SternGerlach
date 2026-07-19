/**
 * AnglesDialog.ts
 *
 * A modal dialog exposing the direction angles θ (polar) and φ (azimuthal)
 * that define one n̂-type analyzer or magnet's own measurement/precession
 * axis, with a live DirectionSphereNode so the geometry is visible while
 * adjusting. Each device owns its angles independently, so one dialog
 * instance is bound to a single device's thetaProperty/phiProperty.
 *
 * Sliders are labeled in multiples of π/2 (θ: 0…π, φ: 0…2π) with π/4 minor ticks.
 */

import type { NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Dimension2, Range, roundToInterval } from "scenerystack/dot";
import { HBox, Text, VBox } from "scenerystack/scenery";
import { MathSymbols, NumberControl, PhetFont } from "scenerystack/scenery-phet";
import { SimDialog } from "../../../common/SimDialog.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../../../common/SternGerlachButtonOptions.js";
import { StringManager } from "../../../i18n/StringManager.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import { DirectionSphereNode } from "../nodes/DirectionSphereNode.js";

/** Arrow-button / keyboard fine step, radians (5°). */
const ANGLE_DELTA = Math.PI / 36;
/** Slider snap interval, radians (15°). */
const SLIDER_STEP = Math.PI / 12;
/** Spacing between unlabeled minor ticks. */
const MINOR_TICK_SPACING = Math.PI / 4;

const TICK_FONT = new PhetFont(12);
const THETA_RANGE = new Range(0, Math.PI);
const PHI_RANGE = new Range(0, 2 * Math.PI);

function tickLabel(markup: string): Text {
  return new Text(markup, {
    font: TICK_FONT,
    fill: SternGerlachColors.textColorProperty,
  });
}

function angleControl(
  title: TReadOnlyProperty<string>,
  property: NumberProperty,
  range: Range,
  majorTicks: { value: number; label: Text }[],
  accessibleName: TReadOnlyProperty<string>,
): NumberControl {
  return new NumberControl(title, property, range, {
    delta: ANGLE_DELTA,
    titleNodeOptions: {
      font: new PhetFont(16),
      fill: SternGerlachColors.textColorProperty,
    },
    numberDisplayOptions: {
      decimalPlaces: 2,
      textOptions: {
        font: new PhetFont(15),
        fill: SternGerlachColors.controlSurfaceTextColorProperty,
      },
      backgroundFill: SternGerlachColors.controlSurfaceColorProperty,
      backgroundStroke: SternGerlachColors.panelBorderColorProperty,
    },
    arrowButtonOptions: {
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      baseColor: SternGerlachColors.controlSurfaceColorProperty,
      arrowFill: SternGerlachColors.controlSurfaceTextColorProperty,
    },
    sliderOptions: {
      trackSize: new Dimension2(160, 4),
      constrainValue: (value) => roundToInterval(value, SLIDER_STEP),
      keyboardStep: SLIDER_STEP,
      shiftKeyboardStep: ANGLE_DELTA,
      pageKeyboardStep: SLIDER_STEP * 3,
      majorTicks,
      minorTickSpacing: MINOR_TICK_SPACING,
      majorTickLength: 12,
      minorTickLength: 7,
      // Slider defaults to black ticks — invisible on the dark default-profile dialog.
      majorTickStroke: SternGerlachColors.textColorProperty,
      minorTickStroke: SternGerlachColors.experimentAreaStrokeProperty,
      majorTickLineWidth: 1.5,
      minorTickLineWidth: 1,
    },
    accessibleName,
  });
}

export class AnglesDialog extends SimDialog {
  public constructor(thetaProperty: NumberProperty, phiProperty: NumberProperty) {
    const strings = StringManager.getInstance();
    const controls = strings.getControls();
    const dialogs = strings.getDialogs();
    const a11y = strings.getA11yStrings();

    const content = new HBox({
      spacing: 24,
      align: "center",
      children: [
        new DirectionSphereNode(thetaProperty, phiProperty),
        new VBox({
          spacing: 18,
          align: "left",
          children: [
            angleControl(
              controls.thetaStringProperty,
              thetaProperty,
              THETA_RANGE,
              [
                { value: 0, label: tickLabel("0") },
                { value: Math.PI / 2, label: tickLabel(`${MathSymbols.PI}/2`) },
                { value: Math.PI, label: tickLabel(MathSymbols.PI) },
              ],
              a11y.controls.thetaControlStringProperty,
            ),
            angleControl(
              controls.phiStringProperty,
              phiProperty,
              PHI_RANGE,
              [
                { value: 0, label: tickLabel("0") },
                { value: Math.PI / 2, label: tickLabel(`${MathSymbols.PI}/2`) },
                { value: Math.PI, label: tickLabel(MathSymbols.PI) },
                { value: (3 * Math.PI) / 2, label: tickLabel(`3${MathSymbols.PI}/2`) },
                { value: 2 * Math.PI, label: tickLabel(`2${MathSymbols.PI}`) },
              ],
              a11y.controls.phiControlStringProperty,
            ),
          ],
        }),
      ],
    });

    super(content, {
      title: new Text(dialogs.anglesTitleStringProperty, {
        font: new PhetFont({ size: 20, weight: "bold" }),
        fill: SternGerlachColors.textColorProperty,
      }),
    });
  }
}
