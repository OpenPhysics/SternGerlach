# references/

Reference material for the OpenPhysics **Stern–Gerlach** simulation. Contains the original
**SPINS** Java software by David H. McIntyre (Oregon State University), downloaded from
<https://sites.science.oregonstate.edu/~mcintyre/ph425/spins/>, plus its documentation. The
Java version is the intended reference for building the TypeScript / SceneryStack port of the
sim.

See **[`SPINS-SUMMARY.md`](./SPINS-SUMMARY.md)** for a full description of the software's
functionality, physics engine, components, and how it maps onto the planned port.

## Contents

| Path | What it is |
|---|---|
| `source/` | The original Java source as downloaded (unmodified) — 15 `.java` files, `images/`, `mainclass.mf`, `spinhelp.html`. |
| `spins.jar` | Prebuilt runnable application. Run with `java -jar spins.jar`. |
| `spinhelp.html` / `spinhelp.pdf` | User documentation (HTML and PDF). |
| `spinsapplet.html` | Legacy Java-applet launcher page. |
| `javahelp.txt` | Original build/run instructions. |
| `gpl.txt` | GNU GPL v2 — the license SPINS is distributed under. |

## License note

SPINS is distributed under the **GNU General Public License v2** (`gpl.txt`). These files are
kept here unmodified as a physics/behavior reference. Respect the GPL terms when reusing any of
this code.
