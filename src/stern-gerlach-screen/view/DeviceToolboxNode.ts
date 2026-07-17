/**
 * DeviceToolboxNode.ts
 *
 * The builder-mode palette, shown as an iconic carousel: the user flips through
 * one device at a time (analyzer, magnet, counter), each drawn as a mini-icon
 * echoing how it looks on the board, and presses it to add a fresh copy to the
 * board to drag into place and wire up. Visible only while the Custom experiment
 * is selected.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle, RichText, Text, type TPaint, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Carousel, type CarouselItem, RectangularPushButton } from "scenerystack/sun";
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

/** Footprint of each device mini-icon, view px. */
const ICON_HALF_WIDTH = 24;
const ICON_HALF_HEIGHT = 18;

/** A boxed device body (analyzer/magnet) carrying a small "SG" label. */
function boxIcon(fill: TPaint): Node {
  const box = new Rectangle(-ICON_HALF_WIDTH, -ICON_HALF_HEIGHT, 2 * ICON_HALF_WIDTH, 2 * ICON_HALF_HEIGHT, {
    cornerRadius: 6,
    fill,
  });
  const label = new RichText("SG<sub>z</sub>", {
    font: new PhetFont({ size: 13, weight: "bold" }),
    fill: SternGerlachColors.analyzerLabelFillProperty,
  });
  label.center = box.center;
  return new Node({ children: [box, label] });
}

/** Analyzer icon: a black body with two cyan splitting curves and exit holes. */
function analyzerIcon(): Node {
  const icon = boxIcon(SternGerlachColors.analyzerBodyFillProperty);
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

/** Magnet icon: the same boxed body, in the magnet's red. */
function magnetIcon(): Node {
  return boxIcon(SternGerlachColors.magnetBodyFillProperty);
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

    const title = new Text(toolbox.titleStringProperty, {
      font: new PhetFont({ size: 14, weight: "bold" }),
      fill: SternGerlachColors.textColorProperty,
    });

    // Each carousel item is a full-icon push button that adds one device to the board.
    const makeItem = (
      icon: Node,
      label: TReadOnlyProperty<string>,
      accessibleName: TReadOnlyProperty<string>,
      listener: () => void,
    ): CarouselItem => ({
      createNode: () =>
        new RectangularPushButton({
          ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
          baseColor: SternGerlachColors.controlSurfaceColorProperty,
          content: new VBox({
            spacing: 6,
            children: [icon, new Text(label, { font: new PhetFont(12), fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 90 })],
          }),
          listener,
          accessibleName,
          xMargin: 12,
          yMargin: 8,
        }),
    });

    const carousel = new Carousel(
      [
        makeItem(
          analyzerIcon(),
          toolbox.analyzerStringProperty,
          a11y.controls.analyzerToolboxItemStringProperty,
          callbacks.addAnalyzer,
        ),
        makeItem(
          magnetIcon(),
          toolbox.magnetStringProperty,
          a11y.controls.magnetToolboxItemStringProperty,
          callbacks.addMagnet,
        ),
        makeItem(
          counterIcon(),
          toolbox.counterStringProperty,
          a11y.controls.counterToolboxItemStringProperty,
          callbacks.addCounter,
        ),
      ],
      {
        orientation: "horizontal",
        itemsPerPage: 1,
        margin: 8,
        fill: SternGerlachColors.controlSurfaceColorProperty,
        stroke: SternGerlachColors.experimentAreaStrokeProperty,
        cornerRadius: 8,
      },
    );

    super(
      new VBox({
        align: "center",
        spacing: 8,
        children: [title, carousel],
      }),
      { visibleProperty: isCustomProperty },
    );
  }
}
