/**
 * StatePreparationAreaNode.ts
 *
 * Compact prepared-state readout inspired by PhET Spin's preparation area:
 * Bloch sphere (spin-½), ket markup, and computational-basis probabilities.
 * Mystery / Random preparations show an explanatory label instead of a vector.
 */

import { Property } from "scenerystack/axon";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { SpinSystem } from "../../common/quantum/SpinSystem.js";
import {
  type BlochVector,
  blochVectorFromSpinHalf,
  computationalProbabilities,
  ketMarkup,
} from "../../common/quantum/StateDisplay.js";
import { SimPanel } from "../../common/SimPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import type { SternGerlachModel } from "../model/SternGerlachModel.js";
import { BlochSphereNode } from "./nodes/BlochSphereNode.js";

export class StatePreparationAreaNode extends SimPanel {
  public constructor(model: SternGerlachModel) {
    const strings = StringManager.getInstance();
    const stateStrings = strings.getStatePreparation();
    const a11y = strings.getA11yStrings();

    const title = new Text(stateStrings.titleStringProperty, {
      font: new PhetFont({ size: 14, weight: "bold" }),
      fill: SternGerlachColors.textColorProperty,
    });

    const blochProperty = new Property<BlochVector | null>(null);
    const blochSphere = new BlochSphereNode(blochProperty);
    const blochWrapper = new Node({ children: [blochSphere] });

    const ketText = new RichText("", {
      font: new PhetFont(13),
      fill: SternGerlachColors.textColorProperty,
      maxWidth: 200,
    });

    const probabilityText = new Text("", {
      font: new PhetFont(12),
      fill: SternGerlachColors.textColorProperty,
      maxWidth: 200,
    });

    const statusText = new Text("", {
      font: new PhetFont(12),
      fill: SternGerlachColors.textColorProperty,
      maxWidth: 200,
    });

    const update = () => {
      const system = model.systemProperty.value;
      const setting = model.initialStateProperty.value;
      const state = model.preparedStateForDisplay();
      blochWrapper.visible = system === SpinSystem.SPIN_HALF;

      if (setting.unknownIndex !== null) {
        blochProperty.value = null;
        ketText.string = "";
        probabilityText.string = "";
        statusText.string = stateStrings.unknownHiddenStringProperty.value;
        return;
      }
      if (setting.isUser && state) {
        blochProperty.value = system === SpinSystem.SPIN_HALF ? blochVectorFromSpinHalf(state) : null;
        ketText.string = ketMarkup(state, system);
        const probs = computationalProbabilities(state, system.stateCount);
        probabilityText.string = formatProbabilities(probs, system, stateStrings);
        statusText.string = "";
        return;
      }
      // Random mixture.
      blochProperty.value = null;
      ketText.string = "";
      const equal = 1 / system.stateCount;
      const probs = Array.from({ length: system.stateCount }, () => equal);
      probabilityText.string = formatProbabilities(probs, system, stateStrings);
      statusText.string = stateStrings.randomMixtureStringProperty.value;
    };

    model.initialStateProperty.link(update);
    model.systemProperty.link(update);
    model.userStateModel.basisProperty.link(update);
    for (const property of model.userStateModel.properties) {
      property.link(update);
    }
    stateStrings.unknownHiddenStringProperty.link(update);
    stateStrings.randomMixtureStringProperty.link(update);
    stateStrings.probabilityPatternStringProperty.link(update);

    const content = new VBox({
      align: "left",
      spacing: 8,
      children: [
        title,
        new HBox({
          spacing: 12,
          align: "top",
          children: [
            blochWrapper,
            new VBox({
              align: "left",
              spacing: 4,
              children: [statusText, ketText, probabilityText],
            }),
          ],
        }),
      ],
    });

    super(content, { minWidth: 280 });
    this.tagName = "section";
    this.accessibleName = a11y.controls.statePreparationRegionStringProperty;
  }
}

function formatProbabilities(
  probs: number[],
  system: SpinSystem,
  stateStrings: ReturnType<StringManager["getStatePreparation"]>,
): string {
  const labels = system.stateCount === 2 ? ["+", "−"] : ["+", "−", "0"];
  return probs
    .map((p, i) =>
      stateStrings.probabilityPatternStringProperty.value
        .replace("{{label}}", labels[i] as string)
        .replace("{{percent}}", (100 * p).toFixed(0)),
    )
    .join("   ");
}
