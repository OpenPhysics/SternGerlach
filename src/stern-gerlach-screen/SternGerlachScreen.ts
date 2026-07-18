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
import { optionize } from "scenerystack/phet-core";
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
  /** Whether SU(3) is offered as a system (from Preferences → Simulation). */
  su3EnabledProperty: TReadOnlyProperty<boolean>;
};

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SternGerlachScreenOptions = ScreenOptions & SelfOptions & { tandem: Tandem };

export class SternGerlachScreen extends Screen<SternGerlachModel, SternGerlachScreenView> {
  public constructor(options: SternGerlachScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () =>
        new SternGerlachModel(undefined, {
          spinOneEnabledProperty: options.spinOneEnabledProperty,
          su3EnabledProperty: options.su3EnabledProperty,
        }),
      // View factory — receives the model instance
      (model) =>
        new SternGerlachScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<SternGerlachScreenOptions, SelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: SternGerlachColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new SternGerlachKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
