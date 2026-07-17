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

    const su3Checkbox = new Checkbox(
      preferencesModel.su3EnabledProperty,
      new Text(prefStrings.su3EnableStringProperty, {
        font: new PhetFont(14),
        fill: SternGerlachColors.textColorProperty,
      }),
      {
        checkboxColor: SternGerlachColors.textColorProperty,
        checkboxColorBackground: SternGerlachColors.panelBackgroundColorProperty,
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("su3Checkbox") }),
      },
    );

    const su3Description = new Text(prefStrings.su3EnableDescriptionStringProperty, {
      font: new PhetFont(12),
      fill: SternGerlachColors.textColorProperty,
    });

    super({
      align: "left",
      spacing: 8,
      children: [header, su3Checkbox, su3Description],
    });
  }
}

SternGerlachNamespace.register("SternGerlachPreferencesNode", SternGerlachPreferencesNode);
