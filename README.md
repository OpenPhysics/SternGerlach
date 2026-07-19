# Stern Gerlach

An interactive simulation of the Stern–Gerlach experiment built with
[SceneryStack](https://scenerystack.org/). Assemble analyzers, magnets, and counters;
fire spin-½ or spin-1 atoms; and compare Monte Carlo counts with analytic quantum
predictions.

## Features

- Build sequential Stern–Gerlach apparatus from analyzers, magnets, and counters
- Fire spin-½ or spin-1 atoms one at a time or as a continuous beam
- Exact Born-rule measurement and unitary magnet precession (SPINS-faithful model)
- Monte Carlo counts with analytic expected-value overlays on counters
- Watch / which-path mode to destroy interference in recombined paths
- English, Spanish, and French UI, projector color profile, and installable PWA

## Quick Start

Requires **Node ≥ 22** (see `.nvmrc`; older Node fails at vitest startup).

```bash
npm install
npm run icons    # generate PNG icons from public/icons/icon.svg
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run preview` | Preview the production build locally |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run clean` | Remove `dist/` |

## Documentation

| Document | Audience |
|---|---|
| [doc/model.md](doc/model.md) | Educators — the physics, equations, and pedagogy |
| [doc/implementation-notes.md](doc/implementation-notes.md) | Developers — architecture and design decisions |
| [doc/multi-screen.md](doc/multi-screen.md) | Developers — how to add screens if the sim grows |
| [references/](references/) | The original SPINS Java program this sim ports |

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^1 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenPhysics org license](https://github.com/OpenPhysics/.github/blob/main/LICENSE).

## Contributing

See [OpenPhysics contributing guidelines](https://github.com/OpenPhysics/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
