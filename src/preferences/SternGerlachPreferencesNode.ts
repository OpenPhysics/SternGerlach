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

/** Preferences dialog content sits on light chrome regardless of color profile. */
const PREFERENCES_TEXT_FILL = SternGerlachColors.preferencesTextColorProperty;
const PREFERENCES_CONTROL_BACKGROUND = SternGerlachColors.preferencesControlBackgroundColorProperty;

export class SternGerlachPreferencesNode extends VBox {
  public constructor(preferencesModel: SternGerlachPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: PREFERENCES_TEXT_FILL,
    });

    const spinOneCheckbox = new Checkbox(
      preferencesModel.spinOneEnabledProperty,
      new Text(prefStrings.spinOneEnableStringProperty, {
        font: new PhetFont(14),
        fill: PREFERENCES_TEXT_FILL,
      }),
      {
        checkboxColor: PREFERENCES_TEXT_FILL,
        checkboxColorBackground: PREFERENCES_CONTROL_BACKGROUND,
        spacing: 8,
        ...(tandem && { tandem: tandem.createTandem("spinOneCheckbox") }),
      },
    );

    const spinOneDescription = new Text(prefStrings.spinOneEnableDescriptionStringProperty, {
      font: new PhetFont(12),
      fill: PREFERENCES_TEXT_FILL,
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
