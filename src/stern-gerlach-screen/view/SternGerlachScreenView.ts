/**
 * SternGerlachScreenView.ts
 *
 * The top-level view: the light experiment board on the left (source →
 * analyzers → counters with animated particles), the experiment control panel
 * on the right, and Reset All bottom-right.
 */

import { Node, Rectangle } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/SimButtonOptions.js";
import { SCREEN_VIEW_MARGIN } from "../../SimConstants.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import type { SternGerlachModel } from "../model/SternGerlachModel.js";
import { ExperimentAreaNode } from "./ExperimentAreaNode.js";
import { ExperimentControlPanel } from "./ExperimentControlPanel.js";
import { SternGerlachScreenSummaryContent } from "./SternGerlachScreenSummaryContent.js";

export class SternGerlachScreenView extends ScreenView {
  private readonly experimentAreaNode: ExperimentAreaNode;

  public constructor(model: SternGerlachModel, options?: ScreenViewOptions) {
    super({
      screenSummaryContent: new SternGerlachScreenSummaryContent(model),
      ...options,
    });

    // ── Background ────────────────────────────────────────────────────────────
    const backgroundRect = new Rectangle(0, 0, this.layoutBounds.width, this.layoutBounds.height, {
      fill: SternGerlachColors.backgroundColorProperty,
    });
    this.addChild(backgroundRect);

    // ── Experiment board ──────────────────────────────────────────────────────
    this.experimentAreaNode = new ExperimentAreaNode(model);
    this.experimentAreaNode.left = SCREEN_VIEW_MARGIN;
    this.experimentAreaNode.top = SCREEN_VIEW_MARGIN;
    this.addChild(this.experimentAreaNode);

    // ── Control panel (combo box list drops into this view, above everything) ──
    const controlPanel = new ExperimentControlPanel(model, this);
    controlPanel.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = SCREEN_VIEW_MARGIN;
    this.addChild(controlPanel);

    // ── Reset All button ──────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(resetAllButton);

    // ── Accessibility: keyboard / reading traversal order ─────────────────────
    this.addChild(
      new Node({
        pdomOrder: [this.experimentAreaNode, controlPanel, resetAllButton],
      }),
    );
  }

  /** Resets view-side state. */
  public reset(): void {
    // No view-only state yet.
  }

  /**
   * Steps the view forward for animation: keeps particle circles in sync.
   * @param _dt - elapsed seconds (positions live in the model; only sync here)
   */
  public override step(dt: number): void {
    this.experimentAreaNode.step(dt);
  }
}
