/**
 * SternGerlachButtonOptions.ts
 *
 * Shared flat button appearance for the sim. Rectangular and round push buttons
 * default to SceneryStack's 3-D appearance; pass these options (or spread them
 * into nested button options) for a flat look everywhere.
 */

import type { PlayPauseStepButtonGroupOptions, TimeControlNodeOptions } from "scenerystack/scenery-phet";
import { ButtonNode, type ComboBoxOptions } from "scenerystack/sun";
import SternGerlachColors from "../SternGerlachColors.js";

export const FLAT_BUTTON_APPEARANCE_OPTIONS = {
  buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
} as const;

/** Profile-aware text on flat push buttons and combo-box items. */
export const LIGHT_SURFACE_TEXT_FILL = SternGerlachColors.controlSurfaceTextColorProperty;

/**
 * Profile-aware combo-box chrome for panels. Item labels must use
 * {@link LIGHT_SURFACE_TEXT_FILL}, which contrasts with the control surface.
 */
export const SIM_COMBO_BOX_OPTIONS = {
  buttonFill: SternGerlachColors.controlSurfaceColorProperty,
  listFill: SternGerlachColors.controlSurfaceColorProperty,
  buttonStroke: SternGerlachColors.panelBorderColorProperty,
  listStroke: SternGerlachColors.panelBorderColorProperty,
  // SceneryStack defaults this to near-white; that washes out dark-profile lists.
  highlightFill: SternGerlachColors.controlSurfaceHighlightColorProperty,
} satisfies Pick<ComboBoxOptions, "buttonFill" | "listFill" | "buttonStroke" | "listStroke" | "highlightFill">;

/** Options for RectangularPushButton and NumberControl arrow buttons. */
export const FLAT_RECTANGULAR_BUTTON_OPTIONS = FLAT_BUTTON_APPEARANCE_OPTIONS;

/** Options for ResetAllButton (extends RoundPushButton). */
export const FLAT_RESET_ALL_BUTTON_OPTIONS = FLAT_BUTTON_APPEARANCE_OPTIONS;

/** Nested options for TimeControlNode play / pause / step round buttons. */
export const FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS = {
  playPauseButtonOptions: FLAT_BUTTON_APPEARANCE_OPTIONS,
  stepForwardButtonOptions: FLAT_BUTTON_APPEARANCE_OPTIONS,
  stepBackwardButtonOptions: FLAT_BUTTON_APPEARANCE_OPTIONS,
} satisfies PlayPauseStepButtonGroupOptions;

/**
 * Speed radio labels for TimeControlNode. SceneryStack Text defaults to black, which
 * is low-contrast on the sim's dark Default-mode panels.
 */
export const TIME_CONTROL_SPEED_RADIO_OPTIONS = {
  speedRadioButtonGroupOptions: {
    labelOptions: { fill: SternGerlachColors.textColorProperty },
  },
} satisfies Pick<TimeControlNodeOptions, "speedRadioButtonGroupOptions">;
