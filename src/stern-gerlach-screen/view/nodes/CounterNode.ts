/**
 * CounterNode.ts
 *
 * Visual for a particle counter: a light box holding a vertical histogram bar
 * whose height is proportional to count / totalDetected, with a numeric count
 * readout to the right. A green expected-value line (the analytic
 * probability, adapted from quantum-measurement's HistogramWithExpectedValue)
 * is toggled by expectedValuesVisibleProperty.
 *
 * Local origin: the device's center; the input port is the left-edge center.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Multilink } from "scenerystack/axon";
import type { TColor } from "scenerystack/scenery";
import { Line, Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { MODEL_VIEW_SCALE } from "../../../SimConstants.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import type { Counter } from "../../model/devices/Counter.js";

const BAR_WIDTH = 26;

export class CounterNode extends Node {
  private readonly disposeCounterNode: () => void;

  /**
   * @param counter - the counter device
   * @param totalDetectedProperty - shared denominator for the bar height
   * @param expectedValuesVisibleProperty - toggles the green analytic line
   * @param barFill - histogram bar color (black for UP-ish ports, magenta for DOWN-ish)
   */
  public constructor(
    counter: Counter,
    totalDetectedProperty: TReadOnlyProperty<number>,
    expectedValuesVisibleProperty: TReadOnlyProperty<boolean>,
    barFill: TColor,
  ) {
    super();

    const halfWidth = counter.halfWidth * MODEL_VIEW_SCALE;
    const halfHeight = counter.halfHeight * MODEL_VIEW_SCALE;
    const barMaxHeight = 2 * halfHeight - 4;

    const box = new Rectangle(-halfWidth, -halfHeight, 2 * halfWidth, 2 * halfHeight, {
      fill: SternGerlachColors.controlSurfaceColorProperty,
      stroke: SternGerlachColors.experimentAreaStrokeProperty,
      lineWidth: 1.5,
    });
    this.addChild(box);

    const bar = new Rectangle(0, 0, BAR_WIDTH, 0, { fill: barFill });
    this.addChild(bar);

    // Green analytic expected-value line across the bar's column.
    const expectedLine = new Line(-BAR_WIDTH, 0, BAR_WIDTH, 0, {
      stroke: SternGerlachColors.expectedValueLineProperty,
      lineWidth: 2.5,
    });
    this.addChild(expectedLine);

    const countText = new Text("0", {
      font: new PhetFont({ size: 15, weight: "bold" }),
      fill: SternGerlachColors.controlSurfaceTextColorProperty,
    });
    this.addChild(countText);

    const percentText = new Text("", {
      font: new PhetFont(11),
      fill: SternGerlachColors.controlSurfaceTextColorProperty,
    });
    this.addChild(percentText);

    const update = (count: number, total: number) => {
      const fraction = total > 0 ? count / total : 0;
      bar.setRect(-BAR_WIDTH / 2, halfHeight - 2 - fraction * barMaxHeight, BAR_WIDTH, fraction * barMaxHeight);

      countText.string = `${count}`;
      countText.left = halfWidth + 7;
      countText.centerY = -6;

      percentText.string = total > 0 ? `${(100 * fraction).toFixed(1)}%` : "";
      percentText.left = halfWidth + 7;
      percentText.top = countText.bottom + 1;
    };
    const countMultilink = new Multilink([counter.countProperty, totalDetectedProperty], update);

    const updateExpected = (probability: number, visible: boolean) => {
      expectedLine.visible = visible;
      expectedLine.setY1(halfHeight - 2 - probability * barMaxHeight);
      expectedLine.setY2(halfHeight - 2 - probability * barMaxHeight);
    };
    const expectedMultilink = new Multilink(
      [counter.probabilityProperty, expectedValuesVisibleProperty],
      updateExpected,
    );

    this.disposeCounterNode = () => {
      countMultilink.dispose();
      expectedMultilink.dispose();
    };
  }

  public override dispose(): void {
    this.disposeCounterNode();
    super.dispose();
  }
}
