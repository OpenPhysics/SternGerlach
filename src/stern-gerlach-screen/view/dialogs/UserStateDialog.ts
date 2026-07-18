/**
 * UserStateDialog.ts
 *
 * Modal for preparing a custom initial state. Walks the user through:
 *   1. choosing the basis the amplitudes are typed in (Z / X / Y),
 *   2. entering real and imaginary parts for each basis ket,
 *   3. previewing the normalized result in the Z basis the analyzers use.
 *
 * The third component row is shown only for 3-state (spin-1) systems.
 */

import {
  DerivedProperty,
  type NumberProperty,
  PatternStringProperty,
  Property,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { GridBox, HSeparator, type Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, NumberSpinner } from "scenerystack/sun";
import { AnalyzerType } from "../../../common/quantum/AnalyzerType.js";
import type { OperatorTable } from "../../../common/quantum/OperatorTable.js";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import {
  amplitudeBasisLabels,
  basisLabels,
  computationalProbabilities,
  ketMarkup,
} from "../../../common/quantum/StateDisplay.js";
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
        font: new PhetFont(14),
        fill: SternGerlachColors.controlSurfaceTextColorProperty,
      },
      backgroundFill: SternGerlachColors.controlSurfaceColorProperty,
      backgroundStroke: SternGerlachColors.panelBorderColorProperty,
      xMargin: 6,
      yMargin: 3,
    },
    arrowButtonOptions: {
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      baseColor: SternGerlachColors.controlSurfaceColorProperty,
      arrowFill: SternGerlachColors.controlSurfaceTextColorProperty,
    },
  });
}

export class UserStateDialog extends SimDialog {
  public constructor(
    userState: UserStateModel,
    systemProperty: TReadOnlyProperty<SpinSystem>,
    operatorTable: OperatorTable,
  ) {
    const strings = StringManager.getInstance();
    const dialogs = strings.getDialogs();
    const stateStrings = strings.getStatePreparation();
    const a11y = strings.getA11yStrings();

    const labelFont = new PhetFont(14);
    const boldFont = new PhetFont({ size: 14, weight: "bold" });
    const labelFill = SternGerlachColors.textColorProperty;
    const mutedFill = SternGerlachColors.accentColorProperty;

    const intro = new RichText(dialogs.userStateIntroStringProperty, {
      font: new PhetFont(13),
      fill: labelFill,
      lineWrap: 420,
      leading: 3,
    });

    const basisLabel = new Text(dialogs.userStateBasisPromptStringProperty, {
      font: boldFont,
      fill: labelFill,
      maxWidth: 420,
    });

    const basisGroup = new AquaRadioButtonGroup(
      userState.basisProperty,
      [
        { type: AnalyzerType.Z, label: dialogs.basisZStringProperty },
        { type: AnalyzerType.X, label: dialogs.basisXStringProperty },
        { type: AnalyzerType.Y, label: dialogs.basisYStringProperty },
      ].map(({ type, label }) => ({
        value: type,
        createNode: () => new Text(label, { font: labelFont, fill: labelFill, maxWidth: 140 }),
      })),
      {
        orientation: "horizontal",
        spacing: 16,
        radioButtonOptions: { radius: 8 },
        accessibleName: a11y.controls.userStateBasisRadioGroupStringProperty,
      },
    );

    const ketLabels: Text[] = [];
    const grid = new GridBox({ xSpacing: 14, ySpacing: 10 });
    grid.addChild(
      new Text(dialogs.realStringProperty, { font: boldFont, fill: labelFill, layoutOptions: { column: 1, row: 0 } }),
    );
    grid.addChild(
      new Text(dialogs.imaginaryStringProperty, {
        font: boldFont,
        fill: labelFill,
        layoutOptions: { column: 2, row: 0 },
      }),
    );

    for (let index = 0; index < 3; index++) {
      const ketLabel = new Text(`|ψ${index}⟩`, {
        font: new PhetFont({ size: 16, weight: "bold" }),
        fill: mutedFill,
        layoutOptions: { column: 0, row: index + 1 },
      });
      ketLabels.push(ketLabel);

      const reAccessible = new PatternStringProperty(a11y.controls.userStateRealPatternStringProperty, {
        index: index + 1,
      });
      const imAccessible = new PatternStringProperty(a11y.controls.userStateImagPatternStringProperty, {
        index: index + 1,
      });
      const reSpinner = amplitudeSpinner(userState.re[index] as NumberProperty, reAccessible);
      const imSpinner = amplitudeSpinner(userState.im[index] as NumberProperty, imAccessible);
      reSpinner.layoutOptions = { column: 1, row: index + 1 };
      imSpinner.layoutOptions = { column: 2, row: index + 1 };

      if (index === 2) {
        const visible = new DerivedProperty([systemProperty], (system) => system.stateCount === 3);
        for (const node of [ketLabel, reSpinner, imSpinner] as Node[]) {
          node.setVisibleProperty(visible);
        }
      }

      grid.addChild(ketLabel);
      grid.addChild(reSpinner);
      grid.addChild(imSpinner);
    }

    const refreshKetLabels = () => {
      const system = systemProperty.value;
      const labels = amplitudeBasisLabels(system, userState.basisProperty.value.code);
      for (let i = 0; i < ketLabels.length; i++) {
        const label = labels[i];
        const node = ketLabels[i];
        if (label !== undefined && node) {
          node.string = `|${label}⟩`;
        }
      }
    };
    userState.basisProperty.link(refreshKetLabels);
    systemProperty.link(refreshKetLabels);

    const previewHeading = new Text(dialogs.userStatePreviewHeadingStringProperty, {
      font: boldFont,
      fill: labelFill,
      maxWidth: 420,
    });

    const previewKet = new RichText("|ψ⟩ = |+z⟩", {
      font: new PhetFont(15),
      fill: mutedFill,
      align: "left",
      lineWrap: 420,
      leading: 4,
    });

    const previewProbs = new Text("", {
      font: new PhetFont(13),
      fill: labelFill,
      maxWidth: 420,
    });

    const updatePreview = () => {
      const system = systemProperty.value;
      const state = userState.toZBasisVector(operatorTable, system);
      previewKet.string = ketMarkup(state, system);
      const probs = computationalProbabilities(state, system.stateCount);
      const labels = basisLabels(system);
      previewProbs.string = probs
        .map((p, i) =>
          stateStrings.probabilityPatternStringProperty.value
            .replace("{{label}}", labels[i] as string)
            .replace("{{percent}}", (100 * p).toFixed(0)),
        )
        .join("      ");
    };

    userState.basisProperty.link(updatePreview);
    systemProperty.link(updatePreview);
    for (const property of userState.properties) {
      property.link(updatePreview);
    }
    stateStrings.probabilityPatternStringProperty.link(updatePreview);

    const content = new VBox({
      spacing: 14,
      align: "left",
      children: [
        intro,
        new VBox({ spacing: 8, align: "left", children: [basisLabel, basisGroup] }),
        new HSeparator(),
        grid,
        new HSeparator(),
        new VBox({ spacing: 6, align: "left", children: [previewHeading, previewKet, previewProbs] }),
      ],
    });

    super(content, {
      title: new Text(dialogs.userStateTitleStringProperty, {
        font: new PhetFont({ size: 20, weight: "bold" }),
        fill: SternGerlachColors.textColorProperty,
      }),
    });
  }
}
