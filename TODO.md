# TODO

Open ideas and follow-ups. Current game version: **0.25.0**
(`src/data/changelog.js`). Finished work lives in the changelog, not here — this
file only tracks what is **still open**. See `AGENTS.md` for architecture,
commands and data conventions.

Section numbers are stable references (`#24`, `#36`, …) and are deliberately not
renumbered, so the gaps below are items that shipped or were dropped.

---

## Priority order (effort vs. gain)

**Effort**: S (small) < S–M < M < M–L < L. **Gain** is the player-facing value
(★ = nice to have, ★★★★★ = core missing feature).

### Tier 1 — Worth the effort

_(empty)_

### Tier 2 — Big, defer

- **#101–#108 Redraw each region's map layout** (M each, ★★★) — the #99 map
  canvas, per-region palettes, node silhouettes and curved roads shipped; what
  is left is re-measuring each region's `REGION_MAP_LAYOUTS` so its shape
  matches the reference map. Split one item per region so each gets a focused
  run instead of one oversized job. See the entries below.

### Tier 3 — Small follow-ups on shipped systems

- **#109 Refresh the icon set and backdrops for the new theme** (M, ★★) — the
  theme redesign skipped its illustration scope; see the entry below.

---

## Feature ideas

The numbered entries below are open work items. Effort uses the same scale
(S < S–M < M < M–L < L); gain is player-facing value (★ = nice to have,
★★★★★ = core missing feature).

The #99 map redesign (canvas, per-region palettes, node silhouettes, curved
roads) shipped in `b5acb6f4`. The remaining work is the region-by-region layout
rework, split by region below: the old combined item's `todo-99` session grew
large enough that the runner's requests kept hitting the API's worker resource
limit (`503`), so each region now gets a fresh, short session. The shared method
is in **Map cleanup reference maps** under Reference notes.

## 101. Redraw the Johto map layout

**Effort:** M  **Gain:** ★★★

Re-measure Johto's `REGION_MAP_LAYOUTS.johto` in `tools/generate-regions.cjs`
against its reference map so the shape reads like the real region: correct
relative geography, sane spacing and no overlapping roads. Johto is anchored by
Mt. Silver on the right with the league hanging off it, so keep that ending
orientation. Nudge the committed nodes with `tools/map-editor.html`, check them
with `tools/map-compare/overlay-region-maps.py`, then run
`tools/apply-map-layout.cjs` last and remove this section.

## 102. Redraw the Hoenn map layout

**Effort:** M  **Gain:** ★★★

Re-measure Hoenn's `REGION_MAP_LAYOUTS.hoenn` in `tools/generate-regions.cjs`
against its ORAS reference map so the shape reads like the real region: correct
relative geography, sane spacing and no overlapping roads. The sea routes and
the Ever Grande league (anchored on Route 128) are the tricky parts. Nudge the
committed nodes with `tools/map-editor.html`, check them with
`tools/map-compare/overlay-region-maps.py`, then run
`tools/apply-map-layout.cjs` last and remove this section.

## 103. Redraw the Sinnoh map layout

**Effort:** M  **Gain:** ★★★

Re-measure Sinnoh's `REGION_MAP_LAYOUTS.sinnoh` in `tools/generate-regions.cjs`
against its reference map so the shape reads like the real region: correct
relative geography, sane spacing and no overlapping roads. A reference image is
kept in Reference notes. Nudge the committed nodes with `tools/map-editor.html`,
check them with `tools/map-compare/overlay-region-maps.py`, then run
`tools/apply-map-layout.cjs` last and remove this section.

## 104. Redraw the Unova map layout

**Effort:** M  **Gain:** ★★★

Re-measure Unova's `REGION_MAP_LAYOUTS.unova` in `tools/generate-regions.cjs`
against its reference map so the shape reads like the real region: correct
relative geography, sane spacing and no overlapping roads. A reference image is
kept in Reference notes. Nudge the committed nodes with `tools/map-editor.html`,
check them with `tools/map-compare/overlay-region-maps.py`, then run
`tools/apply-map-layout.cjs` last and remove this section.

## 105. Redraw the Kalos map layout

**Effort:** M  **Gain:** ★★★

Re-measure Kalos's `REGION_MAP_LAYOUTS.kalos` in `tools/generate-regions.cjs`
against its reference map so the shape reads like the real region: correct
relative geography, sane spacing and no overlapping roads. A reference image is
kept in Reference notes. Nudge the committed nodes with `tools/map-editor.html`,
check them with `tools/map-compare/overlay-region-maps.py`, then run
`tools/apply-map-layout.cjs` last and remove this section.

## 106. Redraw the Alola map layout

**Effort:** M  **Gain:** ★★★

Re-measure Alola's `REGION_MAP_LAYOUTS.alola` in `tools/generate-regions.cjs`
against its reference map so the four islands read as separate landmasses in the
right relative positions (Melemele / Akala / Ula'ula / Poni), with sane spacing
and no overlapping roads. Nudge the committed nodes with
`tools/map-editor.html`, check them with
`tools/map-compare/overlay-region-maps.py`, then run
`tools/apply-map-layout.cjs` last and remove this section.

## 107. Redraw the Galar map layout

**Effort:** M  **Gain:** ★★★

Re-measure Galar's `REGION_MAP_LAYOUTS.galar` in `tools/generate-regions.cjs`
against its reference map so the shape reads like the real region: correct
relative geography, sane spacing and no overlapping roads. The Wild Area/DLC
zone hubs sit inside the region, so keep their sub-area rings intact when a hub
moves. A reference image is kept in Reference notes. Nudge the committed nodes
with `tools/map-editor.html`, check them with
`tools/map-compare/overlay-region-maps.py`, then run
`tools/apply-map-layout.cjs` last and remove this section.

## 108. Redraw the Paldea map layout

**Effort:** M  **Gain:** ★★★

Re-measure Paldea's `REGION_MAP_LAYOUTS.paldea` in `tools/generate-regions.cjs`
against its reference map so the shape reads like the real region (the province
areas and landmarks rather than numbered routes). Keep the linear Victory Road
order that `tools/apply-paldea-progression.cjs` writes, and keep the zone hub
sub-area rings intact. Nudge the committed nodes with `tools/map-editor.html`,
check them with `tools/map-compare/overlay-region-maps.py`, then run
`tools/apply-map-layout.cjs` last and remove this section.

## 109. Refresh the icon set and backdrops for the new theme

**Effort:** M  **Gain:** ★★

The site-theme redesign (palette, typography, shared chrome and the four
selectable themes) shipped, but its "icons & illustration" scope is still open.
Audit the icons the UI draws — type badges (`src/data/moves.js`), item icons
(`src/components/item-icon.js` + `public/sprites/items/`), Town Map pins, the
nav/tab glyphs and the battle HUD — and give them one consistent set that reads
on every theme, including Classic. Then refresh the scene art under
`public/backgrounds/` (and any `BIOME_SCENE_IMAGES` entries in `src/data/ui.js`)
so the battlegrounds match the new palette.

Verify on all four themes with `tools/screenshot.cjs`, keep `npm run typecheck`
clean, and fold the result into the top `CHANGELOG` entry under **Interface**.

## Reference notes

### Map cleanup reference maps

All eight non-Kanto regions have hand-measured `REGION_MAP_LAYOUTS` overrides.
`tools/map-compare/overlay-region-maps.py` draws the game's nodes on top of each
reference image (`tools/map-compare/refs/`, fetched by `fetch-refs.cjs`) to
check them. Re-run the overlay after moving or adding nodes.

Common method for the per-region layout items (#101–#108):

1. Overlay the region (`overlay-region-maps.py`) and compare it to the
   reference to find which nodes are off and by how much.
2. Nudge the committed positions with `tools/map-editor.html` (drag nodes, or
   run the Straighten button), which writes `tools/map-layout-overrides.json`.
   Copy the positions back into `REGION_MAP_LAYOUTS.<region>` in
   `tools/generate-regions.cjs` too, so a regeneration keeps them.
3. Run the data passes in order with `apply-map-layout.cjs` **last**, keeping
   every pass idempotent: `node tools/straighten-map.cjs --regions=<region>`,
   `node tools/align-map-roads.cjs --regions=<region>`,
   `node tools/apply-map-layout.cjs` (each takes `--dry` to preview; only the
   first two take `--regions`).
4. Verify with `npm test`, `node tools/quickplay.mjs`, `npm run build` and
   `tools/screenshot.cjs` (Town Map + focused area view), and re-run
   `tools/generate-encounter-index.cjs` / `tools/generate-reference.cjs` if any
   visible data changed.

Reference images kept for future checks:

- **Sinnoh** — https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e3b63315-f949-4899-bfec-5e53edcb71bc/de3deoc-13a15e88-ca36-4f15-8824-44f4f7c83833.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9lM2I2MzMxNS1mOTQ5LTQ4OTktYmZlYy01ZTUzZWRjYjcxYmMvZGUzZGVvYy0xM2ExNWU4OC1jYTM2LTRmMTUtODgyNC00NGY0ZjdjODM4MzMucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.2o7QyN1MjdspHH1EYhWWIpV8_2aer0TBwtswDubtGzw
- **Galar** — https://static0.polygonimages.com/wordpress/wp-content/uploads/chorus/uploads/chorus_asset/file/19375993/Pokemon_sword_shield_galar_map_locations.jpg?q=50&fit=crop&w=750&dpr=1.5
- **Kalos** — https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Fm77o7e9nfw371.jpg
- **Unova** — https://upload.wikimedia.org/wikipedia/commons/2/2b/Unova_Map.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail_unscaled&_=20231229170134

### Useful references when picking these up

- **Data-pipeline template:** `tools/fetch-breeding-data.cjs` — cached PokéAPI
  fetch, form ids resolved to base species, writes a `public/data/*.json`, then
  add the key to `assets/gameDataInjector.js` and re-export in
  `src/data/gameData.js`.
- **Battle hooks:** status conditions / drain live in `src/game/combat/turn.js`
  (`resolveBattleTurn`); volatile state is threaded through the game loop and
  the reducer's `UPDATE_VOLATILE`.
- **Save shape:** new state fields go in `initialGameState`, `context.js`
  (save + sanitising restore) and `src/types.d.ts`. Bump `SAVE_VERSION`
  (`src/data/config.js`) only for incompatible shape changes (add
  `LEGACY_SAVE_KEYS`).
- **Config constants** live in `src/data/config.js`.
- **Scenes / pausing phases:** the minigames (`mining`, `gameCorner`,
  `battleRoyal`, `doubles`, …), Wonder Trade, evolution, healing and the Master
  Ball throw are all phase-driven scenes rendered by
  `src/components/battle-scene.js`; the idle loop pauses for them in
  `src/game/use-game-loop.js`.
- **Verifying:** `npm test`, `npm run typecheck`, `npm run validate`,
  `npm run quickplay` and `npm run build`. A headless test (mock
  `window.gameDataInjector.data` with the JSON files and `import()` the module)
  works well for reducer/combat logic.
- **Versioning:** fold a change into the top `CHANGELOG` entry; cut a new
  `GAME_VERSION` only at a milestone (secrets stay out of the changelog by
  convention).
- **Commit** each logical change; never `git push`.
