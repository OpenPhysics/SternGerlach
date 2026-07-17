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

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(SternGerlachNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(SternGerlachNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(SternGerlachNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  // ── Experiment board ─────────────────────────────────────────────────────────
  // The experiment area is a light board (quantum-measurement style) in BOTH
  // profiles, so the device colors below are profile-invariant: they always sit
  // on the light board. Projector mode only lightens the surrounding chrome.

  /** Fill of the experiment board behind the devices. */
  experimentAreaFillProperty: new ProfileColorProperty(SternGerlachNamespace, "experimentAreaFill", {
    default: "#eef3f7",
    projector: "#f7fafc",
  }),

  /** Stroke around the experiment board. */
  experimentAreaStrokeProperty: new ProfileColorProperty(SternGerlachNamespace, "experimentAreaStroke", {
    default: "#8899aa",
    projector: "#8899aa",
  }),

  /** Body of a Stern–Gerlach analyzer (black box, QM style). */
  analyzerBodyFillProperty: new ProfileColorProperty(SternGerlachNamespace, "analyzerBodyFill", {
    default: "#000000",
    projector: "#000000",
  }),

  /** Analyzer label text (SG_Z, λ₄, …) on the black body. */
  analyzerLabelFillProperty: new ProfileColorProperty(SternGerlachNamespace, "analyzerLabelFill", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** The parabolic beam-splitting curves inside an analyzer. */
  splitterCurveStrokeProperty: new ProfileColorProperty(SternGerlachNamespace, "splitterCurveStroke", {
    default: "#aaffff",
    projector: "#aaffff",
  }),

  /** The dark exit holes on an analyzer's output edge. */
  analyzerHoleFillProperty: new ProfileColorProperty(SternGerlachNamespace, "analyzerHole", {
    default: "#333333",
    projector: "#333333",
  }),

  /** Particles (single-fire circles and continuous-beam dots). Magenta, QM style. */
  particleColorProperty: new ProfileColorProperty(SternGerlachNamespace, "particleColor", {
    default: "#CC00CC",
    projector: "#CC00CC",
  }),

  /** Wires connecting output ports to input ports. */
  wireStrokeProperty: new ProfileColorProperty(SternGerlachNamespace, "wireStroke", {
    default: "#556677",
    projector: "#556677",
  }),

  /** Body of a magnet (red, as in the Java applet). */
  magnetBodyFillProperty: new ProfileColorProperty(SternGerlachNamespace, "magnetBodyFill", {
    default: "#cc2222",
    projector: "#cc2222",
  }),

  /** Histogram bar for UP-ish counters (black, QM style). */
  counterBarUpFillProperty: new ProfileColorProperty(SternGerlachNamespace, "counterBarUpFill", {
    default: "#000000",
    projector: "#000000",
  }),

  /** Histogram bar for DOWN-ish counters (magenta, QM style). */
  counterBarDownFillProperty: new ProfileColorProperty(SternGerlachNamespace, "counterBarDownFill", {
    default: "#CC00CC",
    projector: "#CC00CC",
  }),

  /** The green analytic expected-value line on counters. */
  expectedValueLineProperty: new ProfileColorProperty(SternGerlachNamespace, "expectedValueLine", {
    default: "rgb(0,170,0)",
    projector: "rgb(0,170,0)",
  }),

  /** A lit which-path watch light on an analyzer output. */
  watchLightOnProperty: new ProfileColorProperty(SternGerlachNamespace, "watchLightOn", {
    default: "#ffdd00",
    projector: "#ffdd00",
  }),

  /** Port circles on device edges. */
  portFillProperty: new ProfileColorProperty(SternGerlachNamespace, "portFill", {
    default: "#445566",
    projector: "#445566",
  }),

  /** Highlighted port circle (legal wiring target under the cursor). */
  portHighlightProperty: new ProfileColorProperty(SternGerlachNamespace, "portHighlight", {
    default: "#00aaff",
    projector: "#00aaff",
  }),

  /** Light band of the particle source's metallic gradient. */
  sourceGradientLightProperty: new ProfileColorProperty(SternGerlachNamespace, "sourceGradientLight", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Dark band of the particle source's metallic gradient. */
  sourceGradientDarkProperty: new ProfileColorProperty(SternGerlachNamespace, "sourceGradientDark", {
    default: "#999fa8",
    projector: "#999fa8",
  }),
};

export default SternGerlachColors;
