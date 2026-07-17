/**
 * ExperimentDefinition.ts
 *
 * A preset experiment: a named recipe that populates the shared
 * ExperimentGraph with devices and wires. Presets fill the same collections
 * the free-form builder edits, so one device-graph model serves both.
 *
 * The recipe is parametrized by the active SpinSystem: analyzers grow a third
 * output (and a third counter) under 3-state systems, and analyzer types fall
 * back to the system default where a preset's type is not available (e.g. Z
 * under SU(3) becomes λ₁).
 *
 * Layout: model coordinates, source on the left, beam flowing +x; counters
 * for one analyzer stack in a column so the group reads like a histogram.
 */

import { Vector2 } from "scenerystack/dot";
import { AnalyzerType } from "../../common/quantum/AnalyzerType.js";
import type { SpinSystem } from "../../common/quantum/SpinSystem.js";
import { Analyzer } from "./devices/Analyzer.js";
import { Counter } from "./devices/Counter.js";
import { Magnet } from "./devices/Magnet.js";
import { ParticleSource } from "./devices/ParticleSource.js";
import type { ExperimentGraph } from "./ExperimentGraph.js";
import { Wire } from "./Wire.js";

/** Vertical spacing between stacked counters, model units. */
const COUNTER_SPACING = 0.42;

/** The analyzer type to use under `system`, falling back to the system default. */
function typeFor(preferred: AnalyzerType, system: SpinSystem): AnalyzerType {
  return system.analyzerTypes.includes(preferred) ? preferred : system.defaultType;
}

/**
 * Adds one counter per remaining unwired output of `analyzer`, stacked in a column at x,
 * vertically centered on centerY (default: the analyzer's center). Output 0 (UP) maps to
 * the top counter.
 */
function addCountersForAnalyzer(
  graph: ExperimentGraph,
  system: SpinSystem,
  analyzer: Analyzer,
  x: number,
  centerY: number = analyzer.positionProperty.value.y,
): void {
  const outputs: number[] = [];
  for (let outputIndex = 0; outputIndex < analyzer.outputCount(system); outputIndex++) {
    if (graph.getNext(analyzer, outputIndex) === null) {
      outputs.push(outputIndex);
    }
  }

  // Visual order top-to-bottom is UP (0), NONE (2), DOWN (1) — same as the analyzer's ports.
  const visualOrder = [...outputs].sort((a, b) => portRank(a) - portRank(b));
  visualOrder.forEach((outputIndex, row) => {
    const y = centerY + ((visualOrder.length - 1) / 2 - row) * COUNTER_SPACING;
    const counter = new Counter(new Vector2(x, y));
    graph.addDevice(counter);
    graph.addWire(new Wire(analyzer, outputIndex, counter));
  });
}

/** Top-to-bottom display rank of an analyzer output port: UP, then NONE, then DOWN. */
function portRank(outputIndex: number): number {
  return outputIndex === 0 ? 0 : outputIndex === 2 ? 1 : 2;
}

export class ExperimentDefinition {
  /** Key into the `experiments` string group (view resolves it to a localized name). */
  public readonly nameKey: string;

  private readonly builder: (graph: ExperimentGraph, system: SpinSystem) => void;

  public constructor(nameKey: string, builder: (graph: ExperimentGraph, system: SpinSystem) => void) {
    this.nameKey = nameKey;
    this.builder = builder;
  }

  /** Clears the graph and rebuilds it as this preset under the given system. */
  public buildInto(graph: ExperimentGraph, system: SpinSystem): void {
    graph.clear();
    this.builder(graph, system);
  }

  /** Source → one analyzer of the given type → a counter per output. */
  private static singleAnalyzer(nameKey: string, type: AnalyzerType): ExperimentDefinition {
    return new ExperimentDefinition(nameKey, (graph, system) => {
      const source = new ParticleSource(new Vector2(0.4, 0));
      const analyzer = new Analyzer(new Vector2(1.4, 0), typeFor(type, system));
      graph.addDevice(source);
      graph.addDevice(analyzer);
      graph.addWire(new Wire(source, 0, analyzer));
      addCountersForAnalyzer(graph, system, analyzer, 2.6);
    });
  }

  /** Source → first analyzer; its UP output feeds a second analyzer; counters everywhere else. */
  private static chained(nameKey: string, firstType: AnalyzerType, secondType: AnalyzerType): ExperimentDefinition {
    return new ExperimentDefinition(nameKey, (graph, system) => {
      const source = new ParticleSource(new Vector2(0.35, 0.3));
      const first = new Analyzer(new Vector2(1.15, 0.3), typeFor(firstType, system));
      const second = new Analyzer(new Vector2(2.15, 0.7), typeFor(secondType, system));
      graph.addDevice(source);
      graph.addDevice(first);
      graph.addDevice(second);
      graph.addWire(new Wire(source, 0, first));
      graph.addWire(new Wire(first, 0, second));
      addCountersForAnalyzer(graph, system, second, 3.3);
      addCountersForAnalyzer(graph, system, first, 3.3, -0.35);
    });
  }

  /**
   * The interferometer: first analyzer's UP output feeds a middle analyzer whose outputs are
   * ALL recombined into a final analyzer of the first's type. With Watch off the middle
   * measurement leaves no record, so the final analyzer sees the original state restored.
   */
  private static interferometer(): ExperimentDefinition {
    return new ExperimentDefinition("interferometer", (graph, system) => {
      const source = new ParticleSource(new Vector2(0.3, 0.25));
      const first = new Analyzer(new Vector2(1.0, 0.25), typeFor(AnalyzerType.Z, system));
      const middle = new Analyzer(new Vector2(1.85, 0.55), typeFor(AnalyzerType.X, system));
      const last = new Analyzer(new Vector2(2.7, 0.55), typeFor(AnalyzerType.Z, system));
      graph.addDevice(source);
      graph.addDevice(first);
      graph.addDevice(middle);
      graph.addDevice(last);
      graph.addWire(new Wire(source, 0, first));
      graph.addWire(new Wire(first, 0, middle));
      for (let outputIndex = 0; outputIndex < middle.outputCount(system); outputIndex++) {
        graph.addWire(new Wire(middle, outputIndex, last));
      }
      addCountersForAnalyzer(graph, system, last, 3.55);
      addCountersForAnalyzer(graph, system, first, 3.55, -0.5);
    });
  }

  /**
   * Magnet precession: a Z analyzer polarizes the beam; its UP output passes through a magnet
   * (dial the field to precess the spin) and into an X analyzer whose counts sweep with the
   * field. The Z analyzer's other outputs are counted directly.
   */
  private static magnetPrecession(): ExperimentDefinition {
    return new ExperimentDefinition("magnet", (graph, system) => {
      const source = new ParticleSource(new Vector2(0.35, 0.3));
      const first = new Analyzer(new Vector2(1.05, 0.3), typeFor(AnalyzerType.Z, system));
      const magnet = new Magnet(new Vector2(1.8, 0.6), typeFor(AnalyzerType.Y, system));
      const last = new Analyzer(new Vector2(2.6, 0.6), typeFor(AnalyzerType.X, system));
      graph.addDevice(source);
      graph.addDevice(first);
      graph.addDevice(magnet);
      graph.addDevice(last);
      graph.addWire(new Wire(source, 0, first));
      graph.addWire(new Wire(first, 0, magnet));
      graph.addWire(new Wire(magnet, 0, last));
      addCountersForAnalyzer(graph, system, last, 3.4);
      addCountersForAnalyzer(graph, system, first, 3.4, -0.45);
    });
  }

  /**
   * Recombination: the first analyzer's UP and NONE outputs merge into a second analyzer while its
   * DOWN output is counted directly. Under a 3-state system this is the classic 2-of-3 coherent
   * recombination (ProjectOut of the DOWN eigencomponent); under spin-½ both outputs merge, restoring
   * the input state at the second analyzer.
   */
  private static recombination(): ExperimentDefinition {
    return new ExperimentDefinition("recombination", (graph, system) => {
      const source = new ParticleSource(new Vector2(0.3, 0.25));
      const first = new Analyzer(new Vector2(1.05, 0.25), typeFor(AnalyzerType.Z, system));
      const second = new Analyzer(new Vector2(2.15, 0.55), typeFor(AnalyzerType.X, system));
      graph.addDevice(source);
      graph.addDevice(first);
      graph.addDevice(second);
      graph.addWire(new Wire(source, 0, first));
      // Merge UP (0) with NONE (2) for 3-state systems; merge both outputs for spin-½.
      const mergedOutputs = system.stateCount === 3 ? [0, 2] : [0, 1];
      for (const outputIndex of mergedOutputs) {
        graph.addWire(new Wire(first, outputIndex, second));
      }
      addCountersForAnalyzer(graph, system, second, 3.4);
      addCountersForAnalyzer(graph, system, first, 3.4, -0.6);
    });
  }

  /** The preset list offered in the experiment combo box, in display order. */
  public static readonly PRESETS: readonly ExperimentDefinition[] = [
    ExperimentDefinition.singleAnalyzer("singleZ", AnalyzerType.Z),
    ExperimentDefinition.singleAnalyzer("singleX", AnalyzerType.X),
    ExperimentDefinition.chained("zThenX", AnalyzerType.Z, AnalyzerType.X),
    ExperimentDefinition.chained("zThenZ", AnalyzerType.Z, AnalyzerType.Z),
    ExperimentDefinition.interferometer(),
    ExperimentDefinition.magnetPrecession(),
    ExperimentDefinition.recombination(),
  ];

  /** The default preset selected on startup and after Reset All. */
  public static readonly DEFAULT = ExperimentDefinition.PRESETS[0] as ExperimentDefinition;
}
