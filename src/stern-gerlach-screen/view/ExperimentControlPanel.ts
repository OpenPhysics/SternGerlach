/**
 * ExperimentControlPanel.ts
 *
 * The right-hand control panel: the preset-experiment combo box, the
 * expected-value toggle, the analytic Do-N batch buttons, and Reset Counts.
 * Additional controls (watch, system, initial state) join in later milestones.
 */

import { PatternStringProperty } from "scenerystack/axon";
import type { Node } from "scenerystack/scenery";
import { HBox, HSeparator, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox, ComboBox, RectangularPushButton } from "scenerystack/sun";
import { SpinSystem } from "../../common/quantum/SpinSystem.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
  SIM_COMBO_BOX_OPTIONS,
} from "../../common/SimButtonOptions.js";
import { SimPanel } from "../../common/SimPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import { ExperimentDefinition } from "../model/ExperimentDefinition.js";
import type { SternGerlachModel } from "../model/SternGerlachModel.js";
import { AnglesDialog } from "./dialogs/AnglesDialog.js";

/** The batch sizes offered by the Do-N buttons (Spins.doAction). */
const DO_N_SIZES = [10, 100, 1000] as const;

export class ExperimentControlPanel extends SimPanel {
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

    const systems = strings.getSystems();
    const systemRadioGroup = new AquaRadioButtonGroup(
      model.systemProperty,
      [
        {
          value: SpinSystem.SPIN_HALF,
          createNode: () =>
            new Text(systems.spinHalfStringProperty, {
              font: new PhetFont(14),
              fill: SternGerlachColors.textColorProperty,
            }),
        },
        {
          value: SpinSystem.SPIN_ONE,
          createNode: () =>
            new Text(systems.spinOneStringProperty, {
              font: new PhetFont(14),
              fill: SternGerlachColors.textColorProperty,
            }),
        },
        {
          value: SpinSystem.SU3,
          createNode: () =>
            new Text(systems.su3StringProperty, { font: new PhetFont(14), fill: SternGerlachColors.textColorProperty }),
          // SU(3) is only offered when enabled in Preferences → Simulation.
          options: { visibleProperty: model.su3EnabledProperty },
        },
      ],
      {
        orientation: "horizontal",
        spacing: 12,
        radioButtonOptions: { radius: 7 },
        accessibleName: a11y.controls.systemRadioGroupStringProperty,
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

    const anglesDialog = new AnglesDialog(model.thetaProperty, model.phiProperty);
    const anglesButton = new RectangularPushButton({
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      baseColor: SternGerlachColors.controlSurfaceColorProperty,
      content: new Text(controls.anglesStringProperty, { font: new PhetFont(13), fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => anglesDialog.show(),
      accessibleName: a11y.controls.anglesButtonStringProperty,
    });

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
          systemRadioGroup,
          new HSeparator(),
          watchCheckbox,
          expectedValuesCheckbox,
          anglesButton,
          new HSeparator(),
          doNRow,
          resetCountsButton,
        ],
        align: "left",
        spacing: 10,
      }),
      { minWidth: 210 },
    );
  }
}
