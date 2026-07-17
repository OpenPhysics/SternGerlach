/**
 * PortNode.ts
 *
 * A small circular handle drawn on a device's input or output port, interactive
 * only in builder (CUSTOM) mode. Output ports are wiring sources: pressing one
 * starts a rubber-band wire; input ports are drop targets that highlight when a
 * legal connection hovers over them.
 */

import { Circle } from "scenerystack/scenery";
import SternGerlachColors from "../../../SternGerlachColors.js";

export const PORT_RADIUS = 7;

export class PortNode extends Circle {
  public constructor(centerX: number, centerY: number, interactive: boolean) {
    super(PORT_RADIUS, {
      centerX,
      centerY,
      fill: SternGerlachColors.portFillProperty,
      stroke: SternGerlachColors.analyzerLabelFillProperty,
      lineWidth: 1,
      cursor: interactive ? "pointer" : null,
    });
  }

  /** Toggles the highlighted (legal-target) appearance. */
  public setHighlighted(highlighted: boolean): void {
    this.fill = highlighted ? SternGerlachColors.portHighlightProperty : SternGerlachColors.portFillProperty;
  }
}
