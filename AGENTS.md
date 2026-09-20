# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

**Pokémon Idle** — a browser-based incremental/idle Pokémon game (train, evolve,
catch, battle gym leaders / Elite 4 / champion). It is a client-only app; there
is no backend and no persistence layer beyond the browser.

The game logic is a bundled React 19 + Vite app committed to
`assets/index.js`. Game *content* (species, moves, maps, trainers, sprites) is
kept as editable JSON/PNG under `public/` and loaded at runtime.

## Commands

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # production build -> dist/  (gitignored)
npm run preview  # serve the production build
```

There is **no test suite, no linter, and no type-checker**. Verify changes by
running the dev server and exercising the game in the browser.

Formatting: `.prettierrc.json` is the intended style (`semi: false`,
`singleQuote: true`, `trailingComma: "es5"`), but Prettier is **not** installed
as a dependency and there is no format script. Match the surrounding code
style; do not reformat/minify unrelated code.

Python tools (the `tools/*.py` scrapers) use the checked-in venv:
`.venv/Scripts/python.exe` (Windows). The repo is developed on Windows, so
prefer cross-platform paths/commands.

## Runtime data flow

```
index.html
  ├─ <script type="module" src="./assets/gameDataInjector.js">   (loads JSON)
  └─ <script type="module" src="./assets/index.js">              (the app)
```

1. `assets/gameDataInjector.js` `fetch`es every file in `dataFilesToLoad`
   concurrently, stores them on `window.gameDataInjector.data`, and resolves
   `window.gameDataReady`.
2. The hand-written prelude at the very top of `assets/index.js` awaits
   `window.gameDataReady` and destructures the data into module-level variables
   (`pokemonSpecies`, `evolutionData`, `moveData`, `mapData`, …).
3. The rest of `assets/index.js` (the bundled React app) reads those variables.

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
| `assets/index.js` | **The whole game app** (React 19 bundle, partially de-minified). Edit this for gameplay/UI changes. |
| `assets/gameDataInjector.js` | Loads `public/data/*.json` into `window.gameDataInjector`. Add new data files here. |
| `assets/style.css` | All game styling + CSS variables (theme colors). |
| `assets/fonts.css` | Local "Press Start 2P" `@font-face` declarations. |
| `public/data/*.json` | **The game database** (see below). Served at `/data/...`. |
| `public/sprites/pokemon/` | Pokémon sprites, named by numeric species/form id (`25.png`, `25.gif`, `back/25.png`, …). |
| `public/sprites/trainers/` | Trainer images. |
| `public/backgrounds/` | Battle/location backgrounds. |
| `public/heal-animation-web.mp4` | Healing animation. |
| `ui/` | UI textures (parchment, wood button). |
| `tools/` | One-off scrapers/converters for generating the data JSON. Not part of the build. |
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
| `championData` | `champion-data.json` |

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
  "All id's now 0 for special pokemon").
- Sprites are referenced by that `id`; a missing `.gif` falls back to the
  static `.png` (see commit "Fallback to static img").

When adding/renaming species or keys, grep `assets/index.js` for the key —
the bundle references keys and ids directly, and cross-file references
(evolutions, encounters, learnsets) must stay consistent.

## Editing `assets/index.js`

- It is a **single ~21k-line file**: a small hand-written prelude followed by a
  partially de-minified React bundle. It is the source of truth for game logic;
  recent commits edit it directly.
- It is *not* generated by `npm run build` from a `src/` directory (there is no
  `src/`). The `src/` modular split described in `tools/REFACTORING_GUIDE.md`
  was planned but **not implemented**.
- Prefer targeted edits. When searching, use `rg`/grep with the descriptive
  variable names (many were de-minified, e.g. `mapData`, `encounterData`,
  `gymLeaderData`); some internal names are still minified.
- React 19, `React.createElement`/`jsx` style. Keep changes consistent with
  the existing pattern in the file.

## Tools (`tools/`)

One-off scripts used to build the data JSON (not run during dev/build):

- `scrape_serebii.py`, `convert_moves.py`, `fix_pokemon_ids.py` — Python
  (need `requests`, `beautifulsoup4` in `.venv`).
- `scrape_pokemondb.cjs`, `download_pokemon_sprites.cjs`, `extract_data.cjs` —
  Node scripts.
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
