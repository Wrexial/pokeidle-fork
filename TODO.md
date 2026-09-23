# TODO

Open ideas and follow-ups. Current game version: **0.38.3**
(`src/data/changelog.js`). Finished work lives in the changelog, not here — this
file only tracks what is **still open**. See `AGENTS.md` for architecture,
commands and data conventions.

Section numbers are stable references (`#24`, `#36`, …) and are deliberately not
renumbered, so the gaps below are items that shipped.

---

## Priority order (effort vs. gain)

**Effort**: S (small) < S–M < M < M–L < L. **Gain** is the player-facing value
(★ = nice to have, ★★★★★ = core missing feature).

### Tier 1 — Quick wins (small effort, high gain)

1. **#30a Caught-indicator polish** — S · ★★½ — the enemy name row's caught
   badge is a plain `✓`; use a Pokéball sprite and tell seen / caught / shiny
   apart.
2. **#15 Save slots + share code** — S–M · ★★★ — export/import already
   shipped; multiple slots and a base64 share code are still open.
3. **#16 Challenge mode: monotype** — S · ★★★ — the last challenge toggle
   beside Randomizer / Level Scaling / Nuzlocke.
4. **#16 Performance pass** — S–M · ★★ — the idle loop dispatches a lot per
   tick; look at memoisation / batching if it ever gets heavy.

### Tier 2 — High impact, worth the effort (medium–large)

5. **#24 Move data pass (remaining)** — M–L · ★★★★½ — the rest of the
   no-op/partly-modelled moves.
6. **#25 Battle engine pass (remaining)** — M–L · ★★★★½ — pairs with #24; the
   rest of the abilities/items hooks and battle polish.
7. **#36 Zones (route chunks)** — M–L · ★★★★ — lets Alola/Galar/Paldea map as
   chunks of areas instead of a single-route-wide graph.
8. **#38 Clean up the Raid Islands** — M · ★★★½ — later generations leave
   50–60 species on one raid pool, turning raids into a shapeless grab bag.
9. **#40 Alola / Galar / Paldea league structures** — M · ★★★½ — trials, the
   Champion Cup and any-order gyms don't fit the 8-gyms + E4 model. **(partial:
   0.38.0 shipped the data-driven model; Alola's full 11-slot trial track and
   Paldea's Titans / Team Star remain.)**
10. **#11 NPC gifts & static encounters** — M · ★★★ — one-off gift NPCs and
    single overworld catches; needs a few small state flags.
11. **#29 Fishing / companion minigames** — M–L · ★★★ — the rest of the
    minigame menu, now that the scene + phase pattern exists.
12. **#35 More Galar areas** — M · ★★★½ — Galar is the thinnest region map.
13. **#39 DLC regions from later games** — M–L · ★★★★ — promote Isle of Armor,
    Crown Tundra, Kitakami and the Terarium to first-class regions.
14. **#18 Better settings** — M · ★★★★ — centralise the QOL toggles and store
    settings separately from the save.
15. **#28 More region areas (caves, POIs, DLC land)** — L · ★★★★½ — real
    content; data-heavy. Pairs with #35/#36/#39.
16. **#4 In-battle Mega evolution** — M–L · ★★★ — Mega Stones plus a mid-battle
    transformation action.

### Tier 3 — Big / low-return, defer

17. **#10 Weather & terrain leftovers** — M · ★★½ — terrain synergy abilities
    and weather/accuracy interactions.
18. **#19 Online sync** — L · ★★★ — the project's first backend; needs a design
    doc and real ops for modest player value today.

---

## 4. In-battle Mega evolution

Megas exist only as level-100 **evolutions** (`evolution-data.json`); there's no
mid-battle transformation.

- [ ] Give Mega-capable Pokémon a held Mega Stone (ties into #2c).
- [ ] Add a battle action / auto-trigger that swaps to the Mega form for the
      rest of the battle (stats + typing), then reverts.
- [ ] Decide whether this replaces the current level-100 evolution or sits
      alongside it.

Effort: **medium–large**.

## 10. Weather & terrain leftovers

Weather (0.17.0) and terrain (0.20.0) both shipped; what remains:

- [ ] Terrain synergy abilities (Grass Pelt, Hadron Engine, Quark Drive),
      terrain rocks/extended duration, and route-based field effects.
- [ ] Weather-ball / move accuracy interactions (Thunder, Hurricane, Blizzard).

Effort: **medium**.

## 11. NPC gifts & static encounters

Towns are currently marts + gyms; a few one-off NPCs would add flavour and
content (and give fossils/starters a clean source outside the raid pool).

- [ ] A gift NPC per region (fossil, starter, an item) gated on a flag.
- [ ] Static overworld encounters (a fixed species/level you catch once).
- [ ] Reuse the boss-battle / wild-encounter plumbing.

Effort: **medium**. Needs small new state flags.

## 15. Save management & sharing

A save lives in one versioned `localStorage` key. Export/import shipped in
0.9.1; what's left:

- [ ] Multiple save slots (pick a slot at boot).
- [ ] A shareable code (base64 of the save) for trading collections.

Effort: **small–medium**.

## 16. More ideas (unsorted)

- [ ] **Challenge mode: monotype** — a single-type run is still open.
- [ ] **Performance pass** — the idle loop dispatches a lot per tick; look at
      memoisation / batching if it ever gets heavy.

## 18. Better settings

`settings-modal.js` now exposes gameplay, notification, display and audio
toggles; what remains is mostly restructuring:

- [ ] Gameplay: a single home for default catch rule, auto-catch / auto-heal /
      auto-switch / auto-proceed toggles, battle speed and "auto-travel".
- [ ] Notifications: which events raise browser notifications (shiny, rare, egg
      ready, box full).
- [ ] Display: sprite style and other cosmetic options.
- [ ] Data: export/import (#15) and a confirmed reset in one place.
- [ ] Account: sign in / sync controls (#19).
- [ ] Store settings separately from the save (a `localStorage` settings key) so
      they survive a save reset and sync independently.

Effort: **medium** (mostly UI plus a small settings slice).

## 19. Online sync (cloud saves via a database)

This would be the project's **first backend** — the app is deliberately
client-only today with one `localStorage` save. Worth a short design doc first.

- [ ] Pick a backend: a managed BaaS (Supabase / Firebase — auth + Postgres /
      Firestore) vs a small custom API.
- [ ] Auth: an anonymous device id that can later be linked to an account
      (email / OAuth) so a save can follow the player across devices.
- [ ] Sync model: the save is a single JSON blob, so at minimum keep a
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

## 24. Move data pass (remaining)

`possible-moves.json` carries `name / type / category / power / accuracy / pp /
priority / effect`, and `src/data/move-effects.js` layers richer effects on top.
Healing, multi-hit, crit stages, Protect, statuses, screens, entry hazards,
Taunt/Substitute, weather setters and Haze/Clear Smog have all shipped.

Still open:

- [ ] The remaining no-op / partly-modelled status moves (Wish and friends).
- [ ] Re-check the rest of the priority table (the doubles-only moves).
- [ ] PP is stored but unused; decide whether to implement it or drop it.
- [ ] Z-moves / G-Max moves are otherwise dead data — decide keep/drop.

Effort: **medium–large** (the effect set is the bulk of it).

## 25. Battle engine pass (remaining)

`resolveBattleTurn` (`src/game/combat.js`) is fairly complete for damage +
status + stat changes. Healing, multi-hit, Protect, hazards, accuracy/evasion
stages, the extra statuses, weather/terrain, the crit-rate pass, the
auto-battler AI and the contact abilities have shipped.

Still open:

- [ ] Ability / held-item hooks — the rest of the ~300 abilities (see #2a) and
      the remaining item nuances (Choice locking, more berries, Rocky Helmet).
- [ ] Battle polish: move animations / damage numbers / hit feedback.

*(Switching on a bad matchup is intentionally discarded: an auto-switching
opponent is frustrating to play against.)*

Effort: **medium–large** (do it in slices).

## 28. More region areas (DLC, caves, POIs)

The maps are built from PokéAPI/Bulbapedia **towns + numbered routes** only
(`tools/scrape-region-maps.cjs`), then `tools/generate-regions.cjs` turns them
into 21–52 locations per region. That leaves three gaps:

### 28a. DLC / expansion areas

Later generations' DLC regions are missing, so those Pokemon have no native
route and fall into a Raid Island pool instead:

- Galar — **Isle of Armor** and **Crown Tundra** (Sword/Shield Expansion Pass).
- Paldea — **Kitakami** (Teal Mask) and **Blueberry Academy / Terarium**
  (Indigo Disk). `paldea-mossui-town` is already scraped as a bare dead-end town.
- (Optional earlier post-game islands: Kanto's Sevii Islands, Unova's Black/White
  2 areas.)

- [ ] Add the DLC areas to `tools/region-maps.json` (scraper or a committed
      override) and give them encounter tables, or inject them with the
      existing `EXTRA_MAP_AREAS` mechanism (`node` / `species` / `connect` /
      `rank`).
- [ ] Slot them into the level curve and unlock order so they read as post-game
      (DLC areas need a forced `rank` or `unlockOrder`).
- [ ] Re-check each region's `raidPool` after adding them — species that now
      have a native route must drop out.

### 28b. More ordinary areas

The scraper only keeps towns and routes, so caves, forests, tunnels, ruins,
towers, lakes/seas and safari zones are absent unless hand-added
(`EXTRA_MAP_AREAS` currently carries only Johto's Bell Tower / Whirl Islands /
Mt. Silver).

- [ ] Grow `EXTRA_MAP_AREAS` (or scrape the remaining landmark locations) with
      their own species lists so they don't drag a whole generation slice in.
- [ ] Consider a real `type` / `areaType` field (cave, forest, sea, ruins, …)
      instead of the current binary town-vs-route; `location-panel.js` labels
      everything non-town as "Route 🌿", and the battle background comes from
      the `ROUTE_BACKGROUND_RULES` / dominant-type heuristic.

### 28c. Points of interest (POIs)

Non-route nodes that offer a service or flavour: a Daycare stop, a Move
Tutor / TM vendor, a fishing spot, a berry patch, a raid den, a static
encounter, a legendary shrine, a mart/café.

- [ ] Decide the model: a new `type: 'poi'` location that is selectable but
      doesn't spawn wild battles, vs. lightweight markers overlaid on existing
      locations.
- [ ] Handle rendering/copy in `map-node.js`, `town-map.js` and
      `location-panel.js` (icon, label, no battle loop), reusing the existing
      travel/unlock plumbing.
- [ ] Choose a first POI that reuses existing systems (an on-map Daycare or
      Move Tutor is the smallest win) so it isn't just decoration.

Relevant code: `tools/scrape-region-maps.cjs` (`MANUAL_BRIDGES`),
`tools/generate-regions.cjs` (`EXTRA_MAP_AREAS`, `levelRoutes`,
`ROUTE_BACKGROUND_RULES`, raid pools), `public/data/map-data/*.json`, and the map
UI (`src/components/map-node.js`, `town-map.js`, `location-panel.js`).

Effort: **large** (data-heavy; 28a/28b mostly data, 28c a small feature).

## 29. Minigames (fishing, companion care, and more)

**Shipped:** Sinnoh's Underground mining (0.25.0), Johto's Bug Catching Contest
(0.26.0) and Kanto's Game Corner slots (0.27.0). All three are now full-stage,
game-pausing scenes (0.31.0 / 0.33.0) that unlock from a location rather than
the region Champion (0.32.0); the contest also has a top-3 podium with prizes
and now covers every Bug-type.

`src/game/minigames.js` holds `MINIGAME_BY_REGION` (region → minigame id),
`MINIGAME_UNLOCK_LOCATION` and `MINIGAME_INFO` (title/cost/action/hint) plus
each game's config/reward table. Adding the next one is a scene component + a
`START_*`/`END_MINIGAME` reducer pair + one entry in each map. Covered by
`tests/minigames.test.mjs`.

### 29a. Fishing minigame

Encounter data already keeps water/fishing methods in the scrape but the game
discards the method, so "fishing" is only flavour. Build a real one on water
routes:

- [ ] Rod tiers (Old / Good / Super) as items, each unlocking deeper water —
      then let the player cast from a water route for that route's water
      species only.
- [ ] A short timing minigame (a moving bar / reel-in window, Pokémon-style)
      where a good result improves the catch chance or the level/shiny odds,
      and a perfect one guarantees the encounter.
- [ ] Tie the result into the battle/catch flow (start a normal encounter on
      success) rather than a separate reward table, so it stays consistent.
- [ ] Persist water-only encounter pools (or re-derive them from the scraper
      `method`) so casting targets the right species.

### 29b. Companion / tamagotchi care

The Daycare is already a passive version of this (two parents → egg). A
hands-on companion that you feed/play with/rest would be the active counterpart
and would give friendship (#6) a purpose:

- [ ] Pick (or pin) one party Pokémon as the companion; add `care` state
      (hunger / happiness / energy) that decays on a real-time timer or battle
      count.
- [ ] Feed / play / rest actions with small cooldowns, costing money or berries;
      raising friendship and a temporary bonus (EXP, catch rate, shiny odds).
- [ ] Visual feedback — an animated buddy panel / petting scene using the
      existing sprite helpers.
- [ ] Keep it optional and non-punishing (the game is idle) — neglect should
      pause bonuses, not damage the Pokémon.

### 29c. Other minigame ideas

- [ ] **Berry growing + blending** — plant/pick berries on a timer, blend into
      Poffins/items (ties into care and held items, #2c).

Relevant code: the real-time loop and battle-count ticks (`src/hooks.js`
`useGameLoop`, `tickBattleCounters` in `src/game/progression.js`), the reducer's
`daycare` / `activeEffects` slices (`src/game/reducer.js`), the Daycare UI
(`src/components/daycare-modal.js`) and the existing minigame scenes.

Effort: **small per minigame, medium–large as a feature**.

## 30. Caught / event QOL indicators

The notification queue and basic caught badge shipped in 0.9.0. What's left:

- [ ] Swap the enemy name row's `✓` caught badge (`enemy-info-box.js`) for a
      **Pokéball sprite** (reuse `PokeballIcon` / `pokeballColors` in
      `src/data/ui.js`) — the ball reads instantly as "already in the ball".
- [ ] Distinguish *seen* vs *caught* vs *shiny caught* (`shinyCaught`) — e.g. a
      plain ball vs a shiny-tinted ball — on the enemy row, the encounter list
      and the Pokédex tile.
- [ ] Maybe flag the battle sprite too (a small marker), and keep it off for
      trainer teams / raids where the species isn't the reward.

Effort: **small**.

## 35. Go through the Galar map and add the missing areas

Galar is currently the thinnest region map. The generator only keeps PokéAPI
**towns + numbered routes**, so most of Galar is absent: the Wild Area is a
single node, and **Isle of Armor** / **Crown Tundra** (Expansion Pass) don't
exist. A large slice of the Galar dex has no native route and gets pushed into
Galar's Raid Island pool. This is the focused Galar pass; #28a/#28b cover the
same gaps generally and #36 proposes the zone model the Wild Area needs.

- [ ] Audit `public/data/map-data/galar.json` and
      `public/data/encounter-data/galar.json` against a real Galar map and
      write down what's missing — the Wild Area sub-areas (Rolling Fields,
      Dappled Grove, Giant's Mirror, Lake of Outrage, …), Slumbering Weald,
      Galar Mine, Glimwood Tangle, and any towns/routes the scraper skipped.
- [ ] Add what the scrapers can (`tools/scrape-region-maps.cjs` + cached
      Bulbapedia connections, then `tools/scrape-route-encounters.cjs`); inject
      the rest with `EXTRA_MAP_AREAS` in `tools/generate-regions.cjs`.
- [ ] Model the Wild Area as a **zone** (#36) rather than one giant route, with
      each named sub-area holding its own encounter table/background.
- [ ] Re-run `tools/generate-regions.cjs` and re-check Galar's `raidPool`.
- [ ] Keep progression sensible: mainland Galar stays on the 5–75 curve, and
      the DLC is post-game (after the Champion) via a forced `rank` /
      `unlockOrder`.

Relevant code: `tools/scrape-region-maps.cjs` (`MANUAL_BRIDGES`, which already
carries the Wild Area links), `tools/scrape-route-encounters.cjs`,
`tools/generate-regions.cjs` (`EXTRA_MAP_AREAS`, `levelRoutes`, raid pools),
`public/data/map-data/galar.json` and `public/data/encounter-data/galar.json`,
and `raidPoolFor` in `src/data/gameData.js`.

**Partial (0.37.0):** the Wild Area is now a zone (#36) with three sub-areas,
and Slumbering Weald, Galar Mine and Glimwood Tangle are real wild areas too.
The Expansion Pass is in as two more post-game zones (#39): the Isle of Armor
and the Crown Tundra, gated on beating Galar's Champion. Those areas added
galarian/hisuian and DLC species as wilds, which shrank Galar's `raidPool` from
59 to 22. Galar is now content-complete; first-class DLC *regions* remain #39.

Effort: **medium** (mostly data; the Wild Area zone work depends on #36).

## 36. Zones — route-like chunks of areas

The map is a graph of single nodes joined pair-wise: a town or one route per
node. That fits Kanto–Unova, but the later regions aren't a linear route chain
and they map badly today:

- **Alola** is four islands of trial areas — several islands read as separate
  disconnected clusters.
- **Galar**'s Wild Area is dozens of named sub-areas wrapped around the map; it
  collapses to one node.
- **Paldea** is open-world provinces of "<Dir> Province (Area N)" with no
  numbered routes, so it falls back to BFS-depth ordering and trims each
  province to 15 species.

Introduce a **zone**: a map node that is a *chunk of areas* (like a route, but
grouping several sub-areas) instead of a single encounter table.

Design questions to settle first:

- [ ] **Data shape**: a `type: 'zone'` location carrying
      `subAreas: [{ id, name, routeKey/encounters, background, unlock? }]`, vs.
      first-class locations tagged with a `zone`/`parentZone` id. The first keeps
      the map graph small (one node per zone) and makes zones obvious; the
      second reuses all the existing route plumbing.
- [ ] **Travel & UI**: does a zone appear as one node that opens a sub-area
      picker, or as a cluster of sub-area nodes shown/hidden together? Decide
      how the active sub-area is chosen (player pick vs. rotation).
- [ ] **Encounters**: resolve against the active/selected sub-area —
      `resolvePokemonEncounter` and `encounterData[routeKey]` are keyed by a
      single `routeKey` today, so the zone needs to feed the right one (or hold
      its own bucket).
- [ ] **Progress**: do zones unlock as a unit, or do sub-areas gate
      individually? `computeUnlockedLocations` + each location's `unlock` seed
      the fixpoint, and `unlockOrder` must stay stable when a zone is added
      (currently `region generation * 100000 + route rank`).
- [ ] **Level curve**: `levelRoutes()` spreads routes across the 5–75 curve by
      route number / BFS depth — decide how a zone's sub-areas rank and how the
      DLC/post-game zones slot in.

Likely touch points: `src/components/map-node.js` (zone glyph / cluster),
`town-map.js` (roads + tab), `location-panel.js` (the Wild Pokémon header),
`route-encounter-grid.js` (sub-area tabs), `tools/generate-regions.cjs`
(`EXTRA_MAP_AREAS`, `levelRoutes`, ordering), `tools/scrape-region-maps.cjs`,
and the `map-data/` / `encounter-data/` region files.

Good first candidate: **Galar's Wild Area** (one zone, many sub-areas) together
with #35, then **Alola** (islands as zones) and **Paldea** (provinces as zones)
to replace the proximity stitching / 15-species trim.

**Partial (0.37.0):** the model shipped. Galar's Wild Area, the Galar/Paldea
DLC and Paldea's Area Zero are `type: 'zone'` nodes with sub-area pickers, and
existing routes can be grouped too (`GROUP_ZONES`): Alola's routes are grouped
by island and Paldea's by province. Sub-areas are hidden routes with their own
encounter buckets; they unlock via their own (unchanged) rules, so a locked
area shows as ??? in the picker. Still open: more sub-areas, a distinct zone
glyph on the map, and inline per-sub-area encounter grids.

Effort: **medium–large** (a small data-model change plus map/encounter UI, but
it unblocks the three regions that don't fit the route graph today).

## 38. Clean up the Raid Islands (later generations are bloated)

The raid scan gives each region its generation's species that appear on **no**
region's wild routes and can't be reached by breeding/evolving a route species.
Because later dexes are huge (and their DLC/regional forms have no native route),
the pools balloon (before the Bug Catching Contest cleanup): Kanto 9, Johto 12,
Hoenn 15, Sinnoh 20, Unova 27, Kalos 10, Alola **51**, Galar **59**, Paldea
**58**. Trimming must not orphan anything — the raid pool is the safety net for
otherwise-unobtainable species, and `npm run validate` checks every species is
obtainable.

**Partial (0.37.0):** Galar's pool dropped from 59 to 20, Alola's from 50 to
27 and Paldea's from 56 to 12 (the last two are legendaries only) once the Wild
Area, the new Galar areas, the DLC zones and Area Zero gave their regional
forms, DLC species and paradox Pokemon native routes. The remaining Galar
ordinary members are the revived fossils, the Galarian birds and female
Indeedee. The earlier regions (Unova 26, Sinnoh 20) could still be trimmed the
same way if desired.

- [ ] Decide a target shape per region: e.g. keep **all** legendaries/mythicals
      (no other source) plus a capped non-legendary set (~10–15), and move the
      overflow to a real acquisition path (routed encounters, DLC areas #39,
      evolution items) rather than deleting it.
- [ ] Separate legendaries from the general pool in the data and the UI, so a
      raid can prioritise uncaught legends and ordinary finals are a distinct,
      lower-tier source.
- [ ] Consider weighting/level-gating the pool (by badges/prestige) instead of a
      uniform pick, and whether `raidPoolFor` should return the capped list.
- [ ] Explain *why* the later pools are big and fix the root cause where it is
      a data gap (regional/paradox forms and DLC mons with no native route),
      not just a cap (see #35, #39).
- [ ] Re-run `tools/generate-regions.cjs`, re-check every region's `raidPool`,
      and confirm `validate-data.cjs` still passes with nothing orphaned.

Relevant code: `tools/generate-regions.cjs` (`raidCandidates`,
`raidPoolSpecies`, `staysInRaidPool`, `FORM_RAID_REGION`, `paldeaExtrasFor`),
`public/data/regions.json` (`raidPool`), `pickRaidLegendary` / `resolveRoamer`
(`src/game/progression.js`), `START_RAID` (`src/game/reducer.js`), the raid UI
(`src/components/town-map.js`, `location-panel.js`) and `tools/validate-data.cjs`.

Effort: **medium** (mostly balance/data plus the generator; game logic is small).

## 39. Introduce DLC regions from later games

Later games shipped whole expansion areas that today are either folded into a
parent region, trimmed, or pushed into a raid pool:

- Galar — **Isle of Armor** and **Crown Tundra** (Sword/Shield Expansion Pass).
- Paldea — **Kitakami** (Teal Mask) and **Blueberry Academy / Terarium**
  (Indigo Disk). `paldea-mossui-town` is already scraped as a bare dead-end town.
- Optional older post-games: Kanto's **Sevii Islands** and Unova's Black/White 2
  areas.

#28a covers adding these as *areas inside their parent region*. This item is
about promoting them to **first-class regions** in `regions.json` — their own
`entry`, level curve, unlock path, raid pool and map — so they can be opened
with an Unlock Token like any other region.

**Partial (0.37.0):** Galar's DLC shipped the first (smaller) way — Isle of
Armor and Crown Tundra are post-game zones inside Galar (see #36), gated on
`championDefeated: 'galar'`, with their own sub-areas and encounters. Paldea's
Kitakami and Terarium shipped the same way (gated on `championDefeated:
'paldea'`), which needed the 17 missing Gen 9 DLC species to be added first
(`tools/add-gen9-dlc-species.cjs`). First-class-region promotion is still open.

- [ ] Decide the model: a region whose `generation` points at its parent gen,
      vs. a new `parentRegion` / `isDlc` flag. Regions currently map 1:1 to
      generations (`generation`, `speciesForGen`, per-gen raid pools and the
      per-generation Shiny Charm), so DLC needs an explicit answer.
- [ ] Add each area to `tools/region-maps.json` / `EXTRA_MAP_AREAS` with its own
      locations + encounters (`tools/scrape-region-maps.cjs` +
      `tools/scrape-route-encounters.cjs`, manual for Paldea-style provinces),
      and a `REGION_MAP_LAYOUTS` override where the layout needs hand-measuring.
- [ ] Give each a progression: post-game (after the parent Champion) or bought
      with an Unlock Token; decide whether it needs a league/Champion or just a
      raid/legendary endgame.
- [ ] Reconcile the dex/shininess/achievement structures:
      `GENERATION_DEX_RANGES` / `speciesKeysByGeneration` / `completedGenerations`
      key by national dex, so DLC mons already count toward their gen — decide
      whether DLC regions count toward region completion, Unlock Tokens and the
      World Tour achievement.
- [ ] Register the new region files in `assets/gameDataInjector.js` (the region
      list) and re-export in `src/data/gameData.js`.
- [ ] Re-check raid pools (#38) afterwards.
- [ ] Shape the maps with **zones** (#36) where they're open-world (the
      Terarium, Wild Area-style areas).
- [ ] Suggested order: Galar DLC (fits Galar's thin map, #35) → Paldea DLC
      (relieves Paldea's 15-species trim and its raid pool) → older post-games.

Relevant code: `public/data/regions.json`, `tools/generate-regions.cjs` (region
construction, `speciesForGen`, `levelRoutes`, the raid scan),
`tools/scrape-region-maps.cjs`, `assets/gameDataInjector.js` (region file list),
`src/game/progression.js` (`getRegionUnlockTokens`,
`computeUnlockedLocations`), and the Town Map (`src/components/town-map.js`).

Effort: **medium–large** (data-heavy, but shares groundwork with #28/#35/#36).

## 40. Handle Alola, Galar and Paldea's league structures

The league model assumes every region has **8 gym leaders in canonical order**,
then a **4-member Elite Four** and a Champion at a `leagueLocationKey`, gated by
`gymsRequired` / `badgesRequired` and unlocked along the route tree. That fits
Gens 1–6, but it misrepresents three regions:

- **Alola** has no gyms — 7 island trials (captain + totem Pokemon) award
  Z-Crystals, plus 4 grand trials against the Kahunas. The data currently
  fabricates **8** Z-Crystal "gyms" and spreads them across towns. Alola *does*
  have a real E4 + Champion (Mount Lanakila), so only the badge track is wrong.
- **Galar** has 8 gyms but **no Elite Four**: the Championship runs the Champion
  Cup semifinals (Marnie / Hop / Bede / Raihan) then Champion Leon, with a
  post-game rematch tournament. The data fakes an E4 from those rivals.
- **Paldea** has 8 gyms challengeable **in any order** and no fixed badge
  order — the generator imposes canonical order via `gymsRequired` gates.
  Victory Road is also only one of three storylines, so a badge-count gate is a
  poor fit.

**Partial fix (0.36.1):** Paldea's Elite Four now uses its real roster and
types (Rika, Poppy, Larry, Hassel) — the third/fourth slots were previously
Hassel and Academy director Clavell.

**Shipped (0.38.0):** the league is now **data-driven per region** via a
`league` block in `regions.json` (`badgeOrder`, `badgeTrack`, `badgeName`,
`eliteTrack`). The generator's `LEAGUES` table carries the shape and member
titles; `gym-panel.js`, `records-modal.js`, `location-panel.js` and the
achievements read the region's own wording. Specifically:

- **Alola** is billed as the island trials and awards **Z-Crystals**; its gym
  entries are titled "Trial Captain" with Hapu's grand trial as the
  **Island Kahuna**, and they are placed across the islands via a `GYM_TOWNS`
  map (Ilima no longer doubles up with Hapu in Iki Town).
- **Galar** keeps its 8 gyms but the endgame is labelled the **Champion Cup**
  (all four rivals show that title).
- **Paldea** uses `badgeOrder: 'free'`: the generator lays **no** ordered badge
  gates, and the league is gated by `badgesRequired` (a badge **count**) instead
  of `gymsRequired`, so its gyms can be beaten in any order.

Still open:

- [ ] **Alola full trial track**: the scraped map has no Poni town, so the
      region is mapped to 8 slots (7 trial captains + Hapu's grand trial). Add
      a Poni town / trial site and promote it to the real 7 trials + 4 grand
      trials, deciding whether a trial is a captain battle, a totem battle, or
      both.
- [ ] **Galar post-game tournament**: the Champion Cup's rematch is currently
      the generic Lv.90 rematch; model the post-game tournament separately if
      wanted.
- [ ] **Paldea side content**: Titans and Team Star are not modelled — decide
      whether they are optional side content or part of progression.
- [ ] Save shape stayed fine — `defeatedGyms` / `defeatedEliteFour` /
      `defeatedChampions` remain id lists, so no `SAVE_VERSION` bump was needed.

Relevant code: `tools/generate-regions.cjs` (`LEAGUES`, gym placement,
`gymsRequired` gates, league construction, `BADGE_NAMES` / `GYM_TOWNS`),
`public/data/regions.json` + `gym-leader-data.json` / `elite-4-data.json` /
`champion-data.json`, `src/components/gym-panel.js`, `src/game/reducer.js`
(`BOSS_BATTLE_END`, `RESET_ELITE_FOUR`), `src/data/achievements.js`,
`tools/validate-data.cjs`.

Effort: **medium** (mostly data + panel copy; the Paldea any-order gate is the
only real progression change).

---

## Map cleanup reference maps

All eight non-Kanto regions have hand-measured `REGION_MAP_LAYOUTS` overrides.
`tools/map-compare/overlay-region-maps.py` draws the game's nodes on top of each
reference image (`tools/map-compare/refs/`, fetched by `fetch-refs.cjs`) to
check them. As of 0.36.1 the Sinnoh, Galar, Kalos and Unova nodes all land on
their matching reference places, so there is no outstanding coordinate work for
these four — the remaining Galar gap is the missing areas, not placement (see
#35/#36). Re-run the overlay after moving or adding nodes.

Reference images kept for future checks:

- **Sinnoh** — https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e3b63315-f949-4899-bfec-5e53edcb71bc/de3deoc-13a15e88-ca36-4f15-8824-44f4f7c83833.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9lM2I2MzMxNS1mOTQ5LTQ4OTktYmZlYy01ZTUzZWRjYjcxYmMvZGUzZGVvYy0xM2ExNWU4OC1jYTM2LTRmMTUtODgyNC00NGY0ZjdjODM4MzMucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.2o7QyN1MjdspHH1EYhWWIpV8_2aer0TBwtswDubtGzw
- **Galar** — https://static0.polygonimages.com/wordpress/wp-content/uploads/chorus/uploads/chorus_asset/file/19375993/Pokemon_sword_shield_galar_map_locations.jpg?q=50&fit=crop&w=750&dpr=1.5
- **Kalos** — https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Fm77o7e9nfw371.jpg
- **Unova** — https://upload.wikimedia.org/wikipedia/commons/2/2b/Unova_Map.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail_unscaled&_=20231229170134

---

## Map polish (visual)

The generated maps are readable graphs; the next visual steps need art/design
decisions:

- [x] Draw a generated terrain layer under the Town Map (blue water, green/
      brown land) from each location's biome and wild types. See `TERRAIN_COLORS`
      and `terrainColorFor` in `town-map.js`.
- [ ] Add more battle background art. There are only four base scenes
      (grassland, beach, mountain, cave) plus the biome colour grades; real
      forest/desert/swamp/volcano/tundra art would let `routeBackground` stop
      tinting a handful of images.
- [ ] A zone glyph/label polish pass once the terrain layer exists.

## Useful references when picking these up

- **Data-pipeline template:** `tools/fetch-breeding-data.cjs` — cached PokéAPI
  fetch, form ids resolved to base species, writes a `public/data/*.json`, then
  add the key to `assets/gameDataInjector.js` and re-export in
  `src/data/gameData.js`.
- **Battle hooks:** status conditions / drain live in `src/game/combat.js`
  (`resolveBattleTurn`); volatile state is threaded through `src/hooks.js` and
  the reducer's `UPDATE_VOLATILE`.
- **Save shape:** new state fields go in `initialGameState`, `context.js`
  (save + sanitising restore) and `src/types.d.ts`. Bump `SAVE_VERSION`
  (`src/data/config.js`) only for incompatible shape changes (add
  `LEGACY_SAVE_KEYS`).
- **Config constants** live in `src/data/config.js`.
- **Scenes / pausing phases:** the minigames (`mining`, `gameCorner`,
  `bugCatching`), Wonder Trade, evolution, healing and the Master Ball throw are
  all phase-driven scenes rendered by `src/components/battle-scene.js`; the
  idle loop pauses for them in `src/hooks.js`.
- **Verifying:** `npm run typecheck`, `npm run build`, `npm run validate`, and a
  headless test (mock `window.gameDataInjector.data` with the JSON files and
  `import()` the module) works well for reducer/combat logic.
- **Versioning:** add a `GAME_VERSION` bump + `CHANGELOG` entry when a batch of
  work lands (secrets stay out of the changelog by convention).
- **Commit** each logical change; never `git push`.
