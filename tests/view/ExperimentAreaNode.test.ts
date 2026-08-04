/**
 * ExperimentAreaNode lifecycle regressions.
 *
 * Two classes of defect are guarded here:
 *
 *  1. Rebuild coalescing — the device and wire layers must rebuild once per structural edit,
 *     not once per device/wire added and removed. A preset switch clears and repopulates the
 *     whole graph, so per-element rebuilds are quadratic in the preset's size.
 *
 *  2. Child disposal — scenery's Node.dispose() calls removeAllChildren() but does NOT dispose
 *     children. Any child holding a link to a locale-lived string Property (an accessibleName,
 *     or a PatternStringProperty derived from one) therefore stays registered on that Property
 *     forever, and every device-layer rebuild adds more.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { StringManager } from "../../src/i18n/StringManager.js";
import { Analyzer } from "../../src/stern-gerlach-screen/model/devices/Analyzer.js";
import { ExperimentDefinition } from "../../src/stern-gerlach-screen/model/ExperimentDefinition.js";
import { SternGerlachModel } from "../../src/stern-gerlach-screen/model/SternGerlachModel.js";
import { Wire } from "../../src/stern-gerlach-screen/model/Wire.js";
import { ExperimentAreaNode } from "../../src/stern-gerlach-screen/view/ExperimentAreaNode.js";
import { installSimStub } from "./simStub.js";

installSimStub();

/** A model plus its board view, with the builder unlocked. */
function customModelWithView(): { model: SternGerlachModel; area: ExperimentAreaNode } {
  const model = new SternGerlachModel(() => 0.5);
  const area = new ExperimentAreaNode(model);
  model.experimentProperty.value = ExperimentDefinition.CUSTOM;
  return { model, area };
}

describe("ExperimentAreaNode rebuild coalescing", () => {
  it("rebuilds each layer once per preset switch, not once per device and wire", () => {
    const model = new SternGerlachModel(() => 0.5);
    let deviceRebuilds = 0;
    let wireRebuilds = 0;
    model.graph.devicesChangedEmitter.addListener(() => deviceRebuilds++);
    model.graph.wiresChangedEmitter.addListener(() => wireRebuilds++);

    const threePolarizers = ExperimentDefinition.PRESETS.find((preset) => preset.nameKey === "threePolarizers");
    if (!threePolarizers) {
      throw new Error("threePolarizers preset missing");
    }
    model.experimentProperty.value = threePolarizers;

    // The preset lands on 8 devices and 7 wires; before coalescing this cost 12 and 10 rebuilds.
    expect(model.graph.devices.length).toBe(8);
    expect(model.graph.wires.length).toBe(7);
    expect(deviceRebuilds).toBe(1);
    expect(wireRebuilds).toBe(1);
  });

  it("adding a wire never rebuilds the device layer (an in-progress wiring drag owns a port node)", () => {
    const { model } = customModelWithView();
    const source = model.graph.getSource();
    if (!source) {
      throw new Error("no source");
    }
    const analyzer = new Analyzer(new Vector2(1.4, 0));
    model.graph.addDevice(analyzer);

    let deviceRebuilds = 0;
    let wireRebuilds = 0;
    model.graph.devicesChangedEmitter.addListener(() => deviceRebuilds++);
    model.graph.wiresChangedEmitter.addListener(() => wireRebuilds++);

    model.graph.addWire(new Wire(source, 0, analyzer));

    expect(wireRebuilds).toBe(1);
    expect(deviceRebuilds).toBe(0);
  });

  it("removing a device reports the device and wire changes as one edit", () => {
    const { model } = customModelWithView();
    const source = model.graph.getSource();
    if (!source) {
      throw new Error("no source");
    }
    const analyzer = new Analyzer(new Vector2(1.4, 0));
    model.graph.addDevice(analyzer);

    let deviceRebuilds = 0;
    let wireRebuilds = 0;
    model.graph.devicesChangedEmitter.addListener(() => deviceRebuilds++);
    model.graph.wiresChangedEmitter.addListener(() => wireRebuilds++);

    model.graph.removeDevice(analyzer);
    expect(deviceRebuilds).toBe(1);
  });
});

/**
 * How many listeners a Property is currently carrying. axon exposes getListenerCount() at
 * runtime but marks it private in the type declarations, so the cast is deliberate: counting
 * listeners is the only direct way to observe that disposed nodes released their links.
 */
function listenerCount(property: TReadOnlyProperty<string>): number {
  return (property as unknown as { getListenerCount: () => number }).getListenerCount();
}

describe("ExperimentAreaNode child disposal", () => {
  it("does not accumulate listeners on localized strings across device-layer rebuilds", () => {
    const { model } = customModelWithView();
    const builderStrings = StringManager.getInstance().getA11yStrings().builder;
    const portPattern = builderStrings.outputPortPatternStringProperty;
    const deleteName = builderStrings.deleteDeviceButtonStringProperty;

    const baselinePort = listenerCount(portPattern);
    const baselineDelete = listenerCount(deleteName);

    // Each add and each remove rebuilds the whole device layer, creating a fresh set of
    // output ports and delete buttons; the previous set must have released its links.
    for (let i = 0; i < 20; i++) {
      const analyzer = new Analyzer(new Vector2(1.4, 0));
      model.graph.addDevice(analyzer);
      model.graph.removeDevice(analyzer);
    }

    expect(listenerCount(portPattern)).toBe(baselinePort);
    expect(listenerCount(deleteName)).toBe(baselineDelete);
  });
});
