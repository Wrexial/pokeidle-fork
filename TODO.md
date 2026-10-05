# TODO

Open ideas and follow-ups. Current game version: **0.23.0**
(`src/data/changelog.js`). Finished work lives in the changelog, not here — this
file only tracks what is **still open**. See `AGENTS.md` for architecture,
commands and data conventions.

Section numbers are stable references (`#24`, `#36`, …) and are deliberately not
renumbered, so the gaps below are items that shipped.

---

## Priority order (effort vs. gain)

**Effort**: S (small) < S–M < M < M–L < L. **Gain** is the player-facing value
(★ = nice to have, ★★★★★ = core missing feature).

### Tier 1 — High impact, worth the effort

1. **#28 More region areas (caves, POIs)** — L · ★★★★½ — real content;
   data-heavy. Started: the POI marker model shipped with the Day-Care as the
   first POI (28c), and the DLC areas are now first-class regions (#39);
   ordinary caves/forests (28b) and more POIs remain. Pairs with #36.
2. **#24 Move data pass** — M · ★★★ — ally/faint heals, context move-calling,
   the doubles-only moves, and decisions on unused PP / dead Z-Max data.
3. **#25 Battle engine pass** — M–L · ★★★ — ally/doubles abilities, a few
   complex singles ones, item nuances and battle polish (animations / damage
   numbers).
4. **#36 Zones (route chunks)** — M–L · ★★★★ — the model is in and zone hubs
   list each open sub-area's wild table inline; more sub-areas and a distinct
   zone glyph remain.
5. **#18 Better settings** — M · ★★★ — sprite-style options, account controls
   (blocked on #19) and finishing the Gameplay section.
6. **#43 Multi-battles (double / triple / rotation) as a minigame** — M–L ·
   ★★½ — a self-contained minigame that reuses the combat pipeline.

### Tier 2 — Big / low-return, defer

7. **#56 Multi-effect move pass (residual)** — S · ★★ — moves that roll one
   status out of several (Tri Attack, Dire Claw) or carry a third effect,
   which the single `secondary` slot cannot express.
8. **#19 Online sync** — L · ★★★ — the project's first backend; needs a design
   doc and real ops for modest player value today.

---

## 18. Better settings

`settings-modal.js` exposes gameplay, notification, display and audio toggles,
and the preferences live outside the save (`pokemon-idle-settings`,
`src/game/settings.js`) so they survive a save reset and are shared across slots.

Still open:

- [ ] **Display**: more cosmetic options beyond the sprite style
      (animated / static) that shipped.
- [ ] **Account**: sign in / sync controls — blocked on #19.
- [ ] Gameplay still isn't a complete home: the default catch rule lives in
      the Catch Settings modal, and auto-heal is not modelled yet. (Auto-switch
      and auto-travel already exist as the Battle Style and Auto-Proceed/
      Auto-Travel settings.)

Effort: **medium** (mostly UI plus a small settings slice).

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

## 24. Move data pass (mostly done)

`possible-moves.json` carries `name / type / category / power / accuracy / pp /
priority / effect`, and `src/data/move-effects.js` layers richer effects on top.
Healing, multi-hit, crit stages, Protect, statuses, screens, entry hazards,
Taunt/Substitute, weather setters, weather accuracy, terrain synergy, phazing,
swaps and the two-turn/charging moves are all modelled (0.14.0 + 0.21.0).

Not done:

- [ ] Move-calling that needs more context beyond Sleep Talk: Assist (a
      random move from the party) and Me First (steal the foe’s move).
      (Heal Pulse, Floral Healing, Snore and the Healing Wish / Lunar Dance
      faint-heals shipped; see the changelog.)
- [ ] The doubles-only moves (After You, Ally Switch, Follow Me, Helping Hand,
      Quick/Wide Guard, Rage Powder, …) — the game is singles only.
- [ ] PP is stored but unused; decide whether to implement it or drop it.
- [ ] Z-moves / G-Max moves are otherwise dead data — decide keep/drop.

Effort: **medium–large** (the effect set is now mostly done).

## 25. Battle engine pass (mostly done)

`resolveBattleTurn` (`src/game/combat.js`) is fairly complete for damage +
status + stat changes. Healing, multi-hit, Protect, hazards, accuracy/evasion
stages, the extra statuses, weather/terrain, the crit-rate pass, the
auto-battler AI, the contact abilities, the mid-battle form-change subsystem and
the battle-only synthetic-species table all shipped (0.14.0).

Not done:

- [ ] Ally / doubles abilities: Battery, Power Spot, Friend Guard, Healer,
      Telepathy, Aroma/Flower Veil, Costar, Commander, Hospitality, Symbiosis,
      Gulp Missile.
- [ ] Illusion (deferred: its disguise is cosmetic plus an AI read, which an
      idle auto-battler barely shows).
      (Magic Bounce, Synchronize, Quick Draw, Rivalry, Stakeout and Supreme
      Overlord shipped; see the changelog.)
- [ ] Overworld-only abilities (no effect in an idle auto-battler): Illuminate,
      Run Away.
- [ ] The remaining item nuances: more berries (the pinch berries beyond
      Sitrus/Lum) and Rocky Helmet (blocked on a bag sprite). Choice locking
      shipped.
- [ ] Battle polish: move animations / damage numbers / hit feedback
      (also flagged under #42's shipped manual battle mode).

*(Switching on a bad matchup is intentionally discarded: an auto-switching
opponent is frustrating to play against.)*

Effort: **medium–large** (do it in slices).

## 28. More region areas (DLC, caves, POIs)

The maps are built from PokéAPI/Bulbapedia **towns + numbered routes** only
(`tools/scrape-region-maps.cjs`), then `tools/generate-regions.cjs` turns them
into 21–52 locations per region. That leaves three gaps:

### 28a. DLC / expansion areas

**Shipped:** the Galar (Isle of Armor, Crown Tundra) and Paldea (Kitakami, the
Terarium / Blueberry Academy) DLC areas are now **first-class regions** (#39):
they have their own Town Map tab, map, level band and legendary Raid Island,
and open once their parent region's Champion is beaten. `tools/apply-dlc-regions.cjs`
lifts them out of the parent region's `ZONES` (which the generator still
creates) so a regeneration can re-run it.

Still open:

- [ ] Optional earlier post-games: Kanto's Sevii Islands, Unova's Black/White 2
      areas.

### 28b. More ordinary areas

The scraper only keeps towns and routes, so caves, forests, tunnels, ruins,
towers, lakes/seas and safari zones are absent unless hand-added. The model is
the shared table `tools/lib/ordinary-areas.cjs`, consumed by both
`generate-regions.cjs` (merged into `POST_AREAS`) and the idempotent
`tools/apply-ordinary-areas.cjs` data pass, which wires each area between its
connect locations with a curated species list, a neighbour-averaged level band
and a derived biome. Seventy-six landmark areas have shipped across eight
regions (caves, forests, ruins, towers, lakes and the Safari Zones, from Ilex
Forest to Gracia Stones). Battle gates on a zone-hub connect resolve to the
hub's first sub-area, since a zone hub never spawns wilds.

Still open:

- [ ] Grow the table with more areas — Johto's Whirl Islands side rooms
      (which need the existing node split into sub-areas) and any further
      Glaseado side caves.
      (Trophy Garden, Ramanas Park, White Forest, the Chamber of Emptiness,
      the Kalos Power Plant and Dalizapa Passage shipped; Paldea's Zero Gate
      already existed as a location.)
- [ ] Galar's Wild Area sub-areas (Stony Wilderness, Dusty Bowl, Lake of
      Outrage, ...) belong inside the Wild Area zone, not as standalone routes
      — see #36.
- [ ] Consider surfacing a real terrain `areaType` on the map node / battle
      background too. The location panel already labels caves, forests, sea
      routes, mountains, deserts, volcanic fields, tundra and ruins from the
      committed `biome` (`areaInfoFor` in `src/data/ui.js`), but the battle
      background still comes from the `ROUTE_BACKGROUND_RULES` / dominant-type
      heuristic.

### 28c. Points of interest (POIs)

**Shipped (0.21.0):** the model is the lightweight-marker one — a service POI is
a flavour / utility stop overlaid on an existing location, held in
`src/game/services.js` (`SERVICE_POIS` + `servicePoisFor`). `map-node.js` draws
the markers beside the minigame badge and adds their labels to the node tooltip,
and `location-panel.js` shows a **Services** tag row. The first POI is the
**Day-Care** on every region's breeding route.

Still open:

- [ ] Add more POIs beyond the Day-Care, Berry Garden and Battle Tower that
      shipped: a café / mart, a raid den and a legendary shrine, each with a
      real service behind it (a Move Tutor is global UI, so it has no single
      location to mark).

Relevant code: `tools/scrape-region-maps.cjs` (`MANUAL_BRIDGES`),
`tools/generate-regions.cjs` (`EXTRA_MAP_AREAS`, `levelRoutes`,
`ROUTE_BACKGROUND_RULES`, raid pools), `public/data/map-data/*.json`,
`src/game/services.js`, and the map UI (`src/components/map-node.js`,
`town-map.js`, `location-panel.js`).

Effort: **large** (data-heavy; 28a/28b mostly data, 28c an ongoing small
feature).

## 36. Zones — route-like chunks of areas

The map is a graph of single nodes joined pair-wise. The zone model shipped in
0.13.0: `type: 'zone'` nodes group sub-areas that are hidden routes with their
own encounter buckets, and existing routes can be grouped too (`GROUP_ZONES` —
Alola's islands, Paldea's provinces). Galar's Wild Area is a zone; the Galar
and Paldea DLC started as zones and are now their own regions (#39).

Still open:

- [ ] More sub-areas (pairs with #28a/#28b). Galar's Wild Area (11 habitats),
      the four DLC zones (Isle of Armor 9, Crown Tundra 10, Kitakami 9,
      Terarium 7) and Alola's islands (Melemele 8, Akala 9, Ula'ula 11, Poni 6)
      are filled out via `tools/lib/zone-areas.cjs` + `apply-zone-areas.cjs`,
      and sub-area wild tables are behind a Show/Hide toggle on the hub.
- [ ] Give each zone / area its own zoomed-in map view with a back button — see
      #60.

Effort: **medium–large** (a small data-model change plus map/encounter UI).

## 43. Multi-battles (double / triple / rotation) as a minigame

**Shipped (doubles):** a 2v2 double battle at Kalos's Battle Maison (the
`doubles` minigame). Two of the party face two foes; every surviving battler
picks a target and a move, the actions resolve in priority then speed order,
spread moves hit both foes, and a fainted ally is replaced from the bench
until one side runs out. It reuses the singles engine one action at a time
(`resolveBattleTurn` with the defender skipping and `skipEndOfTurn`, then one
`applyEndOfTurn` pass per round), so it shares all the damage/status/ability
math without a parallel resolver.

Still open:

- [ ] Triple and rotation battles.
- [ ] A 3-way / 4-way free-for-all variant (the Battle Royal is the closest
      thing today).
- [ ] A doubles home in more regions (currently only Kalos's Battle Maison).
- [ ] Ally-targeted moves that heal the *partner* rather than the user
      (`resolveBattleTurn` still treats them as self-heals in doubles).
- [ ] Doubles-only moves (Follow Me, Helping Hand, Quick/Wide Guard) and the
      ally/doubles abilities (#25) still do nothing.

Relevant code: `src/game/minigames/doubles.js`,
`src/components/doubles-scene.js`, `src/game/reducer/minigames.js`, and
`src/game/minigames/registry.js`.
## 56. Multi-effect move pass (mostly done)

Shipped (0.23.0): the move data now supports a primary effect plus one
`secondary` (a status or stat change), so recoil/drain/recharge moves no longer
lose their added effect; the recharge flag is back on the ten recharge moves;
a batch of missing stat-drop/status/self-buff secondaries was filled in; the
elemental fangs carry both their status and flinch; Fake Out is first-turn-only;
and `public/reference.html` is the live checklist of every move's implemented
effects.

Still open (edge cases):

- [ ] Moves that carry a third effect (a primary effect plus two riders), which
      the single `secondary` slot still cannot express.
- [ ] Retaliate (needs a fainted ally’s last-turn state) and the multi-turn
      Round / Echoed Voice (consecutive-use power).
      (Terrain-boosted and turn-order moves, Tri Attack / Dire Claw and the
      status-condition conditionals all shipped; see the changelog.)

Relevant code: `src/data/move-effects.js`, `src/game/combat/turn.js`,
`src/game/move-info.js`, and `public/reference.html` (regenerate with
`node tools/generate-reference.cjs`).

Effort: **small** (the remaining bits are one-offs).

## Map cleanup reference maps

All eight non-Kanto regions have hand-measured `REGION_MAP_LAYOUTS` overrides.
`tools/map-compare/overlay-region-maps.py` draws the game's nodes on top of each
reference image (`tools/map-compare/refs/`, fetched by `fetch-refs.cjs`) to
check them. As of 0.12.0 the Sinnoh, Galar, Kalos and Unova nodes all land on
their matching reference places, so there is no outstanding coordinate work for
these four — the remaining Galar gap was the missing areas, now covered by the
Wild Area/DLC zones (see #28/#36). Re-run the overlay after moving or adding
nodes.

Reference images kept for future checks:

- **Sinnoh** — https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e3b63315-f949-4899-bfec-5e53edcb71bc/de3deoc-13a15e88-ca36-4f15-8824-44f4f7c83833.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9lM2I2MzMxNS1mOTQ5LTQ4OTktYmZlYy01ZTUzZWRjYjcxYmMvZGUzZGVvYy0xM2ExNWU4OC1jYTM2LTRmMTUtODgyNC00NGY0ZjdjODM4MzMucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.2o7QyN1MjdspHH1EYhWWIpV8_2aer0TBwtswDubtGzw
- **Galar** — https://static0.polygonimages.com/wordpress/wp-content/uploads/chorus/uploads/chorus_asset/file/19375993/Pokemon_sword_shield_galar_map_locations.jpg?q=50&fit=crop&w=750&dpr=1.5
- **Kalos** — https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Fm77o7e9nfw371.jpg
- **Unova** — https://upload.wikimedia.org/wikipedia/commons/2/2b/Unova_Map.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail_unscaled&_=20231229170134

---

## Map polish (visual)

The generated maps are readable graphs. The zone marker now shows its sub-area
count, town and area/zone labels stay on screen, and a legend explains the node
types, so what is left here is **art**:

- [ ] Add more battle background art. There are only four base scenes
      (grassland, beach, mountain, cave) plus the biome colour grades; real
      forest/desert/swamp/volcano/tundra art would let `routeBackground` stop
      tinting a handful of images.

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
- **Versioning:** fold a change into the top `CHANGELOG` entry; cut a new
  `GAME_VERSION` only at a milestone (secrets stay out of the changelog by
  convention).
- **Commit** each logical change; never `git push`.
