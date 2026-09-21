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
npm run kill-vite  # kill orphaned dev servers (see note below)
```

**Windows + stale dev servers:** backgrounding `npm run dev` and stopping it
with `pkill -f vite` does **not** work on Windows (`node.exe` isn't matched), so
dev servers pile up on ports 5173, 5174, … and the browser can end up talking to
a stale one. That shows up as confusing runtime errors, e.g.
`Uncaught SyntaxError: The requested module '/src/components/x.js' does not
provide an export named 'X'`. If you see something like that after edits, don't
trust HMR — stop the server (Ctrl-C) and run `npm run kill-vite` (dry run with
`node tools/kill-vite.cjs --dry`) before restarting `npm run dev`.

There is **no test suite and no linter**. `npm run typecheck` runs the TypeScript
compiler in JS-checking mode (`jsconfig.json` + `@types/react`) and should stay
clean; fix it or add JSDoc rather than ignoring errors. Verify behaviour by
running the dev server and exercising the game in the browser.

**Save recovery:** an incompatible/stuck save self-heals without DevTools.
The save key is **versioned** (`pokemon-idle-save-v<n>`, see `SAVE_VERSION` in
`src/data/config.js`); the loader in `src/game/context.js` reads the versioned
key, and only falls back to a legacy key (`pokemon-idle-save`) for a one-time
migration. A save is loaded only if the version matches (or it's a legacy save)
*and* it repairs cleanly — the repair drops unknown locations/routes/species,
moves, gyms and catch rules, and rebuilds a safe location. Anything that still
fails is copied to `pi-save-backup` and ignored, so it can never crash the boot
again. `index.html` has an inline *boot guard* that clears every
`pokemon-idle-save*` key and reloads once if the game fails to start (module
error / rejected promise / >15s hang with a save present; a `sessionStorage`
counter stops reload loops), and `ErrorBoundary`
(`src/components/error-boundary.js`) auto-resets after a render error. A console
helper `pokemonIdleResetSave()` also exists. Bump `SAVE_VERSION` and add the old
key to `LEGACY_SAVE_KEYS` when the save shape changes incompatibly; `clearSave()`
removes the live keys (the quarantine backup is kept).

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
| `public/encounter-index.html` | Generated offline "what spawns where" overview (see `tools/generate-encounter-index.cjs`). |
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
| `mapEncounterData` | `encounter-data/<region>.json` (merged) |
| `mapData` | `map-data/<region>.json` (merged) |
| `trainerClasses` | `trainer-classes.json` |
| `trainerData` | `trainer-data.json` |
| `gymLeaderData` | `gym-leader-data.json` |
| `elite4Data` | `elite-4-data.json` |
| `championData` | `champion-data.json` (array, one per region) |
| `regions` | `regions.json` |

**Watch out:** `move-data.json` and `move-learnsets.json` are *not* loaded by
the injector — they are older/smaller files. The live move data is
`possible-moves.json` / `possible-learnsets.json`. Don't edit the wrong pair.

The map and encounter databases are **split one file per region** under
`public/data/map-data/` and `public/data/encounter-data/` (`kanto.json` …
`paldea.json`). The injector loads each file with `merge: true` and combines
them, in region order, into the single `mapData` / `mapEncounterData` objects
the app sees (`tools/lib/region-data.cjs` does the same for the Node tools).
Edit a region's own file; don't reintroduce the monolithic JSON.

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
- `regions.json` entries carry `entry` (the starting town's location id),
  `startLevel` (5 for every region now that each runs its own 5-75 curve) and
  `leagueLocationKey` (the region's Pokémon League, e.g.
  `indigoPlat` for Kanto; generated as `<region>-league`). The Elite Four can
  only be challenged while the player is standing at that location, and gym
  leaders only while at their `locationKey`, so both are gated by their zone.
  `SELECT_STARTER` uses `entry` to place the player: choosing a
  region's starter starts the run on that region's first route. Regional
  starters live in `regionalStarters` in `src/data/config.js`.
- `map-data/<region>.json` locations carry a `region` id; wild routes also
  reference an `encounter-data/<region>.json` bucket via `routeKey`. Unlock rules support
  `battlesAtLocation`, `badgesRequired`, `gymsRequired` (specific gym ids),
  `championDefeated` (a region id, or
  `true` meaning Kanto), and `requires` (locations that must already be
  unlocked) — all resolved to a fixpoint in `computeUnlockedLocations`. Region
  **entry towns** use `{ entry: true, previous: '<regionId>' }`: they open if the
  region is the player's `startRegion`, otherwise only once the `previous`
  region's Champion is beaten (Kanto's previous is Paldea, so the chain cycles
  and nothing is unreachable). Other routes unlock after winning battles at their
  parent location.
- `regions.json` also carries `raidPool` — the generation's species that cannot
  be obtained in that region (not in any wild table and not reachable by
  evolution). Those are the Pokemon found on the region's Raid Island.
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
  `tools/region-maps.json` (committed). Note Paldea is PokéAPI region **10**
  (region 9 is Hisui) and has no routes — its areas are the
  "<Dir> Province (Area N)" locations.

  Bulbapedia routes often meet at intermediate areas (forests, gates, bridges,
  lakes) that aren't separate locations, which used to leave whole chunks of a
  region disconnected (e.g. Sinnoh's Snowpoint City, Kalos's western half,
  Galar's Wild Area). The scraper now records those unresolved compass targets,
  reads the connector's intro links back to real locations (`addConnectorHubs`),
  lays the graph out with a synthetic hub per shared connector, then contracts
  the hubs back out by chaining their neighbours (`contractHubs`). Compass refs
  win: prose links are only consulted when fewer than two nodes name the
  connector, and only its opening paragraph is read, otherwise the whole lead
  (plus `{{rt}}` templates) over-connects the graph (Dark Cave linking Route 29
  and Blackthorn City; Pinwheel Forest linking Route 11). A few gaps
  Bulbapedia never records are filled from `MANUAL_BRIDGES` (currently only
  Galar's Wild Area links); keep that table tiny and verified. Anything still
  unreachable is a genuinely separate area (post-game zones, Alola's islands,
  open-world Paldea) and `generate-regions.cjs` stitches it on by proximity.
- `scrape-route-encounters.cjs` — pulls real per-route wild encounters from
  PokéAPI (`/location` → `/location-area`), keeps only wild methods (drops
  gift/static), keeps only the region's preferred game versions (so no
  cross-generation oddities), maps species to the game's keys, and also
  refreshes Kanto from its own map-data. **Paldea isn't in PokéAPI's encounter
  data**, so its province areas are parsed from Bulbapedia's `{{Catch/entry9}}`
  tables instead. Writes `tools/route-encounters.json` (committed).
- `generate-regions.cjs` — turns `tools/region-maps.json` + `route-encounters.json` into game content
  (locations, encounters, trainers, marts, Raid Islands, and gym/Elite
  Four/Champion leagues) for generations 2-9, merging it into
  `map-data/<region>.json` / `encounter-data/<region>.json` /
  `trainer-data.json` / `gym-leader-data.json` / `elite-4-data.json` /
  `champion-data.json`, and
  writing `regions.json` (region metadata + per-region legendary pools).
  Idempotent — safe to re-run; tags Kanto locations/leaders with
  `region: "kanto"`. Routes without scraped encounters (e.g. Paldea's province
  areas) fall back to a generation-based species slice. A few real wild areas
  are missing from `region-maps.json` because PokéAPI files them outside the
  town/route set, so `EXTRA_MAP_AREAS` injects them into the graph with an
  explicit position/connection — currently Johto's Bell Tower, Whirl Islands and
  Mt. Silver. Mt. Silver carries a forced `rank` so it is Johto's last route,
  and the league/Raid Island hang off it (which is what puts Johto's ending on
  the map's right side). Encounter levels are
  reassigned by `levelRoutes()`: every region runs its own 5-75 curve
  (`LEVEL_MIN`/`LEVEL_MAX`), and its routes are spread across it in the order
  they unlock (route number / BFS depth), so the curve ramps smoothly for the
  player and doesn't trust the scraped real levels (which vary wildly between
  routes and game versions, e.g. Unova Route 1). The Elite Four occupy 68-75
  and the Champion 70-75; Kanto's hand-curated league/trainer levels are kept
  in the committed JSON and normalised onto the same curve.
  Gym leaders are placed in their real city via `GYM_TOWNS` (matched against
  the region's town nodes by display name), falling back to spreading them
  across towns in BFS order — Alola has island trials, not gyms, so it always
  falls back. Those real cities are visited in an order that can differ from
  the canonical gym order (Hoenn's Petalburg holds gym 5 but is reached before
  Rustboro's gym 1), so gym levels stay canonical but each badge is not
  demanded at its own town. Instead the gates are laid in badge order: gym k's
  `gymsRequired` rule goes on the first route after both its town and gym
  k-1's gate, skipping any node that is an ancestor of the gym's own town
  (route order is not tree order — Sinnoh's Route 215 gates Veilstone). Gym 5
  then gates the road past Lavaridge and the player backtracks to Petalburg for
  it. A gym whose town sits too late gets no gate and is only required at the
  league; the league always requires every badge (`gymsRequired`; Kanto uses
  its existing `badgesRequired`). Generated regions reveal any gym whose town is
  unlocked; Kanto keeps its badge-order reveal. Raid Islands offer the region's generation of Pokémon that turn
  up on **no** region's wild routes and can't be reached by evolving one that
  does; that scan runs after every route is generated, so the pools are
  genuinely route-exclusive.

  Progression is ordered by **route number**, not BFS depth: a town is ranked
  just after its lowest-numbered route, and the unlock tree is a Dijkstra run
  from the entry where stepping to a higher-numbered location is cheap and
  going backwards is penalised. That stops shortcuts opening late areas early
  (Johto's Blackthorn via Route 46/45, Hoenn's sea routes off Slateport, Kalos
  routes radiating from Lumiose) and keeps the path matching the real route
  order. Paldea has no numbered routes, so it falls back to BFS depth order.
- `RawMoveData`, `index-backup.js` — large reference/backup data; leave alone.
- `kill-vite.cjs` — kills orphaned Vite dev servers on the port range (Windows
  `taskkill`, else `kill`). Run `npm run kill-vite`, or `--dry` to preview.
- `lib/region-data.cjs` — `readRegionDir`/`writeRegionDir` for the split
  `map-data/` and `encounter-data/` directories (used by `generate-regions.cjs`
  and `scrape-route-encounters.cjs`).
- `map-compare/` — visual sanity-check of the generated region layouts against
  real region maps. `fetch-refs.cjs` downloads Bulbapedia references (gitignored
  `refs/`); `render-region-maps.py` (uses Pillow from `.venv`) draws each
  region's locations/roads from `public/data/map-data/` and writes side-by-side
  composites to gitignored `out/`. Not part of the build.
- `generate-encounter-index.cjs` + `encounter-index-template.html` — build
  `public/encounter-index.html`, a self-contained, offline "what spawns where"
  page (region → location → species with types, level range and encounter
  rate, plus search and region filters). It inlines the split region data into
  the template, so re-run it after map/encounter changes. Served at
  `/encounter-index.html`; sprites use relative `sprites/pokemon/...` paths so
  the file also works when opened directly.
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

## Git

- **Always commit your work when a task is done — but never `git push`.**
  Pushing is the maintainer's call; leaving finished work uncommitted is the
  thing to avoid. One focused commit per logical change is ideal, but never
  leave the tree dirty at the end of a task.
- Write a good commit message: an imperative, capitalised subject line (no
  trailing period, ~72 chars max), then a blank line and a body explaining
  *what* changed and *why* when it isn't obvious. Mention notable side effects,
  regenerated files, or follow-up work. For example:

  ```
  Split region data per map and reconnect the region graphs

  - map-data/ and encounter-data/ are now one file per region; the injector
    merges them back into mapData/mapEncounterData.
  - scrape-region-maps bridges route connectors (forests, gates, bridges) so
    the directional layout no longer fragments; regenerated all region data.

  Side effects: gym locationKey order and Unova's raid pool shifted.
  ```

- Don't commit generated/junk artifacts (`dist/`, `tools/cache/`,
  `tools/map-compare/refs|out/`, `node_modules/`).

## Verifying changes

1. `npm run dev` and load the game.
2. Open the browser console and confirm `window.gameDataDebug.status()` reports
   `loaded: true, hasError: false`.
3. Play through the affected flow (encounter, battle, evolution, shop, etc.).
4. `npm run build` should succeed with no errors before finishing.
