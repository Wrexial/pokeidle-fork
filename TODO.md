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

1. **#78 Alola Ultra Warp Ride** — M · ★★★ — a warp minigame to reach the Ultra
   Beasts and legends.
2. **#66 Battle Frontier facilities** — M–L · ★★½ — rule-variant facilities on
   the Tower / Maison scenes.
3. **#61 Focus / target hunting** — S–M · ★★½.
4. **#77 UI consistency pass (sliders / steppers)** — S–M · ★★.

### Tier 2 — Big, defer

5. **#19 Online sync** — L · ★★★ — the project's first backend; needs a design
   doc and real ops for modest player value today.
6. **#43 Multi-battles (triple / rotation)** — M–L · ★★½.

### Tier 3 — Small follow-ups on shipped systems

See the numbered sections below: #24, #25, #56, #62, #65, #67, #69–#76,
#79–#82. They are optional extras rather than missing features.

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

Still open (design calls):

- [ ] PP is stored but unused; decide whether to implement it or drop it.
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

## 61. Focus / target hunting

Pick a species or type to focus; boost its wild and activity encounter rate and
track hunt progress (encounters, best quality, time to catch).

Effort: **small–medium**.

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

## 65. Prestige perks

A persistent perk tree bought with Prestige Points (2 per region prestige) is in
(`src/game/prestige.js`): Experience, Fortune and Capture, up to rank 5 each.

Still open (optional):

- [ ] More perk ideas: egg hatch rate, item drop rate, a starting-level or
      shiny-odds perk.
- [ ] Respec / refund points.

## 66. Battle Frontier facilities

Rule-variant facilities (inverse battles, rental teams, no-items) built on the
Tower / Maison scenes.

Effort: **medium–large**.

## 67. Ribbons + ribbon case

Eight ribbons and the per-Pokemon ribbon case shipped (`src/game/ribbons.js`).

Still open (optional):

- [ ] More ribbons: a shiny ribbon, a first-catch ribbon, per-region League
      ribbons, or a ribbon for a full Field-research species.

Effort: **small–medium**.

## 69. Legendary quests

Each region's Raid Island tracks a multi-step hunt (badges / Champion / 40% of
its generation) that unlocks a direct raid for its box legendary
(`src/game/legendary-quests.js`).

Still open (optional):

- [ ] Relic-collecting steps (new items found on routes) instead of the
      Pokédex-percentage step.
- [ ] Per-legendary boss battles with dialogue rather than a standard raid.

## 70. Recurring rival

Each region has a named rival who challenges you at 2 / 4 / 6 / 8 badges with a
party-scaled team (`src/game/rival.js`, `rival-panel.js`).

Still open (optional):

- [ ] Rival dialogue before/after the battle.
- [ ] A rival-specific sprite instead of the Ace Trainer stand-in.
- [ ] A Rival Ribbon on the party for a full set of wins.

## 71. Breeding project queue & shiny tracking

The Day-Care tracks eggs / shinies hatched and a breeding project queue
(`src/game/breeding-projects.js`).

Still open (optional):

- [ ] Explicit Masuda odds (a language/region tag on a parent) rather than the
      current shiny-parent boost.
- [ ] A per-project hatch counter (eggs spent toward each project).

## 72. QoL pass

Box IV sort, the move effectiveness / KO preview, team presets and JSON save
export/import all shipped.

Still open:

- [ ] Box bulk-release (multi-select or a filtered "release all"); the Box
      already has one-tap "Release Duplicates".

## 73. Weather system on routes

A 15-minute world weather cycle feeds `fieldWeatherFor` and the activity
conditions, with a chip beside the day/night one (`src/game/weather.js`).

Still open (optional):

- [ ] Let an activity also count the current *battle* weather, so a Rain
      Dance-buffed fight reads as rainy.
- [ ] Add more weather types (fog, strong winds) or a per-region flavour.

## 74. Pokemon sizes (XS–XL)

Every individual rolls a size mapped to an XS–XL rating (with a ★ ALPHA marker
for the very largest) on the stats panel (`src/game/pokemon/sizes.js`).

Still open:

- [ ] Bake the size into an **alpha** stat/EXP bonus (and a Box marker).
- [ ] Tie it into **Field research**: "catch a large specimen" / "catch an XL
      specimen" tasks. Size is per-individual, so the research counter has to
      watch caught individuals, not just species.
- [ ] Add `height` to the species data (a PokeAPI pass like `fetch-weights.cjs`)
      and scale the roll by the species' baseline, so a Wailord and a Diglett
      aren't judged on the same scale.

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

## 77. UI consistency pass (sliders / steppers)

A sweep over the small input controls so like looks like like.

- [ ] **Slider-style controls.** There is currently **no shared slider visual** —
      a search of `src/` and `assets/` finds no `<input type="range">` and no
      `slider` class at all, so anything slider-ish (the catch-settings level
      threshold number input, the shop quantity steppers, the battle speed
      buttons, the Town Map zoom) is styled ad hoc. Consolidate them onto one
      shared slider/stepper component (track + fill + handle) sized for the pixel
      UI. *(If a specific control is what you meant by "sliders", name it and this
      item starts from there.)*
- [ ] Check the segmented selectors (battle speed, sprite style, sort fields) use
      the same active / inactive treatment.
- [ ] Check the settings toggles and the radio-style option lists match too.

Effort: **small–medium**.

## 78. Alola Ultra Warp Ride (warp minigame)

Alola's Ultra Beasts are in — all 11 are present and sit on the region's Raid
Island pool (27 entries) — but there is no Ultra Space and no way to reach them
besides the ordinary Raid Island pick. Add the **Ultra Warp Ride**: ride
Solgaleo / Lunala through a wormhole and steer for the rarest destination.

- [ ] Add an **Ultra Space** point of interest in Alola (a post-game location,
      or a hub on the existing Raid Island) that launches the minigame.
- [ ] Design the ride: a scrolling wormhole tunnel the player steers through,
      collecting rings / dodging debris. The furthest, cleanest run reaches the
      rarest wormhole.
- [ ] Map the destination to a species drawn from Alola's raid pool — the 11
      Ultra Beasts plus the regional legends — so a good run can pick the target
      instead of leaving it to the raid's weighted roll.
- [ ] Reuse the fixed-minigame plumbing (registry entry, phase + scene, a
      `START_*` action, the idle-loop pause list, a tutorial) and the Raid Island
      encounter data for the destination.

Effort: **medium**.

## 79. Johto Poké Ball crafting (Kurt)

The seven Apricorns, the seven Apricorn Balls (with their situational catch
rates) and Kurt's Azalea Town workshop all shipped (`src/game/reducer/items.js`,
`kurt-panel.js`).

Still open (optional):

- [ ] The canonical delayed turnaround (hand Kurt Apricorns, collect after a few
      wild wins) instead of the instant carve.
- [ ] Grow Apricorns in the Berry Garden as well as finding them on routes.

## 80. Companion affection perks (tough it out)

The 1 HP "tough it out" save shipped (`src/game/companion.js`,
`combat/turn.js`).

Still open (optional extras if we want the full affection set):

- [ ] Shake off a status condition, dodge a move, or a bumped crit rate.
- [ ] Let a high-friendship non-companion benefit too, if the companion-only
      gate feels too narrow.

## 81. Research Shop diversification

The Research Shop now sells a research-flavoured set (the Exp. Candy ladder,
Rare Candy, Poffin, the Ability Capsule / Patch, Bottle Caps, a Master Ball)
instead of the Kecleon evolution stones.

Still open (optional):

- [ ] Training items (PP Up / PP Max, vitamins) or research-only held items
      (Lucky Egg, Amulet Coin) once PP / EVs are modelled.
- [ ] A species-specific research reward tied to the species the points came
      from.

## 82. Research tasks for non-wild species (Legends-style tasks)

`researchTasksFor(speciesKey)` is species-aware, so a species with no wild route
gets observable tasks (obtain / feed / use moves) instead of impossible defeat
rows.

Still open (optional extra Legends-style tasks):

- [ ] Catch a large / alpha specimen (ties into #74), or defeat a foe with a
      super-effective move of a given type.
- [ ] A per-species "see it use <specific move>" flavour task for more variety.

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
