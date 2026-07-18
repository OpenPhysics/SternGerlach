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
import type { TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import SternGerlachColors from "../SternGerlachColors.js";
import { SternGerlachModel } from "./model/SternGerlachModel.js";
import { SternGerlachKeyboardHelpContent } from "./view/SternGerlachKeyboardHelpContent.js";
import { SternGerlachScreenView } from "./view/SternGerlachScreenView.js";

type SelfOptions = {
  /** Whether Spin 1 is offered as a system (from Preferences → Simulation). */
  spinOneEnabledProperty: TReadOnlyProperty<boolean>;
};

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SternGerlachScreenOptions = ScreenOptions & SelfOptions & { tandem: Tandem };

export class SternGerlachScreen extends Screen<SternGerlachModel, SternGerlachScreenView> {
  public constructor(providedOptions: SternGerlachScreenOptions) {
    // Consume SelfOptions here so only ScreenOptions reach the parent Screen.
    const { spinOneEnabledProperty, ...screenOptions } = providedOptions;
    super(
      // Model factory — called once when the screen is first shown
      () => new SternGerlachModel(undefined, { spinOneEnabledProperty }),
      // View factory — receives the model instance
      (model) =>
        new SternGerlachScreenView(model, {
          tandem: providedOptions.tandem.createTandem("view"),
        }),
      optionize<ScreenOptions & { tandem: Tandem }, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: SternGerlachColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new SternGerlachKeyboardHelpContent(),
        },
        screenOptions,
      ),
    );
  }
}
