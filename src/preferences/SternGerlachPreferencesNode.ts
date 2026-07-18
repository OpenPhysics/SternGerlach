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
import SternGerlachNamespace from "../SternGerlachNamespace.js";
import type { SternGerlachPreferencesModel } from "./SternGerlachPreferencesModel.js";

// Preferences are rendered on the framework's light dialog surface and deliberately
// do not follow the simulation's default/projector color profile.
const PREFERENCES_TEXT_COLOR = "#1a1a1a";
const PREFERENCES_CONTROL_BACKGROUND = "#ffffff";

export class SternGerlachPreferencesNode extends VBox {
  public constructor(preferencesModel: SternGerlachPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: PREFERENCES_TEXT_COLOR,
    });

    const spinOneCheckbox = new Checkbox(
      preferencesModel.spinOneEnabledProperty,
      new Text(prefStrings.spinOneEnableStringProperty, {
        font: new PhetFont(14),
        fill: PREFERENCES_TEXT_COLOR,
      }),
      {
        checkboxColor: PREFERENCES_TEXT_COLOR,
        checkboxColorBackground: PREFERENCES_CONTROL_BACKGROUND,
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("spinOneCheckbox") }),
      },
    );

    const spinOneDescription = new Text(prefStrings.spinOneEnableDescriptionStringProperty, {
      font: new PhetFont(12),
      fill: PREFERENCES_TEXT_COLOR,
      maxWidth: 400,
    });

    super({
      align: "left",
      spacing: 8,
      children: [header, spinOneCheckbox, spinOneDescription],
    });
  }
}

SternGerlachNamespace.register("SternGerlachPreferencesNode", SternGerlachPreferencesNode);
