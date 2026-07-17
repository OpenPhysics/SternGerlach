/**
 * WireNode.ts
 *
 * Visual for a wire: a horizontal-tangent bezier from a device's output port
 * to the target's input port, using the shared WireGeometry control points so
 * the drawn curve is exactly the particles' flight path. Reacts to both
 * devices' positions so it keeps up when devices move (builder mode).
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path } from "scenerystack/scenery";
import type { SpinSystem } from "../../../common/quantum/SpinSystem.js";
import SternGerlachColors from "../../../SternGerlachColors.js";
import type { Wire } from "../../model/Wire.js";
import { wireControlPoints } from "../../model/WireGeometry.js";

export class WireNode extends Path {
  private readonly disposeWireNode: () => void;

  public constructor(wire: Wire, systemProperty: TReadOnlyProperty<SpinSystem>, mvt: ModelViewTransform2) {
    super(null, {
      stroke: SternGerlachColors.wireStrokeProperty,
      lineWidth: 2.5,
    });

    const update = () => {
      const system = systemProperty.value;
      const { p0, c1, c2, p3 } = wireControlPoints(
        wire.source.getOutputPortPosition(wire.outputIndex, system),
        wire.target.getInputPortPosition(),
      );
      // The mvt is affine, so transforming the control points transforms the whole bézier.
      const v0 = mvt.modelToViewPosition(p0);
      const v1 = mvt.modelToViewPosition(c1);
      const v2 = mvt.modelToViewPosition(c2);
      const v3 = mvt.modelToViewPosition(p3);
      this.shape = new Shape().moveTo(v0.x, v0.y).cubicCurveTo(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y);
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
