/**
 * ExperimentControlPanel.ts
 *
 * The right-hand control panel: the preset-experiment combo box with apparatus
 * notation and guidance, the expected-value toggle, analytic Do-N batch buttons,
 * Reset Counts, plus watch and dead-end probability readouts. The quantum-system
 * chooser lives on the particle source (SourceNode) when Preferences enable
 * Spin 1. The initial-state chooser lives in StatePreparationAreaNode.
 */

import { DerivedProperty, DynamicProperty, PatternStringProperty } from "scenerystack/axon";
import type { Node } from "scenerystack/scenery";
import { HBox, HSeparator, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox, ComboBox, RectangularPushButton } from "scenerystack/sun";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
  SIM_COMBO_BOX_OPTIONS,
} from "../../common/SternGerlachButtonOptions.js";
import { SternGerlachPanel } from "../../common/SternGerlachPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import { ExperimentDefinition } from "../model/ExperimentDefinition.js";
import type { SternGerlachModel } from "../model/SternGerlachModel.js";

/** Guidance column width — long FR/ES strings wrap instead of shrinking. */
const GUIDANCE_LINE_WRAP = 190;

/** The batch sizes offered by the Do-N buttons (Spins.doAction). */
const DO_N_SIZES = [10, 100, 1000] as const;

export class ExperimentControlPanel extends SternGerlachPanel {
  /**
   * @param model - the simulation model
   * @param listParent - node the combo box drops its list into (topmost in the screen view)
   */
  public constructor(model: SternGerlachModel, listParent: Node) {
    const strings = StringManager.getInstance();
    const controls = strings.getControls();
    const a11y = strings.getA11yStrings();

    const title = new Text(controls.experimentStringProperty, {
      font: new PhetFont({ size: 16, weight: "bold" }),
      fill: SternGerlachColors.textColorProperty,
    });

    const comboBox = new ComboBox(
      model.experimentProperty,
      ExperimentDefinition.CHOICES.map((choice) => ({
        value: choice,
        createNode: () =>
          new Text(strings.getExperimentNameProperty(choice.nameKey), {
            font: new PhetFont(14),
            fill: LIGHT_SURFACE_TEXT_FILL,
            maxWidth: 170,
          }),
        accessibleName: strings.getExperimentNameProperty(choice.nameKey),
      })),
      listParent,
      {
        ...SIM_COMBO_BOX_OPTIONS,
        xMargin: 10,
        yMargin: 7,
        accessibleName: a11y.controls.experimentComboBoxStringProperty,
      },
    );

    // DynamicProperty tracks both the selected experiment AND the live locale.
    const notationProperty = new DynamicProperty<string, string, ExperimentDefinition>(model.experimentProperty, {
      derive: (experiment) => strings.getExperimentNotationProperty(experiment.notationKey),
    });
    const notationText = new Text(notationProperty, {
      font: new PhetFont({ size: 13, weight: "bold" }),
      fill: SternGerlachColors.accentColorProperty,
      maxWidth: 190,
    });

    const guidanceProperty = new DynamicProperty<string, string, ExperimentDefinition>(model.experimentProperty, {
      derive: (experiment) => strings.getExperimentGuidanceProperty(experiment.guidanceKey),
    });
    const guidanceLabel = new Text(controls.guidanceStringProperty, {
      font: new PhetFont({ size: 12, weight: "bold" }),
      fill: SternGerlachColors.textColorProperty,
    });
    const guidanceText = new RichText(guidanceProperty, {
      font: new PhetFont(11),
      fill: SternGerlachColors.textColorProperty,
      lineWrap: GUIDANCE_LINE_WRAP,
      leading: 3,
    });

    const deadEndPercent = new DerivedProperty([model.deadEndProbabilityProperty], (p) => Math.round(100 * p));
    const deadEndText = new Text(
      new PatternStringProperty(controls.deadEndPatternStringProperty, { percent: deadEndPercent }),
      {
        font: new PhetFont(11),
        fill: SternGerlachColors.textColorProperty,
        maxWidth: 190,
      },
    );

    const checkboxOptions = {
      checkboxColor: SternGerlachColors.textColorProperty,
      checkboxColorBackground: SternGerlachColors.panelBackgroundColorProperty,
      spacing: 8,
    };

    const watchCheckbox = new Checkbox(
      model.watchProperty,
      new Text(controls.watchStringProperty, {
        font: new PhetFont(14),
        fill: SternGerlachColors.textColorProperty,
        maxWidth: 180,
      }),
      { ...checkboxOptions, accessibleName: a11y.controls.watchCheckboxStringProperty },
    );

    const expectedValuesCheckbox = new Checkbox(
      model.expectedValuesVisibleProperty,
      new Text(controls.expectedValuesStringProperty, {
        font: new PhetFont(14),
        fill: SternGerlachColors.textColorProperty,
        maxWidth: 180,
      }),
      { ...checkboxOptions, accessibleName: a11y.controls.expectedValuesCheckboxStringProperty },
    );

    const doNButtons = DO_N_SIZES.map((count) => {
      const labelProperty = new PatternStringProperty(controls.doNPatternStringProperty, { count });
      const accessibleName = new PatternStringProperty(a11y.controls.doNButtonPatternStringProperty, { count });
      return new RectangularPushButton({
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        baseColor: SternGerlachColors.controlSurfaceColorProperty,
        content: new Text(labelProperty, { font: new PhetFont(13), fill: LIGHT_SURFACE_TEXT_FILL }),
        listener: () => model.doN(count),
        accessibleName,
      });
    });
    const doNRow = new HBox({ children: doNButtons, spacing: 6 });

    const resetCountsButton = new RectangularPushButton({
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      baseColor: SternGerlachColors.controlSurfaceColorProperty,
      content: new Text(controls.resetCountsStringProperty, { font: new PhetFont(13), fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => model.clearCounters(),
      accessibleName: a11y.controls.resetCountsButtonStringProperty,
    });

    super(
      new VBox({
        children: [
          title,
          comboBox,
          notationText,
          guidanceLabel,
          guidanceText,
          new HSeparator(),
          watchCheckbox,
          expectedValuesCheckbox,
          deadEndText,
          new HSeparator(),
          doNRow,
          resetCountsButton,
        ],
        align: "left",
        spacing: 8,
      }),
      { minWidth: 210 },
    );
  }
}
