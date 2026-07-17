/**
 * SternGerlachKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * Covers basic navigation, combo boxes and sliders, firing atoms, and builder-mode
 * drag / wire interactions.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TextKeyNode,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

function fireAtomsSection(): KeyboardHelpSection {
  const a11y = StringManager.getInstance().getA11yStrings().keyboardHelp;
  const enterOrSpace = KeyboardHelpIconFactory.iconOrIcon(TextKeyNode.enter(), TextKeyNode.space());
  return new KeyboardHelpSection(a11y.fireHeadingStringProperty, [
    KeyboardHelpSectionRow.labelWithIcon(a11y.fireAtomStringProperty, enterOrSpace),
  ]);
}

function builderSection(): MoveDraggableItemsKeyboardHelpSection {
  const a11y = StringManager.getInstance().getA11yStrings().keyboardHelp;
  return new MoveDraggableItemsKeyboardHelpSection({
    headingStringProperty: a11y.buildHeadingStringProperty,
  });
}

function wireSection(): KeyboardHelpSection {
  const a11y = StringManager.getInstance().getA11yStrings().keyboardHelp;
  const dragIcon = KeyboardHelpIconFactory.arrowKeysRowIcon();
  return new KeyboardHelpSection(a11y.wireHeadingStringProperty, [
    KeyboardHelpSectionRow.labelWithIcon(a11y.dragWireStringProperty, dragIcon),
  ]);
}

function blockerSection(): KeyboardHelpSection {
  const a11y = StringManager.getInstance().getA11yStrings().keyboardHelp;
  return new KeyboardHelpSection(a11y.blockerHeadingStringProperty, [
    KeyboardHelpSectionRow.labelWithIcon(
      a11y.blockerHelpStringProperty,
      KeyboardHelpIconFactory.iconOrIcon(TextKeyNode.enter(), TextKeyNode.space()),
    ),
  ]);
}

export class SternGerlachKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const a11y = StringManager.getInstance().getA11yStrings().keyboardHelp;
    const left = [
      new BasicActionsKeyboardHelpSection({ withCheckboxContent: true }),
      new ComboBoxKeyboardHelpSection({ headingString: a11y.comboHeadingStringProperty }),
      new SliderControlsKeyboardHelpSection({ headingStringProperty: a11y.sliderHeadingStringProperty }),
    ];
    const right = [fireAtomsSection(), builderSection(), wireSection(), blockerSection()];
    super(left, right);
    KeyboardHelpSection.alignHelpSectionIcons([...left, ...right]);
  }
}
