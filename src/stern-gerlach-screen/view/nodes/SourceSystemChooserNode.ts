/**
 * SourceSystemChooserNode.ts
 *
 * Quantum-system radios (Spin ½ / Spin 1) shown next to the particle source when
 * Preferences enable Spin 1. Kept outside SourceNode so a system switch can
 * rebuild the device layer without disposing these radios mid-click (which
 * broke Voicing with "utterance is not an Utterance").
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import { SimPanel } from "../../../common/SimPanel.js";
import { StringManager } from "../../../i18n/StringManager.js";
import SternGerlachColors from "../../../SternGerlachColors.js";

export class SourceSystemChooserNode extends SimPanel {
  public constructor(systemProperty: Property<SpinSystem>, spinOneEnabledProperty: TReadOnlyProperty<boolean>) {
    const strings = StringManager.getInstance();
    const systems = strings.getSystems();
    const a11y = strings.getA11yStrings();

    const radioFont = new PhetFont({ size: 12, weight: "bold" });
    const labelFill = SternGerlachColors.textColorProperty;

    const radioGroup = new AquaRadioButtonGroup(
      systemProperty,
      [
        {
          value: SpinSystem.SPIN_HALF,
          createNode: () => new Text(systems.spinHalfStringProperty, { font: radioFont, fill: labelFill }),
        },
        {
          value: SpinSystem.SPIN_ONE,
          createNode: () => new Text(systems.spinOneStringProperty, { font: radioFont, fill: labelFill }),
        },
      ],
      {
        orientation: "vertical",
        spacing: 6,
        radioButtonOptions: { radius: 7 },
        accessibleName: a11y.controls.systemRadioGroupStringProperty,
      },
    );

    super(radioGroup, { xMargin: 8, yMargin: 8, visibleProperty: spinOneEnabledProperty });
  }
}
