/**
 * Shared helpers for the model test suite: a seeded deterministic RNG and
 * small graph-building shortcuts.
 */

import { Vector2 } from "scenerystack/dot";
import type { AnalyzerType } from "../../src/common/quantum/AnalyzerType.js";
import { Analyzer } from "../../src/stern-gerlach-screen/model/devices/Analyzer.js";
import { Counter } from "../../src/stern-gerlach-screen/model/devices/Counter.js";
import type { ExperimentDevice } from "../../src/stern-gerlach-screen/model/devices/ExperimentDevice.js";
import { ParticleSource } from "../../src/stern-gerlach-screen/model/devices/ParticleSource.js";
import type { Rng } from "../../src/stern-gerlach-screen/model/ExperimentEngine.js";
import type { ExperimentGraph } from "../../src/stern-gerlach-screen/model/ExperimentGraph.js";
import { Wire } from "../../src/stern-gerlach-screen/model/Wire.js";

/** Deterministic seeded RNG (mulberry32) for reproducible Monte-Carlo tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let nextX = 0;

/** Adds a source to the graph and returns it. */
export function addSource(graph: ExperimentGraph): ParticleSource {
  const source = new ParticleSource(new Vector2(nextX++, 0));
  graph.addDevice(source);
  return source;
}

/** Adds an analyzer of the given type and returns it. */
export function addAnalyzer(graph: ExperimentGraph, type: AnalyzerType): Analyzer {
  const analyzer = new Analyzer(new Vector2(nextX++, 0), type);
  graph.addDevice(analyzer);
  return analyzer;
}

/** Adds a counter and returns it. */
export function addCounter(graph: ExperimentGraph): Counter {
  const counter = new Counter(new Vector2(nextX++, 0));
  graph.addDevice(counter);
  return counter;
}

/** Wires source output `outputIndex` to `target`. */
export function wire(
  graph: ExperimentGraph,
  source: ExperimentDevice,
  outputIndex: number,
  target: ExperimentDevice,
): void {
  graph.addWire(new Wire(source, outputIndex, target));
}
