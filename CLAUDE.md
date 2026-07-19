# CLAUDE.md — Stern Gerlach

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

Single-screen SceneryStack simulation of the **Stern–Gerlach experiment**: build
apparatus from analyzers, magnets, and counters; fire spin-½ / spin-1 atoms;
compare Monte Carlo counts with analytic expectations. Model/view separation,
color profiles, localization, and accessibility are fully wired.
Physics for educators: `doc/model.md`. Architecture: `doc/implementation-notes.md`.
Multi-screen: `doc/multi-screen.md`.

## Key files

| File | Purpose |
|---|---|
| `src/SternGerlachColors.ts` | All `ProfileColorProperty` instances |
| `src/SimConstants.ts` | Named numeric constants (layout px, physics SI units) |
| `src/SternGerlachNamespace.ts` | Namespace for color property names |
| `src/i18n/StringManager.ts` | Singleton localized string accessor |
| `src/stern-gerlach-screen/SternGerlachScreen.ts` | Screen wrapper |
| `src/common/quantum/` | Pure quantum math (no axon/scenery): complex algebra, `OperatorTable`, `SpinSystem` |
| `src/stern-gerlach-screen/model/SternGerlachModel.ts` | Simulation state and logic |
| `src/stern-gerlach-screen/model/ExperimentEngine.ts` | Monte-Carlo + analytic propagation. Direction (n̂) lookups are pure — always pass each device's own (θ, φ); never add shared mutable angle state |
| `src/stern-gerlach-screen/model/ExperimentGraph.ts` | Device/wire graph with enforced invariants (acyclic, single source) |
| `src/stern-gerlach-screen/view/SternGerlachScreenView.ts` | Visual nodes, layout, `screenSummaryContent` + `pdomOrder` |
| `src/stern-gerlach-screen/view/SternGerlachScreenSummaryContent.ts` | Accessible screen summary (reference a11y pattern) |
| `src/stern-gerlach-screen/view/SternGerlachKeyboardHelpContent.ts` | Keyboard-help dialog content |
| `src/common/SimPanel.ts` | Pre-themed `Panel` wrapper (uses `SternGerlachColors` automatically) |
| `src/common/SimButtonOptions.ts` | Flat button-appearance option bundles + light-control-surface combo-box options |
| `src/common/TimeModel.ts` | Composable play/pause + elapsed-time model for animated sims |
| `scripts/generate-icons.ts` | PNG icons from `public/icons/icon.svg` |
| `scripts/rename-sim.ts` | Automated fork/rename across all files and folders |

## Common components

### SimPanel

Every control panel and info box in the sim should use `SimPanel` so that
default/projector color switching is automatic:

```typescript
import { SimPanel } from "../../common/SimPanel.js";
const panel = new SimPanel(content);              // uses SternGerlachColors defaults
const panel = new SimPanel(content, { xMargin: 20 }); // override any PanelOption
```

### TimeModel

For simulations with animation, compose `TimeModel` into your screen model:

```typescript
import { TimeModel } from "../../common/TimeModel.js";

export class FrictionModel implements TModel {
  public readonly timer = new TimeModel();   // starts paused; pass true to auto-play

  public step(dt: number): void {
    this.timer.step(dt);
    // use this.timer.timeProperty.value for physics
  }
  public reset(): void { this.timer.reset(); /* … */ }
}
```

Wire the view to `TimeControlNode` from `scenerystack/scenery-phet` binding on
`model.timer.isPlayingProperty`.

### SimButtonOptions

SceneryStack's push/round buttons default to a 3-D/beveled look; every button in the sim
should be flat instead. Spread these into the relevant options object:

```typescript
import { FLAT_RESET_ALL_BUTTON_OPTIONS, FLAT_RECTANGULAR_BUTTON_OPTIONS } from "../../common/SimButtonOptions.js";

const resetAllButton = new ResetAllButton({ ...FLAT_RESET_ALL_BUTTON_OPTIONS, listener: () => {...} });
const exampleButton = new RectangularPushButton({ ...FLAT_RECTANGULAR_BUTTON_OPTIONS, content, listener });
```

`FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS` spreads into `TimeControlNode`'s `playPauseStepButtonOptions`;
`TIME_CONTROL_SPEED_RADIO_OPTIONS` fixes `TimeControlNode`'s speed-radio label color, which
otherwise defaults to black text on the sim's dark default-mode panels. `SIM_COMBO_BOX_OPTIONS`
themes a `ComboBox`'s button/list chrome to the light control surface below; pair item labels
with `LIGHT_SURFACE_TEXT_FILL` (not `SternGerlachColors.textColorProperty`, which is for panel-fill text).

`SternGerlachColors.ts` backs this with a "control surfaces" section —
`controlSurfaceColorProperty`, `controlSurfaceDisabledColorProperty`,
`controlSurfaceTextColorProperty`, `controlSurfaceHighlightColorProperty` —
profile-aware fills/text so combo boxes, flat buttons, and editable fields keep
readable contrast in both default and projector modes.

## Accessibility

This sim is an OpenPhysics accessibility reference. It ships with the three
required layers: PDOM names, a `SternGerlachScreenSummaryContent` with a live
`currentDetailsContent` `DerivedProperty` over model state, and an explicit
`pdomOrder` + `SternGerlachKeyboardHelpContent`. A11y strings live under the
`a11y` key in each locale JSON, exposed via `StringManager.getA11yStrings()`.
Add `accessibleName`s (preferably live `StringProperty`s) to every interactive
node. Full convention and checklist: [../Baton/ACCESSIBILITY.md](../Baton/ACCESSIBILITY.md).

## Compliance carve-outs

- **Hardcoded colors:** preferences control surface `#ffffff` / `#1a1a1a` in `SternGerlachPreferencesNode.ts` — light preference chrome that must stay readable in both profiles (same pattern as Template light control surfaces).

## Testing

Fleet-standard Vitest layout:

| Path | Purpose |
|---|---|
| `vitest.config.ts` | Test environment + `setupFiles` when present; `execArgv: ["--expose-gc"]` with memory-leak suite |
| `tests/setup.ts` | Canvas / AudioContext mocks + `init({ name: "…" })` before SceneryStack imports (when required) |
| `tests/**/*.test.ts` | Model/physics unit tests — mirror `src/` under `tests/` |
| `tests/memory-leak.test.ts` | WeakRef + `forceGC` dispose regression (fleet pattern) |

- Put unit tests only under root `tests/` (never co-locate or use `__tests__/`).
- Run `npm test`. CI runs the suite when a `test` script is present.
- Expand `memory-leak.test.ts` for components that add/remove nodes or link Properties at runtime (see OpticsLab).

## Multi-screen sims

Full guide: **`doc/multi-screen.md`**

Summary:
- Create a new screen folder mirroring `src/stern-gerlach-screen/` for each screen
- Add screen-name keys to all locale JSON files
- Expose new `StringProperty` getters in `StringManager.getScreenNames()`
- For shared state, create a root model passed to each per-screen model
- Register all screens in the `screens` array in `main.ts`

## PWA

After `npm run build`, the sim is installable offline via Workbox (`dist/manifest.webmanifest`).
