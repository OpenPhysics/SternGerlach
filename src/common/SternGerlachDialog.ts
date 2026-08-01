/**
 * SternGerlachDialog.ts
 *
 * A pre-themed Dialog that uses SternGerlachColors for fill, stroke, and close
 * button so default / projector switching is automatic. Prefer this for every
 * sim-owned modal (Preferences stays on the framework's light chrome).
 *
 * Title Text nodes still need an explicit fill — use textColorProperty.
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Dialog, type DialogOptions } from "scenerystack/sim";
import SternGerlachColors from "../SternGerlachColors.js";

export type SternGerlachDialogOptions = DialogOptions;

export class SternGerlachDialog extends Dialog {
  public constructor(content: Node, providedOptions?: SternGerlachDialogOptions) {
    const options = optionize<SternGerlachDialogOptions, EmptySelfOptions, DialogOptions>()(
      {
        fill: SternGerlachColors.panelBackgroundColorProperty,
        stroke: SternGerlachColors.panelBorderColorProperty,
        closeButtonColor: SternGerlachColors.textColorProperty,
      },
      providedOptions,
    );
    super(content, options);
  }
}
