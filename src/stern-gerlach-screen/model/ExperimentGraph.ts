/**
 * ExperimentGraph.ts
 *
 * The device graph of an experiment: observable collections of devices and
 * wires, plus the connectivity queries the engine and views need. One graph
 * model serves both preset experiments (populated by an
 * ExperimentDefinition) and the free-form builder (edited directly).
 *
 * Structural invariants, enforced on mutation (violations throw — Java would
 * hang or mis-compute on such graphs):
 *   - at most one wire per output port
 *   - every wire into a device comes from the same source device (this is
 *     what makes coherent recombination well-defined)
 *   - no cycles
 *   - at most one ParticleSource, and it cannot be wired into
 */

import { createObservableArray, Emitter, type ObservableArray } from "scenerystack/axon";
import { Counter } from "./devices/Counter.js";
import type { ExperimentDevice } from "./devices/ExperimentDevice.js";
import { ParticleSource } from "./devices/ParticleSource.js";
import type { Wire } from "./Wire.js";

export class ExperimentGraph {
  /** All devices on the board, including the source. */
  public readonly devices: ObservableArray<ExperimentDevice>;

  /** All wires connecting output ports to input ports. */
  public readonly wires: ObservableArray<Wire>;

  /** Fires after any structural change (device or wire added/removed). */
  public readonly changedEmitter: Emitter;

  public constructor() {
    this.devices = createObservableArray();
    this.wires = createObservableArray();
    this.changedEmitter = new Emitter();

    const notify = () => this.changedEmitter.emit();
    this.devices.elementAddedEmitter.addListener(notify);
    this.devices.elementRemovedEmitter.addListener(notify);
    this.wires.elementAddedEmitter.addListener(notify);
    this.wires.elementRemovedEmitter.addListener(notify);
  }

  /** Adds a device. At most one ParticleSource may exist. */
  public addDevice(device: ExperimentDevice): void {
    if (device instanceof ParticleSource && this.getSource() !== null) {
      throw new Error("the graph already has a particle source");
    }
    if (this.devices.includes(device)) {
      throw new Error(`device ${device.id} is already in the graph`);
    }
    this.devices.push(device);
  }

  /** Removes a device and every wire attached to it. */
  public removeDevice(device: ExperimentDevice): void {
    for (const wire of this.wires.filter((w) => w.source === device || w.target === device)) {
      this.wires.remove(wire);
    }
    this.devices.remove(device);
  }

  /**
   * Adds a wire, enforcing the structural invariants. Throws on violation; callers performing
   * user-driven edits should validate with canAddWire first.
   */
  public addWire(wire: Wire): void {
    const problem = this.wireProblem(wire);
    if (problem !== null) {
      throw new Error(problem);
    }
    this.wires.push(wire);
  }

  /** Whether the wire could be added without violating any invariant. */
  public canAddWire(wire: Wire): boolean {
    return this.wireProblem(wire) === null;
  }

  /** Removes a wire. */
  public removeWire(wire: Wire): void {
    this.wires.remove(wire);
  }

  /** Removes every device and wire. */
  public clear(): void {
    // Copy before iterating: removal mutates the observable arrays.
    for (const wire of this.wires.slice()) {
      this.wires.remove(wire);
    }
    for (const device of this.devices.slice()) {
      this.devices.remove(device);
    }
  }

  /** The device wired to the given output port, or null if the port is unwired (Java getNextComponent). */
  public getNext(device: ExperimentDevice, outputIndex: number): ExperimentDevice | null {
    const wire = this.wires.find((w) => w.source === device && w.outputIndex === outputIndex);
    return wire ? wire.target : null;
  }

  /** All wires whose target is the given device. */
  public getWiresInto(device: ExperimentDevice): Wire[] {
    return this.wires.filter((w) => w.target === device);
  }

  /** The wire leaving the given output port, if any. */
  public getWireFrom(device: ExperimentDevice, outputIndex: number): Wire | null {
    return this.wires.find((w) => w.source === device && w.outputIndex === outputIndex) ?? null;
  }

  /** The experiment's single particle source, or null while the graph is empty. */
  public getSource(): ParticleSource | null {
    return (this.devices.find((device) => device instanceof ParticleSource) as ParticleSource | undefined) ?? null;
  }

  /** All counters, in insertion order (presets insert top-to-bottom). */
  public getCounters(): Counter[] {
    return this.devices.filter((device) => device instanceof Counter) as Counter[];
  }

  /** Null if the wire is legal, otherwise a description of the violated invariant. */
  private wireProblem(wire: Wire): string | null {
    if (!(this.devices.includes(wire.source) && this.devices.includes(wire.target))) {
      return "both wire endpoints must be devices in the graph";
    }
    if (!wire.target.hasInput) {
      return `${wire.target.id} has no input port`;
    }
    if (wire.source === wire.target) {
      return "a device cannot be wired to itself";
    }
    if (this.getWireFrom(wire.source, wire.outputIndex) !== null) {
      return `output ${wire.outputIndex} of ${wire.source.id} is already wired`;
    }

    // Recombination requires every wire into a device to come from the same source device.
    const wiresIn = this.getWiresInto(wire.target);
    if (wiresIn.some((w) => w.source !== wire.source)) {
      return `${wire.target.id} already receives input from a different device`;
    }

    // Reject cycles: the wire may not make its source reachable from its target.
    if (this.isReachable(wire.target, wire.source)) {
      return "the wire would create a cycle";
    }

    return null;
  }

  /** Whether `to` can be reached from `from` by following wires forward. */
  private isReachable(from: ExperimentDevice, to: ExperimentDevice): boolean {
    if (from === to) {
      return true;
    }
    const visited = new Set<ExperimentDevice>([from]);
    const frontier: ExperimentDevice[] = [from];
    while (frontier.length > 0) {
      const device = frontier.pop() as ExperimentDevice;
      for (const wire of this.wires) {
        if (wire.source === device && !visited.has(wire.target)) {
          if (wire.target === to) {
            return true;
          }
          visited.add(wire.target);
          frontier.push(wire.target);
        }
      }
    }
    return false;
  }
}
