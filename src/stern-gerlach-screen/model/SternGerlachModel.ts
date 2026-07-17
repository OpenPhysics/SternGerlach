/**
 * SternGerlachModel.ts
 *
 * The top-level model: the experiment graph (populated from the selected
 * preset), the quantum engine, the animated particle system, and the user
 * settings (system, initial state, watch, expected values, θ/φ).
 *
 * Configuration changes — preset, system, initial state, watch, direction
 * angles, analyzer types, magnet fields, or graph structure — clear the
 * counters, remove in-flight particles, and recompute the analytic counter
 * probabilities, matching the original SPINS behavior of never mixing
 * statistics from different configurations.
 */

import { BooleanProperty, DerivedProperty, NumberProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { dotRandom, Vector2 } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import type { AnalyzerType } from "../../common/quantum/AnalyzerType.js";
import type { ComplexVector } from "../../common/quantum/ComplexVector.js";
import { OperatorTable } from "../../common/quantum/OperatorTable.js";
import { SpinSystem } from "../../common/quantum/SpinSystem.js";
import { TimeModel } from "../../common/TimeModel.js";
import { Analyzer } from "./devices/Analyzer.js";
import { Counter } from "./devices/Counter.js";
import type { ExperimentDevice } from "./devices/ExperimentDevice.js";
import { Magnet } from "./devices/Magnet.js";
import { ParticleSource } from "./devices/ParticleSource.js";
import { ExperimentDefinition } from "./ExperimentDefinition.js";
import { ExperimentEngine, type Rng } from "./ExperimentEngine.js";
import { ExperimentGraph } from "./ExperimentGraph.js";
import { InitialStateSetting } from "./InitialStateSetting.js";
import { ParticleSystem } from "./ParticleSystem.js";
import { UserStateModel } from "./UserStateModel.js";
import { Wire } from "./Wire.js";

/** A serializable snapshot of one device, used to retain the custom build across preset switches. */
type DeviceSnapshot =
  | { kind: "source"; position: Vector2 }
  | { kind: "analyzer"; position: Vector2; type: AnalyzerType }
  | { kind: "magnet"; position: Vector2; type: AnalyzerType; field: number }
  | { kind: "counter"; position: Vector2 };

/** A serializable snapshot of the whole custom graph (device descriptors + wires by index). */
type GraphSnapshot = {
  devices: DeviceSnapshot[];
  wires: { sourceIndex: number; outputIndex: number; targetIndex: number }[];
};

/** The graph the builder starts from the first time Custom is chosen: a lone source. */
const DEFAULT_CUSTOM_SNAPSHOT: GraphSnapshot = {
  devices: [{ kind: "source", position: new Vector2(0.4, 0) }],
  wires: [],
};

export class SternGerlachModel implements TModel {
  /** The quantum system being simulated. SU(3) joins the valid set via a preference (later milestone). */
  public readonly systemProperty: Property<SpinSystem>;

  /** The selected preset experiment. */
  public readonly experimentProperty: Property<ExperimentDefinition>;

  /** What the source emits: Random mixture (default), an Unknown mystery state, or the user state. */
  public readonly initialStateProperty: Property<InitialStateSetting>;

  /** The user-defined initial state (amplitudes + basis), used when initialState is USER. */
  public readonly userStateModel: UserStateModel;

  /** Whether the which-path lights are on. Watching destroys coherent recombination. */
  public readonly watchProperty: BooleanProperty;

  /** Whether counters show their green analytic expected-value line. */
  public readonly expectedValuesVisibleProperty: BooleanProperty;

  /** Global polar angle θ for every n̂-type device, radians (Java parity: one global pair). */
  public readonly thetaProperty: NumberProperty;

  /** Global azimuthal angle φ for every n̂-type device, radians. */
  public readonly phiProperty: NumberProperty;

  /** Sum of all counter counts — the denominator for histogram bars and percents. */
  public readonly totalDetectedProperty: NumberProperty;

  /** The device graph currently on the board. */
  public readonly graph: ExperimentGraph;

  /** Operators, eigenvectors, and hard-coded states. */
  public readonly operatorTable: OperatorTable;

  /** Monte-Carlo and analytic propagation over the graph. */
  public readonly engine: ExperimentEngine;

  /** The animated particles in flight. */
  public readonly particleSystem: ParticleSystem;

  /** Play/pause + elapsed time for the animation. Starts playing. */
  public readonly timer: TimeModel;

  /** Whether the SU(3) system is offered (Preferences → Simulation). */
  public readonly su3EnabledProperty: TReadOnlyProperty<boolean>;

  /** True while the free-form builder (CUSTOM) is active; gates all editing in the view. */
  public readonly isCustomProperty: TReadOnlyProperty<boolean>;

  private readonly rng: Rng;

  // The retained custom build, restored whenever CUSTOM is re-selected. Null until first captured.
  private customSnapshot: GraphSnapshot | null;

  // Guards against re-entrant configuration handling while a preset rebuild mutates the graph.
  private rebuildingGraph: boolean;

  // Tracks the per-device listeners attached to analyzers/magnets so they detach on removal.
  private readonly deviceListeners: Map<ExperimentDevice, () => void>;

  /**
   * @param rng - uniform [0,1) random source; tests inject a seeded one (default: dotRandom)
   * @param su3EnabledProperty - whether SU(3) is a selectable system (default: always off)
   */
  public constructor(
    rng: Rng = () => dotRandom.nextDouble(),
    su3EnabledProperty: TReadOnlyProperty<boolean> = new BooleanProperty(false),
  ) {
    this.rng = rng;
    this.su3EnabledProperty = su3EnabledProperty;
    this.systemProperty = new Property(SpinSystem.SPIN_HALF);
    this.experimentProperty = new Property(ExperimentDefinition.DEFAULT);
    this.initialStateProperty = new Property(InitialStateSetting.RANDOM);
    this.userStateModel = new UserStateModel();
    this.watchProperty = new BooleanProperty(false);
    this.expectedValuesVisibleProperty = new BooleanProperty(false);
    this.thetaProperty = new NumberProperty(Math.PI / 2);
    this.phiProperty = new NumberProperty(Math.PI / 4);
    this.totalDetectedProperty = new NumberProperty(0);

    this.operatorTable = new OperatorTable(this.thetaProperty.value, this.phiProperty.value);
    this.graph = new ExperimentGraph();
    this.engine = new ExperimentEngine(this.graph, this.operatorTable);
    this.particleSystem = new ParticleSystem(
      this.graph,
      this.engine,
      this.systemProperty,
      this.watchProperty,
      this.initialStateProperty,
      this.rng,
      () => this.currentUserState(),
    );
    this.timer = new TimeModel(true);
    this.rebuildingGraph = false;
    this.deviceListeners = new Map();
    this.customSnapshot = null;
    this.isCustomProperty = new DerivedProperty([this.experimentProperty], (experiment) => experiment.isCustom);

    // Detected particles roll into the shared total (counter counts drive the histogram bars).
    this.particleSystem.particleDetectedEmitter.addListener(() => {
      this.totalDetectedProperty.value++;
    });

    // Watch analyzer types and magnet dials; changing either is a configuration change.
    this.graph.devices.elementAddedEmitter.addListener((device) => this.attachDeviceListener(device));
    this.graph.devices.elementRemovedEmitter.addListener((device) => this.detachDeviceListener(device));

    // Structural graph edits (builder mode) invalidate statistics.
    this.graph.changedEmitter.addListener(() => this.handleConfigurationChange());

    // Selecting a preset rebuilds the board; leaving CUSTOM first stashes the current build.
    this.experimentProperty.lazyLink((_value, oldValue) => {
      if (oldValue === ExperimentDefinition.CUSTOM) {
        this.customSnapshot = this.captureSnapshot();
      }
      this.rebuildGraph();
    });

    // A system switch rebuilds a preset, but only re-themes the retained custom graph in-place.
    this.systemProperty.lazyLink(() => {
      if (this.experimentProperty.value === ExperimentDefinition.CUSTOM) {
        this.applySetSystemSemantics();
      } else {
        this.rebuildGraph();
      }
    });

    // Disabling SU(3) while it is active falls the system back to spin-½ (Java parity).
    this.su3EnabledProperty.lazyLink((enabled) => {
      if (!enabled && this.systemProperty.value === SpinSystem.SU3) {
        this.systemProperty.value = SpinSystem.SPIN_HALF;
      }
    });

    // Initial state and watch invalidate statistics without touching the board.
    this.initialStateProperty.lazyLink(() => this.handleConfigurationChange());
    this.watchProperty.lazyLink(() => this.handleConfigurationChange());

    // Editing the user-defined state (amplitudes or basis) is a configuration change.
    const onUserStateChange = () => {
      if (this.initialStateProperty.value.isUser) {
        this.handleConfigurationChange();
      }
    };
    this.userStateModel.basisProperty.lazyLink(onUserStateChange);
    for (const property of this.userStateModel.properties) {
      property.lazyLink(onUserStateChange);
    }

    // The global direction angles reshape the Sn operators.
    const applyAngles = () => {
      this.operatorTable.setDirectionAngles(this.thetaProperty.value, this.phiProperty.value);
      this.handleConfigurationChange();
    };
    this.thetaProperty.lazyLink(applyAngles);
    this.phiProperty.lazyLink(applyAngles);

    this.rebuildGraph();
  }

  /** Fires a single particle from the source (SINGLE mode button). */
  public fireSingleParticle(): void {
    this.particleSystem.fireOne();
  }

  /**
   * Analytic batch: samples n particles from the exact counter distribution in one shot
   * (Spins.doAction). Dead-end probability mass produces no count, as in Java.
   */
  public doN(n: number): void {
    const counters = this.graph.getCounters();
    const cumulative: number[] = [];
    let running = 0;
    for (const counter of counters) {
      running += counter.probabilityProperty.value;
      cumulative.push(running);
    }
    for (let sample = 0; sample < n; sample++) {
      const rand = this.rng();
      const index = cumulative.findIndex((edge) => rand < edge);
      const counter = index >= 0 ? counters[index] : undefined;
      if (counter) {
        counter.increment();
        this.totalDetectedProperty.value++;
      }
    }
  }

  /** Zeroes every counter and the shared total (Reset Counts / configuration change). */
  public clearCounters(): void {
    for (const counter of this.graph.getCounters()) {
      counter.clearCount();
    }
    this.totalDetectedProperty.value = 0;
  }

  /** Resets all model state to initial values (Reset All). */
  public reset(): void {
    this.watchProperty.reset();
    this.expectedValuesVisibleProperty.reset();
    this.initialStateProperty.reset();
    this.userStateModel.reset();
    this.thetaProperty.reset();
    this.phiProperty.reset();
    this.systemProperty.reset();
    this.experimentProperty.reset();
    this.graph.getSource()?.reset();
    this.timer.reset();

    // Reset All discards any custom build.
    this.customSnapshot = null;

    // Rebuild even if the preset/system were already at their defaults (fresh devices).
    this.rebuildGraph();
  }

  /**
   * Steps the model forward by dt seconds: advances the clock and, while playing,
   * the particle animation.
   */
  public step(dt: number): void {
    this.timer.step(dt);
    if (this.timer.isPlayingProperty.value) {
      this.particleSystem.step(dt);
    }
  }

  /** The user-defined state rotated into the computational Z basis for the active system. */
  public currentUserState(): ComplexVector {
    return this.userStateModel.toZBasisVector(this.operatorTable, this.systemProperty.value);
  }

  /** Recomputes the analytic probability for every counter (expected-value lines, Do-N). */
  public recomputeProbabilities(): void {
    const probabilities = this.engine.computeCounterProbabilities(
      this.initialStateProperty.value,
      {
        system: this.systemProperty.value,
        watch: this.watchProperty.value,
      },
      this.currentUserState(),
    );
    for (const [counter, probability] of probabilities) {
      counter.probabilityProperty.value = probability;
    }
  }

  /** Rebuilds the board from the selected preset, or restores the retained custom build. */
  private rebuildGraph(): void {
    this.rebuildingGraph = true;
    try {
      if (this.experimentProperty.value === ExperimentDefinition.CUSTOM) {
        this.restoreSnapshot(this.customSnapshot ?? DEFAULT_CUSTOM_SNAPSHOT);
      } else {
        this.experimentProperty.value.buildInto(this.graph, this.systemProperty.value);
      }
    } finally {
      this.rebuildingGraph = false;
    }
    this.handleConfigurationChange();
  }

  /**
   * Replicates the Java setSystem on the live custom graph: reset every analyzer/magnet to the
   * system default type and, when entering a 2-state system, delete wires from the (now absent)
   * third output port. Presets rebuild from scratch instead, so this only runs in CUSTOM mode.
   */
  private applySetSystemSemantics(): void {
    const system = this.systemProperty.value;
    this.rebuildingGraph = true;
    try {
      for (const device of this.graph.devices) {
        if (device instanceof Analyzer || device instanceof Magnet) {
          device.typeProperty.value = system.defaultType;
        }
      }
      if (system.stateCount === 2) {
        for (const wire of this.graph.wires.filter((w) => w.outputIndex === 2)) {
          this.graph.removeWire(wire);
        }
      }
    } finally {
      this.rebuildingGraph = false;
    }
    this.handleConfigurationChange();
  }

  /** Captures the current graph as a snapshot (used to retain the custom build). */
  private captureSnapshot(): GraphSnapshot {
    const devices = this.graph.devices.slice();
    const deviceSnapshots = devices.map((device): DeviceSnapshot => {
      if (device instanceof ParticleSource) {
        return { kind: "source", position: device.positionProperty.value.copy() };
      }
      if (device instanceof Analyzer) {
        return { kind: "analyzer", position: device.positionProperty.value.copy(), type: device.typeProperty.value };
      }
      if (device instanceof Magnet) {
        return {
          kind: "magnet",
          position: device.positionProperty.value.copy(),
          type: device.typeProperty.value,
          field: device.fieldNumberProperty.value,
        };
      }
      return { kind: "counter", position: device.positionProperty.value.copy() };
    });
    const wires = this.graph.wires.map((wire) => ({
      sourceIndex: devices.indexOf(wire.source),
      outputIndex: wire.outputIndex,
      targetIndex: devices.indexOf(wire.target),
    }));
    return { devices: deviceSnapshots, wires };
  }

  /** Rebuilds the graph from a snapshot. */
  private restoreSnapshot(snapshot: GraphSnapshot): void {
    this.graph.clear();
    const devices = snapshot.devices.map((snap): ExperimentDevice => this.deviceFromSnapshot(snap));
    for (const device of devices) {
      this.graph.addDevice(device);
    }
    for (const wire of snapshot.wires) {
      const source = devices[wire.sourceIndex];
      const target = devices[wire.targetIndex];
      if (source && target) {
        this.graph.addWire(new Wire(source, wire.outputIndex, target));
      }
    }
  }

  /** Reconstructs a single device from its snapshot descriptor. */
  private deviceFromSnapshot(snap: DeviceSnapshot): ExperimentDevice {
    if (snap.kind === "source") {
      return new ParticleSource(snap.position.copy());
    }
    if (snap.kind === "analyzer") {
      return new Analyzer(snap.position.copy(), snap.type);
    }
    if (snap.kind === "magnet") {
      const magnet = new Magnet(snap.position.copy(), snap.type);
      magnet.fieldNumberProperty.value = snap.field;
      return magnet;
    }
    return new Counter(snap.position.copy());
  }

  /** Any configuration change: drop in-flight particles, zero counters, refresh probabilities. */
  private handleConfigurationChange(): void {
    if (this.rebuildingGraph) {
      return;
    }
    this.particleSystem.clear();
    this.clearCounters();
    this.recomputeProbabilities();
  }

  /** Configuration listeners for a newly added analyzer or magnet. */
  private attachDeviceListener(device: ExperimentDevice): void {
    const onChange = () => this.handleConfigurationChange();
    if (device instanceof Analyzer) {
      device.typeProperty.lazyLink(onChange);
      this.deviceListeners.set(device, () => device.typeProperty.unlink(onChange));
    } else if (device instanceof Magnet) {
      device.typeProperty.lazyLink(onChange);
      device.fieldNumberProperty.lazyLink(onChange);
      this.deviceListeners.set(device, () => {
        device.typeProperty.unlink(onChange);
        device.fieldNumberProperty.unlink(onChange);
      });
    } else if (device instanceof ParticleSource) {
      // Source mode/rate changes do not invalidate statistics.
    }
  }

  private detachDeviceListener(device: ExperimentDevice): void {
    this.deviceListeners.get(device)?.();
    this.deviceListeners.delete(device);
  }
}
