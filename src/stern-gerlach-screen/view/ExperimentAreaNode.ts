/**
 * ExperimentAreaNode.ts
 *
 * The light experiment board (quantum-measurement style): owns the
 * ModelViewTransform2 (inverted y, MODEL_VIEW_SCALE px per model unit) and
 * stacked layers — wires < devices < particles < wiring overlay. Device nodes
 * rebuild when devices are added/removed; wire nodes rebuild when wires change,
 * so an in-progress wiring drag never disposes the port it started from.
 *
 * In builder (CUSTOM) mode, devices are draggable (pointer + keyboard),
 * deletable, and their output ports can be dragged to input ports to wire the
 * graph. The board and its devices follow the active default/projector color
 * profile.
 */

import type { Property } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { PressListenerEvent } from "scenerystack/scenery";
import { DragListener, KeyboardDragListener, Node, Path, Rectangle, RichText, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { RectangularRadioButtonGroup } from "scenerystack/sun";
import type { AnalyzerType } from "../../common/quantum/AnalyzerType.js";
import { StringManager } from "../../i18n/StringManager.js";
import {
  EXPERIMENT_AREA_HEIGHT,
  EXPERIMENT_AREA_WIDTH,
  MODEL_ORIGIN_IN_AREA_X,
  MODEL_ORIGIN_IN_AREA_Y,
  MODEL_VIEW_SCALE,
} from "../../SimConstants.js";
import SternGerlachColors from "../../SternGerlachColors.js";
import { Analyzer, NO_BLOCKED_OUTPUT } from "../model/devices/Analyzer.js";
import { Counter } from "../model/devices/Counter.js";
import type { ExperimentDevice } from "../model/devices/ExperimentDevice.js";
import { Magnet } from "../model/devices/Magnet.js";
import { ParticleSource, SourceMode } from "../model/devices/ParticleSource.js";
import type { SternGerlachModel } from "../model/SternGerlachModel.js";
import { Wire } from "../model/Wire.js";
import { BeamCanvasNode } from "./BeamCanvasNode.js";
import { AnalyzerNode, analyzerLabelMarkup } from "./nodes/AnalyzerNode.js";
import { CounterNode } from "./nodes/CounterNode.js";
import { MagnetNode } from "./nodes/MagnetNode.js";
import { PortNode } from "./nodes/PortNode.js";
import { SourceNode } from "./nodes/SourceNode.js";
import { WireNode } from "./nodes/WireNode.js";
import { ParticleLayerNode } from "./ParticleLayerNode.js";

/** Coarse builder grid, model units: dropped devices snap to multiples of this. */
const GRID = 0.1;
/** Pointer must release within this many pixels of an input port to connect. */
const CONNECT_THRESHOLD = 26;
/** Keyboard nudge per arrow press, model units. */
const KEYBOARD_STEP = 0.1;
/** Extra padding (model units) keeping device bodies inside the board. */
const BOARD_MARGIN = 0.05;

export class ExperimentAreaNode extends Node {
  /** Maps between experiment model coordinates and this node's local view frame. */
  public readonly mvt: ModelViewTransform2;

  private readonly model: SternGerlachModel;
  private readonly wireLayer: Node;
  private readonly deviceLayer: Node;
  private readonly particleLayer: ParticleLayerNode;
  private readonly beamLayer: BeamCanvasNode;
  private readonly overlayLayer: Node;

  // Analyzer nodes currently on the board, so their which-path flashes can be faded each frame.
  private analyzerNodes: AnalyzerNode[] = [];

  // Counter nodes currently on the board, so their detection flashes can be faded each frame.
  private counterNodes: CounterNode[] = [];

  // Input port handles for the current devices, for highlighting legal wiring targets.
  private inputPorts: Map<ExperimentDevice, PortNode> = new Map();

  // Body-move drag listeners for the current devices, so a toolbox drag-out can hand off to one.
  private deviceDragListeners: Map<ExperimentDevice, { listener: DragListener; visual: Node }> = new Map();

  public constructor(model: SternGerlachModel) {
    super();
    this.model = model;

    this.mvt = ModelViewTransform2.createSinglePointScaleInvertedYMapping(
      Vector2.ZERO,
      new Vector2(MODEL_ORIGIN_IN_AREA_X, MODEL_ORIGIN_IN_AREA_Y),
      MODEL_VIEW_SCALE,
    );

    const board = new Rectangle(0, 0, EXPERIMENT_AREA_WIDTH, EXPERIMENT_AREA_HEIGHT, {
      cornerRadius: 10,
      fill: SternGerlachColors.experimentAreaFillProperty,
      stroke: SternGerlachColors.experimentAreaStrokeProperty,
      lineWidth: 1.5,
    });
    this.addChild(board);

    this.wireLayer = new Node();
    this.deviceLayer = new Node();
    this.particleLayer = new ParticleLayerNode(model.particleSystem, this.mvt);
    this.beamLayer = new BeamCanvasNode(model.particleSystem, this.mvt);
    this.overlayLayer = new Node({ pickable: false });
    this.addChild(this.wireLayer);
    this.addChild(this.deviceLayer);
    this.addChild(this.particleLayer);
    this.addChild(this.beamLayer);
    this.addChild(this.overlayLayer);

    // Devices and wires rebuild independently so a wiring drag never disposes its own port node.
    model.graph.devices.elementAddedEmitter.addListener(() => this.rebuildDevices());
    model.graph.devices.elementRemovedEmitter.addListener(() => this.rebuildDevices());
    model.graph.wires.elementAddedEmitter.addListener(() => this.rebuildWires());
    model.graph.wires.elementRemovedEmitter.addListener(() => this.rebuildWires());
    model.isCustomProperty.link(() => this.rebuildDevices());
    // A system switch changes analyzer output counts and valid types; refresh ports and selectors.
    model.systemProperty.lazyLink(() => {
      this.rebuildDevices();
      this.rebuildWires();
    });

    this.rebuildDevices();
    this.rebuildWires();
  }

  /** Call once per frame so particles track their model positions and flashes fade. */
  public step(dt: number): void {
    // Continuous beams paint on the lightweight canvas; single fires use crisp circles.
    const source = this.model.graph.getSource();
    const continuous = source !== null && source.sourceModeProperty.value === SourceMode.CONTINUOUS;
    this.particleLayer.visible = !continuous;
    this.beamLayer.visible = continuous;
    if (continuous) {
      this.beamLayer.update();
    } else {
      this.particleLayer.update();
    }
    for (const analyzerNode of this.analyzerNodes) {
      analyzerNode.stepFlashes(dt);
    }
    for (const counterNode of this.counterNodes) {
      counterNode.stepFlash(dt);
    }
  }

  /**
   * Creates a device under the pointer (from a toolbox drag-out) and hands the in-progress press
   * off to that device's own body-move drag listener, so it follows the pointer onto the board.
   * @param factory - builds the device given its initial model position
   * @param event - the press event forwarded from the toolbox icon
   */
  public createAndDragDevice(factory: (position: Vector2) => ExperimentDevice, event: PressListenerEvent): void {
    const modelPosition = this.mvt.viewToModelPosition(this.globalToLocalPoint(event.pointer.point));
    const device = factory(modelPosition);
    this.clampToBoard(device);
    // Adding the device rebuilds the device layer synchronously, populating deviceDragListeners.
    this.model.graph.addDevice(device);
    const entry = this.deviceDragListeners.get(device);
    entry?.listener.press(event, entry.visual);
  }

  /** Recreates all device nodes from the current graph. */
  private rebuildDevices(): void {
    for (const child of this.deviceLayer.children.slice()) {
      child.dispose();
    }
    this.analyzerNodes = [];
    this.counterNodes = [];
    this.inputPorts = new Map();
    this.deviceDragListeners = new Map();

    const editable = this.model.isCustomProperty.value;
    for (const device of this.model.graph.devices) {
      this.deviceLayer.addChild(this.createDeviceNode(device, editable));
    }
  }

  /** Recreates all wire nodes from the current graph. */
  private rebuildWires(): void {
    for (const child of this.wireLayer.children.slice()) {
      child.dispose();
    }
    for (const wire of this.model.graph.wires) {
      this.wireLayer.addChild(new WireNode(wire, this.model.systemProperty, this.mvt));
    }
  }

  private createDeviceNode(device: ExperimentDevice, editable: boolean): Node {
    const visual = this.createDeviceVisual(device);
    const container = new Node({ children: [visual] });
    const posListener = (position: Vector2) => {
      container.translation = this.mvt.modelToViewPosition(position);
    };
    device.positionProperty.link(posListener);
    container.disposeEmitter.addListener(() => {
      device.positionProperty.unlink(posListener);
      visual.dispose();
    });

    // Exit-blocker radios sit on every analyzer (presets and Custom).
    if (device instanceof Analyzer) {
      const blockerSelector = this.createBlockerSelector(device, visual, editable);
      container.addChild(blockerSelector);
      container.disposeEmitter.addListener(() => blockerSelector.dispose());
    }

    if (editable) {
      this.makeEditable(device, container, visual);
    }
    return container;
  }

  private createDeviceVisual(device: ExperimentDevice): Node {
    if (device instanceof ParticleSource) {
      return new SourceNode(device, () => this.model.fireSingleParticle());
    }
    if (device instanceof Analyzer) {
      const analyzerNode = new AnalyzerNode(
        device,
        this.model.systemProperty,
        this.model.watchProperty,
        this.model.particleSystem.analyzerExitEmitter,
      );
      this.analyzerNodes.push(analyzerNode);
      return analyzerNode;
    }
    if (device instanceof Magnet) {
      return new MagnetNode(device, this.model.systemProperty);
    }
    if (device instanceof Counter) {
      // UP-ish ports get cyan bars, DOWN-ish magenta — decided by the feeding port.
      const feed = this.model.graph.getWiresInto(device)[0];
      const barFill =
        feed && feed.outputIndex === 1
          ? SternGerlachColors.counterBarDownFillProperty
          : SternGerlachColors.counterBarUpFillProperty;
      const counterNode = new CounterNode(
        device,
        this.model.totalDetectedProperty,
        this.model.expectedValuesVisibleProperty,
        this.model.deadEndProbabilityProperty,
        barFill,
        this.model.particleSystem.particleDetectedEmitter,
      );
      this.counterNodes.push(counterNode);
      return counterNode;
    }
    throw new Error(`no view for device ${device.id}`);
  }

  /** Adds builder-mode interactivity to a device container: drag-to-move, delete, and wiring ports. */
  private makeEditable(device: ExperimentDevice, container: Node, visual: Node): void {
    const system = () => this.model.systemProperty.value;

    // Drag to move (pointer). Ports sit on top and consume presses, so this only moves the body.
    let modelStart = device.positionProperty.value;
    let pointerStart = Vector2.ZERO;
    const moveListener = new DragListener({
      start: (event) => {
        modelStart = device.positionProperty.value;
        pointerStart = this.globalToLocalPoint(event.pointer.point);
      },
      drag: (event) => {
        const here = this.globalToLocalPoint(event.pointer.point);
        device.positionProperty.value = modelStart.plus(this.mvt.viewToModelDelta(here.minus(pointerStart)));
        this.clampToBoard(device);
      },
      end: () => this.snapToGrid(device),
    });
    visual.addInputListener(moveListener);
    visual.cursor = "pointer";
    // Remember this listener so a device dragged out of the toolbox can hand its press off to it.
    this.deviceDragListeners.set(device, { listener: moveListener, visual });

    // Keyboard: focusable, arrow-drag to move, Delete/Backspace to remove.
    container.tagName = "div";
    container.focusable = true;
    container.accessibleName = this.deviceAccessibleName(device);
    const keyboardDrag = new KeyboardDragListener({
      dragSpeed: 0,
      dragDelta: KEYBOARD_STEP * MODEL_VIEW_SCALE,
      drag: (_event, listener) => {
        const modelDelta = this.mvt.viewToModelDelta(listener.modelDelta);
        device.positionProperty.value = device.positionProperty.value.plus(modelDelta);
        this.clampToBoard(device);
      },
      end: () => this.snapToGrid(device),
    });
    container.addInputListener(keyboardDrag);

    if (device.isDeletable) {
      container.addInputListener({
        keydown: (event) => {
          const key = event.domEvent?.key;
          if (key === "Delete" || key === "Backspace") {
            this.model.graph.removeDevice(device);
          }
        },
      });
      container.addChild(this.createDeleteButton(device, visual));
    }

    // Output ports: draggable wiring sources.
    for (let outputIndex = 0; outputIndex < device.outputCount(system()); outputIndex++) {
      container.addChild(this.createOutputPort(device, outputIndex));
    }

    // Input port: a highlightable drop target.
    if (device.hasInput) {
      const offset = device.getInputPortOffset();
      const port = new PortNode(offset.x * MODEL_VIEW_SCALE, -offset.y * MODEL_VIEW_SCALE, false);
      this.inputPorts.set(device, port);
      container.addChild(port);
    }

    // Type selector for analyzers and magnets (the valid types depend on the system).
    if (device instanceof Analyzer || device instanceof Magnet) {
      const selector = this.createTypeSelector(device.typeProperty, visual);
      container.addChild(selector);
      container.disposeEmitter.addListener(() => selector.dispose());
    }
  }

  /** Compact radio group that blocks one analyzer exit (or none). */
  private createBlockerSelector(analyzer: Analyzer, visual: Node, editable: boolean): Node {
    const a11y = StringManager.getInstance().getA11yStrings();
    const controls = StringManager.getInstance().getControls();
    const system = this.model.systemProperty.value;

    const items: { value: number; createNode: () => Node }[] = [
      {
        value: NO_BLOCKED_OUTPUT,
        createNode: () =>
          new Text(controls.blockNoneStringProperty, {
            font: new PhetFont(10),
            fill: SternGerlachColors.controlSurfaceTextColorProperty,
          }),
      },
      {
        value: 0,
        createNode: () =>
          new Text(controls.blockUpStringProperty, {
            font: new PhetFont(10),
            fill: SternGerlachColors.controlSurfaceTextColorProperty,
          }),
      },
      {
        value: 1,
        createNode: () =>
          new Text(controls.blockDownStringProperty, {
            font: new PhetFont(10),
            fill: SternGerlachColors.controlSurfaceTextColorProperty,
          }),
      },
    ];
    if (system.stateCount === 3) {
      items.push({
        value: 2,
        createNode: () =>
          new Text(controls.blockZeroStringProperty, {
            font: new PhetFont(10),
            fill: SternGerlachColors.controlSurfaceTextColorProperty,
          }),
      });
    }

    const group = new RectangularRadioButtonGroup(analyzer.blockedOutputProperty, items, {
      orientation: "horizontal",
      spacing: 2,
      radioButtonOptions: {
        baseColor: SternGerlachColors.controlSurfaceColorProperty,
        xMargin: 4,
        yMargin: 2,
      },
      accessibleName: a11y.controls.blockerRadioGroupStringProperty,
    });
    group.centerX = 0;
    // Sit above the type selector in builder mode, otherwise just below the body.
    group.top = visual.bottom + (editable ? 28 : 4);
    return group;
  }

  /** A flat radio group letting the user pick an analyzer/magnet type (builder mode). */
  private createTypeSelector(typeProperty: Property<AnalyzerType>, visual: Node): Node {
    const a11y = StringManager.getInstance().getA11yStrings();
    const group = new RectangularRadioButtonGroup(
      typeProperty,
      this.model.systemProperty.value.analyzerTypes.map((type) => ({
        value: type,
        createNode: () =>
          new RichText(analyzerLabelMarkup(type), {
            font: new PhetFont(12),
            fill: SternGerlachColors.controlSurfaceTextColorProperty,
          }),
      })),
      {
        orientation: "horizontal",
        spacing: 3,
        // Do not spread FLAT_RECTANGULAR_BUTTON_OPTIONS: that uses ButtonNode.FlatAppearanceStrategy,
        // which lacks SELECTED/DESELECTED. RectangularRadioButton already defaults to its own flat strategy.
        radioButtonOptions: {
          baseColor: SternGerlachColors.controlSurfaceColorProperty,
          xMargin: 5,
          yMargin: 3,
        },
        accessibleName: a11y.builder.analyzerTypeComboBoxStringProperty,
      },
    );
    group.centerX = 0;
    group.top = visual.bottom + 4;
    return group;
  }

  /** A small × button that deletes the device (builder mode). */
  private createDeleteButton(device: ExperimentDevice, visual: Node): Node {
    const a11y = StringManager.getInstance().getA11yStrings();
    const label = new Text("✕", {
      font: new PhetFont({ size: 13, weight: "bold" }),
      fill: SternGerlachColors.analyzerLabelFillProperty,
    });
    const button = new Rectangle(0, 0, 18, 18, {
      cornerRadius: 4,
      fill: SternGerlachColors.destructiveButtonFillProperty,
      cursor: "pointer",
      children: [label],
      tagName: "button",
      accessibleName: a11y.builder.deleteDeviceButtonStringProperty,
    });
    label.center = new Vector2(9, 9);
    button.right = visual.right + 6;
    button.bottom = visual.top - 2;
    button.addInputListener(
      new DragListener({
        press: () => this.model.graph.removeDevice(device),
      }),
    );
    return button;
  }

  /** An output port handle whose drag rubber-bands a wire to a legal input port. */
  private createOutputPort(device: ExperimentDevice, outputIndex: number): PortNode {
    const a11y = StringManager.getInstance().getA11yStrings();
    const offset = device.getOutputPortOffset(outputIndex, this.model.systemProperty.value);
    const port = new PortNode(offset.x * MODEL_VIEW_SCALE, -offset.y * MODEL_VIEW_SCALE, true);
    port.tagName = "div";
    port.focusable = true;
    port.accessibleName = a11y.builder.outputPortPatternStringProperty.value.replace("{{index}}", `${outputIndex + 1}`);

    let rubberBand: Path | null = null;
    const listener = new DragListener({
      start: () => {
        rubberBand = new Path(null, {
          stroke: SternGerlachColors.portHighlightProperty,
          lineWidth: 3,
          lineDash: [7, 5],
        });
        this.overlayLayer.addChild(rubberBand);
      },
      drag: (event) => {
        if (!rubberBand) {
          return;
        }
        const start = this.mvt.modelToViewPosition(
          device.getOutputPortPosition(outputIndex, this.model.systemProperty.value),
        );
        const here = this.globalToLocalPoint(event.pointer.point);
        rubberBand.shape = new Shape().moveTo(start.x, start.y).lineTo(here.x, here.y);
        this.highlightTarget(this.findTarget(here, device));
      },
      end: (event) => {
        // On interruption `event` is null; then just cancel (no connection).
        const target = event ? this.findTarget(this.globalToLocalPoint(event.pointer.point), device) : null;
        this.highlightTarget(null);
        if (rubberBand) {
          this.overlayLayer.removeChild(rubberBand);
          rubberBand.dispose();
          rubberBand = null;
        }
        // Mutate the graph last: adding a wire rebuilds the wire layer.
        if (target) {
          this.connect(device, outputIndex, target);
        }
      },
    });
    port.addInputListener(listener);
    return port;
  }

  /** The device whose input port is closest to a point (within threshold), excluding the source. */
  private findTarget(point: Vector2, from: ExperimentDevice): ExperimentDevice | null {
    let best: ExperimentDevice | null = null;
    let bestDistance = CONNECT_THRESHOLD;
    for (const device of this.model.graph.devices) {
      if (device === from || !device.hasInput) {
        continue;
      }
      const portPos = this.mvt.modelToViewPosition(device.getInputPortPosition());
      const distance = portPos.distance(point);
      if (distance < bestDistance) {
        best = device;
        bestDistance = distance;
      }
    }
    return best;
  }

  private highlightTarget(target: ExperimentDevice | null): void {
    for (const [device, port] of this.inputPorts) {
      port.setHighlighted(device === target);
    }
  }

  /** Wires an output to a target input, re-routing (replacing) any wire already on that output. */
  private connect(source: ExperimentDevice, outputIndex: number, target: ExperimentDevice): void {
    const existing = this.model.graph.getWireFrom(source, outputIndex);
    const wire = new Wire(source, outputIndex, target);
    if (existing) {
      this.model.graph.removeWire(existing);
    }
    if (this.model.graph.canAddWire(wire)) {
      this.model.graph.addWire(wire);
    } else if (existing) {
      // The new connection is illegal; restore the previous wire.
      this.model.graph.addWire(existing);
    }
  }

  /** Snaps a device to the coarse builder grid, then keeps it on the board. */
  private snapToGrid(device: ExperimentDevice): void {
    const p = device.positionProperty.value;
    device.positionProperty.value = new Vector2(Math.round(p.x / GRID) * GRID, Math.round(p.y / GRID) * GRID);
    this.clampToBoard(device);
  }

  /** Keeps a device's body inside the experiment board. */
  private clampToBoard(device: ExperimentDevice): void {
    const minViewX = (device.halfWidth + BOARD_MARGIN) * MODEL_VIEW_SCALE;
    const maxViewX = EXPERIMENT_AREA_WIDTH - (device.halfWidth + BOARD_MARGIN) * MODEL_VIEW_SCALE;
    const minViewY = (device.halfHeight + BOARD_MARGIN) * MODEL_VIEW_SCALE;
    const maxViewY = EXPERIMENT_AREA_HEIGHT - (device.halfHeight + BOARD_MARGIN) * MODEL_VIEW_SCALE;
    const view = this.mvt.modelToViewPosition(device.positionProperty.value);
    device.positionProperty.value = this.mvt.viewToModelPosition(
      new Vector2(Math.min(maxViewX, Math.max(minViewX, view.x)), Math.min(maxViewY, Math.max(minViewY, view.y))),
    );
  }

  /** Accessible name for a builder-mode device container. */
  private deviceAccessibleName(device: ExperimentDevice): string {
    const a11y = StringManager.getInstance().getA11yStrings().builder;
    if (device instanceof ParticleSource) {
      return a11y.sourceDeviceStringProperty.value;
    }
    if (device instanceof Analyzer) {
      return a11y.analyzerDeviceStringProperty.value;
    }
    if (device instanceof Magnet) {
      return a11y.magnetDeviceStringProperty.value;
    }
    return a11y.counterDeviceStringProperty.value;
  }
}
