# Pokémon Idle

[![CI](https://github.com/Wrexial/pokeidle-fork/actions/workflows/ci.yml/badge.svg)](https://github.com/Wrexial/pokeidle-fork/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Game version](https://img.shields.io/badge/version-0.37.0-blue.svg)](src/data/changelog.js)

A browser-based **incremental / idle Pokémon game**. Train a party, battle wild
Pokémon, catch and evolve them, take on gyms, the Elite Four and each region's
Champion, breed at the Daycare, shiny-hunt with Honey and Repel, trade on Wonder
Trade and climb the Battle Tower — with nine regions to unlock.

It is **client-only**: no backend, no account, no server. Your progress is saved
to your browser's `localStorage`.

> **Play:** deploy the static build (see [Deploy](#deploy)) or run it locally
> with `npm run dev`, then open <http://localhost:5173>.

---

## What it is

- React 19 + Vite, plain JavaScript (JSDoc-checked with TypeScript).
- All game content (species, moves, maps, encounters, trainers, sprites) lives
  as editable JSON/PNG under `public/` and is loaded at runtime.
- No persistence layer beyond the browser — one versioned `localStorage` save
  that self-heals if it is ever corrupted or outdated.

## Features

- **Idle battles** — encounters resolve on a timer; speed controls from 1× to
  25×, pause, and optional auto-proceed to the next newly-unlocked location.
- **9 regions** — Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar and
  Paldea, each with its own route unlock tree and level curve (5–75).
- **Gyms / Elite Four / Champion** per region, with real badge names and
  post-game rematch teams.
- **Catching** — Poké Balls, per-route and global catch rules, auto-catch, and a
  guaranteed shiny catch option.
- **Items** — Potions/Revives from every mart, Rare/Exp. Candies that drop from
  wild battles, and sellable treasure (Nuggets, Pearls, Stardust, ...).
- **Evolution** — level-up, item (elemental stones, Link Cable, held-item
  trades) and reversible form changes.
- **Breeding** — the Daycare respects gender, egg groups and shiny odds.
- **Shinies** — full 1/8192 odds, a per-generation **Shiny Charm**, and a
  DexNav-style chain with Honey/Repel support.
- **Swarms & roaming legendaries**, **Raid Islands**, and a **Battle Tower**
  with endless scaling.
- **Wonder Trade**, **region Unlock Tokens**, region **Prestige**, **Records**
  and **Achievements**.

For a player-facing walkthrough of each system, open the in-game
**Settings → Player Guide** or [`public/guide.html`](public/guide.html). The
generated "what spawns where" overview is at
[`public/encounter-index.html`](public/encounter-index.html).

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev        # Vite dev server -> http://localhost:5173
npm run build      # production build -> dist/ (static, gitignored)
npm run preview    # serve the production build
```

Development checks:

```bash
npm run typecheck  # tsc --noEmit (JS checking mode, strict)
npm test           # node --test suite (reducer/combat/breeding/unlocks)
npm run validate   # integrity-check the generated public/data JSON
```

> **Windows tip:** stopping a backgrounded dev server with `pkill -f vite`
> doesn't work, so old servers pile up on ports 5173, 5174, … If a change
> doesn't seem to take effect, stop the server and run `npm run kill-vite`
> before restarting.

## Deploy

The build is a static bundle, so any static host works:

1. `npm run build`
2. Serve the `dist/` directory with GitHub Pages, Netlify, Vercel, nginx, etc.

No environment variables or server-side configuration are needed.

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html` | App entry; loads the data injector and `src/main.js`. |
| `assets/` | `gameDataInjector.js` (loads `public/data/*.json`), `style.css`, fonts. |
| `src/data/` | Static data + tuning: items, config, UI constants, changelog. |
| `src/game/` | Game logic. Each entry point (`pokemon`, `combat`, `progression`, `reducer`, `minigames`) is a barrel over focused submodules. |
| `src/components/` | One file per UI component (kebab-case). |
| `tests/` | `node --test` suite (`npm test`). |
| `public/data/` | **The game database** — species, moves, maps, encounters, trainers. |
| `public/sprites/` | Pokémon / trainer sprites and backgrounds. |
| `tools/` | One-off data scrapers/converters and the decompile tooling. |

`src/` was decompiled from a single minified bundle and split into modules; see
[`AGENTS.md`](AGENTS.md) before contributing. It documents the architecture,
data conventions and commands in detail.

## Data & credits

Game content is derived from community sources and bundled as JSON:

- **[PokéAPI](https://pokeapi.co/)** — species, encounters, learnsets, breeding
  data and static sprites.
- **[Bulbapedia](https://bulbapedia.bulbagarden.net/)** — region maps and
  Paldea's province areas.
- **[Pokémon Showdown](https://pokemonshowdown.com/)** — animated sprites for
  species past Gen V.

This is an **unofficial, non-commercial fan project**. Pokémon and all related
names, characters and imagery are © Nintendo / Creatures Inc. / GAME FREAK inc.
No affiliation or endorsement is implied.

## Community & roadmap

- Subreddit: [r/PkmnIdle](https://www.reddit.com/r/PkmnIdle/)
- Patch notes: in-game **What's New** modal, or
  [`src/data/changelog.js`](src/data/changelog.js).
- Planned work and ideas: [`TODO.md`](TODO.md).

## FAQ

**Is this official?** No — it's a fan-made idle game.

**Where is my save?** In `localStorage` under a versioned key
(`pokemon-idle-save-v*`). You can reset it from the in-game **Settings**, or
call `pokemonIdleResetSave()` in the browser console. An incompatible save is
backed up to `pi-save-backup` before it is ignored.

**Why did the encounter data change?** Route tables are regenerated from the
real games (via the tools in `tools/`), so they can shift when the dataset is
updated.

**How do I contribute?** Read [`AGENTS.md`](AGENTS.md) first — the source
follows specific conventions (no semicolons, `jsx()` runtime calls, JSDoc types)
and must keep `npm run typecheck` clean.

## License

Released under the [MIT License](LICENSE). The licence covers the application
code only; Pokémon content and assets remain the property of their respective
owners.
