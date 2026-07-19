/**
 * StatePreparationAreaNode.ts
 *
 * Initial-state panel near the particle source: a chooser for named eigenstates
 * (+Z/−Z/+X/−X), mystery Unknowns, User State, and Random, plus a Bloch / ket /
 * probability readout of the prepared state. Mystery and Random preparations
 * show an explanatory label instead of a vector.
 */

import { DerivedProperty, PatternStringProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { ComboBox, RectangularPushButton } from "scenerystack/sun";
import { SpinSystem } from "../../common/quantum/SpinSystem.js";
import {
  type BlochVector,
  basisLabels,
  blochVectorFromSpinHalf,
  computationalProbabilities,
  ketMarkup,
} from "../../common/quantum/StateDisplay.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
  SIM_COMBO_BOX_OPTIONS,
} from "../../common/SternGerlachButtonOptions.js";
import { SternGerlachPanel } from "../../common/SternGerlachPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import { InitialStateSetting } from "../model/InitialStateSetting.js";
import type { SternGerlachModel } from "../model/SternGerlachModel.js";
import { UserStateDialog } from "./dialogs/UserStateDialog.js";
import { BlochSphereNode } from "./nodes/BlochSphereNode.js";

/** Combo order: named eigenstates first (default +Z), then mystery / user / random. */
const INITIAL_STATE_CHOICES = [
  InitialStateSetting.PLUS_Z,
  InitialStateSetting.MINUS_Z,
  InitialStateSetting.PLUS_X,
  InitialStateSetting.MINUS_X,
  InitialStateSetting.UNKNOWN_1,
  InitialStateSetting.UNKNOWN_2,
  InitialStateSetting.UNKNOWN_3,
  InitialStateSetting.UNKNOWN_4,
  InitialStateSetting.USER,
  InitialStateSetting.RANDOM,
] as const;

export class StatePreparationAreaNode extends SternGerlachPanel {
  /**
   * @param model - the simulation model
   * @param listParent - node the combo box drops its list into (topmost in the screen view)
   */
  public constructor(model: SternGerlachModel, listParent: Node) {
    const strings = StringManager.getInstance();
    const controls = strings.getControls();
    const stateStrings = strings.getStatePreparation();
    const a11y = strings.getA11yStrings();

    const title = new Text(controls.initialStateStringProperty, {
      font: new PhetFont({ size: 14, weight: "bold" }),
      fill: SternGerlachColors.textColorProperty,
    });

    const initialStateComboBox = new ComboBox(
      model.initialStateProperty,
      INITIAL_STATE_CHOICES.map((choice) => {
        const labelProperty = labelForChoice(choice, controls);
        return {
          value: choice,
          createNode: () =>
            new Text(labelProperty, { font: new PhetFont(14), fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 160 }),
          accessibleName: labelProperty,
        };
      }),
      listParent,
      {
        ...SIM_COMBO_BOX_OPTIONS,
        xMargin: 10,
        yMargin: 7,
        accessibleName: a11y.controls.initialStateComboBoxStringProperty,
      },
    );

    const userStateDialog = new UserStateDialog(model.userStateModel, model.systemProperty, model.operatorTable);
    const editUserStateButton = new RectangularPushButton({
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      baseColor: SternGerlachColors.controlSurfaceColorProperty,
      content: new Text(controls.editAmplitudesStringProperty, {
        font: new PhetFont(13),
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: 180,
      }),
      listener: () => userStateDialog.show(),
      accessibleName: a11y.controls.editUserStateButtonStringProperty,
      visibleProperty: new DerivedProperty([model.initialStateProperty], (setting) => setting.isUser),
    });

    const blochProperty = new Property<BlochVector | null>(null);
    const blochSphere = new BlochSphereNode(blochProperty);
    const blochWrapper = new Node({ children: [blochSphere] });

    const ketText = new RichText("", {
      font: new PhetFont({ size: 15, weight: "bold" }),
      fill: SternGerlachColors.accentColorProperty,
      align: "left",
      lineWrap: 220,
      leading: 5,
    });

    const probabilityText = new Text("", {
      font: new PhetFont(13),
      fill: SternGerlachColors.textColorProperty,
      maxWidth: 220,
    });

    const statusText = new Text("", {
      font: new PhetFont(12),
      fill: SternGerlachColors.textColorProperty,
      maxWidth: 220,
    });

    const update = () => {
      const system = model.systemProperty.value;
      const setting = model.initialStateProperty.value;
      const state = model.preparedStateForDisplay();
      blochWrapper.visible = system === SpinSystem.SPIN_HALF && state !== null;

      if (setting.unknownIndex !== null) {
        blochProperty.value = null;
        ketText.string = "";
        probabilityText.string = "";
        statusText.string = stateStrings.unknownHiddenStringProperty.value;
        return;
      }
      if (state) {
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
        initialStateComboBox,
        editUserStateButton,
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

    super(content, { minWidth: 240 });
    this.tagName = "section";
    this.accessibleName = a11y.controls.statePreparationRegionStringProperty;
  }
}

function labelForChoice(
  choice: InitialStateSetting,
  controls: ReturnType<StringManager["getControls"]>,
): TReadOnlyProperty<string> {
  if (choice === InitialStateSetting.PLUS_Z) {
    return controls.plusZStringProperty;
  }
  if (choice === InitialStateSetting.MINUS_Z) {
    return controls.minusZStringProperty;
  }
  if (choice === InitialStateSetting.PLUS_X) {
    return controls.plusXStringProperty;
  }
  if (choice === InitialStateSetting.MINUS_X) {
    return controls.minusXStringProperty;
  }
  if (choice.unknownIndex !== null) {
    return new PatternStringProperty(controls.unknownPatternStringProperty, { number: choice.unknownIndex + 1 });
  }
  if (choice.isUser) {
    return controls.userStateStringProperty;
  }
  return controls.randomStringProperty;
}

function formatProbabilities(
  probs: number[],
  system: SpinSystem,
  stateStrings: ReturnType<StringManager["getStatePreparation"]>,
): string {
  const labels = basisLabels(system);
  return probs
    .map((p, i) =>
      StringUtils.fillIn(stateStrings.probabilityPatternStringProperty, {
        label: labels[i] as string,
        percent: toFixed(100 * p, 0),
      }),
    )
    .join("      ");
}
