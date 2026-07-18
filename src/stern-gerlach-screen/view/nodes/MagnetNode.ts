/**
 * MagnetNode.ts
 *
 * Visual for a uniform-field magnet: a red rounded body carrying a white
 * field-direction label (B_z, B_x, … — NOT "SG": a magnet precesses the spin
 * without measuring it) and, below it, a spinner that dials the integer field
 * strength 0-99 (φ = 2π·n/72). Single output port on the right edge.
 *
 * Local origin: the device's center.
 */

import { Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { Node, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { NumberSpinner } from "scenerystack/sun";
import type { AnalyzerType } from "../../../common/quantum/AnalyzerType.js";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../../../common/SimButtonOptions.js";
import { StringManager } from "../../../i18n/StringManager.js";
import { MAGNET_FIELD_NUMBER_MAX, MODEL_VIEW_SCALE } from "../../../SimConstants.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import type { Magnet } from "../../model/devices/Magnet.js";

/**
 * The display label for a magnet's field direction: B with the axis as a
 * subscript (B_z, B_n). Deliberately not the analyzer's "SG" markup — a magnet
 * applies a unitary precession, it does not measure.
 */
export function magnetLabelMarkup(type: AnalyzerType): string {
  return `B<sub>${type.code}</sub>`;
}

export class MagnetNode extends Node {
  private readonly disposeMagnetNode: () => void;

  public constructor(magnet: Magnet, _systemProperty: TReadOnlyProperty<SpinSystem>) {
    super();

    const strings = StringManager.getInstance();
    const controls = strings.getControls();
    const a11y = strings.getA11yStrings();

    const halfWidth = magnet.halfWidth * MODEL_VIEW_SCALE;
    const halfHeight = magnet.halfHeight * MODEL_VIEW_SCALE;

    const body = new Rectangle(-halfWidth, -halfHeight, 2 * halfWidth, 2 * halfHeight, {
      cornerRadius: 8,
      fill: SternGerlachColors.magnetBodyFillProperty,
    });
    this.addChild(body);

    const label = new RichText("", {
      font: new PhetFont({ size: 20, weight: "bold" }),
      fill: SternGerlachColors.analyzerLabelFillProperty,
      centerX: 0,
      centerY: -halfHeight * 0.35,
    });
    this.addChild(label);

    const fieldSpinner = new NumberSpinner(
      magnet.fieldNumberProperty,
      new Property(new Range(0, MAGNET_FIELD_NUMBER_MAX)),
      {
        accessibleName: a11y.controls.magnetFieldSpinnerStringProperty,
        accessibleHelpText: a11y.controls.magnetFieldSpinnerHelpStringProperty,
        arrowsPosition: "leftRight",
        numberDisplayOptions: {
          align: "center",
          textOptions: {
            font: new PhetFont(13),
            fill: SternGerlachColors.controlSurfaceTextColorProperty,
          },
          backgroundFill: SternGerlachColors.controlSurfaceColorProperty,
          backgroundStroke: SternGerlachColors.panelBorderColorProperty,
          xMargin: 4,
          yMargin: 2,
        },
        arrowButtonOptions: {
          ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
          baseColor: SternGerlachColors.controlSurfaceColorProperty,
          arrowFill: SternGerlachColors.controlSurfaceTextColorProperty,
        },
      },
    );

    const fieldControl = new VBox({
      spacing: 2,
      children: [
        new Text(controls.fieldStrengthStringProperty, {
          font: new PhetFont(11),
          fill: SternGerlachColors.controlSurfaceTextColorProperty,
        }),
        fieldSpinner,
      ],
    });
    fieldControl.centerX = 0;
    fieldControl.top = halfHeight + 6;
    this.addChild(fieldControl);

    const typeListener = (type: AnalyzerType) => {
      label.string = magnetLabelMarkup(type);
      label.centerX = 0;
      label.centerY = -halfHeight * 0.35;
    };
    magnet.typeProperty.link(typeListener);

    this.disposeMagnetNode = () => {
      magnet.typeProperty.unlink(typeListener);
      fieldSpinner.dispose();
    };
  }

  public override dispose(): void {
    this.disposeMagnetNode();
    super.dispose();
  }
}
