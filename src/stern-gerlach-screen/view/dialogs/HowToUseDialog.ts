/**
 * HowToUseDialog.ts
 *
 * A modal dialog opened from the info button, suggesting a workflow for
 * exploring the simulation (preset → initial state → fire → compare →
 * experiment further). Keyboard shortcuts live in the separate keyboard-help
 * dialog, not here.
 */

import { RichText, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { SimDialog } from "../../../common/SimDialog.js";
import { StringManager } from "../../../i18n/StringManager.js";
import SternGerlachColors from "../../../SternGerlachColors.js";

/** Content column width, in screen px — tuned so paragraphs wrap to 2-3 lines. */
const CONTENT_WIDTH = 380;

export class HowToUseDialog extends SimDialog {
  public constructor() {
    const strings = StringManager.getInstance();
    const dialogs = strings.getDialogs();

    const stepFont = new PhetFont(14);
    const stepFill = SternGerlachColors.textColorProperty;
    const steps = [
      dialogs.howToUseStep1StringProperty,
      dialogs.howToUseStep2StringProperty,
      dialogs.howToUseStep3StringProperty,
      dialogs.howToUseStep4StringProperty,
      dialogs.howToUseStep5StringProperty,
    ].map(
      (stepStringProperty) =>
        new RichText(stepStringProperty, {
          font: stepFont,
          fill: stepFill,
          lineWrap: CONTENT_WIDTH,
          leading: 4,
        }),
    );

    const content = new VBox({
      spacing: 14,
      align: "left",
      children: steps,
    });

    super(content, {
      title: new RichText(dialogs.howToUseTitleStringProperty, {
        font: new PhetFont({ size: 20, weight: "bold" }),
        fill: SternGerlachColors.textColorProperty,
      }),
    });
  }
}
