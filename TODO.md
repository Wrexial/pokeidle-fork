# TODO

Open ideas and follow-ups. Current game version: **0.25.0**
(`src/data/changelog.js`). Finished work lives in the changelog, not here — this
file only tracks what is **still open**. See `AGENTS.md` for architecture,
commands and data conventions.

Section numbers are stable references (`#24`, `#36`, …) and are deliberately not
renumbered, so the gaps below are items that shipped.

---

## Priority order (effort vs. gain)

**Effort**: S (small) < S–M < M < M–L < L. **Gain** is the player-facing value
(★ = nice to have, ★★★★★ = core missing feature).

### Tier 1 — Worth the effort

_(empty — the last Tier 1 item, #77, shipped.)_

### Tier 2 — Big, defer

1. **#19 Online sync** — L · ★★★ — the project's first backend; needs a design
   doc and real ops for modest player value today.
2. **#43 Multi-battles (triple / rotation)** — M–L · ★★½.

### Tier 3 — Small follow-ups on shipped systems

See the numbered sections below: #24, #25, #56, #62, #69, #75–#76. They
are optional extras rather than missing features.

---

## 19. Online sync (cloud saves via a database)

This would be the project's **first backend** — the app is deliberately
client-only today with `localStorage` saves. Worth a short design doc first.

- [ ] Pick a backend: a managed BaaS (Supabase / Firebase — auth + Postgres /
      Firestore) vs a small custom API.
- [ ] Auth: an anonymous device id that can later be linked to an account
      (email / OAuth) so a save can follow the player across devices.
- [ ] Sync model: a save is a single JSON blob, so at minimum keep a
      server-side revision + `savedAt` and never blindly overwrite a newer
      remote (last-write-wins is easy to lose a save with).
- [ ] Offline-first: the game must keep working with no network; sync in the
      background and reconcile on reconnect.
- [ ] Conflict handling: pick a winner / offer a choice; keep a small server
      history so a bad sync is recoverable.
- [ ] Privacy & security: ownership rules (RLS), rate limits, and what is
      stored.
- [ ] Migration: reuse `repairSave` on download and bump `SAVE_VERSION` if the
      save shape changes.

Effort: **large** (auth + conflict handling + a new server to run).

## 24. Move data pass

`possible-moves.json` carries `name / type / category / power / accuracy / pp /
priority / effect`, and `src/data/move-effects.js` layers richer effects on top.
The effect set (healing, multi-hit, crit stages, hazards, weather, terrain,
phazing, swaps, the status conditionals and multi-status rolls, the
doubles-only moves and the Apricorn Balls' catch rates) is done.

PP is stored but deliberately unused — an idle auto-battler has no PP
management, so it stays as data only.

Still open (design call):

- [ ] Z-moves / G-Max moves are otherwise dead data — decide keep/drop.

## 25. Battle engine pass

`resolveBattleTurn` (`src/game/combat.js`) is complete for damage, status, stat
changes, weather/terrain, the contact abilities, the form-change subsystem and
the ally (doubles) abilities.

Still open:

- [ ] Illusion (deferred: its disguise is cosmetic plus an AI read, which an
      idle auto-battler barely shows).
- [ ] Overworld-only abilities (no effect in an idle auto-battler): Illuminate,
      Run Away.
- [ ] Battle polish: move animations / hit feedback (damage numbers already
      float over the sprite and have a Settings toggle).

*(Switching on a bad matchup is intentionally discarded: an auto-switching
opponent is frustrating to play against.)*

## 43. Multi-battles (double / triple / rotation) as a minigame

The **doubles** 2v2 minigame shipped at Kalos's Battle Maison, including the
ally abilities, the doubles-only moves and Quick/Wide Guard side protection.

Still open:

- [ ] Triple and rotation battles.
- [ ] A 3-way / 4-way free-for-all variant (the Battle Royal is the closest
      thing today).
- [ ] A doubles home in more regions (currently only Kalos's Battle Maison).

Relevant code: `src/game/minigames/doubles.js`,
`src/components/doubles-scene.js`, `src/game/reducer/minigames.js`, and
`src/game/minigames/registry.js`.

## 56. Multi-effect move pass

The move data supports a primary effect plus one `secondary`, and
`public/reference.html` is the live checklist of every implemented effect.

Still open:

- [ ] Moves that carry a third effect (a primary effect plus two riders), which
      the single `secondary` slot still cannot express.

Relevant code: `src/data/move-effects.js`, `src/game/combat/turn.js`,
`src/game/move-info.js`, and `public/reference.html` (regenerate with
`node tools/generate-reference.cjs`).

Effort: **small** (the remaining bits are one-offs).

## 62. Offline depth

The "while you were away" report already itemises the Field Jobs that ran
(`offlineReport.jobs`).

Still open:

- [ ] A full catch-up simulation that replays the idle loop offline (battles,
      encounters, auto-catches) instead of the flat money + candy reward, so the
      report can name what was caught.
- [ ] Include the Pelago / garden / daycare in the report (they advance per wild
      win, so they don't tick offline today).

Effort: **medium**.

## 69. Legendary quests

Each region's Raid Island tracks a multi-step hunt (badges / Champion / 40% of
its generation) that unlocks a direct raid for its box legendary
(`src/game/legendary-quests.js`).

Still open (optional):

- [ ] Relic-collecting steps (new items found on routes) instead of the
      Pokédex-percentage step.
- [ ] Per-legendary boss battles with dialogue rather than a standard raid.

## 75. Legends Z-A area (Kalos post-game zone)

Lumiose City's five Wild Zones shipped as a Kalos post-game zone
(`tools/add-lumiose-zone.cjs`).

Still open (optional):

- [ ] A Jubilife-style Lumiose hub scene and the Z-A Mega "Z" forms as an
      area-specific mechanic.

## 76. Legends Arceus / Hisui areas (Sinnoh post-game zone)

Hisui's five areas shipped as a Sinnoh post-game zone
(`tools/add-hisui-zone.cjs`).

Still open (optional):

- [ ] A Jubilife Village hub location and the noble / ride Pokemon as statics or
      Raid Island additions, and space-time distortions as a swarm event.

## Map cleanup reference maps
All eight non-Kanto regions have hand-measured `REGION_MAP_LAYOUTS` overrides.
`tools/map-compare/overlay-region-maps.py` draws the game's nodes on top of each
reference image (`tools/map-compare/refs/`, fetched by `fetch-refs.cjs`) to
check them. Re-run the overlay after moving or adding nodes.

Reference images kept for future checks:

- **Sinnoh** — https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e3b63315-f949-4899-bfec-5e53edcb71bc/de3deoc-13a15e88-ca36-4f15-8824-44f4f7c83833.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9lM2I2MzMxNS1mOTQ5LTQ4OTktYmZlYy01ZTUzZWRjYjcxYmMvZGUzZGVvYy0xM2ExNWU4OC1jYTM2LTRmMTUtODgyNC00NGY0ZjdjODM4MzMucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.2o7QyN1MjdspHH1EYhWWIpV8_2aer0TBwtswDubtGzw
- **Galar** — https://static0.polygonimages.com/wordpress/wp-content/uploads/chorus/uploads/chorus_asset/file/19375993/Pokemon_sword_shield_galar_map_locations.jpg?q=50&fit=crop&w=750&dpr=1.5
- **Kalos** — https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Fm77o7e9nfw371.jpg
- **Unova** — https://upload.wikimedia.org/wikipedia/commons/2/2b/Unova_Map.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail_unscaled&_=20231229170134

---

## Map polish (visual)

The generated maps are readable graphs. The zone marker shows its sub-area
count, town and area/zone labels stay on screen, and a legend explains the node
types and services, so what is left here is **art**:

- [ ] Add more battle background art. There are only four base scenes
      (grassland, beach, mountain, cave) plus the biome colour grades; real
      forest/desert/swamp/volcano/tundra art would let `routeBackground` stop
      tinting a handful of images.

## Useful references when picking these up

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
