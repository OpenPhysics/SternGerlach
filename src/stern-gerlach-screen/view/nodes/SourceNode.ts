/**
 * SourceNode.ts
 *
 * Visual for the particle source (atom gun), in the style of
 * quantum-measurement's ParticleSourceNode: a metallic gray→white→gray
 * gradient body with a nozzle, a magenta round fire button (SINGLE mode) or a
 * None…Lots intensity slider (CONTINUOUS mode), and an AquaRadioButtonGroup
 * to switch between the two modes.
 *
 * The quantum-system chooser (Spin ½ / Spin 1) lives on ExperimentAreaNode
 * as a persistent overlay — it must not be disposed mid-click when changing
 * system rebuilds the device layer (that disposed the radios before Voicing
 * finished and tripped "utterance is not an Utterance").
 *
 * Local origin: the device's center (the body's center); the nozzle tip is
 * the model output port on the right edge.
 */

import type { Property } from "scenerystack/axon";
import { Dimension2, Range } from "scenerystack/dot";
import { Circle, LinearGradient, Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, HSlider, RoundPushButton } from "scenerystack/sun";
import { FLAT_BUTTON_APPEARANCE_OPTIONS } from "../../../common/SternGerlachButtonOptions.js";
import { StringManager } from "../../../i18n/StringManager.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import { CONTINUOUS_RATE_RANGE, MODEL_VIEW_SCALE } from "../../../SternGerlachConstants.js";
import { type ParticleSource, SourceMode } from "../../model/devices/ParticleSource.js";

export class SourceNode extends Node {
  private readonly disposeSourceNode: () => void;

  /**
   * @param source - the source device
   * @param fire - callback that fires one particle (SINGLE mode button)
   */
  public constructor(source: ParticleSource, fire: () => void) {
    super();

    const strings = StringManager.getInstance();
    const controls = strings.getControls();
    const a11y = strings.getA11yStrings();

    const halfWidth = source.halfWidth * MODEL_VIEW_SCALE;
    const halfHeight = source.halfHeight * MODEL_VIEW_SCALE;

    // Metallic body: vertical gray → white → gray gradient.
    const bodyGradient = new LinearGradient(0, -halfHeight, 0, halfHeight)
      .addColorStop(0, SternGerlachColors.sourceGradientDarkProperty)
      .addColorStop(0.5, SternGerlachColors.sourceGradientLightProperty)
      .addColorStop(1, SternGerlachColors.sourceGradientDarkProperty);
    const body = new Rectangle(-halfWidth, -halfHeight, 2 * halfWidth, 2 * halfHeight, {
      cornerRadius: 10,
      fill: bodyGradient,
      stroke: SternGerlachColors.experimentAreaStrokeProperty,
    });
    this.addChild(body);

    // Nozzle reaching to the output port on the right edge.
    const nozzle = new Rectangle(halfWidth - 10, -8, 14, 16, {
      cornerRadius: 3,
      fill: SternGerlachColors.sourceGradientDarkProperty,
      stroke: SternGerlachColors.analyzerHoleFillProperty,
    });
    this.addChild(nozzle);

    // SINGLE mode: the magenta fire button, centered on the body.
    const fireButton = new RoundPushButton({
      ...FLAT_BUTTON_APPEARANCE_OPTIONS,
      radius: 17,
      baseColor: SternGerlachColors.particleColorProperty,
      content: new Circle(5, { fill: SternGerlachColors.analyzerLabelFillProperty }),
      listener: fire,
      center: body.center,
      accessibleName: a11y.controls.fireButtonStringProperty,
    });
    this.addChild(fireButton);

    // CONTINUOUS mode: the None … Lots intensity slider, above the body.
    const rateSlider = new HSlider(
      source.emissionRateProperty,
      new Range(CONTINUOUS_RATE_RANGE.min, CONTINUOUS_RATE_RANGE.max),
      {
        trackSize: new Dimension2(2 * halfWidth - 10, 4),
        thumbSize: new Dimension2(12, 22),
        accessibleName: a11y.controls.emissionRateSliderStringProperty,
      },
    );
    const labelFont = new PhetFont(11);
    const labelFill = SternGerlachColors.controlSurfaceTextColorProperty;
    rateSlider.addMajorTick(
      CONTINUOUS_RATE_RANGE.min,
      new Text(controls.noneStringProperty, { font: labelFont, fill: labelFill }),
    );
    rateSlider.addMajorTick(
      CONTINUOUS_RATE_RANGE.max,
      new Text(controls.lotsStringProperty, { font: labelFont, fill: labelFill }),
    );
    const sliderWrapper = new Node({ children: [rateSlider] });
    sliderWrapper.centerX = 0;
    sliderWrapper.bottom = -halfHeight - 8;
    this.addChild(sliderWrapper);

    // Mode selector below the body — labels keep Single vs Continuous visually distinct.
    const radioFont = new PhetFont({ size: 12, weight: "bold" });
    const modeRadioGroup = new AquaRadioButtonGroup(
      source.sourceModeProperty as Property<SourceMode>,
      [
        {
          value: SourceMode.SINGLE,
          createNode: () => new Text(controls.singleParticleStringProperty, { font: radioFont, fill: labelFill }),
        },
        {
          value: SourceMode.CONTINUOUS,
          createNode: () => new Text(controls.continuousBeamStringProperty, { font: radioFont, fill: labelFill }),
        },
      ],
      {
        orientation: "vertical",
        spacing: 6,
        radioButtonOptions: { radius: 7 },
        accessibleName: a11y.controls.sourceModeRadioGroupStringProperty,
      },
    );
    modeRadioGroup.centerX = 0;
    modeRadioGroup.top = halfHeight + 8;
    this.addChild(modeRadioGroup);

    const modeListener = (mode: SourceMode) => {
      fireButton.visible = mode === SourceMode.SINGLE;
      sliderWrapper.visible = mode === SourceMode.CONTINUOUS;
    };
    source.sourceModeProperty.link(modeListener);

    this.disposeSourceNode = () => {
      source.sourceModeProperty.unlink(modeListener);
      fireButton.dispose();
      rateSlider.dispose();
      modeRadioGroup.dispose();
    };
  }

  public override dispose(): void {
    this.disposeSourceNode();
    super.dispose();
  }
}
