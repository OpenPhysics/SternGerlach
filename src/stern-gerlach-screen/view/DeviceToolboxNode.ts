/**
 * DeviceToolboxNode.ts
 *
 * The builder-mode palette: a compact horizontal strip of the three device
 * kinds (analyzer, magnet, counter), tucked under the control panel clear of
 * the board. Each item is a mini-icon echoing how the device looks on the
 * board: drag it out onto the board to create a device under the pointer, or
 * activate it by keyboard/click to drop one at a default spot. Visible only
 * while the Custom experiment is selected.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import {
  Circle,
  DragListener,
  HBox,
  Node,
  Path,
  type PressListenerEvent,
  Rectangle,
  RichText,
  Text,
  type TPaint,
  VBox,
} from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { LIGHT_SURFACE_TEXT_FILL } from "../../common/SimButtonOptions.js";
import { SimPanel } from "../../common/SimPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import SternGerlachColors from "../../SternGerlachColors.js";

/** How the toolbox creates a device: by drag-out (pointer) or activation (keyboard/click). */
export type ToolboxItemHandlers = {
  /** Pointer drag-out: create the device under the pointer and hand off the drag. */
  dragCreate: (event: PressListenerEvent) => void;
  /** Keyboard/click activation: drop the device at a default spot on the board. */
  clickCreate: () => void;
};

/** The drag-out/activate handlers for each device kind the toolbox offers. */
export type ToolboxCallbacks = {
  analyzer: ToolboxItemHandlers;
  magnet: ToolboxItemHandlers;
  counter: ToolboxItemHandlers;
};

/** Footprint of each device mini-icon, view px. */
const ICON_HALF_WIDTH = 24;
const ICON_HALF_HEIGHT = 18;

/** A boxed device body (analyzer/magnet) carrying a small type label. */
function boxIcon(fill: TPaint, labelMarkup: string): Node {
  const box = new Rectangle(-ICON_HALF_WIDTH, -ICON_HALF_HEIGHT, 2 * ICON_HALF_WIDTH, 2 * ICON_HALF_HEIGHT, {
    cornerRadius: 6,
    fill,
  });
  const label = new RichText(labelMarkup, {
    font: new PhetFont({ size: 13, weight: "bold" }),
    fill: SternGerlachColors.analyzerLabelFillProperty,
  });
  label.center = box.center;
  return new Node({ children: [box, label] });
}

/** Analyzer icon: a black body with two cyan splitting curves and exit holes. */
function analyzerIcon(): Node {
  const icon = boxIcon(SternGerlachColors.analyzerBodyFillProperty, "SG<sub>z</sub>");
  const inputX = -ICON_HALF_WIDTH;
  const outX = ICON_HALF_WIDTH;
  for (const outY of [-9, 9]) {
    const shape = new Shape().moveTo(inputX, 0).cubicCurveTo(0, 0, outX * 0.35, outY, outX, outY);
    icon.addChild(new Path(shape, { stroke: SternGerlachColors.splitterCurveStrokeProperty, lineWidth: 3 }));
    icon.addChild(
      new Circle(4, {
        fill: SternGerlachColors.analyzerHoleFillProperty,
        stroke: SternGerlachColors.analyzerLabelFillProperty,
        lineWidth: 1,
        centerX: outX - 3,
        centerY: outY,
      }),
    );
  }
  return icon;
}

/** Magnet icon: the same boxed body in the magnet's red, labeled by field direction. */
function magnetIcon(): Node {
  return boxIcon(SternGerlachColors.magnetBodyFillProperty, "B<sub>z</sub>");
}

/** Counter icon: a light box holding a short histogram bar. */
function counterIcon(): Node {
  const box = new Rectangle(-ICON_HALF_WIDTH, -ICON_HALF_HEIGHT, 2 * ICON_HALF_WIDTH, 2 * ICON_HALF_HEIGHT, {
    fill: SternGerlachColors.controlSurfaceColorProperty,
    stroke: SternGerlachColors.experimentAreaStrokeProperty,
    lineWidth: 1.5,
  });
  const bar = new Rectangle(-6, -2, 12, ICON_HALF_HEIGHT + 2, {
    fill: SternGerlachColors.counterBarUpFillProperty,
  });
  bar.bottom = ICON_HALF_HEIGHT - 3;
  bar.centerX = 0;
  return new Node({ children: [box, bar] });
}

export class DeviceToolboxNode extends SimPanel {
  public constructor(isCustomProperty: TReadOnlyProperty<boolean>, callbacks: ToolboxCallbacks) {
    const strings = StringManager.getInstance();
    const toolbox = strings.getToolbox();
    const a11y = strings.getA11yStrings();

    // Each item is a full-icon creator node: drag it out to spawn a device under the pointer
    // (a real board device takes over the drag), or activate it by keyboard/click.
    const makeItem = (
      icon: Node,
      label: TReadOnlyProperty<string>,
      accessibleName: TReadOnlyProperty<string>,
      handlers: ToolboxItemHandlers,
    ): Node => {
      const content = new VBox({
        spacing: 4,
        children: [icon, new Text(label, { font: new PhetFont(11), fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 74 })],
      });

      // A rounded control-surface background that tracks the content bounds (localized labels vary).
      const background = new Rectangle(0, 0, 0, 0, {
        cornerRadius: 6,
        fill: SternGerlachColors.controlSurfaceColorProperty,
      });
      content.boundsProperty.link(() => {
        const b = content.bounds.dilatedXY(7, 5);
        background.setRect(b.minX, b.minY, b.width, b.height);
      });

      const item = new Node({
        children: [background, content],
        cursor: "pointer",
        // Accessible: a focusable button that drops a device on keyboard/click activation.
        tagName: "button",
        accessibleName,
      });
      // Pointer: forward the press so the created board device follows the pointer.
      item.addInputListener(DragListener.createForwardingListener((event) => handlers.dragCreate(event)));
      item.addInputListener({ click: () => handlers.clickCreate() });
      return item;
    };

    // A compact horizontal strip of the three device icons, sized to sit clear of the board.
    const row = new HBox({
      spacing: 6,
      children: [
        makeItem(
          analyzerIcon(),
          toolbox.analyzerStringProperty,
          a11y.controls.analyzerToolboxItemStringProperty,
          callbacks.analyzer,
        ),
        makeItem(
          magnetIcon(),
          toolbox.magnetStringProperty,
          a11y.controls.magnetToolboxItemStringProperty,
          callbacks.magnet,
        ),
        makeItem(
          counterIcon(),
          toolbox.counterStringProperty,
          a11y.controls.counterToolboxItemStringProperty,
          callbacks.counter,
        ),
      ],
    });

    super(row, { visibleProperty: isCustomProperty, xMargin: 8, yMargin: 6 });
  }
}
