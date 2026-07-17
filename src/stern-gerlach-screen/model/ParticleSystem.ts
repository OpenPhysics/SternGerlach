/**
 * ParticleSystem.ts
 *
 * Owns and animates the live particles. Spawns them at the source (one per
 * fire() in SINGLE mode, a rate-driven stream in CONTINUOUS mode, capped at
 * MAX_LIVE_PARTICLES), flies them along straight rays between ports, and on
 * each device arrival delegates the physics to ExperimentEngine:
 * counters increment, magnets precess, analyzers collapse and re-route.
 * Dead ends (unwired output ports) make the particle vanish.
 *
 * Emits analyzerExitEmitter(analyzer, outputIndex) on every analyzer transit
 * so the view can flash the watch lights, and particleDetectedEmitter(counter)
 * on every detection.
 */

import { Emitter, type TReadOnlyProperty } from "scenerystack/axon";
import type { SpinSystem } from "../../common/quantum/SpinSystem.js";
import { MAX_LIVE_PARTICLES, PARTICLE_SPEED } from "../../SimConstants.js";
import { Analyzer } from "./devices/Analyzer.js";
import { Counter } from "./devices/Counter.js";
import { SourceMode } from "./devices/ParticleSource.js";
import type { ExperimentEngine, Rng } from "./ExperimentEngine.js";
import type { ExperimentGraph } from "./ExperimentGraph.js";
import type { InitialStateSetting } from "./InitialStateSetting.js";
import { Particle } from "./Particle.js";

export class ParticleSystem {
  /** Live particles, in spawn order. Read directly by particle/beam views each frame. */
  public readonly particles: Particle[];

  /** Fires (analyzer, outputIndex) whenever a particle leaves an analyzer — drives watch flashes. */
  public readonly analyzerExitEmitter: Emitter<[Analyzer, number]>;

  /** Fires (counter) whenever a particle is detected. */
  public readonly particleDetectedEmitter: Emitter<[Counter]>;

  /** Fires whenever particles are added, moved, or removed (repaint hook for canvas views). */
  public readonly changedEmitter: Emitter;

  private readonly graph: ExperimentGraph;
  private readonly engine: ExperimentEngine;
  private readonly systemProperty: TReadOnlyProperty<SpinSystem>;
  private readonly watchProperty: TReadOnlyProperty<boolean>;
  private readonly initialStateProperty: TReadOnlyProperty<InitialStateSetting>;
  private readonly rng: Rng;

  // Fractional particles accumulated in CONTINUOUS mode; a particle spawns per whole unit.
  private emissionAccumulator: number;

  public constructor(
    graph: ExperimentGraph,
    engine: ExperimentEngine,
    systemProperty: TReadOnlyProperty<SpinSystem>,
    watchProperty: TReadOnlyProperty<boolean>,
    initialStateProperty: TReadOnlyProperty<InitialStateSetting>,
    rng: Rng,
  ) {
    this.particles = [];
    this.analyzerExitEmitter = new Emitter({ parameters: [{ valueType: Analyzer }, { valueType: "number" }] });
    this.particleDetectedEmitter = new Emitter({ parameters: [{ valueType: Counter }] });
    this.changedEmitter = new Emitter();
    this.graph = graph;
    this.engine = engine;
    this.systemProperty = systemProperty;
    this.watchProperty = watchProperty;
    this.initialStateProperty = initialStateProperty;
    this.rng = rng;
    this.emissionAccumulator = 0;
  }

  /**
   * Spawns one particle at the source's output port, carrying a freshly sampled initial
   * state. No-op if the source is missing, unwired, or the live cap is reached.
   */
  public fireOne(): void {
    const source = this.graph.getSource();
    if (source === null || this.particles.length >= MAX_LIVE_PARTICLES) {
      return;
    }
    const next = this.graph.getNext(source, 0);
    if (next === null) {
      return;
    }
    const system = this.systemProperty.value;
    const state = this.engine.sampleInitialState(this.initialStateProperty.value, system, this.rng);
    const start = source.getOutputPortPosition(0, system);
    this.particles.push(new Particle(start.copy(), state, next, next.getInputPortPosition()));
    this.changedEmitter.emit();
  }

  /**
   * Advances all particles by dt seconds and, in CONTINUOUS mode, spawns new ones at the
   * source's emission rate.
   */
  public step(dt: number): void {
    this.emitContinuous(dt);

    if (this.particles.length === 0) {
      return;
    }

    const system = this.systemProperty.value;
    const options = { system, watch: this.watchProperty.value };

    // Iterate over a copy: arrivals can remove particles.
    for (const particle of this.particles.slice()) {
      let budget = PARTICLE_SPEED * dt;

      // A fast particle may cross several devices in one step; the graph is acyclic,
      // so the chain of arrivals always terminates.
      while (budget > 0) {
        const toTarget = particle.targetPoint.minus(particle.position);
        const distance = toTarget.magnitude;
        if (budget < distance) {
          particle.position = particle.position.plus(toTarget.timesScalar(budget / distance));
          break;
        }
        budget -= distance;
        particle.position = particle.targetPoint;
        if (!this.handleArrival(particle, options)) {
          break;
        }
      }
    }
    this.changedEmitter.emit();
  }

  /** Removes all live particles (configuration changed or Reset All). */
  public clear(): void {
    this.particles.length = 0;
    this.emissionAccumulator = 0;
    this.changedEmitter.emit();
  }

  /** Continuous-beam spawning: emissionRate particles per second, capped. */
  private emitContinuous(dt: number): void {
    const source = this.graph.getSource();
    if (source === null || source.sourceModeProperty.value !== SourceMode.CONTINUOUS) {
      this.emissionAccumulator = 0;
      return;
    }
    this.emissionAccumulator += source.emissionRateProperty.value * dt;
    while (this.emissionAccumulator >= 1) {
      this.emissionAccumulator -= 1;
      if (this.particles.length >= MAX_LIVE_PARTICLES) {
        this.emissionAccumulator = 0;
        break;
      }
      this.fireOne();
    }
  }

  /**
   * The particle has reached its target device. Returns true if the particle survived
   * (was re-routed) and may keep moving this step.
   */
  private handleArrival(particle: Particle, options: { system: SpinSystem; watch: boolean }): boolean {
    const device = particle.target;

    if (device instanceof Counter) {
      device.increment();
      this.remove(particle);
      this.particleDetectedEmitter.emit(device);
      return false;
    }

    const result = this.engine.transitDevice(device, particle.state, options, this.rng);
    particle.state = result.newState;
    if (device instanceof Analyzer) {
      this.analyzerExitEmitter.emit(device, result.outputIndex);
    }

    if (result.next === null) {
      // Dead end: the output port is unwired, the particle vanishes.
      this.remove(particle);
      return false;
    }
    particle.position = device.getOutputPortPosition(result.outputIndex, options.system);
    particle.target = result.next;
    particle.targetPoint = result.next.getInputPortPosition();
    return true;
  }

  private remove(particle: Particle): void {
    const index = this.particles.indexOf(particle);
    if (index >= 0) {
      this.particles.splice(index, 1);
    }
  }
}
