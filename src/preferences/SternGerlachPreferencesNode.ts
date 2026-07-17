/**
 * SternGerlachPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to SternGerlachPreferencesModel Properties (whose initial values come from
 * sternGerlachQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import SternGerlachColors from "../SternGerlachColors.js";
import SternGerlachNamespace from "../SternGerlachNamespace.js";
import type { SternGerlachPreferencesModel } from "./SternGerlachPreferencesModel.js";

export class SternGerlachPreferencesNode extends VBox {
  public constructor(preferencesModel: SternGerlachPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: SternGerlachColors.textColorProperty,
    });

    const exampleToggleCheckbox = new Checkbox(
      preferencesModel.exampleToggleProperty,
      new Text(prefStrings.exampleToggleStringProperty, {
        font: new PhetFont(14),
        fill: SternGerlachColors.textColorProperty,
      }),
      {
        checkboxColor: SternGerlachColors.textColorProperty,
        checkboxColorBackground: SternGerlachColors.panelBackgroundColorProperty,
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("exampleToggleCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: 12,
      children: [header, exampleToggleCheckbox],
    });
  }
}

SternGerlachNamespace.register("SternGerlachPreferencesNode", SternGerlachPreferencesNode);
