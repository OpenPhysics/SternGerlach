# Implementation Notes - Stern Gerlach

Developer-facing notes on the architecture. The physics itself is documented for educators in
[model.md](./model.md).

## Architecture Overview

Stern Gerlach is a single-screen SceneryStack simulation, a TypeScript port of David McIntyre's
SPINS Java program (`references/source/`). The code separates into three layers:

```
src/common/quantum/            pure math — no axon/scenery dependencies, fully unit-tested
  ├─ Complex / ComplexVector / ComplexMatrix   immutable complex arithmetic (ports of the Java classes)
  ├─ OperatorTable             operators, eigenvectors, unknown states; Sn(θ, φ) lookups are PURE
  ├─ SpinSystem                spin-½ / spin-1 enumeration (state count, operator indices)
  └─ StateDisplay              ket/Bloch/probability formatting helpers

src/stern-gerlach-screen/model/
  ├─ SternGerlachModel         top-level coordinator: preset/system/state properties, snapshots
  ├─ ExperimentGraph           devices + wires with enforced invariants (acyclic, single source,
  │                            one wire per output, same-source recombination)
  ├─ ExperimentEngine          the physics: Monte-Carlo transit (NextComp port) and the exact
  │                            analytic path-sum that drives expected-value lines and Do-N
  ├─ ParticleSystem            spawns and flies animated particles along WireGeometry béziers
  ├─ ExperimentDefinition      the preset experiment recipes
  └─ devices/                  ParticleSource, Analyzer, Magnet, Counter (pure state, no physics)
       Analyzer/Magnet         each n̂ device: thetaProperty, phiProperty (independent angles)

src/stern-gerlach-screen/view/
  ├─ SternGerlachScreenView    layout coordinator + pdomOrder
  ├─ ExperimentAreaNode        the board: mvt, layers (wires < devices < particles < overlay),
  │                            builder-mode editing (drag, wire, delete — pointer and keyboard)
  ├─ ExperimentControlPanel / StatePreparationAreaNode / DeviceToolboxNode
  ├─ nodes/                    one view node per device type, plus Bloch/direction spheres
  └─ dialogs/                  AnglesDialog (per-device θ, φ), user state, how-to-use
```

Data flows Model → View through AXON `Property` objects; the view never computes physics and the
model never touches scenery.

## Key design decisions

- **Per-device n̂ angles.** Java SPINS shared one global (θ, φ) across all n̂ devices; here each
  analyzer/magnet owns `thetaProperty`/`phiProperty`. `OperatorTable`'s direction operators
  (indices 6–7) are **pure lookups** — callers pass (θ, φ) explicitly; the table holds no mutable
  direction state. Results are memoized per operator on the last (θ, φ) queried only. Never
  reintroduce a shared "current angles" setter: the recursive analytic walk
  (`computeCounterProbabilities`) visits devices with different angles mid-recursion; a regression
  bug from shared mutable direction state was fixed in commit `0297df1`.
- **Two propagation paths, one physics.** `ExperimentEngine.transitDevice` (Monte-Carlo, per
  particle arrival) and `ExperimentEngine.computeCounterProbabilities` (analytic path-sum) must
  agree; tests check this statistically at 10k–20k seeded shots, including multi-n̂-device chains.
- **Configuration changes clear statistics.** Any change to preset, system, initial state, watch,
  analyzer/magnet settings, or graph structure removes in-flight particles, zeroes counters, and
  recomputes analytic probabilities (`SternGerlachModel.handleConfigurationChange`) — never mix
  counts from different configurations (SPINS behavior).
- **Snapshots retain the custom build.** Leaving the Custom preset serializes the graph
  (`GraphSnapshot`); restoring sanitizes port-dependent data if the system changed in between.
- **Injected RNG.** Every random draw flows through an injected `Rng`; production uses
  `dotRandom`, tests use a seeded mulberry32 (`tests/model/testUtilities.ts`).

## Common components

- `SimPanel` — pre-themed panel; all control panels use it so projector-mode switching is automatic.
- `SimDialog` — pre-themed dialog wrapper used by all dialogs.
- `SimButtonOptions` — flat button/combo-box option bundles (see `CLAUDE.md` for usage rules).
- `TimeModel` — composable play/pause + elapsed-time model, composed into `SternGerlachModel`.

## Disposal conventions

Device and wire view nodes are rebuilt whenever the graph changes, so every such node registers
its unlinks/listener removals on `disposeEmitter` (or a `dispose...` closure) — see
`AnalyzerNode`, `CounterNode`, `WireNode`, and the listeners wired in
`ExperimentAreaNode.createDeviceNode`/`makeEditable`. Screen-lifetime nodes (panels, toolbox,
chrome) intentionally never dispose.

## Testing

`npm test` (vitest, requires Node ≥ 22 — see `.nvmrc`):

- `tests/quantum/` — operator/eigenvector invariants, vector/matrix algebra, Sn lookup purity
- `tests/model/` — engine physics invariants, preset pedagogy, Monte-Carlo vs analytic
  agreement ("multiple n̂ devices with different angles"), model configuration/reset/snapshot
- `tests/memory-leak.test.ts` — fleet-standard WeakRef/GC regression suite

## Multi-screen simulations

This sim is single-screen. If it ever grows screens, see `doc/multi-screen.md` for the fleet
pattern (per-screen folders, StringManager getters, shared root model).

## Accessibility reference

This sim is an OpenPhysics accessibility reference: `SternGerlachScreenSummaryContent` with live
`currentDetailsContent`, explicit `pdomOrder`, and `SternGerlachKeyboardHelpContent`. See
`CLAUDE.md` and [Baton/ACCESSIBILITY.md](https://github.com/OpenPhysics/Baton/blob/main/ACCESSIBILITY.md).
