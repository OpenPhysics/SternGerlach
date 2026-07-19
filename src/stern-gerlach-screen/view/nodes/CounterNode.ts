/**
 * CounterNode.ts
 *
 * Visual for a particle counter: a light box holding a vertical histogram bar
 * whose height is proportional to count / totalDetected, with a numeric count
 * readout and percent to the right. A green expected-value line is toggled by
 * expectedValuesVisibleProperty; it shows the analytic probability conditioned
 * on detection (P / (1 − lost)), the same denominator as the bars, so bars and
 * lines converge together even when blockers/dead ends discard probability.
 * A brief yellow flash fires on each detection (PhET Spin camera-flash
 * pedagogy).
 *
 * Local origin: the device's center; the input port is the left-edge center.
 */

import type { Emitter, TReadOnlyProperty } from "scenerystack/axon";
import { Multilink } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import type { TColor } from "scenerystack/scenery";
import { Line, Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../../i18n/StringManager.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import { MODEL_VIEW_SCALE } from "../../../SternGerlachConstants.js";
import { type Counter, expectedDetectedFraction } from "../../model/devices/Counter.js";

const BAR_WIDTH = 26;
const FLASH_DURATION = 0.35;

export class CounterNode extends Node {
  private readonly disposeCounterNode: () => void;
  private readonly flash: Rectangle;
  private flashOpacity = 0;

  /**
   * @param counter - the counter device
   * @param totalDetectedProperty - shared denominator for the bar height
   * @param expectedValuesVisibleProperty - toggles the green analytic line
   * @param deadEndProbabilityProperty - probability mass lost to blockers/dead ends, used to
   *   condition the expected line on detection (same denominator as the bars)
   * @param barFillProperty - histogram bar color, tracking the feeding port (cyan UP,
   *   magenta DOWN, amber NONE); a Property so builder-mode rewiring recolors the bar
   * @param particleDetectedEmitter - optional emitter that flashes this counter on detection
   */
  public constructor(
    counter: Counter,
    totalDetectedProperty: TReadOnlyProperty<number>,
    expectedValuesVisibleProperty: TReadOnlyProperty<boolean>,
    deadEndProbabilityProperty: TReadOnlyProperty<number>,
    barFillProperty: TReadOnlyProperty<TColor>,
    particleDetectedEmitter?: Emitter<[Counter]>,
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

    this.flash = new Rectangle(-halfWidth, -halfHeight, 2 * halfWidth, 2 * halfHeight, {
      fill: SternGerlachColors.measurementFlashFillProperty,
      opacity: 0,
      pickable: false,
    });
    this.addChild(this.flash);

    const bar = new Rectangle(0, 0, BAR_WIDTH, 0);
    const barFillListener = (fill: TColor) => {
      bar.fill = fill;
    };
    barFillProperty.link(barFillListener);
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

    const sampleText = new Text("", {
      font: new PhetFont(10),
      fill: SternGerlachColors.controlSurfaceTextColorProperty,
    });
    this.addChild(sampleText);

    const counterStrings = StringManager.getInstance().getCounterStrings();
    const update = (count: number, total: number, percentPattern: string, samplePattern: string) => {
      const fraction = total > 0 ? count / total : 0;
      bar.setRect(-BAR_WIDTH / 2, halfHeight - 2 - fraction * barMaxHeight, BAR_WIDTH, fraction * barMaxHeight);

      countText.string = `${count}`;
      countText.left = halfWidth + 7;
      countText.centerY = -8;

      percentText.string = total > 0 ? StringUtils.fillIn(percentPattern, { percent: toFixed(100 * fraction, 1) }) : "";
      percentText.left = halfWidth + 7;
      percentText.top = countText.bottom + 1;

      sampleText.string = total > 0 ? StringUtils.fillIn(samplePattern, { total }) : "";
      sampleText.left = halfWidth + 7;
      sampleText.top = percentText.bottom + 1;
    };
    const countMultilink = new Multilink(
      [
        counter.countProperty,
        totalDetectedProperty,
        counterStrings.percentPatternStringProperty,
        counterStrings.samplePatternStringProperty,
      ],
      update,
    );

    const updateExpected = (probability: number, visible: boolean, deadEnd: number) => {
      const fraction = expectedDetectedFraction(probability, deadEnd);
      expectedLine.visible = visible;
      expectedLine.setY1(halfHeight - 2 - fraction * barMaxHeight);
      expectedLine.setY2(halfHeight - 2 - fraction * barMaxHeight);
    };
    const expectedMultilink = new Multilink(
      [counter.probabilityProperty, expectedValuesVisibleProperty, deadEndProbabilityProperty],
      updateExpected,
    );

    const detectionListener = (detected: Counter) => {
      if (detected === counter) {
        this.flashOpacity = 1;
        this.flash.opacity = 1;
      }
    };
    particleDetectedEmitter?.addListener(detectionListener);

    this.disposeCounterNode = () => {
      countMultilink.dispose();
      expectedMultilink.dispose();
      barFillProperty.unlink(barFillListener);
      particleDetectedEmitter?.removeListener(detectionListener);
    };
  }

  /** Fades the detection flash; call once per frame. */
  public stepFlash(dt: number): void {
    if (this.flashOpacity <= 0) {
      return;
    }
    this.flashOpacity = Math.max(0, this.flashOpacity - dt / FLASH_DURATION);
    this.flash.opacity = this.flashOpacity * 0.55;
  }

  public override dispose(): void {
    this.disposeCounterNode();
    super.dispose();
  }
}
