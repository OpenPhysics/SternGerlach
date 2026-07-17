/**
 * DeviceToolboxNode.ts
 *
 * The builder-mode palette. Each button adds a fresh device (analyzer, magnet,
 * or counter) to the board, which the user then drags into place and wires up.
 * Visible only while the Custom experiment is selected.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { RectangularPushButton } from "scenerystack/sun";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/SimButtonOptions.js";
import { SimPanel } from "../../common/SimPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import SternGerlachColors from "../../SternGerlachColors.js";

/** Callbacks the toolbox invokes to add each device kind to the board. */
export type ToolboxCallbacks = {
  addAnalyzer: () => void;
  addMagnet: () => void;
  addCounter: () => void;
};

export class DeviceToolboxNode extends SimPanel {
  public constructor(isCustomProperty: TReadOnlyProperty<boolean>, callbacks: ToolboxCallbacks) {
    const strings = StringManager.getInstance();
    const toolbox = strings.getToolbox();
    const a11y = strings.getA11yStrings();

    const title = new Text(toolbox.titleStringProperty, {
      font: new PhetFont({ size: 14, weight: "bold" }),
      fill: SternGerlachColors.textColorProperty,
    });

    const makeButton = (
      label: TReadOnlyProperty<string>,
      accessibleName: TReadOnlyProperty<string>,
      listener: () => void,
    ) =>
      new RectangularPushButton({
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        baseColor: SternGerlachColors.controlSurfaceColorProperty,
        content: new Text(label, { font: new PhetFont(13), fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 120 }),
        listener,
        accessibleName,
        minWidth: 120,
        xMargin: 10,
      });

    super(
      new VBox({
        align: "left",
        spacing: 8,
        children: [
          title,
          makeButton(
            toolbox.analyzerStringProperty,
            a11y.controls.analyzerToolboxItemStringProperty,
            callbacks.addAnalyzer,
          ),
          makeButton(toolbox.magnetStringProperty, a11y.controls.magnetToolboxItemStringProperty, callbacks.addMagnet),
          makeButton(
            toolbox.counterStringProperty,
            a11y.controls.counterToolboxItemStringProperty,
            callbacks.addCounter,
          ),
        ],
      }),
      { visibleProperty: isCustomProperty },
    );
  }
}
