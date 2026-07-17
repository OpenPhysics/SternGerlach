/**
 * ExperimentControlPanel.ts
 *
 * The right-hand control panel: the preset-experiment combo box (more
 * controls — watch, expected values, Do-N — join in later milestones).
 */

import type { Property } from "scenerystack/axon";
import type { Node } from "scenerystack/scenery";
import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { ComboBox } from "scenerystack/sun";
import { LIGHT_SURFACE_TEXT_FILL, SIM_COMBO_BOX_OPTIONS } from "../../common/SimButtonOptions.js";
import { SimPanel } from "../../common/SimPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import { ExperimentDefinition } from "../model/ExperimentDefinition.js";

export class ExperimentControlPanel extends SimPanel {
  /**
   * @param experimentProperty - the model's selected preset
   * @param listParent - node the combo box drops its list into (topmost in the screen view)
   */
  public constructor(experimentProperty: Property<ExperimentDefinition>, listParent: Node) {
    const strings = StringManager.getInstance();
    const controls = strings.getControls();
    const a11y = strings.getA11yStrings();

    const title = new Text(controls.experimentStringProperty, {
      font: new PhetFont({ size: 16, weight: "bold" }),
      fill: SternGerlachColors.textColorProperty,
    });

    const comboBox = new ComboBox(
      experimentProperty,
      ExperimentDefinition.PRESETS.map((preset) => ({
        value: preset,
        createNode: () =>
          new Text(strings.getExperimentNameProperty(preset.nameKey), {
            font: new PhetFont(14),
            fill: LIGHT_SURFACE_TEXT_FILL,
            maxWidth: 170,
          }),
        accessibleName: strings.getExperimentNameProperty(preset.nameKey),
      })),
      listParent,
      {
        ...SIM_COMBO_BOX_OPTIONS,
        xMargin: 10,
        yMargin: 7,
        accessibleName: a11y.controls.experimentComboBoxStringProperty,
      },
    );

    super(
      new VBox({
        children: [title, comboBox],
        align: "left",
        spacing: 8,
      }),
    );
  }
}
