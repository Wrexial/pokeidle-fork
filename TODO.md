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

_(empty — the last Tier 1 item, #77, shipped.)_

### Tier 2 — Big, defer

_(empty — the game stays client-only, so the online-sync idea was dropped.)_

### Tier 3 — Small follow-ups on shipped systems

_(empty — every shipped system's follow-ups are done.)_

### Feature ideas (0.25.0 brainstorm)

A backlog of candidate features gathered from a brainstorm. Each has a stable
number and full detail further down. Promote into the tiers above once scoped.

- **Strong candidates:** #78 Seasons · #83 Trainer Card, titles & avatar.
- **Big but wanted:** #86 Pokemon Bank.
- **Medium:** #85 Form dex · #89 Mystery Gift ·
  #90 Professor's story · #91 Auto-battle policy · #92 Raid events.
- **Quick wins:** #95 Hide-and-seek · #98 Hotkeys.

---

## Feature ideas

The numbered entries below are the brainstorm referenced from the priority
order above. Effort uses the same scale (S < S–M < M < M–L < L); gain is
player-facing value (★ = nice to have, ★★★★★ = core missing feature).

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

## Professor's Story region gating (follow-up)

The Professor's Story chapters unlock strictly in sequence: in
`professorStoryStatus` (`src/game/quests.js`) a chapter's `unlocked` is only true
once the previous chapter is claimed. But regions open in any order now (Unlock
Tokens), so a player deep into, say, Paldea is still blocked from Kukui's
chapter until they have chained through every earlier region. Gate each chapter
on **its own region** being open instead:

- [ ] Base a regional chapter's `unlocked` on the region being available to the
      player (or just drop the pre-req and let the steps gate it), keeping the
      `region: null` capstone behind every regional chapter.
- [ ] Re-check the `chapters` capstone step and the "Locked · <professor>" copy
      in `src/components/quests-modal.js`, and update
      `tests/professor-story.test.mjs` (it currently asserts the sequential
      chain, e.g. that a done-but-unreached Unova chapter stays unclaimable).

## Route activity theme tweaks (follow-up)

Two newer route activities reuse older minigames' mechanics and read as
duplicates. Keep them, but re-theme so they feel like their own thing:

- [ ] **Dowsing Machine** (`src/game/minigames/dowsing.js`,
      `src/components/dowsing-scene.js`): the hot/cold probe grid is the Mining
      grid (`mining.js`) again. Reskin the grid, heat language and reward
      fiction (lost-and-found, buried treasure, auras) so it is not "another
      Mining".
- [ ] **Hide-and-Seek** (`src/game/minigames/hide-and-seek.js`,
      `src/components/hide-and-seek-scene.js`): the glyph reveal is the Unown
      Picross nonogram (`unown-picross.js`) again. Re-theme the puzzle
      presentation (rustling grass, footprint tracking, echolocation) so it is
      not a second Picross.

## SOS chain should break on a new species (bug)

The SOS chain keys only on the **route** (`sosChain: { routeKey, count }`; see
`advanceSosChain` in `src/game/reducer/collection.js`), so KOing a *different*
species on the same route keeps the streak — and its hidden-ability/shiny odds
and milestone rewards — climbing. It should be a same-species chain: meeting a
new species breaks it.

- [ ] Store the species on the chain and reset `count` to 1 when the enemy's
      species differs. The wild-win event already has
      `state.enemyPokemon?.speciesKey` (`src/game/reducer/battle/events.js`).
- [ ] Decide whether `sosBestChains` and the milestone rewards stay per route or
      become per species, and adjust the location-panel SOS copy.
- [ ] Cover it in `tests/sos-chain.test.mjs`.

## Sweet Scent as field Honey (follow-up)

Honey (`src/data/items.js`, the `USE_EFFECT_ITEM` reducer) is an out-of-combat,
per-route, per-species lure: it doubles that species' encounter weight and gives
a 1.5x catch bonus for 500 battles (`applyEncounterModifiers` / `isHoneyActive`
in `src/game/progression/encounters.js`, offered from
`src/components/encounter-detail-panel.js`). Sweet Scent is currently only a
battle move, so let a party Pokemon that knows it grant the same out-of-combat
utility instead of spending Honey.

- [ ] Apply the existing `{ type: 'honey', routeKey, speciesKey,
      battlesRemaining }` effect from a field-move button on the encounter/route
      panel, with a cooldown (or small cost) so it doesn't fully replace the
      item. Only the entry point is new; the effect plumbing is already there.
- [ ] Cover the field-move path and its cooldown in the tests.

## Route activity frequency (follow-up)

The Dowsing Machine and Hide-and-Seek currently appear on **every** wild route
(`dowsingRouteKey` / `hideAndSeekRouteKey` in `src/components/location-panel.js`
fall back to the route's own `routeKey`), so a region can offer a dozen of each.
Thin them out to **2 Dowsing spots and 2 Hide-and-Seek spots per region** (4
route activities total per region).

- [ ] Pick the 2 routes per region deterministically (a curated table, or a
      day-seeded selection) and expose helpers like `dowsingRouteForRegion` /
      `hideAndSeekRouteForRegion` that the panel consults before showing the
      cards. Keep the existing per-route daily gating.
- [ ] Apply the same limit to the `START_DOWSING` / `START_HIDE_AND_SEEK`
      reducer guards (`src/game/reducer/minigames.js`) so a route that isn't
      chosen can't start one.
- [ ] Update `tests/dowsing.test.mjs` and `tests/hide-and-seek.test.mjs`.

---

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
