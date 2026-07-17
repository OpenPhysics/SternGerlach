/**
 * UserStateDialog.ts
 *
 * A modal dialog for entering the user-defined initial state: a basis chooser
 * (Z / X / Y) and, per state component, real- and imaginary-part spinners. The
 * third component's row is shown only for 3-state systems (spin-1, SU(3)); the
 * basis chooser is hidden for SU(3), which takes the amplitudes directly (Java
 * getDataFromUser parity). The model normalizes and rotates the entry into the
 * Z basis when a particle is fired.
 */

import {
  DerivedProperty,
  type NumberProperty,
  PatternStringProperty,
  Property,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { GridBox, type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, NumberSpinner } from "scenerystack/sun";
import { AnalyzerType } from "../../../common/quantum/AnalyzerType.js";
import { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../../../common/SimButtonOptions.js";
import { SimDialog } from "../../../common/SimDialog.js";
import { StringManager } from "../../../i18n/StringManager.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import type { UserStateModel } from "../../model/UserStateModel.js";

/** Amplitude spinners span [−1, 1]; the state is renormalized anyway. */
const AMPLITUDE_RANGE = new Range(-1, 1);
const AMPLITUDE_DELTA = 0.1;

function amplitudeSpinner(property: NumberProperty, accessibleName: TReadOnlyProperty<string>): NumberSpinner {
  return new NumberSpinner(property, new Property(AMPLITUDE_RANGE), {
    accessibleName,
    deltaValue: AMPLITUDE_DELTA,
    arrowsPosition: "leftRight",
    numberDisplayOptions: {
      decimalPlaces: 2,
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
  });
}

export class UserStateDialog extends SimDialog {
  public constructor(userState: UserStateModel, systemProperty: TReadOnlyProperty<SpinSystem>) {
    const strings = StringManager.getInstance();
    const dialogs = strings.getDialogs();
    const a11y = strings.getA11yStrings();

    const labelFont = new PhetFont(14);
    const labelFill = SternGerlachColors.textColorProperty;

    const basisGroup = new AquaRadioButtonGroup(
      userState.basisProperty,
      [AnalyzerType.Z, AnalyzerType.X, AnalyzerType.Y].map((type) => ({
        value: type,
        createNode: () => new Text(type.code, { font: labelFont, fill: labelFill }),
      })),
      {
        orientation: "horizontal",
        spacing: 14,
        radioButtonOptions: { radius: 7 },
        accessibleName: a11y.controls.userStateBasisRadioGroupStringProperty,
        // SU(3) takes amplitudes directly, so no basis rotation is offered.
        visibleProperty: new DerivedProperty([systemProperty], (system) => system !== SpinSystem.SU3),
      },
    );

    const grid = new GridBox({ xSpacing: 8, ySpacing: 6 });
    grid.addChild(
      new Text(dialogs.realStringProperty, { font: labelFont, fill: labelFill, layoutOptions: { column: 1, row: 0 } }),
    );
    grid.addChild(
      new Text(dialogs.imaginaryStringProperty, {
        font: labelFont,
        fill: labelFill,
        layoutOptions: { column: 2, row: 0 },
      }),
    );

    for (let index = 0; index < 3; index++) {
      const rowNode = new Text(`ψ${["₀", "₁", "₂"][index]}`, {
        font: labelFont,
        fill: labelFill,
        layoutOptions: { column: 0, row: index + 1 },
      });
      const reAccessible = new PatternStringProperty(a11y.controls.userStateRealPatternStringProperty, { index });
      const imAccessible = new PatternStringProperty(a11y.controls.userStateImagPatternStringProperty, { index });
      const reSpinner = amplitudeSpinner(userState.re[index] as NumberProperty, reAccessible);
      const imSpinner = amplitudeSpinner(userState.im[index] as NumberProperty, imAccessible);
      reSpinner.layoutOptions = { column: 1, row: index + 1 };
      imSpinner.layoutOptions = { column: 2, row: index + 1 };

      // The third component exists only for 3-state systems.
      if (index === 2) {
        const visible = new DerivedProperty([systemProperty], (system) => system.stateCount === 3);
        for (const node of [rowNode, reSpinner, imSpinner] as Node[]) {
          node.setVisibleProperty(visible);
        }
      }

      grid.addChild(rowNode);
      grid.addChild(reSpinner);
      grid.addChild(imSpinner);
    }

    const content = new VBox({ spacing: 16, align: "left", children: [basisGroup, grid] });

    super(content, {
      title: new Text(dialogs.userStateTitleStringProperty, {
        font: new PhetFont({ size: 20, weight: "bold" }),
        fill: SternGerlachColors.textColorProperty,
      }),
    });
  }
}
