/**
 * Minimal `phet.joist.sim` stub so view nodes can be built headlessly.
 *
 * sun's Dialog resolves its sim via getGlobal("phet.joist.sim") at construction time and
 * multilinks the sim's bounds/scale Properties. That multilink no-ops while the bounds are
 * null, so four null-valued Properties are enough to construct a Dialog — and therefore
 * ExperimentAreaNode, which builds an AnglesDialog for every analyzer and magnet.
 *
 * Only construction is supported; nothing here is sufficient to actually show a dialog.
 */

import { Property } from "scenerystack/axon";
import { Node } from "scenerystack/scenery";

type MutableGlobal = Record<string, Record<string, Record<string, unknown>>>;

/** Installs the stub once per test process; safe to call from every test. */
export function installSimStub(): void {
  const globals = globalThis as unknown as MutableGlobal;
  globals["phet"] = globals["phet"] ?? {};
  globals["phet"]["joist"] = globals["phet"]["joist"] ?? {};
  if (globals["phet"]["joist"]["sim"] !== undefined) {
    return;
  }
  const noop = (): void => {
    /* popups are never shown in tests */
  };
  globals["phet"]["joist"]["sim"] = {
    boundsProperty: new Property(null),
    screenBoundsProperty: new Property(null),
    scaleProperty: new Property(null),
    selectedScreenProperty: new Property(null),
    isConstructionCompleteProperty: new Property(true),
    topLayer: new Node(),
    // Popupable binds these at construction via gracefulBind("phet.joist.sim.showPopup").
    showPopup: noop,
    hidePopup: noop,
  };
}
