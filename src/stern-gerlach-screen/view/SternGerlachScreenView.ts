/**
 * SternGerlachScreenView.ts
 *
 * The top-level view: the profile-aware experiment board on the left (source →
 * analyzers → counters with animated particles), the experiment control panel
 * on the right, and Reset All bottom-right.
 */

import { Vector2 } from "scenerystack/dot";
import { Node, Rectangle } from "scenerystack/scenery";
import { InfoButton, ResetAllButton, SceneryPhetConstants } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { FLAT_BUTTON_APPEARANCE_OPTIONS } from "../../common/SimButtonOptions.js";
import { StringManager } from "../../i18n/StringManager.js";
import { SCREEN_VIEW_MARGIN } from "../../SimConstants.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import { Analyzer } from "../model/devices/Analyzer.js";
import { Counter } from "../model/devices/Counter.js";
import { Magnet } from "../model/devices/Magnet.js";
import type { SternGerlachModel } from "../model/SternGerlachModel.js";
import { DeviceToolboxNode } from "./DeviceToolboxNode.js";
import { HowToUseDialog } from "./dialogs/HowToUseDialog.js";
import { ExperimentAreaNode } from "./ExperimentAreaNode.js";
import { ExperimentControlPanel } from "./ExperimentControlPanel.js";
import { StatePreparationAreaNode } from "./StatePreparationAreaNode.js";
import { SternGerlachScreenSummaryContent } from "./SternGerlachScreenSummaryContent.js";

/** Gap between the control panel and toolbox, and between toolbox and Reset All. */
const RIGHT_COLUMN_GAP = 6;

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

    // ── Initial-state panel (chooser + Bloch/ket readout), near the source ────
    const statePrep = new StatePreparationAreaNode(model, this);
    statePrep.left = this.experimentAreaNode.left + 8;
    // Sit just above the beam line so the panel reads as attached to the source.
    statePrep.bottom = this.experimentAreaNode.top + 200;
    this.addChild(statePrep);

    // ── Control panel (combo box list drops into this view, above everything) ──
    const controlPanel = new ExperimentControlPanel(model, this);
    controlPanel.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = SCREEN_VIEW_MARGIN;
    this.addChild(controlPanel);

    // ── Builder toolbox (right column, below the control panel, visible only in Custom mode) ──
    const newAnalyzer = (position: Vector2) => new Analyzer(position, model.systemProperty.value.defaultType);
    const newMagnet = (position: Vector2) => new Magnet(position, model.systemProperty.value.defaultType);
    const newCounter = (position: Vector2) => new Counter(position);
    const toolbox = new DeviceToolboxNode(model.isCustomProperty, {
      analyzer: {
        dragCreate: (event) => this.experimentAreaNode.createAndDragDevice(newAnalyzer, event),
        clickCreate: () => model.graph.addDevice(newAnalyzer(this.spawnPosition(model))),
      },
      magnet: {
        dragCreate: (event) => this.experimentAreaNode.createAndDragDevice(newMagnet, event),
        clickCreate: () => model.graph.addDevice(newMagnet(this.spawnPosition(model))),
      },
      counter: {
        dragCreate: (event) => this.experimentAreaNode.createAndDragDevice(newCounter, event),
        clickCreate: () => model.graph.addDevice(newCounter(this.spawnPosition(model))),
      },
    });
    toolbox.right = controlPanel.right;
    this.addChild(toolbox);

    // ── Reset All button ──────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      ...FLAT_BUTTON_APPEARANCE_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(resetAllButton);

    // Keep the toolbox in the right-column gap between the control panel and Reset All.
    const layoutRightColumn = () => {
      const desiredTop = controlPanel.bottom + RIGHT_COLUMN_GAP;
      const maxTop = resetAllButton.top - toolbox.height - RIGHT_COLUMN_GAP;
      toolbox.top = maxTop < desiredTop ? Math.max(SCREEN_VIEW_MARGIN, maxTop) : desiredTop;
    };
    layoutRightColumn();
    controlPanel.boundsProperty.lazyLink(layoutRightColumn);
    toolbox.boundsProperty.lazyLink(layoutRightColumn);

    // ── Info button: how-to-use dialog, to the left of Reset All ───────────────
    const a11y = StringManager.getInstance().getA11yStrings();
    const howToUseDialog = new HowToUseDialog();
    const infoButton = new InfoButton({
      ...FLAT_BUTTON_APPEARANCE_OPTIONS,
      radius: SceneryPhetConstants.DEFAULT_BUTTON_RADIUS,
      listener: () => howToUseDialog.show(),
      accessibleName: a11y.controls.howToUseButtonStringProperty,
      right: resetAllButton.left - 12,
      centerY: resetAllButton.centerY,
    });
    this.addChild(infoButton);

    // ── Accessibility: keyboard / reading traversal order ─────────────────────
    this.addChild(
      new Node({
        pdomOrder: [statePrep, this.experimentAreaNode, controlPanel, toolbox, infoButton, resetAllButton],
      }),
    );
  }

  /** A staggered model position for a newly added builder device, to avoid stacking. */
  private spawnPosition(model: SternGerlachModel): Vector2 {
    // Two staggered diagonals of 6 slots each before positions repeat.
    const slot = model.graph.devices.length % 12;
    const step = slot % 6;
    const row = Math.floor(slot / 6);
    return new Vector2(1.0 + step * 0.14 + row * 0.07, 0.7 - step * 0.16 - row * 0.4);
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
