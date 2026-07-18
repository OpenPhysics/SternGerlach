/**
 * SternGerlachPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in sternGerlachQueryParameters.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import SternGerlachNamespace from "../SternGerlachNamespace.js";
import sternGerlachQueryParameters from "./sternGerlachQueryParameters.js";

export class SternGerlachPreferencesModel {
  /** Whether Spin 1 is offered next to spin-½; initial value from the `spinOne` query parameter. */
  public readonly spinOneEnabledProperty: BooleanProperty;

  /** Whether the SU(3) system is offered; initial value from the `su3` query parameter. */
  public readonly su3EnabledProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.spinOneEnabledProperty = new BooleanProperty(
      sternGerlachQueryParameters.spinOne,
      tandem ? { tandem: tandem.createTandem("spinOneEnabledProperty") } : undefined,
    );
    this.su3EnabledProperty = new BooleanProperty(
      sternGerlachQueryParameters.su3,
      tandem ? { tandem: tandem.createTandem("su3EnabledProperty") } : undefined,
    );
  }

  public reset(): void {
    this.spinOneEnabledProperty.reset();
    this.su3EnabledProperty.reset();
  }
}

SternGerlachNamespace.register("SternGerlachPreferencesModel", SternGerlachPreferencesModel);
