# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

**Pokémon Idle** — a browser-based incremental/idle Pokémon game (train, evolve,
catch, battle gym leaders / Elite 4 / champion). It is a client-only app; there
is no backend and no persistence layer beyond the browser.

The game logic lives in `src/` as ES modules that import React 19 / ReactDOM
from npm and are bundled by Vite. Game *content* (species, moves, maps,
trainers, sprites) is kept as editable JSON/PNG under `public/` and loaded at
runtime.

## Commands

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # production build -> dist/  (gitignored)
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit over src/ (jsconfig.json, checkJs)
```

There is **no test suite and no linter**. `npm run typecheck` runs the TypeScript
compiler in JS-checking mode (`jsconfig.json` + `@types/react`) and should stay
clean; fix it or add JSDoc rather than ignoring errors. Verify behaviour by
running the dev server and exercising the game in the browser.

Formatting: `.prettierrc.json` is the intended style (`semi: false`,
`singleQuote: true`, `trailingComma: "es5"`), but Prettier is **not** installed
as a dependency and there is no format script. Match the surrounding code
style; do not reformat/minify unrelated code.

`src/` was decompiled from a single minified bundle. The vendored React copy has
been removed (React is now a real dependency), all identifiers were renamed to
descriptive names, and the monolith was split into modules (see
`tools/decompile/`).

`tools/decompile/` holds AST-based, scope-safe rename tools (Babel). They emit
minimal textual edits (no codegen), so formatting is preserved, and they refuse
to run on collisions:

```bash
# top-level identifiers (applied; RENAMES is now empty)
node tools/decompile/rename.mjs [--write]

# function-scope locals (params + body vars) — see LOCAL_RENAMES
node tools/decompile/rename-locals.mjs [--write] [--fn SomeFunction]

# nested/block-scoped locals, targeted by declaration line — see NESTED_RENAMES
node tools/decompile/rename-nested.mjs [--write] [--fn SomeFunction] [--pass2]

# collapse `{ key: key }` object properties to shorthand
node tools/decompile/collapse-shorthand.mjs [--write]

# reporting
node tools/decompile/dump-scopes.mjs [FunctionName]   # fn params + scope bindings
node tools/decompile/dump-nested.mjs                   # nested-report.txt
node tools/decompile/deps.mjs                          # top-level dependency graph

# split the monolith into src/ modules (already applied)
node tools/decompile/split-modules.mjs [--write]

# split src/game/logic.js into game sub-modules (already applied)
node tools/decompile/split-logic.mjs [--write]

# generic module splitter (used for src/data/constants.js)
node tools/decompile/split-module.mjs [--write]

# split grouped component files into one file per component (already applied)
node tools/decompile/split-components.mjs [--write]
```

The whole codebase has now been de-minified and modularised with these tools:
top-level names, function parameters/body variables, and nested (block/callback)
bindings are all descriptive, and the code is split into `src/`. The rename
tools are effectively **one-shot records** of the renames that were applied
(re-running a pass reports the old names as "not found"); to rename new code,
add entries targeting the *current* names.
`rename-nested.mjs` keys entries by declaration line, because short names are
reused with different roles in sibling scopes (e.g. every `gameReducer` case).

Python tools (the `tools/*.py` scrapers) use the checked-in venv:
`.venv/Scripts/python.exe` (Windows). The repo is developed on Windows, so
prefer cross-platform paths/commands.

## Runtime data flow

```
index.html
  ├─ <script type="module" src="./assets/gameDataInjector.js">   (loads JSON)
  └─ <script type="module" src="./src/main.js">                  (the app)
```

1. `assets/gameDataInjector.js` `fetch`es every file in `dataFilesToLoad`
   concurrently, stores them on `window.gameDataInjector.data`, and resolves
   `window.gameDataReady`.
2. `src/data/gameData.js` awaits `window.gameDataReady` (top-level await) and
   re-exports the data (`pokemonSpecies`, `evolutionData`, `moveData`,
   `mapData`, …) plus derived maps (`preEvolutionMap`, `pokedexIndexes`, …).
3. The rest of `src/` imports that data as needed.

`assets/gameDataLoader.js` and `assets/dataIntegrationUtils.js` are optional
helper/debug modules describing the integration; the live path is
`gameDataInjector.js` + `index.js`.

### Debugging at runtime (browser console)

```js
window.gameDataDebug.status()          // load status / errors
window.gameDataDebug.getAllData()      // all loaded JSON
window.gameDataDebug.listAllPokemon()
window.gameDataDebug.findByType('Water')
window.gameDataDebug.lookupPokemon('pikachu')
```

## Repository layout

| Path | Purpose |
| --- | --- |
| `index.html` | Entry point; wires the two scripts above. |
| `src/main.js` | App entry: mounts `App` (plus `AppContent`). Renders the root. |
| `src/data/gameData.js` | Loads and re-exports all game JSON + derived maps. |
| `src/data/items.js` | Items/balls/evolution items, mart stock, bag categories. |
| `src/data/config.js` | Tuning constants: shiny odds, cooldowns, starters/legendaries, save keys. |
| `src/data/moves.js` | Type chart + move-category icons. |
| `src/data/ui.js` | UI constants: speed options, stat-bar colors, rarity labels, drag defaults, backgrounds. |
| `src/data/changelog.js` | `GAME_VERSION`, `LAST_SEEN_VERSION_KEY`, `CHANGELOG`. |
| `src/game/pokemon.js` | Species/stat/exp/learnset math, sprite URLs, `createPokemon`. |
| `src/game/combat.js` | Battle math: type chart, damage, stat stages, AI, `resolveBattleTurn`. |
| `src/game/catching.js` | Catch rate/chance, ball selection, auto-catch rules, encounter rarity. |
| `src/game/progression.js` | Encounters, EXP awards, unlocks, party sync, effects/items, roads. |
| `src/game/reducer.js` | `initialGameState` + `gameReducer` (the whole state machine). |
| `src/game/context.js` | `GameContext`, `GameProvider`, `useGame`. |
| `src/hooks.js` | `useTypewriter`, `useIsMobile`, `useGameLoop`. |
| `src/components/*.js` | **One file per component** (39 files, kebab-case, e.g. `battle-scene.js`, `pokedex-tile.js`). |
| `src/types.d.ts` | Ambient types for the injected `window.gameData*` globals. |
| `assets/gameDataInjector.js` | Loads `public/data/*.json` into `window.gameDataInjector`. Add new data files here. |
| `assets/style.css` | All game styling + CSS variables (theme colors). |
| `assets/fonts.css` | Local "Press Start 2P" `@font-face` declarations. |
| `public/data/*.json` | **The game database** (see below). Served at `/data/...`. |
| `public/sprites/pokemon/` | Pokémon sprites, named by numeric species/form id (`25.png`, `25.gif`, `back/25.png`, …). |
| `public/sprites/trainers/` | Trainer images. |
| `public/backgrounds/` | Battle/location backgrounds. |
| `public/heal-animation-web.mp4` | Healing animation. |
| `ui/` | UI textures (parchment, wood button). |
| `tools/` | One-off scrapers/converters for generating the data JSON, plus `tools/decompile/` (AST rename tool). Not part of the build. |
| `dist/` | Build output. Gitignored — never edit or commit. |

## Data files (`public/data/`)

These are loaded by `assets/gameDataInjector.js` (`key` → file):

| Injector key | File |
| --- | --- |
| `pokemonSpecies` | `pokemon-species.json` |
| `evolutionData` | `evolution-data.json` |
| `moveLearnsets` | **`possible-learnsets.json`** |
| `moveData` | **`possible-moves.json`** |
| `mapEncounterData` | `encounter-data.json` |
| `mapData` | `map-data.json` |
| `trainerClasses` | `trainer-classes.json` |
| `trainerData` | `trainer-data.json` |
| `gymLeaderData` | `gym-leader-data.json` |
| `elite4Data` | `elite-4-data.json` |
| `championData` | `champion-data.json` (array, one per region) |
| `regions` | `regions.json` |

**Watch out:** `move-data.json` and `move-learnsets.json` are *not* loaded by
the injector — they are older/smaller files. The live move data is
`possible-moves.json` / `possible-learnsets.json`. Don't edit the wrong pair.

Data conventions:

- Species keys are lowercase camelCase names (`bulbasaur`, `mrMime`,
  `nidoranf` for the female Nidoran).
- `pokemon-species.json` entries look like:
  ```json
  {
    "id": 1, "name": "Bulbasaur", "types": ["Grass", "Poison"],
    "baseStats": { "hp": 45, "attack": 49, "defense": 49,
                   "spAttack": 65, "spDefense": 65, "speed": 45 },
    "baseExpYield": 64, "growthRate": "mediumSlow", "catchRate": 45
  }
  ```
- Learnsets map `species -> [[level, moveKey], ...]`.
- Some special/placeholder forms use `"id": 0` intentionally (see commit
  "All id's now 0 for special pokemon"). Region wild encounters only use species
  with `id > 0` (forms with ids above 1025 are excluded).
- `map-data.json` locations carry a `region` id; wild routes also reference an
  `encounter-data.json` bucket via `routeKey`. Unlock rules support
  `battlesAtLocation`, `badgesRequired`, `championDefeated`, and `requires`
  (a list of locations that must already be unlocked — resolved to a fixpoint in
  `computeUnlockedLocations`).
- Sprites are referenced by that `id`; a missing `.gif` falls back to the
  static `.png` (see commit "Fallback to static img").

When adding/renaming species or keys, grep `src/` for the key —
the code references keys and ids directly, and cross-file references
(evolutions, encounters, learnsets) must stay consistent.

## Source layout (`src/`)

- Split into modules by layer. Imports form a DAG (no cycles). The rough order
  is `data → game/pokemon|combat → game/progression → game/catching → game/reducer
  → game/context → hooks → components/* → main`.
- Each UI component is its own file under `src/components/` (kebab-case).
- TypeScript runs in check-JS mode with **`strict: true`**: `npm run typecheck`
  must stay at 0 errors. Core shapes (`Pokemon`, `BattlePokemon`, `Move`,
  `Species`, `GameState`, `GameAction`, `MapLocation`, …) live in
  `src/types.d.ts`; data tables are typed where they are declared.
- JSDoc gotchas: `React.memo(function ({...}))` needs a `@param` for its props
  (otherwise TS infers `{}`); `useRef(null)`/`useState(null)` need a `@type`
  cast; image `onError` handlers are typed `@param {{ target: HTMLImageElement }}
  event`; arrow params can be annotated inline (`/** @param {T} x */ (x) => …`).
- All identifiers are descriptive (top-level, params, locals, and nested
  block/callback bindings). Short names only remain where they read naturally
  (`id`, `ms`, `item`, `rule`, `key`, `type`, …).
- React 19, `jsx`/`jsxs` runtime calls (imported from `react/jsx-runtime`); there
  is no JSX syntax, so no React Vite plugin is needed. Keep changes consistent
  with the existing `jsx('div', { ... })` pattern.
- `tools/index-backup.js` still contains the original minified 26k-line bundle
  if you ever need to compare against the pre-decompilation source.
- To add/rename/move modules, edit `MODULES` in
  `tools/decompile/split-modules.mjs` and re-run it (regenerates `src/` from the
  former monolith — only do this while `tools/index-backup.js` still matches).

## Tools (`tools/`)

One-off scripts used to build the data JSON (not run during dev/build):

- `scrape_serebii.py`, `convert_moves.py`, `fix_pokemon_ids.py` — Python
  (need `requests`, `beautifulsoup4` in `.venv`).
- `scrape_pokemondb.cjs`, `download_pokemon_sprites.cjs`, `extract_data.cjs` —
  Node scripts.
- `scrape-region-maps.cjs` — scrapes real region maps: location lists from
  PokéAPI and route/town compass connections (`north/south/east/west`) from
  Bulbapedia's raw infoboxes, then computes a directional layout. Caches HTTP
  responses under `tools/cache/` (gitignored) and writes
  `tools/region-maps.json` (committed).
- `generate-regions.cjs` — turns `tools/region-maps.json` into game content
  (locations, encounters, trainers, marts, Raid Islands, and gym/Elite
  Four/Champion leagues) for generations 2-9, merging it into
  `map-data.json` / `encounter-data.json` / `trainer-data.json` /
  `gym-leader-data.json` / `elite-4-data.json` / `champion-data.json`, and
  writing `regions.json` (region metadata + per-region legendary pools).
  Idempotent — safe to re-run; tags Kanto locations/leaders with
  `region: "kanto"`.
- `RawMoveData`, `index-backup.js` — large reference/backup data; leave alone.
- `*.md` in `tools/` (`SUMMARY.md`, `DATA_INTEGRATION.md`,
  `REFACTORING_GUIDE.md`, `QUICKSTART_DATA_INTEGRATION.md`) — historical design
  docs. Some counts/claims there are outdated (e.g. they still say "151
  Pokémon"); treat the JSON files and code as authoritative.

These scripts hit external sites (Serebii, PokémonDB) and may write large files
— only run them when the task is explicitly about re-scraping data.

## Conventions

- JS: no semicolons, single quotes, ES5 trailing commas, 2-space indent.
- CSS: 4-space indent; theme lives in the `:root` custom properties at the top
  of `assets/style.css`.
- Data/asset paths in code are absolute from web root (`/data/...`,
  `/sprites/...`), served out of `public/`.
- Keep diffs scoped; avoid touching `tools/index-backup.js`, `dist/`, and the
  committed base64/PNG assets unless the task requires it.

## Verifying changes

1. `npm run dev` and load the game.
2. Open the browser console and confirm `window.gameDataDebug.status()` reports
   `loaded: true, hasError: false`.
3. Play through the affected flow (encounter, battle, evolution, shop, etc.).
4. `npm run build` should succeed with no errors before finishing.
