/**
 * SternGerlachPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in sternGerlachQueryParameters.
 *
 * Remove the example preference (and its query parameter / UI control) if the
 * sim has no sim-specific preferences.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import SternGerlachNamespace from "../SternGerlachNamespace.js";
import sternGerlachQueryParameters from "./sternGerlachQueryParameters.js";

export class SternGerlachPreferencesModel {
  /** Whether the SU(3) system is offered in the main UI; initial value from the `su3` query parameter. */
  public readonly su3EnabledProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.su3EnabledProperty = new BooleanProperty(
      sternGerlachQueryParameters.su3,
      tandem ? { tandem: tandem.createTandem("su3EnabledProperty") } : undefined,
    );
  }

  public reset(): void {
    this.su3EnabledProperty.reset();
  }
}

SternGerlachNamespace.register("SternGerlachPreferencesModel", SternGerlachPreferencesModel);
