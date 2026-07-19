/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "./i18n/StringManager.js";
import { SternGerlachPreferencesModel } from "./preferences/SternGerlachPreferencesModel.js";
import { SternGerlachPreferencesNode } from "./preferences/SternGerlachPreferencesNode.js";
import SternGerlachColors from "./SternGerlachColors.js";
import { SternGerlachScreen } from "./stern-gerlach-screen/SternGerlachScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from sternGerlachQueryParameters.
  const simPreferences = new SternGerlachPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new SternGerlachScreen({
      // The screen name Property updates automatically when the locale changes
      name: stringManager.getScreenNames().simStringProperty,
      tandem: Tandem.ROOT.createTandem("simScreen"),
      backgroundColorProperty: SternGerlachColors.backgroundColorProperty,
      spinOneEnabledProperty: simPreferences.spinOneEnabledProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new SternGerlachPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Credits shown in Help → About
    credits: {
      leadDesign: "Martin Veillette",
      softwareDevelopment: "Martin Veillette",
    },
  });

  sim.start();
});
