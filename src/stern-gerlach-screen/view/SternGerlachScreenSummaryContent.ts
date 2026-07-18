/**
 * SternGerlachScreenSummaryContent.ts
 *
 * The accessible screen summary read by screen readers (SceneryStack's
 * Interactive Description). `currentDetailsContent` is a live DerivedProperty
 * over experiment, system, initial state, detection count, watch, dead-end
 * probability, and builder mode so screen-reader users can re-read the
 * simulation's current state.
 */

import { DerivedProperty, DynamicProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { SpinSystem } from "../../common/quantum/SpinSystem.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ExperimentDefinition } from "../model/ExperimentDefinition.js";
import { InitialStateSetting } from "../model/InitialStateSetting.js";
import type { SternGerlachModel } from "../model/SternGerlachModel.js";

export class SternGerlachScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: SternGerlachModel) {
    const strings = StringManager.getInstance();
    const a11y = strings.getA11yStrings();
    const controls = strings.getControls();
    const systems = strings.getSystems();

    // DynamicProperty tracks both the selected experiment AND the live locale.
    const experimentName = new DynamicProperty<string, string, ExperimentDefinition>(model.experimentProperty, {
      derive: (experiment) => strings.getExperimentNameProperty(experiment.nameKey),
    });

    const systemName = new DerivedProperty(
      [model.systemProperty, systems.spinHalfStringProperty, systems.spinOneStringProperty],
      (system) =>
        system === SpinSystem.SPIN_ONE ? systems.spinOneStringProperty.value : systems.spinHalfStringProperty.value,
    );

    const unknownNumber = new DerivedProperty([model.initialStateProperty], (setting) =>
      setting.unknownIndex !== null ? setting.unknownIndex + 1 : 1,
    );
    const unknownLabel = new PatternStringProperty(controls.unknownPatternStringProperty, {
      number: unknownNumber,
    });

    const initialStateName = new DerivedProperty(
      [
        model.initialStateProperty,
        unknownLabel,
        controls.plusZStringProperty,
        controls.minusZStringProperty,
        controls.plusXStringProperty,
        controls.minusXStringProperty,
        controls.randomStringProperty,
        controls.userStateStringProperty,
      ],
      (setting, unknown, plusZ, minusZ, plusX, minusX, random, user) => {
        if (setting === InitialStateSetting.PLUS_Z) {
          return plusZ;
        }
        if (setting === InitialStateSetting.MINUS_Z) {
          return minusZ;
        }
        if (setting === InitialStateSetting.PLUS_X) {
          return plusX;
        }
        if (setting === InitialStateSetting.MINUS_X) {
          return minusX;
        }
        if (setting.unknownIndex !== null) {
          return unknown;
        }
        if (setting.isUser) {
          return user;
        }
        return random;
      },
    );

    const watchStatus = new DerivedProperty(
      [model.watchProperty, a11y.watchOnStringProperty, a11y.watchOffStringProperty],
      (watch, on, off) => (watch ? on : off),
    );

    const deadEndPercent = new DerivedProperty([model.deadEndProbabilityProperty], (p) => Math.round(100 * p));

    const currentDetailsBase = new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
      experiment: experimentName,
      system: systemName,
      initialState: initialStateName,
      total: model.totalDetectedProperty,
      watchStatus,
      deadEnd: deadEndPercent,
    });

    const currentDetailsContent = new DerivedProperty(
      [currentDetailsBase, model.isCustomProperty, a11y.currentDetailsBuilderSuffixStringProperty],
      (base, isCustom, suffix) => (isCustom ? `${base}${suffix}` : base),
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
