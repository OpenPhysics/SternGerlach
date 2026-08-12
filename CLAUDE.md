# CLAUDE.md — Stern Gerlach

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

Single-screen SceneryStack simulation of the **Stern–Gerlach experiment**: build apparatus from
analyzers, magnets, and counters; fire spin-½ / spin-1 atoms; compare Monte Carlo counts with
analytic expectations. TypeScript port of David McIntyre's **SPINS** program.

Educator physics: [`doc/model.md`](doc/model.md). Architecture: [`doc/implementation-notes.md`](doc/implementation-notes.md).

## Key files

| Area | Location |
|---|---|
| Quantum math (pure, no axon/scenery) | `src/common/quantum/` — `Complex`, `ComplexVector`, `ComplexMatrix`, `OperatorTable`, `SpinSystem`, `StateDisplay` |
| Top-level model | `src/stern-gerlach-screen/model/SternGerlachModel.ts` |
| Physics engine | `ExperimentEngine.ts` — Monte-Carlo transit + analytic path-sum |
| Apparatus graph | `ExperimentGraph.ts` — acyclic device/wire graph with enforced invariants |
| Devices | `src/stern-gerlach-screen/model/devices/` — `Analyzer`, `Magnet`, `Counter`, `ParticleSource` |
| Animation | `ParticleSystem.ts`, `WireGeometry.ts` |
| View / a11y | `SternGerlachScreenView.ts`, `SternGerlachScreenSummaryContent.ts`, `SternGerlachKeyboardHelpContent.ts`, `ExperimentAreaNode.ts` |
| Colors / constants | `SternGerlachColors.ts`, `SternGerlachConstants.ts`, `SternGerlachNamespace.ts` |
| i18n | `src/i18n/StringManager.ts` |

## Model

- **State:** each atom carries a complex state vector (ℂ² spin-½ or ℂ³ spin-1). Analyzers collapse
  via the Born rule; magnets apply unitary precession; counters accumulate detected counts.
- **Two propagation paths:** `ExperimentEngine.transitDevice` (Monte-Carlo, per-particle) and
  `computeCounterProbabilities` (exact analytic path-sum for expected-value lines and Do-N).
- **Critical gotcha — per-device n̂ angles:** Java SPINS shared one global (θ, φ); here each
  analyzer/magnet owns `thetaProperty` / `phiProperty`. `OperatorTable` direction lookups are
  **pure** — always pass the owning device's `(θ, φ)` explicitly; the table holds no mutable
  direction state. The recursive analytic walk visits devices with different angles mid-recursion;
  never reintroduce shared mutable angle state (regression fixed in commit `0297df1`).
- **Coherent recombination:** when all outputs of an analyzer feed the same downstream device and
  Watch is off, no measurement record exists — superposition is restored (spin interferometer).
- **RNG:** injected (`dotRandom` in production; seeded in tests), never global.

## Accessibility

This sim is an OpenPhysics accessibility reference. It ships the three required layers: PDOM names,
`SternGerlachScreenSummaryContent` with live `currentDetailsContent` as a `DerivedProperty` over
model state, and explicit `pdomOrder` + `SternGerlachKeyboardHelpContent`. A11y strings live under
the `a11y` key in each locale JSON, via `StringManager.getA11yStrings()`. Prefer live
`StringProperty`s for `accessibleName` on interactive nodes. Full convention:
[Baton/ACCESSIBILITY.md](https://github.com/OpenPhysics/Baton/blob/main/ACCESSIBILITY.md).

## Compliance carve-outs

- **Hardcoded colors:** preferences control surface `#ffffff` / `#1a1a1a` in
  `SternGerlachPreferencesNode.ts` — light preference chrome that must stay readable in both
  profiles (same pattern as Template light control surfaces).


### `package.json` overrides

JSON cannot carry comments, so the rationale for forced transitive pins lives here. Prefer
**tilde (`~`) or exact** versions — caret (`^`) lets minors drift under what is meant to be a
hard pin. Dependabot ignores these three names (see `.github/dependabot.yml`) so it does not
open PRs that fight the overrides. Revisit when SceneryStack drops or re-pins them upstream.

| Override | Pin | Why |
|---|---|---|
| `lodash` | `~4.18.1` | SceneryStack declares `~4.17.12`. Bump clears Dependabot/npm advisories patched in 4.18.x (e.g. GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh). |
| `three` | `~0.125.2` | SceneryStack declares `^0.104.0`. Floor is 0.125.0 for GHSA-fq6p-x6j3-cmmq (ReDoS). Staying on the 0.125 line avoids a larger API jump; **0.125.x still has open CVEs** (e.g. XSS GHSA-7vvq-7r29-5vg3, fixed only in ≥0.137.0). Remove this override if/when SceneryStack stops depending on `three` or pins a patched line itself. LightPropagation keeps a higher `three` pin — do not force 0.125 there. |
| `brace-expansion` | `~5.0.9` | Transitive via `vite-plugin-pwa` / Workbox. Clears npm audit (originally GHSA-mh99-v99m-4gvg; keep ≥5.0.9 for GHSA-rgw5-rvv9-x895). |

## Testing

Fleet-standard Vitest layout (`happy-dom`, `tests/setup.ts`, `execArgv: ["--expose-gc"]`):

| Path | Purpose |
|---|---|
| `tests/quantum/Complex.test.ts` | Complex arithmetic |
| `tests/quantum/ComplexVector.test.ts` | State vectors |
| `tests/quantum/ComplexMatrix.test.ts` | Matrix ops |
| `tests/quantum/OperatorTable.test.ts` | Operators, eigenvectors, pure Sn(θ, φ) lookups |
| `tests/quantum/StateDisplay.test.ts` | Ket/Bloch formatting |
| `tests/model/ExperimentEngine.test.ts` | Monte-Carlo + analytic propagation |
| `tests/model/ExperimentGraph.test.ts` | Graph invariants + `batch()` change coalescing |
| `tests/view/ExperimentAreaNode.test.ts` | Board rebuild coalescing + child-disposal leaks (uses `tests/view/simStub.ts`) |
| `tests/model/SternGerlachModel.test.ts` | Top-level coordinator |
| `tests/model/UserStateModel.test.ts` | User-prepared states |
| `tests/model/Magnet.test.ts` | Magnet device |
| `tests/model/Counter.test.ts` | Counter accumulation |
| `tests/model/WireGeometry.test.ts` | Wire paths |
| `tests/TimeModel.test.ts` | Composable play/pause timer |
| `tests/memory-leak.test.ts` | WeakRef + `forceGC` dispose regression |

Put unit tests only under root `tests/` (never co-locate or use `__tests__/`). Run `npm test`; CI
runs the suite when a `test` script is present. Use seeded RNG in engine tests for reproducibility.

View nodes that build a `Dialog` need a `phet.joist.sim` global; call `installSimStub()` from
`tests/view/simStub.ts` before constructing them. The Playwright fuzz smoke (`npm run test:fuzz`)
runs as its own CI job, since it needs a browser.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

`npm run release` intentionally skips `npm test` in some sims — append `&& npm test` before the version bump so a release cannot ship a failing suite.

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run build:single` | Single-file build mode |
| `npm run check` | TypeScript (`tsc --noEmit` + scripts project) |
| `npm run lint` / `npm run fix` | Biome check / auto-fix |
| `npm test` | Vitest unit tests |
| `npm run icons` | Regenerate PWA icons |

## Development notes

- **`src/common/quantum/`** must stay free of axon/scenery imports — pure math only, fully
  unit-tested under `tests/quantum/`.
- **Builder mode:** `ExperimentAreaNode` handles drag/wire/delete editing (pointer and keyboard).
- **SPINS reference:** Java source in `../Baseline/SG/spins/source/`; mystery states and preset recipes in
  `ExperimentDefinition.ts`.
- **PWA:** after `npm run build`, installable offline via Workbox (`dist/manifest.webmanifest`).
