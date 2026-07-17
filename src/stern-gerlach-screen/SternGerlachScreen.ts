/**
 * SternGerlachScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * For multi-screen simulations, duplicate this file (e.g. IntroScreen.ts,
 * LabScreen.ts) and add each screen to the screens array in src/main.ts.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import SternGerlachColors from "../SternGerlachColors.js";
import { SternGerlachModel } from "./model/SternGerlachModel.js";
import { SternGerlachKeyboardHelpContent } from "./view/SternGerlachKeyboardHelpContent.js";
import { SternGerlachScreenView } from "./view/SternGerlachScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SternGerlachScreenOptions = ScreenOptions & { tandem: Tandem };

export class SternGerlachScreen extends Screen<SternGerlachModel, SternGerlachScreenView> {
  public constructor(options: SternGerlachScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new SternGerlachModel(),
      // View factory — receives the model instance
      (model) =>
        new SternGerlachScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<SternGerlachScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: SternGerlachColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new SternGerlachKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
