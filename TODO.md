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

## UI polish batch

Panel-layout and top-bar cleanups: reclaim vertical space, make the sub-tab
hierarchy read, and fold the daily menus together. All are UI-only unless
noted.

## Make the Secret Base card collapsible (follow-up)

`SecretBaseCard` (`src/components/secret-base-card.js`) always shows its
heading, hint paragraph and start/move button on every route, which is a lot of
space for a feature most routes don't use. Collapse it behind its section title
like the other disclosure sections, defaulting to open only when this route *is*
the player's base.

- [ ] Add a `collapsed` state to `SecretBaseCard` toggled from the
      `location-section-title`, with a chevron/open indicator.
- [ ] Keep the hint and the ENTER / MOVE / SET UP button inside the expanded
      body; show the base's location (or "not set up") in the collapsed title.
- [ ] Match the existing disclosure styling in `assets/style.css` rather than
      inventing a new pattern.

## Put Focus Hunt and Field Jobs on one row (follow-up)

The Focus Hunt bar (`HuntBar`, `src/components/hunt-panel.js`) is a full-width
bar, and the Field Jobs entry (`location-jobs-btn`,
`src/components/location-panel.js`) only appears under it once a job is already
running, so there is no single "route utilities" row. Group them: make the
Focus control read as a compact button (icon + target/short progress) and sit
the Field Jobs button beside it.

- [ ] Restyle `.hunt-bar` in `assets/style.css` as a compact button so it can
      share a row instead of stretching full width.
- [ ] Add a small flex row in `LocationPanel` holding `HuntBar` and the Field
      Jobs button, and show the jobs button whenever job slots exist rather
      than only when `jobCount > 0`.
- [ ] Sanity-check the row on the narrow/mobile location panel.

## Collapse the daily menus into one hub (follow-up)

The battle top bar (`battle-top-buttons` in `src/components/battle-scene.js`)
has a separate button each for the Daily Event, Mystery Gift, Quests &
Professor's Story, Pokewalker and Companion. That is five icons competing with
Info and Settings. Collapse them behind one "Dailies" button that opens a modal
with a sub-tab per section (reuse the trainer sub-tab styling above) and shows a
single claimable pulse when any of them has something waiting.

- [ ] Add a `DailyHubModal` that hosts `DailyEventModal`, `MysteryGiftModal`,
      `QuestsModal`, `PokewalkerPanel` and `CompanionCarePanel` as inline
      sub-views (they already support inline rendering or can be adapted).
- [ ] Replace the five top-bar buttons in `battle-scene.js` with one Dailies
      button, keeping the combined "claimable" state
      (`claimableMysteryGifts`, `hasClaimableQuests` /
      `hasClaimableProfessorStory`, `state.dailyEvent`, Pokewalker steps,
      companion care).
- [ ] Keep `BattleMenuKey` and the `BattleMenuModals` switch tidy (drop the
      now-unused keys) and update any test that references them.

## Remove the Run Summary shortcut from the battle screen (follow-up)

The Run Summary now lives in Backpack → Trainer → Summary
(`src/components/trainer-card-panel.js`), but the battle top bar still has its
own `run-summary-btn` (`src/components/battle-scene.js`) and the `'summary'`
branch in `src/components/battle-menu-modals.js`, so the same modal opens from
two places.

- [ ] Delete the `run-summary-btn` from `battle-scene.js` and the `'summary'`
      entry from `BattleMenuKey` / `BattleMenuModals`.
- [ ] Drop the now-unused `RunSummaryModal` import and confirm no test or other
      caller references the old menu key.

## Rare Radar reads as broken (bug)

Buying the Pokewalker's Rare Radar sets `revealSpecies` from
`rarestRouteSpecies(state.currentRoute)` (`src/components/pokewalker-panel.js`)
and `spendOnReveal` (`src/game/reducer/pokewalker.js`) only adds that species to
`activeEffects` as a `honey` effect. `resolveActiveModifiers`
(`src/game/progression/encounters.js`) merely **doubles** its encounter weight,
so a weight-1 "super rare" in a large table stays effectively invisible, and
nothing in the UI confirms the buff is up — the steps look wasted. The reducer
test (`tests/pokewalker.test.mjs`) only asserts the effect object, not that the
target actually becomes common.

- [ ] Reproduce it: spend steps on a route, then confirm the target's spawn
      rate barely changes (and the effect is invisible in the location /
      encounter panel).
- [ ] Make the reveal actually draw the target out — a much larger multiplier,
      suppression of the other species, or a guaranteed encounter after N
      battles — instead of reusing the Honey buff verbatim.
- [ ] Surface an active-reveal chip in the location panel (target name +
      battles remaining) so the player can see it working.
- [ ] Add an idle-loop/encounter test asserting the target is materially more
      common (or guaranteed) while the reveal is active, not just that the
      effect object exists.

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
