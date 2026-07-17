/**
 * AnglesDialog.ts
 *
 * A modal dialog exposing the global direction angles θ (polar) and φ
 * (azimuthal) that define every n̂-type analyzer and magnet. Following the Java
 * SPINS applet, these angles are global model state shared by all n̂ devices.
 */

import type { NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont } from "scenerystack/scenery-phet";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../../../common/SimButtonOptions.js";
import { SimDialog } from "../../../common/SimDialog.js";
import { StringManager } from "../../../i18n/StringManager.js";
import SternGerlachColors from "../../../SternGerlachColors.js";

/** Small increment per arrow press / keyboard step, radians (5°). */
const ANGLE_DELTA = Math.PI / 36;

function angleControl(
  title: TReadOnlyProperty<string>,
  property: NumberProperty,
  range: Range,
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
    accessibleName,
  });
}

export class AnglesDialog extends SimDialog {
  public constructor(thetaProperty: NumberProperty, phiProperty: NumberProperty) {
    const strings = StringManager.getInstance();
    const controls = strings.getControls();
    const dialogs = strings.getDialogs();
    const a11y = strings.getA11yStrings();

    const content = new VBox({
      spacing: 18,
      align: "left",
      children: [
        angleControl(
          controls.thetaStringProperty,
          thetaProperty,
          new Range(0, Math.PI),
          a11y.controls.thetaControlStringProperty,
        ),
        angleControl(
          controls.phiStringProperty,
          phiProperty,
          new Range(0, 2 * Math.PI),
          a11y.controls.phiControlStringProperty,
        ),
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
