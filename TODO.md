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

- **Strong candidates:** #78 Seasons · #83 Trainer Card, titles & avatar ·
  #88 Villain-team questlines (each fills a real gap for the effort).
- **Big but wanted:** #87 Secret Base · #86 Pokemon Bank.
- **Medium:** #85 Form dex · #89 Mystery Gift ·
  #90 Professor's story · #91 Auto-battle policy · #92 Raid events ·
  #93 Tower ladders · #96 Berry market.
- **Quick wins:** #94 Dowsing Machine · #95 Hide-and-seek ·
  #97 Run summary · #98 Hotkeys.

---

## Feature ideas

The numbered entries below are the brainstorm referenced from the priority
order above. Effort uses the same scale (S < S–M < M < M–L < L); gain is
player-facing value (★ = nice to have, ★★★★★ = core missing feature).

**Meta, collection & customization**

## 87. Secret Base / hideout

Pick a route, decorate a base with furniture/plushies/trophies, earn passive
bonuses and a daily yield. Reuses the Pelago/Garden patterns.

- [ ] A base owned per save with a decoration inventory and a placement grid.
- [ ] A shop for furniture and trophies (milestone rewards).
- [ ] Passive bonuses + a collectable daily yield (idle hook).

Effort: **large**. Gain: ★★★.

**Narrative & quests**

## 88. Villain-team questlines

The rival exists but no antagonist organisation does. Grunt hideouts gated
behind badges, an admin, a boss with a legendary. The biggest content gap.

- [ ] One org per region (Rocket / Aqua / Magma / Galactic / Plasma / Flare /
      Skull / Yell / Star) with a hideout location and a short arc.
- [ ] Reuse the trainer/gym/raid plumbing for grunts, admins and the boss.
- [ ] A post-arc reward (a legendary quest, a Master Ball, a key item).

Effort: **large**. Gain: ★★★★★.

## 89. Mystery Gift / distributions

Rotating date-gated mythical gifts and redeem codes, Wonder-Card style. No
backend needed.

- [ ] A date/rotation table for gift species, reusing `src/game/gifts.js`.
- [ ] A Mystery Gift panel with a claim state and a Wonder Card view.
- [ ] Optionally accept offline "codes" (a signed string) later.

Effort: **medium**. Gain: ★★★★.

## 90. Professor's story chain

A multi-region questline beyond the per-species research tasks.

- [ ] Extend `src/game/quests.js` with a chained regional storyline.
- [ ] Step rewards (items, a charm, a Master Ball) and a final capstone.

Effort: **medium**. Gain: ★★★.

**Battle depth**

## 91. Configurable auto-battle policy

AUTO currently chooses moves for the player. Let players set rules instead: prefer
STAB, avoid contact vs Rocky Helmet, switch below X%, item at Y%.

- [ ] A settings shape for move/switching/item policy.
- [ ] Feed it into `src/game/combat/ai.js` (used for the player's auto turns).
- [ ] A compact editor in Settings with sensible defaults.

Effort: **S–M**. Gain: ★★★★.

## 92. Rotating raid events

Tera raids exist; add Gmax raid bosses on a daily/weekly rotation with a
simulated ally.

- [ ] A rotation table picked by `daily-events.js` / date.
- [ ] A boss modifier on the existing Tera Raid scene.
- [ ] Event-only rewards and a completion record.

Effort: **medium**. Gain: ★★★.

## 93. Battle Tower ladder modifiers

Weekly rotating rule sets on top of the existing Tower/Frontier (inverse, no
items, weather-lock, no healing).

- [ ] A modifier registry + a weekly pick.
- [ ] Apply modifiers in `src/game/battle-frontier.js` / the Tower run.
- [ ] Show the active modifier on the panel and in Records.

Effort: **medium**. Gain: ★★★.

**Activities & economy**

## 94. Dowsing Machine

A grid search for hidden items on a route; reuses the mining/dig grid UI.

- [ ] A per-route hidden-item set, respawning daily.
- [ ] A hot/cold grid minigame using `src/game/minigames/mining.js` patterns.

Effort: **S**. Gain: ★★.

## 95. Hide-and-seek spots

Hidden Pokemon spots that reveal rare spawns, using the Picross / Ruins reveal
pattern.

- [ ] Spots on a route that reveal a bonus encounter when found.
- [ ] Reuse the `unown-picross` / `ruins-puzzle` reveal UI.

Effort: **S**. Gain: ★★.

## 96. Berry / commodity market

Daily price swings; buy low, sell high across days. A gentle idle economy.

- [ ] A price table with daily fluctuation (seeded like `daily-events.js`).
- [ ] A buy/sell UI (extends `src/game/shop.js`).
- [ ] Keep it optional so it never blocks normal play.

Effort: **medium**. Gain: ★★★.

**Interface**

## 97. Run summary / milestone timeline

A shareable recap of a run's high points (catches, shinies, badges, first level
100), beyond the flat Records panel.

- [ ] Record milestone events into a capped timeline.
- [ ] Render a summary modal + an image export.

Effort: **S**. Gain: ★★★.

## 98. Rebindable hotkeys

Power users idling for hours would appreciate it.

- [ ] A keybinding settings section and a small resolver.
- [ ] Cover the common actions (battle speed, manual/auto, catch).

Effort: **S**. Gain: ★★.

---

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
