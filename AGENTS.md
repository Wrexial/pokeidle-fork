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
npm run validate   # integrity-check the generated public/data JSON
npm test           # node --test suite under tests/
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

There is **no linter**. `npm run typecheck` runs the TypeScript compiler in
JS-checking mode (`jsconfig.json` + `@types/react`) and should stay clean; fix
it or add JSDoc rather than ignoring errors. `npm run validate` integrity-checks
the generated JSON (every species has moves and is obtainable, teams/encounters
reference real species, the map graph is sound, etc.) and should stay clean
after any data regeneration. `npm test` runs the lightweight `node --test`
suite (see below). Verify behaviour by running the dev server and exercising
the game in the browser.

**Tests (`tests/`):** `npm test` runs `node --test "tests/**/*.test.mjs"`.
Files are plain `.mjs` using `node:test`, kept out of the TypeScript project.
The shared `tests/helpers/game-data.mjs` loads `public/data` (merging the
split per-region files) into `window.gameDataInjector` so `src/` modules can be
`import()`ed in Node. Because `src/data/gameData.js` reads those globals during
its own top-level evaluation, a test must call `installGameData()` and then
`await import(...)` the modules under test (never a static import). Cover
reducer/combat/breeding/unlock invariants and keep them deterministic (stub
`Math.random` where needed).

**Save recovery:** an incompatible/stuck save self-heals without DevTools.
The save key is **versioned** (`pokemon-idle-save-v<n>`, see `SAVE_VERSION` in
`src/data/config.js`); the loader in `src/game/save.js` reads the versioned
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

There is also a hidden keyboard cheat: `useKonamiCode` (`src/hooks.js`, wired up
in `GameLayout`) dispatches `DEBUG_MAX_LEVEL` when the Konami code
(↑ ↑ ↓ ↓ ← → ← → B A) is typed, maxing the active Pokemon to level 100.

## Repository layout

| Path | Purpose |
| --- | --- |
| `index.html` | Entry point; wires the two scripts above. |
| `src/main.js` | App entry: mounts `App` (plus `AppContent`). Renders the root. |
| `src/data/gameData.js` | Loads and re-exports all game JSON + derived maps (including the per-generation national-dex sets behind the Shiny Charm). |
| `src/data/items.js` | Items/balls/evolution items, mart stock, bag categories. |
| `src/data/config.js` | Tuning constants: shiny odds, cooldowns, starters/legendaries, save keys. |
| `src/data/moves.js` | Type chart + move-category icons. |
| `src/data/ui.js` | UI constants: speed options, stat-bar colors, rarity labels, drag defaults, backgrounds. |
| `src/data/changelog.js` | `GAME_VERSION`, `LAST_SEEN_VERSION_KEY`, `CHANGELOG`. |
| `src/game/pokemon.js` | Barrel re-exporting `src/game/pokemon/`: `sprites`, `stats` (stat/IV maths), `evolution` (chains/learnsets), `friendship`, `exp` (curves/yields) and `creation` (`createPokemon`, box helpers). |
| `src/game/combat.js` | Battle math barrel re-exporting `src/game/combat/`: `damage` (type chart, stat stages, damage), `status` (status/volatile effects), `volatile` (volatile state, speed, screens), `ai` (move choice), `setup` (`createBattlePokemon`), `turn` (`resolveBattleTurn`) and `end-of-turn` (residual/field decay). |
| `src/game/catching.js` | Catch rate/chance, ball selection, auto-catch rules, encounter rarity. |
| `src/game/progression.js` | Barrel re-exporting `src/game/progression/`: `items` (economy/effects), `offline`, `party` (sync/transitions), `unlocks`, `encounters`, `teams` (trainer/tower), `exp` and `roads`. |
| `src/game/reducer.js` | `initialGameState` + a thin `gameReducer` dispatcher; the per-action handlers live in `src/game/reducer/*.js` (`world`, `battle`, `recovery`, `pokemon`, `collection`, `items`, `minigames`, `settings`) with shared helpers in `src/game/reducer-helpers.js`. `reducer/battle.js` is itself a barrel over `reducer/battle/` (`events`, `rewards`, `trainer`, `boss`, `balls`, `effects`, `raid`) and `reducer/pokemon.js` over `reducer/pokemon/` (`management`, `party-box`, `evolution`, `daycare`, `wonder-trade`). |
| `src/game/context.js` | `GameProvider` + `useGame` (React wiring); re-exports the save helpers. |
| `src/game/save.js` | `repairSave`, `loadSavedState`, `serializeSave`, `persistSave` and `SAVED_STATE_KEYS` — the versioned localStorage save. |
| `src/hooks.js` | Cross-cutting UI hooks: `useTypewriter`, `useIsMobile`, `useKonamiCode`, daily/notification/audio/quest hooks. |
| `src/game/use-game-loop.js` | `useGameLoop` — the idle tick state machine. |
| `src/game/minigames.js` | Barrel re-exporting `src/game/minigames/`: `mining`, `bug-contest`, `game-corner` and `registry`. |
| `src/components/*.js` | **One file per component** (53 files, kebab-case, e.g. `battle-scene.js`, `pokedex-tile.js`). |
| `src/types.d.ts` | Ambient types for the injected `window.gameData*` globals. |
| `assets/gameDataInjector.js` | Loads `public/data/*.json` into `window.gameDataInjector`. Add new data files here. |
| `assets/style.css` | All game styling + CSS variables (theme colors). |
| `assets/fonts.css` | Local "Press Start 2P" `@font-face` declarations. |
| `public/data/*.json` | **The game database** (see below). Served at `/data/...`. |
| `public/encounter-index.html` | Generated offline "what spawns where" overview (see `tools/generate-encounter-index.cjs`). |
| `public/guide.html` | Hand-written player guide (features explained); linked from Settings and the encounter index. |
| `public/sprites/pokemon/` | Pokémon sprites, named by numeric species/form id (`25.png`, `shiny/25.png`, `back/25.png`, `back/shiny/25.png`, animated gifs under `versions/generation-v/black-white/animated/`). |
| `public/sprites/trainers/` | Trainer images. |
| `public/backgrounds/` | Battle/location backgrounds. |
| `public/heal-animation-web.mp4` | Healing animation. |
| `ui/` | UI textures (parchment, wood button). |
| `tools/` | One-off scrapers/converters for generating the data JSON, plus `tools/decompile/` (AST rename tool). Not part of the build. |
| `tests/` | `node --test` suite (`npm test`); `tests/helpers/game-data.mjs` loads `public/data` for headless module tests. |
| `dist/` | Build output. Gitignored — never edit or commit. |

## Data files (`public/data/`)

These are loaded by `assets/gameDataInjector.js` (`key` → file):

| Injector key | File |
| --- | --- |
| `pokemonSpecies` | `pokemon-species.json` |
| `breedingData` | `breeding-data.json` (gender rate + egg groups, see below) |
| `abilityData` | `ability-data.json` (normal + hidden abilities per species) |
| `animatedSprites` | `animated-sprites.json` (ids missing each animated variant) |
| `evolutionData` | `evolution-data.json` |
| `moveLearnsets` | **`possible-learnsets.json`** |
| `tmLearnsets` | `tm-learnsets.json` (machine/TM moves per species) |
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
- Every entry's `id` is the PokeAPI *pokemon* id: the national dex number for
  base species and the 10000+ form id for alternate forms (megas, regional
  forms, Gigantamax, ...). Only `missingno` keeps `id: 0`, which renders the
  `?` placeholder sprite. `tools/fix_pokemon_ids.py` reconciles every id with
  PokeAPI (it derives each key's PokeAPI name, so re-run it after adding a
  form). Region wild encounters only use species with `id > 0` (forms with ids
  above 1025 are excluded).
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
  reference an `encounter-data/<region>.json` bucket via `routeKey`. Generated
  routes carry a `background` (biome, from the route name and its dominant
  wild type) that `battle-scene.js` uses for the wild battle scene; Kanto's
  routes fall back to the hand-curated `locationImages` map in `ui.js`. Unlock rules support
  `battlesAtLocation`, `caughtCount` (minimum Pokedex size), `caughtOnRoute`
  (catch some of the `species` that spawn only on `routeKey`, a route-specific,
  harder variant of `caughtCount`), `partyLevel`
  (minimum level any party Pokemon must reach), `badgesRequired`, `gymsRequired`
  (specific gym ids), `championDefeated` (a region id, or `true` meaning Kanto),
  and `requires` (locations that must already be unlocked) — all resolved to a
  fixpoint in `computeUnlockedLocations`. Region
  **entry towns** use `{ entry: true }`: they open if the region is the player's
  `startRegion` or is listed in the player's `unlockedRegions`. Regions are no
  longer a fixed chain — beating any region's Champion earns an
  **Unlock Token** (`getRegionUnlockTokens` = Champions beaten minus regions
  already opened beyond the starting one), and the player spends it from the
  Town Map (`UNLOCK_REGION`) to open any still-locked region. Other routes
  unlock after winning battles at their
  parent location. Each location also carries `unlockOrder`, a **stable derived
  progress key** (`region generation * 100000 + route rank`), used only for
  ordering. It is computed, not counted, so adding a zone never renumbers its
  neighbours — or, importantly, any other region.
- **Zones** (`ZONES` in `generate-regions.cjs`) group several route-like
  sub-areas behind one map node. The hub is `type: 'zone'` with a `subAreas`
  list and a `routeKey` pointing at its first sub-area; each sub-area is a real
  route with its own `routeKey`/encounter bucket, but `hidden: true`,
  `zone: <hubId>` and `unlock: { requires: [hubId] }`, so it never renders on
  the Town Map and unlocks with the hub. Picking a sub-area from the hub panel
  travels to it (the existing `TRAVEL`/encounter plumbing carries it) and its
  panel shows a back button; the idle loop skips wild spawns at the hub itself.
  Galar's Wild Area is the first one, and the species it adds count as native
  wilds, so they drop out of the Raid Islands. `POST_AREAS` injects standalone
  wild areas (Slumbering Weald, Galar Mine, Glimwood Tangle) the same way,
  with a level band averaged from the routes they connect to so adding one
  never re-levels the region. Galar's DLC uses zones too: the Isle of Armor and
  Crown Tundra are post-game hubs gated on `championDefeated` with fixed high
  levels (`zone.level`).
- Some regions' scraped force-directed layout doesn't match the real map, so
  `REGION_MAP_LAYOUTS` in `generate-regions.cjs` overrides it with
  hand-measured coordinates from a labelled reference map. Every region except
  Kanto (hand-curated) now has one: Hoenn (ORAS map), Johto (GSC map), Sinnoh,
  Unova, Kalos, Alola, Galar and Paldea. The reference is scaled to fit the
  square world canvas *without distortion* (letterboxed), and its position
  values bypass the collision-avoidance shifting. Town positions are measured
  from the reference labels; route nodes are interpolated from the connection
  graph (so individual route paths are approximate). Because adjacent
  towns/routes sit almost on top of each other on the reference (Route 10
  beside Opelucid City), a final relaxation pass nudges any pair closer than
  3 units apart. The league can also be
  pinned to a specific pre-league route via `LEAGUE_ANCHOR` (Hoenn's Route 128
  at Ever Grande, not the highest-numbered Route 134).
- `regions.json` also carries `raidPool` — the generation's species that cannot
  be obtained in that region (not in any wild table and not reachable by
  evolution). Those are the Pokemon found on the region's Raid Island. Kanto's
  hand-curated `raidIsland` is wired up by `generate-regions.cjs` too (it used
  to be the only raid without a `routeKey`/encounter bucket), so
  `encounterData['raidIsland']` resolves. Alternate forms with no route/evolution
  path are also placed here by `generate-regions.cjs` (`FORM_RAID_REGION`):
  Alolan forms to Alola, Galarian/Hisuian forms to Galar, Paldean forms to
  Paldea. Gigantamax forms instead become level-100 evolutions (see below),
  matching how the original data models Megas. Every species in
  `pokemon-species.json` is now obtainable.
- Sprites are referenced by that `id`. The animated directory is a merged set:
  the official Gen V Black/White animated gifs for national dex ids 1-649, plus
  Pokémon Showdown's animated sprites for everything else (PokeAPI has no
  animation past Gen V; a few Gen 9 forms only exist in Showdown's `gen5ani`
  by name). A missing `.gif` falls back to the static `.png`; the tool writes
  `animated-sprites.json`, the list of ids still missing each variant, so
  `getPokemonSpriteUrl` can use the static png without a 404 round-trip (only
  `missingno` and a handful of Gen 9 paradox/Gigantamax forms lack animation).
  `tools/download_pokemon_sprites.cjs` fills in every front/back/shiny/back-shiny
  variant from those sources; re-run it after adding species or form ids.

When adding/renaming species or keys, grep `src/` for the key —
the code references keys and ids directly, and cross-file references
(evolutions, encounters, learnsets) must stay consistent.

## Source layout (`src/`)

- Split into modules by layer. Imports form a DAG (no cycles). The rough order
  is `data → game/pokemon|combat → game/progression → game/catching → game/reducer
  → game/context → hooks → components/* → main`. The larger subsystems are
  barrels (`pokemon.js`, `combat.js`, `progression.js`, `minigames.js`,
  `reducer.js`, `reducer/battle.js`, `reducer/pokemon.js`) re-exporting focused
  modules in the matching `src/game/<name>/` folder; add new behaviour to a
  submodule rather than re-inflating the barrel.
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
- `tools/decompile/split-modules.mjs` and the other splitters are historical
  one-shot records of the original monolith split. `src/` has since been
  reorganized by hand, so re-running them would clobber the current layout —
  treat the `MODULES`/rename tables as reference only.

## Tools (`tools/`)

One-off scripts used to build the data JSON (not run during dev/build):

- `scrape_serebii.py`, `convert_moves.py`, `fix_pokemon_ids.py` — Python
  (need `requests`, `beautifulsoup4` in `.venv`).
- `scrape_pokemondb.cjs`, `extract_data.cjs` — Node scripts. `extract_data.cjs`
  is legacy (it extracts from `tools/index-backup.js` into a stale `data/`
  directory), so live edits belong in `public/data/`.
- `add-gmax-evolutions.cjs` — adds `base -> gx-base` level-100 evolutions for
  every Gigantamax form (idempotent) so they have an acquisition path, like
  Megas already do. The added entries carry `form: true`, which
  `generate-regions.cjs`'s `isFinalEvolution` ignores so team generation is
  unchanged. Re-run after any re-extraction of `evolution-data.json`.
- `fix-missing-learnsets.cjs` — fills the ~195 species (every alternate form
  plus a few base species) absent from `possible-learnsets.json` by borrowing
  the learnset of their base form, pre-evolution or evolution (falling back to
  the original bundle's table). Without this those Pokemon fight with no moves.
  Idempotent; re-run if `possible-learnsets.json` is regenerated.
- `add-evolution-items.cjs` — rewrites the level-up evolutions that canonically
  use an item into `{ into, item }` entries: the elemental stones, the trade
  evolutions (Link Cable) and the held-item trade evolutions (King's Rock,
  Metal Coat, Protector, ...). The matching items are sold in the Reward Shop
  (`tokenShopItems` in `src/data/items.js`). Idempotent; re-run after any
  re-extraction of `evolution-data.json`. Because item evolutions carry no
  `level`, `generate-regions.cjs` gives them a nominal one for team-maturity.
- `add-friendship-evolutions.cjs` — rewrites the evolutions that canonically
  require high friendship (Golbat→Crobat, Chansey→Blissey, Pichu→Pikachu,
  Cleffa/Igglybuff, Togepi, Azurill, Budew, Buneary, Chingling, Munchlax, Riolu,
  Woobat, Swadloon, Snom, Type: Null, Eevee's Espeon/Umbreon/Sylveon) into
  `{ into, friendship: 160 }` entries, dropping their level. The party/box UI
  checks the Pokemon's friendship. Idempotent; re-run after re-extracting
  `evolution-data.json` (friendship is raised in `gainFriendship`).
- `fix-form-transforms.cjs` — makes temporary form transformations reversible
  (Deoxys, the Rotom appliances, Giratina, Shaymin, the Therian formes, Kyurem,
  Zygarde, Hoopa, Necrozma, Zacian/Zamazenta, Calyrex — Deoxys/Zygarde/Calyrex
  fully all-to-all, Necrozma star-shaped with a per-form item) and drops the bad
  `armarouge <-> ceruledge` edges. Most transforms are gated by their canonical
  **reusable** item (Rotom Catalog, Griseous Orb, Gracidea, Meteorite, Reveal
  Glass, DNA Splicers, Zygarde Cube, Prison Bottle, N-Solarizer/N-Lunarizer/
  Ultranecrozium Z, Rusted Sword/Shield, Reins of Unity) sold in the Reward
  Shop; forms with no canonical item (Keldeo, Ash-Greninja) keep a level gate.
  `START_EVOLUTION` does not consume items flagged `reusable`. It also handles
  **gender forms**: the manual
  `basculegion`/`indeedee`/`oinkologne` male↔female edges are removed, and
  Basculegion/Oinkologne carry a `gender` tag on their evolution so only the
  variant matching the Pokemon's gender is offered (filtered in the party/box
  UI via `genderForPokemon`; Indeedee's two variants are fixed-gender species).
  Idempotent; re-run after any re-extraction of `evolution-data.json`.
  `preEvolutionMap` (`src/data/gameData.js`, mirrored in the Node tools) skips
  a form's reverse edge so breeding/learnset chains still start from the real
  base (e.g. Palafin → Finizen).
- `add-gen9-dlc-species.cjs` — adds the Gen 9 DLC species PokeAPI has but the
  extracted bundle predates (ids 1009-1025, Walking Wake through Pecharunt) to
  `pokemon-species.json` / `possible-learnsets.json` / `evolution-data.json`,
  level-gating the item evolutions (Syrupy Apple, Metal Alloy, the teacups)
  since those items aren't modelled. Then run `fetch-abilities` /
  `fetch-breeding-data` / `fetch-tm-learnsets` / `download_pokemon_sprites`.
  PokeAPI responses are cached; idempotent.
- `fix-pokemon-stats.cjs` — reconciles every `pokemon-species.json` `baseStats`
  block and type set with the modern games (base species against Pokemon
  Showdown's dex, alternate forms against cached PokeAPI). The extracted data
  predated the Gen 6/7 buffs and Gen 9 nerfs (Arbok, Shedinja, Lycanroc's
  forms, ...). Idempotent (`--dry` to preview); re-run after re-extracting
  species data.
- `fetch-breeding-data.cjs` — fetches each species' gender rate and egg groups
  from PokeAPI (form ids resolved to their base species) and writes
  `public/data/breeding-data.json`, which the Daycare's breeding rules use.
  Responses are cached under `tools/cache/`, so it's resumable and only hits
  the network once per id.
- `fetch-abilities.cjs` — fetches each species' normal and hidden abilities from
  PokeAPI and writes `public/data/ability-data.json` (keyed by species, camelCase
  ability keys). Cached alongside the breeding data; `rollAbility`
  (`src/game/pokemon.js`) assigns one when a Pokemon is created. Re-run after
  adding species/form ids.
- `fetch-tm-learnsets.cjs` — reads each species' cached `/pokemon/{id}` response
  and writes `public/data/tm-learnsets.json`, the machine (TM) moves it can learn
  in its newest game. Feeds the Move Tutor (`getTutorMoves` in
  `src/game/pokemon.js`); normally needs no network (the responses are cached by
  fetch-abilities.cjs). Re-run after adding species/form ids.
- `download_pokemon_sprites.cjs` — fills the local sprite tree for every id in
  `pokemon-species.json`: static front/back/shiny from PokeAPI, and animated
  front/back/shiny from Gen V for dex ids 1-649 falling back to Pokémon
  Showdown for the rest (plus Showdown's `gen5ani` by name for a few Gen 9
  forms). Also writes `public/data/animated-sprites.json`, the ids with no gif
  per variant. Idempotent (`--only=static|animated`, `--force`).
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
  PokéAPI (`/location` → `/location-area`), keeps only ordinary wild methods
  (drops gift/static/headbutt/honey-tree/Rock Smash/grottos/trades/Island Scan…)
  and only encounters without special `condition_values` (drops radio/GBA
  dual-slot/Poké Radar/fossil item/story/swarm), so non-native or one-off
  species don't leak onto routes (HGSS radio used to put Shinx/Plusle/Minun on
  Johto Route 29). Legendaries are skipped entirely so they stay Raid Island
  content. Keeps only the region's preferred game versions, and when none
  match, falls back only to a version from that region's own generation (which
  is why Kanto Victory Road no longer carries Gold/SoulSilver species). Maps
  species to the game's keys, and also refreshes Kanto from its own map-data.
  **Paldea isn't in PokéAPI's encounter data**, so its province areas are parsed
  from Bulbapedia's `{{Catch/entry9}}` tables instead. Writes
  `tools/route-encounters.json` (committed).
- `generate-regions.cjs` — turns `tools/region-maps.json` + `route-encounters.json` into game content
  (locations, encounters, trainers, marts, Raid Islands, and gym/Elite
  Four/Champion leagues) for generations 2-9, merging it into
  `map-data/<region>.json` / `encounter-data/<region>.json` /
  `trainer-data.json` / `gym-leader-data.json` / `elite-4-data.json` /
  `champion-data.json`, and
  writing `regions.json` (region metadata + per-region legendary pools).
  Idempotent — safe to re-run; tags Kanto locations/leaders with
  `region: "kanto"`. Routes without scraped encounters (e.g. Paldea's province
  areas) fall back to a generation-based species slice. Paldea's open-world
  province areas list 50-84 species each, so they are trimmed to the 15 most
  common (`PALDEA_ENCOUNTER_CAP`); the dropped species are handed to Paldea's
  Raid Island so nothing is orphaned (and to keep them out of their native
  regions' raid pools). A few real wild areas
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
  its existing `badgesRequired`). Every location whose unlock parent sits before
  a badge gate inherits that gate too, unless it is needed to reach the gym
  town, so a branch hanging off an early town can't slip past the badges (Johto's
  Route 36 off Violet City now waits for Whitney; Mt. Silver waits for Clair).
  The generated gates also rotate their flavour instead of repeating "15 battles
  at the parent": battle counts vary, and some routes ask for a Pokedex count
  (`caughtCount`) or a party level (`partyLevel`). Where the parent route has
  species that spawn nowhere else in the game, the Pokedex-count gate is
  replaced by `caughtOnRoute` (catch a few of those route-exclusive species),
  and battle-only gates may gain the same check; legendaries, starters and
  ultra-rare (weight 1-2) finds are left out so the goal stays reasonable.
  Generated regions reveal any gym whose town is
  unlocked; Kanto keeps its badge-order reveal. Gym, Elite Four and Champion
  teams are type-themed from `GYM_TYPES` / `E4_TYPES` / `CHAMPION_TYPES` (drawn
  from every generation up to the region's own, minus starter lines and
  legendaries), and each leader gets a unique Showdown sprite key derived from
  their name by `trainerSpriteKey`. Route trainers are themed by class via
  `TRAINER_CLASS_TYPES` and named "Class Firstname" (`TRAINER_CLASS_LABELS` +
  `TRAINER_NAMES`) rather than by location. `buildTeam` prefers levelled-appropriate Pokemon:
  it drops species that should already have evolved and, at Lv.55+, very weak
  final forms (Ditto), while keeping the type theme when a sparse type (Dragon)
  would otherwise run out. Kanto's hand-curated trainer/leader data and its gen3
  sprites are left alone. `pokemon-species.json` carries a `legendary` flag
  (set for legendaries, mythicals and Ultra Beasts) that keeps them out of
  every trainer team.
  Every leader also gets a `rematchTeam`: a gym fields six Lv.80 final
  evolutions once the player has every badge in that region, and the Elite Four
  / Champion field Lv.90/92 teams once the region's Champion has been beaten.
  Rematches draw from the whole national dex so sparse types still have six
  members; the gym panel shows a `REMATCH` tag / "Rematch Lv.90" when active.
  Badges use their real in-game names (`BADGE_NAMES`) — Alola's trials award
  Z-Crystals and Galar/Paldea use type badges — coloured by the leader's type.
  Raid Islands offer the region's generation of Pokémon that turn
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
  composites to gitignored `out/`; `overlay-region-maps.py` draws the game's
  nodes on top of the reference so the hand-measured `REGION_MAP_LAYOUTS`
  coordinates can be checked and nudged. Not part of the build.
- `generate-encounter-index.cjs` + `encounter-index-template.html` — build
  `public/encounter-index.html`, a self-contained, offline "what spawns where"
  page (region → location → species with types, level range and encounter
  rate, plus search and region filters). It inlines the split region data into
  the template, so re-run it after map/encounter changes. Served at
  `/encounter-index.html`; sprites use relative `sprites/pokemon/...` paths so
  the file also works when opened directly. Its header links to
  `public/guide.html`, the hand-written player-facing feature guide.
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
- **Changelog:** whenever you add or change a user-facing feature (or fix a
  player-visible bug), update `src/data/changelog.js` in the same change. Add
  the entry to the **top** `CHANGELOG` object (newest first, grouped under
  `sections[].heading`, `items[]` one line per change), give the release a
  `subtitle`, and bump `GAME_VERSION` to match its `version` so the in-game
  "What's New" modal shows it once per player (`LAST_SEEN_VERSION_KEY`). If
  several changes land together, group them under one version bump instead of
  bumping per commit. Keep secrets/cheats and purely internal refactors out of
  the changelog by convention.

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

1. `npm test` and `npm run typecheck` should pass; `npm run validate` after any
   data regeneration.
2. `npm run dev` and load the game.
3. Open the browser console and confirm `window.gameDataDebug.status()` reports
   `loaded: true, hasError: false`.
4. Play through the affected flow (encounter, battle, evolution, shop, etc.).
5. `npm run build` should succeed with no errors before finishing.
