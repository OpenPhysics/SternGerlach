# SPINS — Functionality Summary

**Source:** <https://sites.science.oregonstate.edu/~mcintyre/ph425/spins/>
**Author:** David H. McIntyre, Oregon State University (Java version).
Original Macintosh version by D. V. Schroeder (see *Am. J. Phys.* **61**, 798 (1993)).
**License:** GNU General Public License v2 (see `gpl.txt`).
**Downloaded:** 2026-07-17 for use as the reference implementation of a future TypeScript/SceneryStack port.

---

## 1. What SPINS is

SPINS is an interactive desktop program that simulates **Stern–Gerlach measurements** on
spin-½ and spin-1 quantum particles (plus an abstract SU(3) mode). The user builds an
"experiment" on a canvas by dragging simple components and wiring their outputs to inputs,
then fires atoms from an oven (gun) through the apparatus and watches probabilistic
measurement outcomes accumulate on counters. It is a teaching tool for quantum measurement,
sequential Stern–Gerlach experiments, spin precession in a magnetic field, and spin
interferometry.

The physics is exact: the program tracks a genuine complex quantum state vector, collapses it
on measurement according to the Born rule, and applies unitary time-evolution for magnets.

---

## 2. Components (the "device" palette)

Every draggable object subclasses the abstract `deviceSurface` (a Swing `JComponent`). The four
concrete device types are:

| Component | Class | Role |
|---|---|---|
| **Gun / Oven** | `Gun.java` | Source of atoms. Emits one atom at a time in a chosen initial spin state. Has one output, no input. |
| **Analyzer** | `Analyzer.java` | A Stern–Gerlach analyzer that *measures* spin along a chosen axis. Splits the beam into 2 outputs (spin-½) or 3 outputs (spin-1 / SU(3)), one per measurement eigenvalue. Collapses the state onto the corresponding eigenvector. |
| **Magnet** | `Magnet.java` | A region of uniform magnetic field that causes **spin precession** — it applies a unitary propagator to the state *without* measuring. Field strength is an integer 0–99 (set by clicking the number). One input, one output. |
| **Counter** | `Counter.java` | Detector/sink that tallies how many atoms arrive, and can display the exact theoretical probability. One input, no output. A horizontal bar with an auto-scaling count display. |

Components are connected by **`DrawLine`** objects: click an output arrow and drag to an input.
Multiple analyzer outputs may be recombined into a single downstream input, which is what makes
**interferometers** possible. Clicking an output arrow again disconnects it.

### Orientation / type
Analyzers and magnets carry a `type` string that selects the measured axis:
- **Spin-½ and Spin-1:** `X`, `Y`, `Z`, or `n` (a general direction set by polar angle θ and azimuthal angle φ). Click the letter to cycle X→Y→Z→n.
- **SU(3):** types `1`–`8`, corresponding to the eight Gell-Mann operators.

`deviceSurface.getTypeNum()` maps the letter to a type number, and `Experiment.typeTable[system][typeNum]`
maps that to an operator index (`op`) into the operator/eigenvector tables.

---

## 3. The physics engine (`Experiment.java`)

`Experiment` is the model/simulation core (a `Thread`). It owns the list of components and
connecting lines and all the quantum-mechanical machinery.

### Systems and state dimension
A `system` field selects the physics:
- `0` → **Spin ½** (`state = 2`, 2-dimensional Hilbert space)
- `1` → **Spin 1** (`state = 3`)
- `2` → **SU(3)** (`state = 3`)

### Operators and eigenvectors
`initVectors()` builds an array of up to 12 operator matrices (`oper[]`) with their squares
(`opSquared[]`) and eigenvectors (`EigenVector[op][k]`), all in a fixed complex basis:
- **Spin ½:** the Pauli matrices Sx, Sy, Sz and a general-direction Sn(θ,φ).
- **Spin 1:** the 3×3 spin matrices Sx, Sy, Sz and Sn(θ,φ).
- **SU(3):** the Gell-Mann-type λ matrices.

The general-direction operators (`op 10` for spin-½, `op 11` for spin-1) and their eigenvectors
are (re)computed from θ and φ in `SetPhi(theta, phi)` whenever the user changes the angles.

### Initial states (the oven output)
`whichInit` selects what state each atom leaves the gun in:
- `0`–`3` → **Unknown #1–#4** — specific, hard-coded state vectors the student is meant to
  determine experimentally (`InitialState[system][whichInit]`).
- `4` → **User State** — components the user types in a chosen basis; the program normalizes them.
- `5` → **Random** — each atom is emitted in a random eigenstate drawn from a fixed basis:
  Sz (`EigenVector[2]`) for spin-½, the spin-1 Sy eigenstates (`EigenVector[9]`) for spin-1 and
  SU(3), with equal probability among the 2 or 3 states (see `Experiment.run`). This is the
  default at startup.

### Two execution modes

**(a) Monte-Carlo simulation — `run()` / `NextComp()`**
Atoms are fired one at a time in a loop until stopped. For each atom:
1. Prepare the initial `stateVector`.
2. Walk the component chain from the gun. At each **analyzer**, roll a random number and use
   `vector.DotProdSquared()` (|⟨eigen|ψ⟩|², the Born rule) to pick which output the atom exits;
   the state collapses to that eigenvector (`ProjectOut()` handles recombined outputs). At each
   **magnet**, multiply the state by the precession propagator `U`. Continue until a **counter**
   is reached and increment it.
3. In **Watch** mode, a light flashes on the output the atom actually took (`drawWatchEnd`),
   which — as in the real which-path experiment — destroys interference.

**(b) Exact probability — `ComputeProbForCounters()` / `ComputeProb()` / `BranchProb()`**
For each counter, the engine walks *backwards* to the gun to find the chain of components,
then computes the exact analytic probability that an atom reaches that counter (summing over
initial eigenstates for the Random case), applying `BranchProb()` at each analyzer and the
propagator at each magnet. This lets the sim display theoretical probabilities alongside the
Monte-Carlo counts.

### Magnet propagator (`Magnet.ComputeU()`)
Field strength `number` (0–99) maps to a precession angle `phi = 2π·number/72`. The unitary is
computed in closed form for operators whose eigenvalues are in {−1, 0, +1}:

```
U = exp(−iHφ) = 1 − i·sin(phi)·H + (cos(phi) − 1)·H²
```

---

## 4. Supporting math classes

| File | Purpose |
|---|---|
| `Complex.java` | Complex-number arithmetic (add, product, conjugation, modulus², scale, etc.). |
| `vector.java` | 3-component complex state vector: dot product, scalar multiply, add, normalize, `DotProdSquared` (Born probability), `ProjectOut` (collapse into the plane ⟂ to a measured eigenvector). |
| `Matrix.java` | 3×3 complex matrix: matrix×vector, matrix×matrix, add, scalar multiply, and `SquareMatrix` (H²). |

---

## 5. User interface (`Spins.java`, ~2200 lines)

`Spins` is the main Swing application window (`JFrame`). It provides a scrollable **draw board**
canvas, a toolbar, and a menu bar. Mouse handling supports click-to-select, drag-to-move,
resize, click-an-output-and-drag-to-connect, and click-to-change (letter cycles axis, number
cycles field strength).

### Menus
- **File** — About, New (clear board), Default Experiment (the ready-to-go z-measurement),
  Quit.
- **Edit** — Cut, Copy, Clear.
- **Design** — choose the system (**Spin 1/2**, **Spin 1**, **SU(3)** radio buttons); add a
  **New Analyzer / Magnet / Counter / Gun**; **Change Angles** (θ, φ dialog for the `n`
  direction); Redraw Screen. Keyboard shortcuts exist (e.g. ctrl-N for a new analyzer).
- **Control** — **Go** / **Stop** (start/stop continuous firing), **Reset** (clear counters),
  **Do 1 / 10 / 100 / 1000 / 10000** (fire a fixed number of atoms), **Watch** (which-path
  light toggle), **Set Watch Time** (how long the watch lights stay lit).
- **Initialize** — pick the oven's initial state: **Unknown #1–#4**, **User State**, **Random**.
- **Help** — in-canvas HTML help (`spinhelp.html`) shown via `HtmlPanel`, plus Exit Help.

### Other UI helpers
| File | Purpose |
|---|---|
| `deviceSurface.java` | Abstract base for all devices; geometry, cloning, type/op handling, hit-testing, cursor selection. |
| `DrawLine.java` | A connection between an output end of one device and the input of another. |
| `Counter.java` | Also handles count display and shared auto-scaling of the count bars. |
| `HtmlPanel.java` | Renders the HTML help file inside the app. |
| `DecimalField.java`, `FormattedDocument.java`, `ConverterRangeModel.java` | Numeric text-entry fields for the angle and User-State dialogs. |
| `SpinsApplet.java` | Thin applet wrapper so SPINS can run embedded in a browser (legacy Java plug-in). |
| `mainclass.mf` | JAR manifest naming `Spins` as the entry point. |
| `images/` | GIF icons for the toolbar/devices and the five help-figure images. |

---

## 6. Canonical experiments (from the help file)

1. **Single z-measurement** — Gun → Sz analyzer → two counters. (Loaded by default at startup.)
2. **Sequential measurements** — chain analyzers on different axes to show that measuring Sx
   destroys prior Sz information.
3. **Spin-½ interferometer** — recombine the two outputs of one analyzer into a second analyzer;
   toggling **Watch** collapses the which-path information and destroys the interference.
4. **Spin precession in a field** — Gun → analyzer → magnet → analyzer → counters, varying the
   field strength to see the state rotate.

---

## 7. Relevance to the TypeScript / SceneryStack port

For the planned rewrite, the clean model/view split maps as follows:

- **Model (physics):** port `Experiment`, `Complex`, `vector` (→ a complex-state-vector type),
  `Matrix`, and the per-device operator/eigenvector tables. The Born-rule sampling in
  `NextComp()` and the analytic `ComputeProb()`/`BranchProb()` paths are the heart of the sim and
  translate directly to TypeScript. Keep both the Monte-Carlo and exact-probability paths.
- **Devices:** `Gun`, `Analyzer`, `Magnet`, `Counter` become model objects plus SceneryStack
  view `Node`s; the drag-to-connect wiring becomes a graph of connections (the `DrawLine` list).
- **View/UI:** the Swing menus map onto SceneryStack panels/combo boxes — system selector,
  initial-state selector, θ/φ angle control, run controls (Go/Stop/Do-N), Watch toggle.
- **Note:** the original hard-codes a maximum Hilbert-space dimension of 3; a modern port can
  keep that scope (spin-½, spin-1, SU(3)) or generalize it.

---

## 8. Files in this `references/` directory

| Path | Description |
|---|---|
| `source/` | The original Java source as downloaded (unmodified) — 15 `.java` files, `images/`, `mainclass.mf`, `spinhelp.html`. |
| `spins.jar` | Prebuilt runnable Java application (`java -jar spins.jar`). |
| `spinhelp.html` | User documentation (HTML). |
| `spinhelp.pdf` | User documentation (PDF, 2 pages). |
| `spinsapplet.html` | Legacy applet launcher page. |
| `javahelp.txt` | Build/run instructions for the Java app and applet. |
| `gpl.txt` | GNU GPL v2 license text. |
| `SPINS-SUMMARY.md` | This document. |

### Running the reference (for behavior comparison)
```sh
java -jar references/spins.jar        # needs a Java runtime (originally Java 1.2+/Swing)
```
Or rebuild from source (see `javahelp.txt`):
```sh
cd references/source
javac Spins.java
java Spins
```
