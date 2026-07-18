/**
 * StringManager.ts
 *
 * Centralizes all localized string access for the simulation.
 *
 * Strings are loaded from JSON files per locale and wrapped in reactive
 * Property objects by SceneryStack. When the user switches language in the
 * Preferences dialog, all StringProperties update automatically.
 *
 * ── How to add a locale ───────────────────────────────────────────────────────
 * 1. Create src/i18n/strings_XX.json with the same keys as strings_en.json
 * 2. Import it below and add `XX: stringsXX` to the locale map
 * 3. Add "XX" to `availableLocales` in src/init.ts
 *
 * ── How to add a string ───────────────────────────────────────────────────────
 * 1. Add the key + English value to strings_en.json
 * 2. Add the same key + translated value to ALL other locale files
 *    (TypeScript will show an error here if any locale is missing a key)
 * 3. Expose the new StringProperty via a new getter method below
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import { LocalizedString } from "scenerystack/chipper";
import stringsEn from "./strings_en.json";
import stringsEs from "./strings_es.json";
import stringsFr from "./strings_fr.json";

// ── Compile-time key-parity check ─────────────────────────────────────────────
// TypeScript errors here if any locale file is missing a key from English.
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsFr);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsFr satisfies typeof stringsEn);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsEs);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEs satisfies typeof stringsEn);

// ── Build the reactive string property tree ───────────────────────────────────
const stringProperties = LocalizedString.getNestedStringProperties({
  en: stringsEn,
  fr: stringsFr,
  es: stringsEs,
});

/**
 * StringManager is a singleton that provides typed access to all localized
 * strings. Use `StringManager.getInstance()` everywhere — never construct it
 * directly.
 */
export class StringManager {
  private static instance: StringManager | null = null;

  private constructor() {
    // Private — obtain via getInstance()
  }

  public static getInstance(): StringManager {
    if (StringManager.instance === null) {
      StringManager.instance = new StringManager();
    }
    return StringManager.instance;
  }

  /**
   * The simulation title shown in the navigation bar and browser tab.
   * Updates automatically when the locale changes.
   */
  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return stringProperties.titleStringProperty;
  }

  /**
   * Screen name StringProperties used when constructing Screen instances.
   * Each property updates automatically when the locale changes.
   */
  public getScreenNames(): {
    readonly simStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      simStringProperty: stringProperties.screens.simStringProperty,
    };
  }

  /**
   * Accessibility (Interactive Description) StringProperties.
   *
   * Returns the reactive `a11y` string tree used by the parallel DOM:
   *   - `screenSummary.*` — play-area / control-area overview and an interaction
   *     hint, read by `SternGerlachScreenSummaryContent`.
   *   - `currentDetails*` — pattern strings composed into a live
   *     `DerivedProperty` over model state (see `SternGerlachScreenSummaryContent`).
   *
   * Add `accessibleName` / `accessibleHelpText` strings for individual controls
   * to the `a11y` group too, then read them through this same nested tree.
   */
  public getA11yStrings() {
    return stringProperties.a11y;
  }

  /**
   * Simulation-specific preference labels shown in Preferences → Simulation.
   */
  public getPreferences() {
    return stringProperties.preferences;
  }

  /**
   * Localized names of the preset experiments, keyed by ExperimentDefinition.nameKey.
   */
  public getExperimentNameProperty(nameKey: string): ReadOnlyProperty<string> {
    const experiments = stringProperties.experiments as unknown as Record<string, ReadOnlyProperty<string>>;
    const property = experiments[`${nameKey}StringProperty`];
    if (!property) {
      throw new Error(`no experiment name string for key "${nameKey}"`);
    }
    return property;
  }

  /**
   * Compact apparatus notation for a preset, e.g. "[SGz → SGx]".
   */
  public getExperimentNotationProperty(nameKey: string): ReadOnlyProperty<string> {
    const notations = stringProperties.experimentNotation as unknown as Record<string, ReadOnlyProperty<string>>;
    const property = notations[`${nameKey}StringProperty`];
    if (!property) {
      throw new Error(`no experiment notation string for key "${nameKey}"`);
    }
    return property;
  }

  /**
   * Prediction / observation guidance for a preset.
   */
  public getExperimentGuidanceProperty(nameKey: string): ReadOnlyProperty<string> {
    const guidance = stringProperties.experimentGuidance as unknown as Record<string, ReadOnlyProperty<string>>;
    const property = guidance[`${nameKey}StringProperty`];
    if (!property) {
      throw new Error(`no experiment guidance string for key "${nameKey}"`);
    }
    return property;
  }

  /**
   * Labels for the prepared-state readout (Bloch / ket / probabilities).
   */
  public getStatePreparation() {
    return stringProperties.statePreparation;
  }

  /**
   * Patterns for the counter readouts (percent of detected atoms, sample size).
   */
  public getCounterStrings() {
    return stringProperties.counters;
  }

  /**
   * Labels for the sim's controls (experiment chooser, fire button, source mode, …).
   */
  public getControls() {
    return stringProperties.controls;
  }

  /**
   * Titles and labels for the sim's dialogs (direction angles, user state, …).
   */
  public getDialogs() {
    return stringProperties.dialogs;
  }

  /**
   * Localized names of the quantum systems (spin-½, spin-1).
   */
  public getSystems() {
    return stringProperties.systems;
  }

  /**
   * Labels for the builder-mode device toolbox (analyzer, magnet, counter).
   */
  public getToolbox() {
    return stringProperties.toolbox;
  }
}
