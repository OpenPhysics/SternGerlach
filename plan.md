Plan: Port the Java "Spins" Stern–Gerlach simulation to TypeScript/SceneryStack
Context
Port David McIntyre's SPINS Java simulation (source in references/source/: Experiment.java, Complex.java, vector.java, Matrix.java, Analyzer.java, Magnet.java, Gun.java, Counter.java, DrawLine.java, Spins.java) into the SceneryStack scaffold at /home/user/SternGerlach, on branch claude/java-typescript-simulation-port-4mofwv.
The visual style follows the third ("Spin") screen of phetsims/quantum-measurement (cloned read-only at /home/user/quantum-measurement, key references: js/spin/view/SternGerlachNode.ts, js/spin/view/HistogramWithExpectedValue.ts, js/common/view/QuantumMeasurementHistogram.ts, js/spin/model/ParticleCollection.ts). Its code can't be imported (phet-internal import paths vs. the scaffold's scenerystack npm package), so patterns/shapes/colors are hand-adapted.
User-confirmed scope:
Preset experiments in a ComboBox plus a free-form builder mode (drag devices, wire outputs→inputs, recombination supported).
All Java features: magnet (adjustable field precession), Watch/which-path toggle, unknown-state guessing game, user-defined initial state, Random (unpolarized) state, plus quantum-measurement-style histograms with measured and predicted/expected values, single-fire + continuous beam (+ Do-N analytic batch).
Spin-½ and Spin-1 always selectable in the main UI; SU(3) (Gell-Mann λ1–λ8) appears as a third system choice only when enabled via a Preferences-dialog checkbox.
Guiding decisions
Pure quantum math layer in src/common/quantum/ with no axon/scenery dependencies — direct port of Complex/vector/Matrix and Experiment.initVectors() tables, fully unit-testable in vitest. Preserve the Java eigenvector index convention verbatim: for 3-state systems, index 0,1,2 = eigenvalues +1, −1, 0 (matches analyzer outputs UP=0, DOWN=1, NONE=2) — verified at Experiment.java:100-107.
One device-graph model serves both presets and builder. A preset is a declarative ExperimentDefinition that populates the same Device + Wire collections the builder edits; a CUSTOM ComboBox entry unlocks editing.
Two propagation paths, as in Java:
Monte-Carlo decide-at-arrival: animated particles carry a state vector; on reaching a device the engine performs one hop (port of Experiment.NextComp, lines 466–605): magnet applies U; analyzer collapses via Born rule, EXCEPT coherent pass-through (2-state) or ProjectOut recombination (3-state) when multiple outputs feed the same device and Watch is off. Same pattern as QM's decideParticleDestiny.
Analytic: forward DFS path-sum from the source producing exact counter probabilities (replaces Java's backward ComputeProb/BranchProb walk, whose own comments flag multi-input bugs; must reproduce its results, including recombination prob 1 − |⟨k|ψ⟩|² + ProjectOut). Powers expected-value lines and Do-N categorical sampling (à la Spins.doAction).
Colors: keep the scaffold's dark default chrome; the experiment area is a light board (QM-style) in both profiles, so device colors (black SG boxes, #aff curves, magenta #C0C particles, green expected lines) are profile-invariant. Projector mode only lightens surrounding chrome.
RNG injected everywhere (production dotRandom, tests seeded).
Physics to port verbatim (ground truth: references/source/Experiment.java, verified)
12 operators + eigenvectors (initVectors, lines 82–262): ops 0–2 Pauli x/y/z; 3–6 Gell-Mann λ4–λ7; 7–9 spin-1 Sz/Sx/Sy; 10–11 Sn(θ,φ) recomputed by SetPhi (lines 268–304; init θ=π/2, φ=π/4).
typeTable: spin-½ {Z→2, X→0, Y→1, n→10}; spin-1 {Z→7, X→8, Y→9, n→11}; SU3 {"1".."8"→ops 0..7}. Default type: Z (spin-½/1), "1"/λ1 (SU3).
Born rule |⟨eig|ψ⟩|² with conjugate-left inner product over stateCount components (2 or 3); collapse to eigenvector; ProjectOut(v) = normalize(v − ⟨e|v⟩e) for recombination (vector.java:75-82).
Magnet: U = I − i·sin(φ)H + (cos φ − 1)H², φ = 2π·number/72, number ∈ [0,99] (Magnet.ComputeU, valid because all eigenvalues ∈ {−1,0,+1}).
Initial states (whichInit): Unknown #1–#4 hard-coded vectors (lines 219–235), User state (complex components in X/Y/Z basis, rotated to Z basis — Spins.java ~1373–1527, incl. spin-1 index remap 0,1,2↔0,2,1), Random = equal-weight eigenstates of Sz (spin-½) / Sy (spin-1/SU3).
setSystem semantics (Spins.java 662–716): reset all device types to system default, delete wires from output index 2 when entering spin-½, clear counters.
1. Model architecture
src/common/quantum/ (pure, no Properties)
File
Contents
Complex.ts
Immutable re/im; plus, minus, times, conjugate, magnitudeSquared; statics ZERO/ONE/I.
ComplexVector.ts
3 components; innerProduct (conjugate left), dotProdSquared, projectOut, normalize, equalsEpsilon. Ops return new vectors.
ComplexMatrix.ts
3×3; timesVector, timesScalar, plus, squared; static identity.
OperatorTable.ts
Instance-owned (no mutable statics): operators[12], operatorsSquared[12], eigenvectors[12][3] per initVectors; setDirectionAngles(theta, phi) recomputes ops 10/11; UNKNOWN_STATES[system][0..3]; Random-basis constants.
SpinSystem.ts
EnumerationValue SPIN_HALF/SPIN_ONE/SU3 with stateCount, analyzerTypes, opFor(type) (the typeTable), defaultType.
AnalyzerType.ts
EnumerationValue Z/X/Y/N/LAMBDA1..8 + label keys; shared by analyzers and magnets.
src/stern-gerlach-screen/model/
devices/ExperimentDevice.ts — abstract: id, positionProperty (model coords), port offsets, outputCount(system), isDeletable.
devices/ParticleSource.ts — sourceModeProperty (SINGLE/CONTINUOUS), emissionRateProperty, fire(). One output, non-deletable.
devices/Analyzer.ts — typeProperty: Property<AnalyzerType>; 2 or 3 outputs per system.
devices/Magnet.ts — typeProperty, fieldNumberProperty (0–99 int), cached computeU(operatorTable) invalidated on field/type/angle/system change.
devices/Counter.ts — countProperty, probabilityProperty (analytic), reset.
Wire.ts — {source, outputIndex, target}.
ExperimentGraph.ts — ObservableArrays of devices/wires; queries getNext(device, outIdx), getWiresInto, getSource; invariants enforced on mutation: ≤1 wire per output port, all wires into a device from the same source device, no cycles (reject — Java would hang); changedEmitter.
ExperimentEngine.ts — stateless over (graph, operatorTable, system, watch): transitDevice(device, state, rng) → {outputIndex, newState} (full NextComp port incl. the 3-state i/j/k branch logic at Experiment.java:517–604); computeCounterProbabilities() (forward DFS, Random init averaged ½/⅓ over fixed basis); sampleInitialState(rng).
InitialStateSetting.ts — enum UNKNOWN_1..4 / USER / RANDOM + UserStateModel (amplitude NumberProperties, basis choice, Z-basis rotation port).
ExperimentDefinition.ts — declarative presets {nameKey, devices, wires, layout} + buildInto(graph). Presets (QM-flavored, per system): single Z; single X; Z→X; Z→Z; interferometer (Z → X with outputs recombined → Z); magnet precession (Z → magnet → X); spin-1 2-of-3 recombination; SU3 λ chains. Plus CUSTOM sentinel.
Particle.ts / ParticleSystem.ts — particles move along straight rays between ports; on arrival call transitDevice, retarget via wires (dead end → vanish), increment counters, emit analyzerExitEmitter(analyzer, outIdx) for watch lights. Continuous emission capped (~500 live).
SternGerlachModel.ts — systemProperty (validValues gated by SU3 preference), experimentProperty, initialStateProperty, watchProperty, expectedValuesVisibleProperty, thetaProperty/phiProperty (global for all N-type devices, Java parity), graph, operatorTable, particleSystem, timer: TimeModel, doN(n) (analytic categorical sampling), clearCounters(). Reactions: system switch replicates setSystem; preset switch rebuilds graph (custom graph retained in a separate instance so toggling away/back preserves the build); any config change → clear counters + recompute analytic probabilities.
2. View architecture (src/stern-gerlach-screen/view/)
ExperimentAreaNode.ts — light rounded-rect board, owns ModelViewTransform2 (inverted-Y, scale ≈180); layers: wires < devices < particles < watch flashes.
nodes/AnalyzerNode.ts — QM SternGerlachNode look: black rect, #aff lineWidth-4 parabolic splitting curves (2 or 3; middle straight for the "0" output), gray-gradient holes, white RichText label (SG_Z … λ₄); exit-light flash circles driven by analyzerExitEmitter when Watch on (~0.5 s fade); type selector (RectangularRadioButtonGroup or ComboBox) below, visible in custom mode.
nodes/SourceNode.ts — QM ParticleSourceNode style: gray→white→gray gradient rounded rect, magenta RoundPushButton (single) / HSlider None…Lots (continuous), AquaRadioButtonGroup for source mode.
nodes/MagnetNode.ts — red body, type label, NumberDisplay + arrow buttons for field 0–99.
nodes/CounterNode.ts — histogram bar: height ∝ count/totalDetected, NumberDisplay (count + percent), green expected-value line at analytic probability toggled by expectedValuesVisibleProperty (adapted from QM HistogramWithExpectedValue). Preset layouts stack counters in a column so the group reads like QM's histogram.
nodes/WireNode.ts — bezier output→input, reactive to device positions. nodes/PortNode.ts — port circles, interactive in custom mode only.
ParticleLayerNode.ts (magenta Circles, single mode) + BeamCanvasNode.ts (CanvasNode 2px dots, continuous — QM ManyParticlesCanvasNode pattern).
ExperimentControlPanel.ts — SimPanel with preset ComboBox (SIM_COMBO_BOX_OPTIONS + LIGHT_SURFACE_TEXT_FILL), system AquaRadioButtonGroup (SU3 item visibleProperty ← preference), initial-state ComboBox (Random / Unknown #1–4 / User State…), Watch checkbox, Expected Values checkbox, Do 10/100/1000 flat buttons, Reset Counts.
DeviceToolboxNode.ts — custom-mode palette (analyzer/magnet/counter); creator-node drag-out; drag back to delete. Visible only when experimentProperty === CUSTOM.
UserStateDialog.ts, AnglesDialog.ts — user amplitudes (+X/Y/Z basis) and global θ/φ NumberControls.
Update existing: SternGerlachScreenView.ts (compose; pdomOrder), SternGerlachScreenSummaryContent.ts (live currentDetailsContent DerivedProperty describing graph + counts — doubles as the builder's non-visual overview), SternGerlachKeyboardHelpContent.ts (fire/build/wire sections).
Presets vs. builder: single isEditableProperty = experimentProperty === CUSTOM gates DragListeners/KeyboardDragListeners, port interactivity, toolbox, type selectors, deletion. Custom devices snap to a coarse grid.
Wiring interaction: pointer — press output port, rubber-band dashed wire, release on legal input port (illegal dimmed; elsewhere cancels); click wire to select, Delete/× to remove; press occupied output to re-route. Keyboard — devices focusable with KeyboardDragListener grid moves; on an output port Enter starts connect mode, arrows cycle candidate input ports (announced via accessibleName + context responses), Enter confirms, Esc cancels, Delete removes. Documented in keyboard help; v1 spatial overview relies on the live screen summary.
3. Preferences / SU(3) touch points
src/preferences/sternGerlachQueryParameters.ts — replace exampleToggle with su3: {type: "boolean", defaultValue: false, public: true}.
src/preferences/SternGerlachPreferencesModel.ts — su3EnabledProperty: BooleanProperty (init + reset).
src/preferences/SternGerlachPreferencesNode.ts — checkbox bound to it (existing template).
src/main.ts → SternGerlachScreen.ts → model: thread simPreferences through.
Model: if preference turns false while system is SU3 → fall back to SPIN_HALF. View: SU3 radio item visibility ← preference.
Strings preferences.su3Enable (+ description) in en/es/fr (compile-time parity enforces all three).
4. Colors & strings
New ProfileColorPropertys in src/SternGerlachColors.ts (default/projector): experimentAreaFill/experimentAreaStroke (light in both), analyzerBodyFill (black), analyzerLabelFill (white), splitterCurveStroke (#aaffff), analyzerHoleFill, particleColor (#C0C), wireStroke, magnetBodyFill, counterBarUpFill (black), counterBarDownFill (#C0C), expectedValueLine (rgb(0,170,0)), watchLightOn, portFill/portHighlight, sourceGradientLight/Dark. Device colors profile-invariant (they sit on the always-light board).
String keys (added per milestone to strings_en/es/fr.json, getters in StringManager): experiments.* (preset names, custom), systems.{spinHalf,spinOne,su3}, devices.* (labels, SG/λ patterns), controls.* (watch, expectedValues, singleParticle, continuous, fire, doN pattern, resetCounts, fieldStrength, initialState, random, unknownNPattern, userState, angles, theta, phi, none, lots), toolbox.*, dialogs.*, a11y.* (screenSummary, live currentDetails pattern, accessibleName/HelpText per control, builder connect/grab/wire responses), preferences.su3Enable.
5. Milestones (each verifiable; commit + push per milestone)
M1 — Quantum core. src/common/quantum/* + tests/quantum/*.test.ts. Gate: npm test, npm run check.
M2 — Model graph + engine (headless). Devices, graph, engine (transit + analytic DFS), initial states, presets, model skeleton, seeded RNG. Gate: physics-invariant vitest suite (§6) — carries most port risk, browser-free.
M3 — Preset pipeline on screen (spin-½). Experiment area, Source/Analyzer/Counter/Wire nodes, preset ComboBox, single-fire animated particle, counts. Gate: npm start manual check.
M4 — Statistics UX. Histogram bars + percent displays + green expected lines + checkbox; continuous beam (CanvasNode, cap); Do-N; auto-clear on config change.
M5 — Watch + magnet. Watch checkbox + exit-light flashes; MagnetNode + field control + magnet preset; AnglesDialog. Gate: interferometer restores input state watch-off, 50/50 watch-on; magnet n=72 ≡ identity.
M6 — Spin-1 + SU(3). System radio group, 3-output analyzers, spin-1 presets + 2-of-3 recombination, setSystem semantics, SU3 preference (§3) + λ presets. Gate: SU3 hidden until enabled; system switch matches Java.
M7 — Builder mode. CUSTOM entry, toolbox, drag (pointer + keyboard), port wiring, deletion, graph constraints, retained custom graph. Gate: hand-build the interferometer, reproduce M5 numbers.
M8 — Initial states. Initial-state ComboBox, Unknown #1–4 game, User State dialog with basis rotation (re-verify against Spins.java ~1373–1527). Gate: Unknown #1 → Z gives 100% up; Unknown #2 → Y gives 100% down.
M9 — A11y, i18n, polish, docs. Live currentDetails, full pdomOrder, keyboard help, accessibleNames audit, es/fr pass, both color profiles, beam perf pass, update doc/model.md + doc/implementation-notes.md. Gate: npm run check && npm run lint && npm test && npm run build.
6. Test plan (vitest, seeded RNG)
Math: projectOut orthogonality + normalization; inner-product conjugation; matrix identities.
Operators: every op's eigenvectors orthonormal with H·e = λe, λ order (+1, −1, 0); Sn(0,·)≡Sz, Sn(π/2,0)≡Sx; opSquared = op².
Analytic engine: |+z⟩→Z = (1,0); |+z⟩→X = (½,½); Z→X chain = (½,¼,¼); Random→Z = 50/50 (⅓ each spin-1); interferometer (both X outputs→Z) returns (1,0) for |+z⟩; watch-on interferometer = (½,½); spin-1 2-of-3 recombination vs hand-computed ProjectOut; SU3 λ4 probabilities; dead-end → 0.
Monte-Carlo vs analytic: 20k seeded particles through 3-analyzer graph within ~1.5% per counter; coherent recombination restores state exactly (equalsEpsilon).
Magnet: U†U=I for all types/fields; n=0 and n=72 → identity; n=18 (φ=π/2) vs hand-computed precession.
Model semantics: system-switch resets/deletions/clears; graph rejects cycles, double-wired outputs, multi-source inputs; Do-N totals.
7. Risks / notes
Continuous-beam perf: cap ~500 live particles, CanvasNode; Sprites only if profiling demands.
Percent denominator = total detected (not emitted) so unwired losses don't skew bars.
Java disables Do-N under Watch; our watch-aware analytic engine keeps it valid — verify watch-on branch enumeration collapses at every analyzer.
Global θ/φ (Java parity) for all N devices; per-device angles = future work.
Wire overlap in builder: grid snap + bezier offsets by output index.
Exactly one non-deletable source in custom mode (documented deviation from Java's multi-gun quirk).
User-state basis rotation is the least-documented Java code — re-verify at M8.
Verification (end-to-end)
Per milestone: npm run check, npm run lint, npm test; visual via npm start (check both color profiles via Preferences → Projector, keyboard traversal, screen-summary output). Final: npm run build. Commit and push each milestone to claude/java-typescript-simulation-port (git push -u origin, retry w/ backoff on network failure). 