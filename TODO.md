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

- **#99 Redesign the region maps** (L, ★★★★) — give every region a proper,
  redrawn Town Map (layout, terrain art and node styling) instead of the
  current scraped + hand-nudged approximation. See the full entry below.
- **#100 Redesign the site theme** (L, ★★★★) — a full visual refresh of the
  game's look and feel (palette, panels, typography, icons/illustrations), not
  just a tweak of the current dark-brown/parchment skin. See the full entry
  below.

### Tier 3 — Small follow-ups on shipped systems

_(empty)_

---

## Feature ideas

The numbered entries below are open work items. Effort uses the same scale
(S < S–M < M < M–L < L); gain is player-facing value (★ = nice to have,
★★★★★ = core missing feature).

## 99. Redesign the region maps

**Effort:** L  **Gain:** ★★★★

Every region's Town Map is currently a scraped force-directed layout that was
hand-measured onto a reference image and then nudged with the automatic passes
(`straighten-map.cjs`, `align-map-roads.cjs`, `apply-map-layout.cjs`). It is
*readable* but it is not *designed*: roads are orthogonal elbows, nodes are
generic dots/pins, and the terrain is coarse biome shading. This item is to
redesign and redraw the maps of each region properly.

Scope (pick a subset to start):

- **Layout:** rework each region's `REGION_MAP_LAYOUTS` (in
  `generate-regions.cjs`) so the shape reads like the real region — correct
  relative geography, sane spacing, no overlapping roads. Work region by region
  with `tools/map-editor.html` and `tools/map-compare/` (overlay the game's
  nodes on the Bulbapedia reference via `overlay-region-maps.py`).
- **Visuals:** redesign the map canvas itself — a real terrain backdrop per
  region, distinct node icons for towns / routes / gyms / league / raid /
  hideouts / zone hubs, better roads (bezier vs. elbows) and zone focus view.
  Theme lives in `:root` in `assets/style.css`; the map renders in
  `src/components/town-map.js` and `src/game/progression/roads.js` builds the
  road paths.
- **Consistency:** apply the same visual language to all regions (Kanto is
  hand-curated and currently the odd one out), and keep the focused zone view
  (`focusZone`) working.

Keep the data passes idempotent (`apply-map-layout.cjs` last) and re-run
`generate-encounter-index.cjs` / `generate-reference.cjs` afterwards. Verify
with `npm test`, `node tools/quickplay.mjs`, `npm run build` and
`tools/screenshot.cjs` (Town Map + focused area view).

## Reference notes

### Map cleanup reference maps

All eight non-Kanto regions have hand-measured `REGION_MAP_LAYOUTS` overrides.
`tools/map-compare/overlay-region-maps.py` draws the game's nodes on top of each
reference image (`tools/map-compare/refs/`, fetched by `fetch-refs.cjs`) to
check them. Re-run the overlay after moving or adding nodes.

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
