/**
 * SternGerlachColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import SternGerlachColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import SternGerlachColors from "../../SternGerlachColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: SternGerlachColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the SternGerlachColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import SternGerlachNamespace from "./SternGerlachNamespace.js";

const SternGerlachColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(SternGerlachNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(SternGerlachNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(SternGerlachNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(SternGerlachNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(SternGerlachNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Control surfaces ─────────────────────────────────────────────────────────
  // Controls participate in the active profile. The Preferences dialog is the sole
  // exception because its content is hosted on framework-owned, always-light chrome.

  /** Fill of combo-box buttons/lists and editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(SternGerlachNamespace, "controlSurface", {
    default: "#26364a",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(SternGerlachNamespace, "controlSurfaceDisabled", {
    default: "#526173",
    projector: "#cccccc",
  }),

  /** Text on control surfaces: combo items, flat-button labels, and field values. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(SternGerlachNamespace, "controlSurfaceText", {
    default: "#f4f8fb",
    projector: "#1a1a1a",
  }),

  /** Hover/focus highlight behind combo-box list items. */
  controlSurfaceHighlightColorProperty: new ProfileColorProperty(SternGerlachNamespace, "controlSurfaceHighlight", {
    default: "#3a5168",
    projector: "#dfe7ee",
  }),

  // ── Experiment board ─────────────────────────────────────────────────────────
  // The complete play area changes profile; it is not an invariant light island.

  /** Fill of the experiment board behind the devices. */
  experimentAreaFillProperty: new ProfileColorProperty(SternGerlachNamespace, "experimentAreaFill", {
    default: "#101820",
    projector: "#f7fafc",
  }),

  /** Stroke around the experiment board. */
  experimentAreaStrokeProperty: new ProfileColorProperty(SternGerlachNamespace, "experimentAreaStroke", {
    default: "#526575",
    projector: "#8899aa",
  }),

  /** Body of a Stern–Gerlach analyzer. */
  analyzerBodyFillProperty: new ProfileColorProperty(SternGerlachNamespace, "analyzerBodyFill", {
    default: "#253746",
    projector: "#000000",
  }),

  /** Lighter entrance band on the analyzer's input edge (PhET Spin look). */
  analyzerEntranceFillProperty: new ProfileColorProperty(SternGerlachNamespace, "analyzerEntranceFill", {
    default: "#3d5568",
    projector: "#333333",
  }),

  /** Physical wall drawn over a blocked analyzer exit. */
  blockerFillProperty: new ProfileColorProperty(SternGerlachNamespace, "blockerFill", {
    default: "#c45c26",
    projector: "#aa4400",
  }),

  /** Brief camera/detection flash fill on a counter. */
  measurementFlashFillProperty: new ProfileColorProperty(SternGerlachNamespace, "measurementFlashFill", {
    default: "#fff176",
    projector: "#ffdd00",
  }),

  /** Analyzer label text (SG_Z, SG_n, …). */
  analyzerLabelFillProperty: new ProfileColorProperty(SternGerlachNamespace, "analyzerLabelFill", {
    default: "#e8f7ff",
    projector: "#ffffff",
  }),

  /** The parabolic beam-splitting curves inside an analyzer. */
  splitterCurveStrokeProperty: new ProfileColorProperty(SternGerlachNamespace, "splitterCurveStroke", {
    default: "#4fc3f7",
    projector: "#aaffff",
  }),

  /** The dark exit holes on an analyzer's output edge. */
  analyzerHoleFillProperty: new ProfileColorProperty(SternGerlachNamespace, "analyzerHole", {
    default: "#0a1016",
    projector: "#333333",
  }),

  /** Particles (single-fire circles and continuous-beam dots). Magenta, QM style. */
  particleColorProperty: new ProfileColorProperty(SternGerlachNamespace, "particleColor", {
    default: "#ff55e8",
    projector: "#CC00CC",
  }),

  /** Wires connecting output ports to input ports. */
  wireStrokeProperty: new ProfileColorProperty(SternGerlachNamespace, "wireStroke", {
    default: "#9cb4c6",
    projector: "#556677",
  }),

  /** Body of a magnet (red, as in the Java applet). */
  magnetBodyFillProperty: new ProfileColorProperty(SternGerlachNamespace, "magnetBodyFill", {
    default: "#ff5a5f",
    projector: "#cc2222",
  }),

  /** Histogram bar for UP-ish counters. */
  counterBarUpFillProperty: new ProfileColorProperty(SternGerlachNamespace, "counterBarUpFill", {
    default: "#4fc3f7",
    projector: "#000000",
  }),

  /** Histogram bar for DOWN-ish counters (magenta, QM style). */
  counterBarDownFillProperty: new ProfileColorProperty(SternGerlachNamespace, "counterBarDownFill", {
    default: "#ff55e8",
    projector: "#CC00CC",
  }),

  /** Histogram bar for counters fed by the m=0 (NONE) output of a 3-state analyzer. */
  counterBarZeroFillProperty: new ProfileColorProperty(SternGerlachNamespace, "counterBarZeroFill", {
    default: "#ffd54f",
    projector: "#B8860B",
  }),

  /** The green analytic expected-value line on counters. */
  expectedValueLineProperty: new ProfileColorProperty(SternGerlachNamespace, "expectedValueLine", {
    default: "rgb(77,220,120)",
    projector: "rgb(0,170,0)",
  }),

  /** A lit which-path watch light on an analyzer output. */
  watchLightOnProperty: new ProfileColorProperty(SternGerlachNamespace, "watchLightOn", {
    default: "#fff176",
    projector: "#ffdd00",
  }),

  /** Port circles on device edges. */
  portFillProperty: new ProfileColorProperty(SternGerlachNamespace, "portFill", {
    default: "#7893a8",
    projector: "#445566",
  }),

  /** Highlighted port circle (legal wiring target under the cursor). */
  portHighlightProperty: new ProfileColorProperty(SternGerlachNamespace, "portHighlight", {
    default: "#55d6ff",
    projector: "#00aaff",
  }),

  /** Destructive action button fill. */
  destructiveButtonFillProperty: new ProfileColorProperty(SternGerlachNamespace, "destructiveButtonFill", {
    default: "#ff5a5f",
    projector: "#cc3333",
  }),

  /** Light band of the particle source's metallic gradient. */
  sourceGradientLightProperty: new ProfileColorProperty(SternGerlachNamespace, "sourceGradientLight", {
    default: "#e3edf4",
    projector: "#ffffff",
  }),

  /** Dark band of the particle source's metallic gradient. */
  sourceGradientDarkProperty: new ProfileColorProperty(SternGerlachNamespace, "sourceGradientDark", {
    default: "#596b79",
    projector: "#999fa8",
  }),
};

export default SternGerlachColors;
