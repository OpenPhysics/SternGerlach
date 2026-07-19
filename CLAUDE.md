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
| `tests/model/ExperimentGraph.test.ts` | Graph invariants |
| `tests/model/SternGerlachModel.test.ts` | Top-level coordinator |
| `tests/model/UserStateModel.test.ts` | User-prepared states |
| `tests/model/Magnet.test.ts` | Magnet device |
| `tests/model/Counter.test.ts` | Counter accumulation |
| `tests/model/WireGeometry.test.ts` | Wire paths |
| `tests/TimeModel.test.ts` | Composable play/pause timer |
| `tests/memory-leak.test.ts` | WeakRef + `forceGC` dispose regression |

Put unit tests only under root `tests/` (never co-locate or use `__tests__/`). Run `npm test`; CI
runs the suite when a `test` script is present. Use seeded RNG in engine tests for reproducibility.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

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
- **SPINS reference:** Java source in `references/source/`; mystery states and preset recipes in
  `ExperimentDefinition.ts`.
- **PWA:** after `npm run build`, installable offline via Workbox (`dist/manifest.webmanifest`).
