# Adversarial Review — Stern–Gerlach Simulation

**Date:** 2026-07-17
**Scope:** Full source review (quantum math layer, engine, graph, devices, particle system, all
view nodes), cross-checked against the Java SPINS reference in `references/source/` and the PhET
`quantum-measurement` Spin screen (`references/quantum-measurement/js/spin/`). Suspected bugs were
verified with throwaway repro tests (removed after confirmation; the shipped suite remains 83/83
green under Node 22).

**Overall:** the physics core is solid — operator tables, unknown states, and the type table match
the Java source verbatim; Born sampling and ProjectOut recombination are correct; Monte-Carlo vs
analytic agreement is tested at 20k particles. Adversarial probing found two confirmed bugs, one
systematic statistical inconsistency, and several pedagogical hazards.

---

## 1. Confirmed bugs (reproduced with failing tests)

> **Status 2026-07-17:** all three bugs in this section are **fixed**, each with regression
> tests (`tests/quantum/StateDisplay.test.ts`, `tests/model/SternGerlachModel.test.ts`,
> `tests/model/Counter.test.ts`). The subsections below record the findings as reviewed.

### 1.1 Spin-1 state readout swaps the |0⟩ and |−⟩ labels

`ketMarkup` and the probability formatter use labels `["+", "−", "0"]` for components 0–2
(`src/common/quantum/StateDisplay.ts:56` and
`src/stern-gerlach-screen/view/StatePreparationAreaNode.ts:129`), but the computational basis
order is (+1, **0**, **−1**) — op 7's eigenvectors map component 1 to m = 0 and component 2 to
m = −1.

Verified: the pure m = 0 state renders as `|ψ⟩ = (1.00)|−⟩`. Every spin-1 User State ket and
P(label) readout mislabels two of the three amplitudes.

**Fix:** labels `["+", "0", "−"]` in both places.

### 1.2 Restoring a custom build after a system switch crashes the sim

The custom snapshot stores analyzer types but not the system it was built under
(`SternGerlachModel.ts:369-433`). Reproduction:

1. Build a Custom apparatus under SU(3) with a λ₄ analyzer (wired through to a counter).
2. Select any preset (stashes the snapshot).
3. Switch the system to spin-½.
4. Re-select Custom.

`restoreSnapshot` recreates the λ₄ analyzer, `recomputeProbabilities` calls
`SPIN_HALF.opFor(LAMBDA_4)` → `undefined` → `TypeError: Cannot read properties of undefined`
(verified thrown).

The same stale-snapshot family also:

- restores wires from output port 2 under spin-½ — phantom wires drawn from the middle of the
  analyzer, since `wireProblem` never validates `outputIndex < outputCount(system)`
  (`ExperimentGraph.ts:125`);
- restores a `blockedOutput` of 2 that the blocker radio group (items −1/0/1 only) cannot
  represent.

**Fix:** store the system in the snapshot and run the `applySetSystemSemantics` normalization
after restore when it differs.

### 1.3 Histogram bars and expected-value lines use different denominators

Bars and percents divide by `totalDetectedProperty` (detected atoms only,
`CounterNode.ts:92-94`), while the green line is the analytic probability *per fired atom*
(`Counter.probabilityProperty`). Whenever probability mass is lost — a blocked exit or an unwired
port, i.e. exactly the exit-blocker experiments — bars converge systematically **above** the green
lines. Blocked-DOWN single-Z: bar → 100 %, line at 50 %, forever.

**Fix:** either count fired atoms in the denominator or renormalize the expected line by
Σ P(counters). As shipped, the sim visually teaches that statistics don't converge to theory.

---

## 2. Physics/pedagogy hazards (correct-by-parity, but misleading on screen)

> **Status 2026-07-17:** §2.1, §2.2, and §2.4 are **fixed** (Born-weighted display-path
> sampling in the engine; magnets relabeled B_z/B_λₖ everywhere including the toolbox and type
> selector; particles now fly the shared WireGeometry bézier that WireNode draws). §2.3 (λ₈
> aliasing) is deliberately retained for SPINS parity and is now documented for educators in
> `doc/model.md`.

### 2.1 Coherent pass-through shows which-path information that shouldn't exist

When analyzer outputs are merged and Watch is off, the engine correctly passes the state through
coherently but always routes the animated particle out port 0 (`ExperimentEngine.ts:141`, `163`).
In the Interferometer preset every atom visibly takes the *top* path — the exact anti-lesson: the
display asserts a definite path while the physics depends on there being none. Java SPINS never
animated atoms, so it never had this problem.

**Suggestion:** sample a *display-only* path Born-weighted (without touching the carried state),
or render the coherent segment as a split/ghosted beam on both wires.

### 2.2 The magnet is labeled `SG_z`

`MagnetNode` reuses `analyzerLabelMarkup` (`MagnetNode.ts:82`), so a precession device carries a
Stern–Gerlach label — inviting students to conflate unitary evolution with measurement. Label it
`B_z` (etc.); Java used a bare letter.

### 2.3 "λ₈" is not the Gell-Mann λ₈

The port faithfully keeps the Java aliasing of op 7 (spin-1 Sz, diag(1, 0, −1)) as λ₈
(`SpinSystem.ts:54-55`), but the real λ₈ is diag(1, 1, −2)/√3 with a degenerate eigenspace. Since
SU(3) is preference-gated, at minimum document this in `doc/model.md` so an instructor isn't
ambushed; a real fix needs degenerate-subspace collapse, which the ProjectOut machinery cannot
express.

### 2.4 Particles fly straight rays while wires are drawn as béziers

`ParticleSystem.ts:124` vs `WireNode.ts:32-34` — atoms visibly detach from curved wires on any
vertically offset connection.

---

## 3. Smaller findings

> **Status 2026-07-17:** all fixed except two intentional leftovers — the harmless double
> rebuild on Reset All, and the Node-22 requirement (environment, not code). Keyboard wiring now
> exists (Enter/Space on a focused output port cycles its connection through every legal target,
> then unwired), the Delete/Backspace listener only fires when the device container itself has
> focus, locale-stale derivations use DynamicProperty, counter readouts are localized, counter
> bar colors track rewiring (with a new amber color for the m=0 beam), the Single-Z guidance now
> matches the Random default, θ/φ edits keep counts when no n̂ device exists, spawn positions
> cycle 12 slots, and `doc/model.md` is written.

- **Keyboard help promises wiring that doesn't exist.** Output ports are focusable and the help
  dialog has a "wire" section with arrow keys (`SternGerlachKeyboardHelpContent.ts:37-43`), but
  `createOutputPort` attaches only a pointer `DragListener` — keyboard users cannot wire at all.
  Also, the Delete/Backspace listener sits on the device *container*
  (`ExperimentAreaNode.ts:292-299`), so pressing Backspace while focused on a child control (type
  radio, field spinner) deletes the whole device.
- **Locale-stale derivations:** `notationProperty` / `guidanceProperty`
  (`ExperimentControlPanel.ts:79-91`) and `experimentName`
  (`SternGerlachScreenSummaryContent.ts:24-27`) read `.value` of a string Property inside a
  DerivedProperty that doesn't depend on it — they won't refresh on a live language switch. Same
  pattern for the port accessible name (`ExperimentAreaNode.ts:447`). `n=` / `%` in `CounterNode`
  are hardcoded English.
- **Counter bar color is frozen at creation** from the then-current inbound wire
  (`ExperimentAreaNode.ts:234-237`); wiring a counter later in builder mode never recolors it, and
  the NONE port gets the "up" color.
- **Guidance contradicts the default state:** the Single-Z guidance says "for a prepared |+z⟩
  state, which counter should fire?" but the default initial state is Random — a student who
  follows it sees 50/50 and learns the wrong lesson. Either the guidance should tell them to set
  User State |+z⟩ first, or presets should set a matching initial state.
- **A11y wording nit:** `userStateRealPattern` announces 0-based "component 0" while output ports
  announce 1-based.
- **`doc/model.md` is still the template placeholder** even though the sim now has real, subtle
  physics (watch semantics, recombination, Java-parity caveats). For a pedagogy-first project this
  is the document educators need most.
- Trivia: `spawnPosition` cycles only 6 slots (a 7th device stacks on the 1st); reset does a
  harmless double rebuild; θ/φ changes clear counters even with no n̂ device on the board. The repo
  needs Node 22 (`.nvmrc`) — under system Node 18, vitest fails at startup.

---

## 4. Attacked and found correct

- Merged-output grouping logic in all null/blocked permutations: blockers correctly force
  measurement; dead pairs lose probability mass correctly in both Monte-Carlo and analytic paths.
- The X/Y-basis rotation with the spin-1 normal-order index remap in `UserStateModel`.
- Bloch vector math and probability display normalization for the Random mixture (I/N density
  matrix → equal computational probabilities).
- Graph invariants: cycle rejection, single source, same-source recombination.
- Magnet propagator closed form U = I − i·sin(φ)·H + (cos φ − 1)·H² (valid because all operators
  have eigenvalues in {−1, 0, +1}).
- The watch-aware analytic path — a genuine improvement over Java's `ComputeProb`, keeping Do-N
  valid under Watch.
- Operator matrices, eigenvectors, unknown initial states, and the type table match
  `references/source/Experiment.java` verbatim (including the ProjectOut normalization slip in
  `vector.java` that the port deliberately fixes and documents).
- One doc nit: `SPINS-SUMMARY.md` says Random emits eigenstates of "the first analyzer's axis,"
  but the actual Java (and the port) uses a fixed Sz (spin-½) / Sy (spin-1) basis — the code is
  right, the summary is wrong.

---

## 5. Pedagogical feature ideas

Highest leverage first:

1. **Friendly state preparation** (from PhET Spin): a chooser for |+z⟩, |−z⟩, |+x⟩, |−y⟩… plus a
   (θ, φ) dial with the live Bloch sphere, instead of only re/im spinners. The current User State
   dialog is expert-only.
2. **"Mixture vs superposition" preset:** Random and |+x⟩ both give 50/50 through SGz but 50/50 vs
   100/0 through SGx — a two-run guided preset would nail the single most-misunderstood concept
   this apparatus can teach.
3. **Predict-then-observe workflow:** the guidance strings already prompt predictions; add
   commit-able prediction markers on the counters (student drags a marker to their predicted %,
   fires, compares). Elicit–confront–resolve.
4. **√N error bars / convergence affordance:** show counting-statistics bands on the bars so
   students learn when a deviation from the green line is meaningful — and add Do 10,000 (Java had
   it) so they can watch the band shrink.
5. **Mystery-state game mode:** the four Unknowns exist, but there's no way to answer. Let the
   student submit a guess (choose from candidate kets or enter θ, φ) and have the sim grade it —
   this is exactly McIntyre's lab workflow the SPINS program was built for.
6. **Bloch-sphere probes on wires** (PhET's "measurement cameras"): drop an inspector on any wire
   to see the state (or mixture) at that point — makes collapse and precession visible
   mid-apparatus.
7. **Magnet upgrades:** display the precession angle (n × 5°) next to the dial, and animate the
   Bloch vector precessing while atoms cross — connects the 0–99 dial to Larmor precession instead
   of leaving it a magic number.
8. **Beam-intensity rendering in continuous mode:** wire brightness/thickness proportional to
   probability flux, dimming after blockers — makes the "Lost to filters" number visual.
9. **Shareable apparatus links:** `GraphSnapshot` already serializes the custom build; encode it
   in a URL query parameter so instructors can hand students a pre-built apparatus (or a hidden
   "black box" to reverse-engineer).
10. **Data export (CSV)** of counts/probabilities for classroom analysis.
