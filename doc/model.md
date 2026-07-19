# Model - Stern Gerlach

This document describes the model (the underlying physics, math, and behavior) for the simulation,
in terms appropriate for an educator. It is the companion to
[implementation-notes.md](./implementation-notes.md), which targets developers.

## Overview

The simulation models **sequential Stern–Gerlach experiments** on individual quantum particles.
A source emits atoms one at a time (or as a continuous beam) into an apparatus the user assembles
from analyzers, magnets, and counters. The physics is exact, not a cartoon: every atom carries a
genuine complex state vector, analyzers collapse it according to the Born rule, and magnets apply
unitary time evolution. Counts accumulate on the counters so students watch probabilistic single
events converge to the quantum-mechanical prediction.

The model is a faithful port of David McIntyre's **SPINS** program (Oregon State University; see
`references/`), which itself descends from D. V. Schroeder's Macintosh program
(*Am. J. Phys.* **61**, 798 (1993)). The key ideas a student should take away:

- A measurement along one axis **destroys** prior information about incompatible observables
  (measuring Sx erases a previous Sz result).
- Repeating the same measurement gives the same answer (the state has collapsed).
- If an analyzer's outputs are **recombined without leaving a record**, no measurement has
  happened — the original superposition is restored (the spin interferometer). Turning on
  *Watch* (which-path lights) restores the measurement and destroys the interference.
- A magnetic field **precesses** the spin coherently; precession is unitary evolution, not
  measurement.

## Quantities and units

The model is abstract quantum mechanics; there are no SI quantities. Spin operators are expressed
in units of ħ (spin-½ analyzers report ±1 rather than ±ħ/2, matching SPINS).

| Quantity | Symbol | Values |
|---|---|---|
| Quantum state | \|ψ⟩ | unit vector in ℂ² (spin-½) or ℂ³ (spin-1) |
| Measured spin component | Sn | eigenvalues +1, −1 (spin-½); +1, 0, −1 (spin-1) |
| Analyzer direction | n̂(θ, φ) | θ ∈ [0, π], φ ∈ [0, 2π] — **each n̂ device owns its own pair** |
| Magnet field dial | n | integer 0–99; precession angle φ = 2π·n/72 (72 = one full turn) |

## Governing equations

**Measurement (analyzers).** An analyzer measuring observable A with eigenvectors |aₖ⟩ routes the
atom out of port k with Born probability P(k) = |⟨aₖ|ψ⟩|², and the state collapses to |aₖ⟩.
The counters' green expected-value lines come from an exact analytic path-sum over the apparatus,
computed alongside the Monte-Carlo sampling.

**Precession (magnets).** A magnet applies the propagator

U = exp(−iHφ) = 1 − i·sin(φ)·H + (cos φ − 1)·H²

which is the closed form of the exponential for any observable H whose eigenvalues lie in
{−1, 0, +1} — true of every operator in the simulation.

For an n̂-type magnet, H is Sn at **that magnet's own** (θ, φ). Different n̂ devices in one
apparatus may point in different directions independently.

**Coherent recombination.** When *all* outputs of an analyzer are wired into the same downstream
device and Watch is off, no record of the intermediate result exists, so the state passes through
**unchanged**. When two of a 3-state analyzer's outputs are recombined and the third is separate,
the separate branch k is measured with probability |⟨aₖ|ψ⟩|², and the merged branch carries the
renormalized projection of |ψ⟩ onto the plane perpendicular to |aₖ⟩ with probability
1 − |⟨aₖ|ψ⟩|². With Watch on, every branch is measured and the interference disappears.

Note on the animation: on a coherent (merged) branch the drawn atom must still exit *some* port,
so the display path is sampled with the Born weights — but this choice is cosmetic only; the
carried state stays in superposition.

**Exit blockers.** Blocking an analyzer exit physically discards the atoms (and probability mass)
that would leave there — a blocked path *is* a measurement. The "Lost to filters/dead ends"
readout reports the discarded fraction; histogram bars and expected-value lines are both
normalized to **detected** atoms, so they converge to each other even when mass is lost.

## Initial states

- **Random** (default): each atom is emitted in a randomly chosen eigenstate of a fixed basis —
  Sz for spin-½, Sy for spin-1 — with equal probability. This is a *statistical
  mixture*, not a superposition: it gives 50/50 through every analyzer direction for spin-½.
- **Unknown #1–#4**: hard-coded mystery states for the classic lab exercise of determining an
  unknown state experimentally. They are deliberately never displayed.
- **User State**: amplitudes typed in a chosen basis (Z, X, or Y; the model normalizes and
  rotates them into the computational Z basis). For spin-1, components are ordered by eigenvalue
  (+1, 0, −1).

## The two systems

- **Spin ½** — 2-dimensional; analyzers split into 2 beams; observables Sx, Sy, Sz, Sn(θ, φ).
- **Spin 1** — 3-dimensional; analyzers split into 3 beams (+1 top, 0 middle, −1 bottom).
  Offered when Preferences → Simulation enables Spin 1 (or via `?spinOne`).

SU(3) spin systems were removed; only spin-½ and spin-1 are supported.

## Simplifications and assumptions

- **Geometry is schematic.** Atoms travel along drawn wires at a fixed animation speed; distances,
  beam deflection magnitudes, and gradients are not modeled. Only the quantum state matters.
- **Each n̂ device owns its own direction** — a deliberate departure from SPINS, where one global
  (θ, φ) pair was shared by every n̂-type analyzer and magnet. Here every analyzer and magnet set
  to n̂ carries independent angles, so apparatus with several differently-oriented n̂ devices
  behave correctly. The implementation keeps direction math as pure (θ, φ) lookups with no shared
  mutable angle state (see implementation notes).
- **Recombination requires a common upstream device.** All wires into a device must come from the
  same source device — this is what makes the coherent-recombination rule well-defined. (The Java
  original permitted arbitrary merges but computed them incorrectly; this port forbids them.)
- **Magnets are lossless and instantaneous** — pure unitaries, no traversal-time physics beyond
  the dialed precession angle.

## References

- D. H. McIntyre, *Quantum Mechanics: A Paradigms Approach* (Pearson, 2012), Chapter 1 — the
  SPINS-based introduction this simulation is designed to accompany.
- D. V. Schroeder & T. A. Moore, "A computer-simulated Stern-Gerlach laboratory",
  *Am. J. Phys.* **61**, 798 (1993).
- The original SPINS Java program and documentation: `references/` in this repository.
- PhET's *Quantum Measurement* simulation (Spin screen) for comparative UI/pedagogy patterns:
  `references/quantum-measurement/`.
