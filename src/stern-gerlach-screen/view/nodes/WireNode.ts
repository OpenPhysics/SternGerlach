/**
 * WireNode.ts
 *
 * Visual for a wire: a horizontal-tangent bezier from a device's output port
 * to the target's input port. Reacts to both devices' positions so it keeps
 * up when devices move (builder mode, later milestone).
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path } from "scenerystack/scenery";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import type { Wire } from "../../model/Wire.js";

export class WireNode extends Path {
  private readonly disposeWireNode: () => void;

  public constructor(wire: Wire, systemProperty: TReadOnlyProperty<SpinSystem>, mvt: ModelViewTransform2) {
    super(null, {
      stroke: SternGerlachColors.wireStrokeProperty,
      lineWidth: 2.5,
    });

    const update = () => {
      const system = systemProperty.value;
      const start = mvt.modelToViewPosition(wire.source.getOutputPortPosition(wire.outputIndex, system));
      const end = mvt.modelToViewPosition(wire.target.getInputPortPosition());
      const lead = Math.max(20, Math.abs(end.x - start.x) * 0.45);
      this.shape = new Shape()
        .moveTo(start.x, start.y)
        .cubicCurveTo(start.x + lead, start.y, end.x - lead, end.y, end.x, end.y);
    };

    const multilink = new Multilink(
      [wire.source.positionProperty, wire.target.positionProperty, systemProperty],
      update,
    );

    this.disposeWireNode = () => multilink.dispose();
  }

  public override dispose(): void {
    this.disposeWireNode();
    super.dispose();
  }
}
