# TODO

Open ideas and follow-ups. Current game version: **0.18.0**
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

1. **#16 Performance pass** — S–M · ★★ — the idle loop dispatches a lot per
   tick; look at memoisation / batching if it ever gets heavy.
2. **#46 Mobile UX fixes** — S–M · ★★★ — party drag/drop order, map pan/zoom
   controls and the cut-off bottom of the Map/Items tabs on phones.
3. **#48 Colour-accessibility pass** — S · ★★ — yellow-on-yellow move-learning
   text plus a broader contrast sweep.

### Tier 2 — High impact, worth the effort (medium–large)

4. **#24 Move data pass** — **(largely done: 0.14.0 modelled the
   remaining status/utility moves; only Heal Block, Speed/Power/Guard Swap-Split,
   the charging moves and the dead Z/Max data remain.)**
5. **#25 Battle engine pass** — **(largely done: 0.14.0 modelled the bulk of
   the ~300 abilities, the item hooks, the mid-battle form-change subsystem and
   the battle-only form species; only ally/doubles abilities, a few complex
   ones and the item nuances remain.)**
6. **#36 Zones (route chunks)** — M–L · ★★★★ — lets Alola/Galar/Paldea map as
   chunks of areas instead of a single-route-wide graph.
7. **#40 Alola / Galar / Paldea league structures** — M · ★★★½ — trials, the
   Champion Cup and any-order gyms don't fit the 8-gyms + E4 model. **(partial:
   0.13.0 shipped the data-driven model; Alola's full 11-slot trial track and
   Paldea's Titans / Team Star remain.)**
8. ~~**#11 NPC gifts & static encounters**~~ — **shipped (0.18.0).**
9. **#29 Fishing / companion minigames** — M–L · ★★★ — the rest of the
   minigame menu, now that the scene + phase pattern exists.
10. **#35 More Galar areas** — M · ★★★½ — Galar is the thinnest region map.
11. **#39 DLC regions from later games** — M–L · ★★★★ — promote Isle of Armor,
    Crown Tundra, Kitakami and the Terarium to first-class regions.
12. **#18 Better settings** — M · ★★★★ — centralise the QOL toggles and store
    settings separately from the save.
13. **#28 More region areas (caves, POIs, DLC land)** — L · ★★★★½ — real
    content; data-heavy. Pairs with #35/#36/#39.
14. ~~**#4 In-battle Mega evolution**~~ — **shipped (0.18.0).**
15. **#42 Manual battle mode** — M · ★★★★ — let the player pick moves instead
    of always auto-battling.
16. **#44 Set / Switch toggle** — S · ★★★ — choose whether a faint asks for a
    replacement or keeps the next party member in automatically.
17. **#45 Move-category icons** — S · ★★ — replace the ✴/◎/☯ glyphs with
    physical/special/status images.
18. **#47 Backpack section** — M · ★★★ — rename the League tab and host the
    Pokédex, Bank, Items and Records inside it.
19. **#43 Multi-battles (double/triple/rotation)** — M–L · ★★½ — a
    self-contained minigame that reuses the combat pipeline.

### Tier 3 — Big / low-return, defer

20. **#10 Weather & terrain leftovers** — M · ★★½ — **(partial: 0.14.0 shipped
    Weather Ball, weather-perfect accuracy and the terrain synergy abilities;
    terrain rocks and route-based field effects remain.)**
21. **#19 Online sync** — L · ★★★ — the project's first backend; needs a design
    doc and real ops for modest player value today.

---

## 4. In-battle Mega evolution

**Shipped (0.18.0):** a Mega-capable Pokemon holding the new held **Mega Stone**
transforms as the battle starts (or via the MEGA EVOLVE button in the battle
scene). It stores the forme on `playerVolatile.formKey`, so it keeps the forme's
stats, typing and ability for the rest of the battle and reverts when the battle
ends \u2014 the saved Pokemon never changes. Charizard and Mewtwo (the only
species with two Megas) take the physical X forme when Attack is higher, the
special Y forme otherwise. The stone sits alongside the existing level-100 Mega
evolutions rather than replacing them, and the idle loop auto-triggers it so
idle play benefits.

Effort: **done**.

## 10. Weather & terrain leftovers

Weather and terrain shipped together in 0.11.0.

**Shipped (0.14.0):** Weather Ball takes the weather's type (Water/Fire/Rock/
Ice) with doubled power; Thunder and Hurricane never miss in rain and Blizzard
never misses in snow/hail; and the terrain synergy abilities work — Grass Pelt
raises Defense on Grassy Terrain, and Hadron Engine (which now also sets
Electric Terrain on entry) and Quark Drive boost offence on Electric Terrain.

Still open:

- [ ] Terrain rocks (an item/ability that extends a terrain's duration), and
      route-based field effects (a route that starts sunny/raining/etc.).

Effort: **medium**.

## 11. NPC gifts & static encounters

**Shipped (0.18.0):** a curated `GIFTS` / `STATIC_ENCOUNTERS` table
(`src/game/gifts.js`) drives a new **People & Places** section in the location
panel. Gifts hand over items, money or a Pokemon (Oak's parcel, Celadon's Eevee,
Elm's Cyndaquil, the Weather Institute's Castform, Bebe's Eevee, a Nacrene
Larvesta, Korrina's Riolu, an Alola/Paldea starter, a Galar Toxel); statics start
a normal wild battle with a fixed species/level (Route 12/16 Snorlax, Route 36
Sudowoodo, Route 119 Kecleon, Route 210 Munchlax, Route 7 Snorlax). Both are
claimed once per save (`claimedGifts`); a static only counts as claimed when it
is caught, so a failed catch can be retried. Requirements are region-local
badge / champion / Pokedex gates, shown as a checklist.

Effort: **done**.

## 16. More ideas (unsorted)

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

## 24. Move data pass (mostly done)

`possible-moves.json` carries `name / type / category / power / accuracy / pp /
priority / effect`, and `src/data/move-effects.js` layers richer effects on top.

**Done (0.14.0):** healing, multi-hit, crit stages, Protect, statuses,
screens, entry hazards, Taunt/Substitute, weather setters, Haze/Clear Smog,
Weather Ball + weather accuracy, terrain synergy, Focus Energy, Aqua Ring /
Ingrain, Wish, Yawn, Topsy-Turvy, Pain Split, Safeguard, Mist, Encore, Disable,
Perish Song, Tailwind, Trick Room, Destiny Bond, Laser Focus, Lock-On / Mind
Reader, Life Dew / Jungle Healing / Lunar Blessing, Gastro Acid / Worry Seed /
Simple Beam / Role Play / Entrainment / Skill Swap, Soak / Magic Powder /
Reflect Type / Forest's Curse / Trick-or-Treat, Power / Guard / Heart Swap,
Recycle, Trick / Switcheroo / Bestow / Corrosive Gas, and Metronome / Copycat /
Mirror Move / Nature Power. Recoil was also added to the recoil moves
(Double-Edge, Brave Bird, Flare Blitz, …).

**Not done:**

- [ ] Heal Block; Speed Swap; Power Split / Guard Split.
- [ ] Ally-targeted heals (Heal Pulse, Floral Healing) and the faint-heals
      (Healing Wish, Lunar Dance).
- [ ] Move-calling that needs more context (Sleep Talk, Assist, Me First).
- [ ] Two-turn / charging moves (Solar Beam, Fly, Dig, Skull Bash, …) — only
      the recharge moves (Hyper Beam) are modelled today.
- [ ] The doubles-only moves (After You, Ally Switch, Follow Me, Helping Hand,
      Quick/Wide Guard, Rage Powder, …) — the game is singles only.
- [ ] PP is stored but unused; decide whether to implement it or drop it.
- [ ] Z-moves / G-Max moves are otherwise dead data — decide keep/drop.

Effort: **medium–large** (the effect set is now mostly done).

## 25. Battle engine pass (mostly done)

`resolveBattleTurn` (`src/game/combat.js`) is fairly complete for damage +
status + stat changes. Healing, multi-hit, Protect, hazards, accuracy/evasion
stages, the extra statuses, weather/terrain, the crit-rate pass, the
auto-battler AI and the contact abilities have shipped.

**Done (0.14.0):** most of the ~300 abilities are now modelled; the coverage
spans attacking modifiers, defensive
modifiers, stat shaping, field & side effects, ability suppression, switch-in,
contact / on-hit reactions, recovery & residual, speed / priority / accuracy,
type changing, and the held-item hooks. The mid-battle form-change subsystem
(Stance Change, Zero to Hero, Power Construct, Schooling, Imposter, Battle
Bond, Disguise, Ice Face, Shields Down, Forecast, Hunger Switch, Zen Mode,
Mimicry, Flower Gift) and the battle-only synthetic-species table
(`src/data/form-species.js`) shipped too, along with the out-of-battle Pickup /
Honey Gather / Ball Fetch. `abilityPreventsStatus` also now treats badly-poisoned
as poison (Immunity / Pastel Veil).

**Not done:**

- [ ] Ally / doubles abilities: Battery, Power Spot, Friend Guard, Healer,
      Telepathy, Aroma/Flower Veil, Costar, Commander, Hospitality, Symbiosis,
      Gulp Missile.
- [ ] A few complex singles ones: Illusion, Magic Bounce, Synchronize,
      Stakeout, Supreme Overlord, Quick Draw, Rivalry.
- [ ] Overworld-only abilities (no effect in an idle auto-battler): Illuminate,
      Run Away.
- [ ] The remaining item nuances (Choice locking, more berries, Rocky Helmet).
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

**Shipped:** Sinnoh's Underground mining, Johto's Bug Catching Contest and
Kanto's Game Corner slots all landed in 0.12.0 as full-stage, game-pausing
scenes that unlock from a location rather than the region Champion; the contest
also has a top-3 podium with prizes and now covers every Bug-type.

**Shipped (0.16.0):** Fishing and Berry Foraging are route activities, attached
by terrain (water routes / forests and gardens) rather than a fixed POI, and
every minigame now launches from the location panel while you are standing there
instead of from the League tab.

**Shipped (0.16.0):** fishing rod tiers (Old / Good / Super) gate how deep into
a route's water species a cast can reach, with a level bonus, and each better
rod is found by opening another region.

**Shipped (0.17.0):** a Companion (care decays per wild win, feed/play/rest with
a one-per-win limit, +15% EXP while content) and a Berry Garden (plant Oran /
Sitrus / Lum Berries, ripen over wild wins, harvest, and blend three into a
Poffin for +30 friendship), both in the top bar.

`src/game/minigames.js` holds `MINIGAME_LOCATIONS` (location → fixed minigame),
`MINIGAME_INFO` (title/cost/action/hint), `ROUTE_ACTIVITIES` and `RODS` plus
each game's config/reward table. Adding a fixed minigame is a scene component + a
`START_*`/`END_MINIGAME` reducer pair + a `MINIGAME_LOCATIONS` entry; a route
activity is an entry in `ROUTE_ACTIVITIES` and a terrain predicate. Covered by
`tests/minigames.test.mjs`, `tests/route-activities.test.mjs` and
`tests/rods.test.mjs`.

### 29a. Fishing minigame

**Shipped (0.16.0):** a timing-bar fishing activity that hooks a Water species
from the route's own table and starts a normal wild battle, plus a Berry
Foraging counterpart on forested routes.
**Shipped (0.16.0):** rod tiers gate the rarity of what a cast reaches, fishing
is limited to 30 curated water-rich routes (`FISHING_LOCATIONS`), and a cast only
ever hooks a Water species.
**Shipped (0.16.0):** each fishing route has an exclusive Water Pokemon that only
appears on the tiny perfect-cast zone and is removed from the route's normal
wild table (`fishingExclusiveFor`).

Nothing left here; see #29b (companion care) and #29c (berry growing) for the
remaining minigame ideas.

### 29b. Companion / tamagotchi care

**Shipped (0.17.0):** pin a party Pokémon and keep it fed, happy and rested;
care decays per wild win, one action per win, and a content companion gives
+15% EXP (see `src/game/companion.js`). Still open:

- [ ] An animated buddy panel / petting scene using the existing sprite helpers
      (it is a static modal today).

### 29c. Other minigame ideas

- [x] **Berry growing** — plant / pick berries over a battle count
      (`src/game/garden.js`).
- [x] **Berry blending** — blend three berries into a Poffin (friendship +30).

Both shipped in 0.17.0; nothing left here.

Relevant code: the real-time loop and battle-count ticks (`src/hooks.js`
`useGameLoop`, `tickBattleCounters` in `src/game/progression.js`), the reducer's
`daycare` / `activeEffects` slices (`src/game/reducer.js`), the Daycare UI
(`src/components/daycare-modal.js`) and the existing minigame scenes.

Effort: **small per minigame, medium–large as a feature**.

## 30. Caught / event QOL indicators

The notification queue shipped in 0.9.0.

**Shipped (0.13.0):** the caught indicator is now a Pokéball badge that tells
**seen** (grey ball) from **caught** (red ball) from **shiny caught** (gold
ball). It replaces the old `✓` on the enemy name row (`enemy-info-box.js`,
via the shared `dex-ball-badge.js` and `getDexStatus` in `src/game/catching.js`)
and the shiny star on the encounter list / Pokédex tiles, and stays hidden for
trainer battles.

Still open:

- [ ] Flag the battle **sprite** too (a small marker), if it adds value over the
      name-row ball.
- [ ] Decide whether raids should show the badge (they currently do, since the
      raid boss is a catch reward).

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

**Partial (0.13.0):** the Wild Area is now a zone (#36) with three sub-areas,
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

**Partial (0.13.0):** the model shipped. Galar's Wild Area, the Galar/Paldea
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

**Shipped (0.13.0):** each region's island is now split into two tiers in
`regions.json`:

- `raidPool` — every legendary/mythical with no other source; these are the
  raid bosses.
- `raidOrdinaryPool` — the ordinary finals (fossils, regional forms, one-off
  lines) with no other source, capped at 15.

`raidLegendaryPoolFor` feeds `pickRaidLegendary`, so a raid always headlines a
legendary (an ordinary final can no longer turn up as the "legendary" boss), and
`resolveRoamer` rolls legendaries only. `raidPoolFor` still returns the island's
full table (legendaries first) for the UI and the wild bucket, so the ordinary
set stays obtainable by idling on the island; levels already tier the two
(legendaries fight at 75, ordinary finals at 70). `validate-data.cjs` now checks
the split (all legendaries in `raidPool`, none in `raidOrdinaryPool`, no overlap,
ordinary ≤ 15), and the earlier regions were already within the cap, so nothing
was trimmed and nothing is orphaned.

Still open:

- [ ] Weight / level-gate the legendary pick by badges or prestige instead of a
      uniform "unseen first" pick.
- [ ] If a smaller Unova (13 ordinary) pool is wanted, give a few of its finals a
      real route or evolution source (part of #28/#35/#39).

Relevant code: `tools/generate-regions.cjs` (`raidCandidates`,
`raidPoolSpecies`, `staysInRaidPool`, `FORM_RAID_REGION`, `paldeaExtrasFor`, the
raid scan), `public/data/regions.json` (`raidPool` / `raidOrdinaryPool`),
`raidPoolFor` / `raidLegendaryPoolFor` (`src/data/gameData.js`),
`pickRaidLegendary` / `resolveRoamer` (`src/game/progression.js`), the raid UI
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

**Partial (0.13.0):** Galar's DLC shipped the first (smaller) way — Isle of
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

**Partial fix (0.12.0):** Paldea's Elite Four now uses its real roster and
types (Rika, Poppy, Larry, Hassel) — the third/fourth slots were previously
Hassel and Academy director Clavell.

**Shipped (0.13.0):** the league is now **data-driven per region** via a
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

## 41. Region-filler minigames (ideas)

Every region now has *something* (fishing / foraging / rock smash / headbutt /
diving, plus the fixed Safari / Game Corner / Bug Contest / Underground / Battle
Tower), but Unova, Kalos, Alola, Galar and Paldea have no **signature** minigame
of their own. These are the candidate ideas — all mechanically distinct from the
sets that already exist, roughly one per region. Add one the same way as the
others: a scene component, a `START_*`/`END_MINIGAME` reducer pair, a
`MINIGAME_LOCATIONS` + `MINIGAME_START_ACTION` + `MINIGAME_INFO` entry, the phase
added to the pause/busy lists, and tests.

**Shipped (0.16.0):** the Academy Quiz (Paldea), Voltorb Flip (Unova), the
Grand Auction House (Kalos), the Pokemon Contest (Hoenn), the Pokeathlon
(Johto), Poke Radar chaining (Sinnoh), the Battle Royal (Alola) and Dynamax
Adventures (Galar). Every region now has its signature minigame.

**Extra minigames (0.16.0):** Hoenn's **Lights Out** (Mauville City), Galar's
**Curry Cooking** (Motostoke), Unova's **Pokestar Studios** (Virbank City),
Johto's **Pokemon Puzzle League** (Goldenrod City), Hoenn's **Pokemon Memory**
(Slateport City) and Kanto's **Whack-a-Diglett** (Vermilion City) were added on
top of the one-per-region set.

**More minigames (0.18.0):** Unova's **Pokemon Musical** (Castelia City, a
four-lane rhythm game), Paldea's **Picnic** (Cortondo, stack ingredients on the
sandwich) and Kalos's **Poke Ball Factory** (Laverre City, rotate the conveyor
tiles to link the inlet and outlet) were added, so every region now has at least
two signature minigames.

- [x] **Poké Pelago (Alola)** — **shipped (0.17.0):** a new Alola island hub
      (off Hau'oli City) hosting companion care (Pat/Brush/Wash +
      Cleanliness), the Berry Garden, and three passive islands (Bean Farm,
      Training Isle, Isle Caves) staffed with *boxed* Pokemon.
- [x] **Voltorb Flip (Unova)** — **shipped (0.16.0):** a 5×5 deduction board
      at Nimbasa City. Every row and column advertises its Voltorb count and
      point total; flip the 2s and 3s to bank coins, clear a board to climb a
      level, and a single Voltorb ends the run.
- [x] **Poké Radar chaining (Sinnoh)** — **shipped (0.16.0):** Sandgem Town's
      memory chain. Watch the grass, repeat the sequence, and bank a chain that
      boosts a route's rarest species' shiny odds.
- [x] **Dynamax Adventures (Galar)** — **shipped (0.16.0):** the Max Lair at
      Hammerlocke. Pick a path through three encounters, then beat a Galar raid
      legendary to catch it. Uses the real combat pipeline.
- [x] **Auction House (Kalos)** — **shipped (0.16.0):** the Grand Auction House at
      Lumiose City. Bid against hidden rival budgets for a lot of items; the
      appraiser gives a value range, rivals drop out at their own ceilings, and
      winning the hammer means paying whatever you bid.
- [x] **Pokémon Contest (Hoenn)** — **shipped (0.16.0):** Lilycove City's stage.
      Pick a move each round to appeal to the theme, chain the same type for a
      combo and avoid repeats, then rank against the rivals.
- [x] **Pokéathlon (Johto)** — **shipped (0.16.0):** Ecruteak City's three-event
      meet (Sprint mash, Hurdle timing, Target throw) scored together for a
      medal.
- [x] **Battle Royal (Alola)** — **shipped (0.16.0):** Heahea City's endless
      wave gauntlet for your party, resolved with the real combat pipeline.
      Each win heals a little and the reward scales with depth.

Relevant code: `src/game/minigames/` (one module per game), `registry.js`
(`MINIGAME_LOCATIONS` / `MINIGAME_INFO`), `src/components/*-scene.js`,
`src/game/reducer/minigames.js`, and the existing scenes to mirror.

Effort: **small–medium each**, **large as a full set** (one region at a time).

## 42. Manual battle mode

The game is an idle auto-battler: `resolveBattleTurn` (`src/game/combat/turn.js`)
resolves each turn with the AI (`src/game/combat/ai.js`) and the loop never waits
for input. There is no way to choose a move.

Add a manual mode so the player can actually play a battle, at minimum while it
is open, without abandoning the idle loop for normal play.

- [ ] Decide the scope: a global auto/manual toggle, or manual only for
      trainer / gym / Elite Four / Champion / raid battles (where the choices
      matter) with wild battles staying automatic.
- [ ] Wire the battle scene to pause the tick while awaiting input and surface
      the existing move buttons (they are rendered today but read-only).
- [ ] Handle switching (the move picker needs a switch option) and the
      faint-replacement prompt (see #44).
- [ ] Decide what happens if the player never acts (idle timeout back to auto,
      or a visible prompt), so a forgotten manual battle can't stall the game
      forever.
- [ ] Persist the preference in settings (#18), not the save.

Likely touch points: `src/game/use-game-loop.js` (the tick state machine),
`src/game/combat/turn.js` / `ai.js`, `src/game/reducer/battle.js`,
`src/components/battle-scene.js`, and `src/data/ui.js` (settings toggles).

Effort: **medium** (the combat engine already exposes per-turn state; the work
is the interactive phase and the reducer round-trip).

## 43. Multi-battles (double / triple / rotation) as a minigame

The engine is **singles only** — the move data already flags the doubles-only
moves (Follow Me, Helping Hand, Quick/Wide Guard, …) as unimplemented (see #24),
and the ally/doubles abilities are on the #25 list. Building full multi-battle
support into the main loop is a large change with little idle value.

Instead, make multi-battles a **self-contained minigame** (a scene + a
`START_*`/`END_MINIGAME` reducer pair + a `MINIGAME_LOCATIONS` entry, per the
#29 pattern), so the main game stays singles and the extra modes stay fun and
contained.

- [ ] Pick the first mode: **double battle** (2v2) is the most legible and the
      most reusable; triple and rotation battles are stretch goals.
- [ ] Decide how much of the combat engine is shared: the damage/status math is
      reusable, but target selection, spread moves and per-slot speed order are
      new.
- [ ] Minimal doubles rules: one target chosen per move, spread moves hit both,
      and the existing ally-targeted moves (#24) can finally do something.
- [ ] Give it a home location per region (a Battle Maison / Battle Tower-style
      node) and a reward table, mirroring the Battle Royal (#41).
- [ ] Consider a "3-way / 4-way" free-for-all variant as a separate mode if the
      2v2 version lands well.

Likely touch points: `src/game/combat/` (a parallel multi-target turn
resolver), `src/components/*-scene.js`, `src/game/reducer/minigames.js`, and
`src/game/minigames/registry.js`.

Effort: **medium–large** (the shared math helps, but target/order handling is
genuinely new).

## 44. Toggleable Set / Switch battle style

The mainline games let the player choose **Set** (the next party member is sent
out without being asked) or **Switch** (the game prompts after a faint). An idle
auto-battler currently always behaves like Set, silently pulling the next
healthy party member in.

- [ ] Add a `battleStyle` setting (`'set'` | `'switch'`) under gameplay (#18).
- [ ] In Switch mode, when the active Pokemon faints, pause and prompt the
      player to choose a replacement from the healthy party.
- [ ] Ties into manual mode (#42) and the auto-switch behaviour — make sure the
      two don't fight (manual mode should always allow a choice; auto-switch
      health rules still apply to *when* the AI switches, not the faint prompt).
- [ ] Default to Set so idle play is unchanged for existing saves.

Likely touch points: `src/game/reducer/battle.js` (the faint/replacement path),
`src/components/battle-scene.js` (the prompt), `src/data/ui.js` and
`src/hooks.js` (settings plumbing).

Effort: **small** (the replacement party selection already exists for manual
switching; this is a prompt + preference).

## 45. Physical / special / status as images

Move categories are rendered from three Unicode glyphs in
`src/data/moves.js` (`moveCategoryIcons`: `✴` physical, `◎` special, `☯`
status), drawn in `battle-scene.js`, `move-manager-panel.js` and `stats-panel.js`.
The glyphs render inconsistently across platforms and fonts and read poorly at
small sizes.

- [ ] Add small category icons (physical/special/status) as image assets, e.g.
      `public/sprites/moves/` or an inline SVG set, and export a helper that
      returns the URL (mirroring `getPokemonSpriteUrl`).
- [ ] Replace every `moveCategoryIcons[...]` call site with the image (an
      `<img>` or a CSS background on the existing badge element).
- [ ] Keep `moveCategoryIcons` as a text fallback if the image fails to load.
- [ ] Check the move list, the battle move buttons and the stats panel at both
      desktop and mobile sizes.

Likely touch points: `src/data/moves.js`, `src/components/battle-scene.js`,
`move-manager-panel.js`, `stats-panel.js`, and a new asset directory under
`public/sprites/`.

Effort: **small** (three assets plus call-site swaps), once the art exists.

## 46. Mobile UX fixes

Three concrete mobile issues found while playing on a phone:

- [x] **Party drag/drop order doesn't work on touch.** *Done: the mobile party
      panel now shows compact up/down reorder buttons (desktop keeps drag and
      drop). The box panel still has no touch reorder.*
- [x] **Map pan/zoom controls don't work on touch.** *Done: pan already used
      pointer events; two-finger pinch-to-zoom was added and the on-screen
      +/−/F/C buttons are now touch-sized on small screens.*
- [x] **The bottom of the Map and Items tabs is cut off.** *Done: the `100dvh`
      override was declared before the `100vh` fallback, so `100vh` always won
      and the bottom sat under the mobile browser chrome (hiding the map's
      bottom-corner zoom buttons too). The order is fixed.*

Likely touch points: `src/components/party-panel.js` / `box-panel.js`
(reorder), `src/components/town-map.js` (pan/zoom input), `mobile-tabs.js` and
`assets/style.css` (viewport/scroll), plus `.party-*` / `.map-*` rules.

Effort: **small–medium** (three separate, largely CSS/event fixes).

## 47. Rename the League tab to Backpack

The side panel has two tabs today (`SIDE_PANEL_TABS` in `src/data/ui.js`):
**Location** and **League**. The League tab mixes the gym progress, records,
Pokédex, bank and items, which the player reads as unrelated things bundled
under a misleading name.

- [ ] Keep **Location** as its own section (the current location, wild
      encounters, activities, People & Places).
- [ ] Rename **League** to **Backpack** and make it the home for the
      player-owned data: the current **Pokédex**, **Bank** (money), **Items**
      (bag) and **Records** tabs, with the gym/league progress moved into the
      Location section or a dedicated progression view.
- [ ] Decide the section split: does League progress live under Location, or
      get its own third section? The gym panel is currently the bulk of the
      League tab.
- [ ] Update the mobile tab set (`MOBILE_TABS`) to match where it makes sense.
- [ ] Re-tune the panel copy/labels and any deep links that reference the old
      tab id.

Likely touch points: `src/data/ui.js` (`SIDE_PANEL_TABS` / `MOBILE_TABS`),
`src/components/game-layout.js`, `mobile-tabs.js`, `gym-panel.js`,
`league-location-panel.js`, `records-modal.js`, `bag-panel.js` and the Pokédex /
bank panels.

Effort: **medium** (mostly restructuring the panel; the tab bodies already
exist).

## 48. Colour-accessibility pass

There is currently **yellow text on a yellow background** when learning a new
move (the move-manager / level-up flow), which is close to unreadable. This is
one instance of a broader problem: several theme colours (the parchment/gold
palette in `assets/style.css`) are used for both text and surfaces without
checking contrast.

- [x] Fix the move-learning text first (give the text a darker ink colour or
      the panel a non-yellow surface). *(Done: the tutor-cost line and the
      section/species labels in the move manager now use a dark `--ink`, and
      the light type colours (electric/ground/ice/steel) get dark text again in
      the move list — the component `color:#fff` rules were overriding the
      `.type-bg-*` ones.)*
- [ ] Sweep the UI for other low-contrast pairs and check body text, badges,
      status tags and buttons at WCAG AA for their size. White on the lighter
      type colours (normal, rock, bug, fairy, grass, flying) is still below AA
      for the small move text; decide whether to darken those too.
- [ ] Consider a slightly darker text token or a `--text-on-gold` variable
      rather than fixing colours case by case. *(Started: `--ink` added for
      text on parchment — the stats-panel HP label uses it now.)*
- [ ] Spot-check the shiny/gold, warning and error states, and the battle
      log / floating damage numbers.

Likely touch points: `assets/style.css` (the `:root` custom properties and the
move-manager / learn-move rules), `src/components/move-manager-panel.js`, and
any component with inline colours.

Effort: **small** (mostly CSS; the sweep is the bulk of the work).

---

## Map cleanup reference maps

All eight non-Kanto regions have hand-measured `REGION_MAP_LAYOUTS` overrides.
`tools/map-compare/overlay-region-maps.py` draws the game's nodes on top of each
reference image (`tools/map-compare/refs/`, fetched by `fetch-refs.cjs`) to
check them. As of 0.12.0 the Sinnoh, Galar, Kalos and Unova nodes all land on
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
