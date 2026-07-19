/**
 * ParticleSource.ts
 *
 * The atom gun. Fires one particle at a time (SINGLE mode) or a steady beam
 * (CONTINUOUS mode, rate set by emissionRateProperty). Exactly one source
 * exists per experiment and it cannot be deleted.
 *
 * Emission is driven by SternGerlachModel.fireSingleParticle() (SINGLE) and
 * ParticleSystem.step() (CONTINUOUS) — this device only holds mode/rate state.
 */

import { EnumerationProperty, NumberProperty } from "scenerystack/axon";
import { Range, Vector2 } from "scenerystack/dot";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import { CONTINUOUS_RATE_RANGE, SOURCE_HALF_HEIGHT, SOURCE_HALF_WIDTH } from "../../../SternGerlachConstants.js";
import { ExperimentDevice } from "./ExperimentDevice.js";

export class SourceMode extends EnumerationValue {
  /** One particle per press of the fire button. */
  public static readonly SINGLE = new SourceMode();

  /** A continuous beam at emissionRateProperty particles per second. */
  public static readonly CONTINUOUS = new SourceMode();

  public static readonly enumeration = new Enumeration(SourceMode);
}

export class ParticleSource extends ExperimentDevice {
  /** SINGLE (fire button) or CONTINUOUS (beam). */
  public readonly sourceModeProperty: EnumerationProperty<SourceMode>;

  /** Beam intensity in particles per second, used in CONTINUOUS mode ("None" … "Lots"). */
  public readonly emissionRateProperty: NumberProperty;

  public constructor(position: Vector2) {
    super("source", position, false);
    this.sourceModeProperty = new EnumerationProperty(SourceMode.SINGLE);
    this.emissionRateProperty = new NumberProperty(CONTINUOUS_RATE_RANGE.defaultValue, {
      range: new Range(CONTINUOUS_RATE_RANGE.min, CONTINUOUS_RATE_RANGE.max),
    });
  }

  public override get halfWidth(): number {
    return SOURCE_HALF_WIDTH;
  }

  public override get halfHeight(): number {
    return SOURCE_HALF_HEIGHT;
  }

  /** The source emits particles; nothing flows into it. */
  public override get hasInput(): boolean {
    return false;
  }

  public override outputCount(_system: SpinSystem): number {
    return 1;
  }

  public override getOutputPortOffset(_outputIndex: number, _system: SpinSystem): Vector2 {
    return new Vector2(this.halfWidth, 0);
  }

  /** Restores mode and rate to their defaults. */
  public reset(): void {
    this.sourceModeProperty.reset();
    this.emissionRateProperty.reset();
  }
}
