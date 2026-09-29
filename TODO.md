# TODO

Open ideas and follow-ups. Current game version: **0.21.0**
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
2. **#55 Poke Radar: a guaranteed shiny every 5 levels** — S · ★★★ — shinies on
   a schedule (5, 10, 15, ...) instead of only nudged odds.
3. **#53 IV increment items** — S–M · ★★ — Bottle-Cap-style items that raise
   IVs, handed out as rewards somewhere.
### Tier 2 — High impact, worth the effort (medium–large)

4. **#28 More region areas (caves, POIs, DLC land)** — L · ★★★★½ — real
   content; data-heavy. Started: the POI marker model shipped with the Day-Care
   as the first POI (28c), and the DLC areas are in as zones (28a); ordinary
   caves/forests (28b) and more POIs remain. Pairs with #36/#39.
5. **#24 Move data pass** — M · ★★★ — ally/faint heals, context move-calling,
   the doubles-only moves, and decisions on unused PP / dead Z-Max data.
6. **#56 Multi-effect move pass** — M · ★★★ — audit moves with more than one
    effect (Hyper Beam / Giga Impact recharge, Bite / flinch moves, stat-drop
    secondaries, ...) and implement the missing half-effects; quite a few only
    do part of what they should.
7. **#25 Battle engine pass** — M–L · ★★★ — ally/doubles abilities, a few
    complex singles ones, item nuances and battle polish (animations / damage
    numbers).
8. **#36 Zones (route chunks)** — M–L · ★★★★ — the model is in; more
    sub-areas, a distinct zone glyph and inline per-sub-area encounter grids.
9. **#40 Alola / Galar / Paldea league structures** — M · ★★★½ — the
    data-driven model is in; Alola's full trial track, Galar's post-game
    tournament and Paldea's Titans / Team Star remain.
10. **#39 DLC regions from later games** — M–L · ★★★★ — promote Isle of Armor,
    Crown Tundra, Kitakami and the Terarium to first-class regions.
11. **#54 Improve Dynamax Adventures and Battle Royal** — M · ★★½ — both are
    minimal loops today; make them feel like real modes with real rewards.
12. **#29 Companion minigame polish** — S · ★★ — an animated buddy panel /
    petting scene (the last open minigame idea).
13. **#18 Better settings** — M · ★★★ — sprite-style options, account controls
    (blocked on #19) and finishing the Gameplay section.
14. **#38 Clean up the Raid Islands** — M · ★★½ — weight / level-gate the
    legendary pick and (optionally) shrink Unova's ordinary pool.
15. **#43 Multi-battles (double / triple / rotation) as a minigame** — M–L ·
    ★★½ — a self-contained minigame that reuses the combat pipeline.
16. **#60 Areas should have their own zoomed-in map** — M · ★★ — zones and
    large areas list their sub-areas in the panel only; give them a focused
    map view entered from the Town Map, with a back button to exit.
17. **#61 Former raid gifts onto real routes** — M · ★★ — the ordinary Raid
    Island finals became one-off refuge statics on each region's last route;
    place them on routes that suit them as part of the encounter table.
18. **#65 Use minigames as unlock gates** — M · ★★ — let a route require
    clearing a minigame (or hitting a score) instead of only battles / badges /
    catches, so the minigames feed progression.
19. **#66 Ruins of Alph should award an Unown (and all 28 forms)** — M · ★★ —
    the sliding puzzle never gives an Unown, and only one Unown form exists;
    award one and add the full letter / punctuation set.
20. **#67 Baby Pokemon from breeding, not gifts** — M · ★★ — the Daycare can
    already hatch babies from their evolved forms; stop handing the babies out
    as gift/static rewards and give their evolved forms a real source.
21. **#68 Trainer teams should use all level-appropriate Pokemon** — M · ★★ —
    the strong type bias and narrow pools mean the same few species repeat; let
    trainers field every level-appropriate Pokemon so the Pokedex "seen" fills
    in.
22. **#70 Day/night cycle on a 60-minute clock** — M · ★★ — a fixed
    real-time cycle (full day = 60 min) replacing the wall-clock night flag,
    with a visual phase and time-gated effects.
### Tier 3 — Big / low-return, defer

23. **#10 Weather & terrain leftovers** — M · ★★½ — terrain rocks and
    route-based field effects.
24. **#19 Online sync** — L · ★★★ — the project's first backend; needs a design
    doc and real ops for modest player value today.

---

## 10. Weather & terrain leftovers

Weather and terrain shipped in 0.11.0; Weather Ball, weather-perfect accuracy
and the terrain synergy abilities shipped in 0.14.0.

Still open:

- [ ] Terrain rocks (an item/ability that extends a terrain's duration), and
      route-based field effects (a route that starts sunny/raining/etc.).
- [ ] A route-based or global day/night field — see #70.

Effort: **medium**.

## 16. Performance pass

- [ ] The idle loop dispatches a lot per tick; look at memoisation / batching
      if it ever gets heavy.

## 18. Better settings

`settings-modal.js` exposes gameplay, notification, display and audio toggles,
and the preferences live outside the save (`pokemon-idle-settings`,
`src/game/settings.js`) so they survive a save reset and are shared across slots.

Still open:

- [ ] **Display**: sprite style and other cosmetic options (no sprite-style
      feature exists yet).
- [ ] **Account**: sign in / sync controls — blocked on #19.
- [ ] Gameplay still isn't a complete home: the default catch rule lives in
      the Catch Settings modal, and auto-heal / auto-switch / auto-travel are
      not modelled yet.

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

- [ ] Ally-targeted heals (Heal Pulse, Floral Healing) and the faint-heals
      (Healing Wish, Lunar Dance).
- [ ] Move-calling that needs more context (Sleep Talk, Assist, Me First).
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
- [ ] A few complex singles ones: Illusion, Magic Bounce, Synchronize,
      Stakeout, Supreme Overlord, Quick Draw, Rivalry.
- [ ] Overworld-only abilities (no effect in an idle auto-battler): Illuminate,
      Run Away.
- [ ] The remaining item nuances (Choice locking, more berries, Rocky Helmet).
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

**Shipped (0.13.0):** the Galar (Isle of Armor, Crown Tundra) and Paldea
(Kitakami, the Terarium / Blueberry Academy) DLC areas are in as post-game
zones inside their parent region, gated on `championDefeated`. Promoting them to
first-class regions is #39.

Still open:

- [ ] Optional earlier post-games: Kanto's Sevii Islands, Unova's Black/White 2
      areas.
- [ ] Re-check each region's `raidPool` after adding them — species that now
      have a native route must drop out.

### 28b. More ordinary areas

The scraper only keeps towns and routes, so caves, forests, tunnels, ruins,
towers, lakes/seas and safari zones are absent unless hand-added
(`EXTRA_MAP_AREAS` currently carries only Johto's Bell Tower / Whirl Islands /
Mt. Silver).

- [ ] Grow `EXTRA_MAP_AREAS` (or scrape the remaining landmark locations) with
      their own species lists so they don't drag a whole generation slice in.
      Note: the committed `public/data` isn't currently idempotent with the
      generator, so a data-only pass needs an `apply-*.cjs` script (as the other
      generators' follow-ups do) rather than a full re-run. (The Lake of Rage is
      one such missing Johto area — see #69.)
- [ ] Consider a real `type` / `areaType` field (cave, forest, sea, ruins, …)
      instead of the current binary town-vs-route; `location-panel.js` labels
      everything non-town as "Route 🌿", and the battle background comes from
      the `ROUTE_BACKGROUND_RULES` / dominant-type heuristic.

### 28c. Points of interest (POIs)

**Shipped (0.21.0):** the model is the lightweight-marker one — a service POI is
a flavour / utility stop overlaid on an existing location, held in
`src/game/services.js` (`SERVICE_POIS` + `servicePoisFor`). `map-node.js` draws
the markers beside the minigame badge and adds their labels to the node tooltip,
and `location-panel.js` shows a **Services** tag row. The first POI is the
**Day-Care** on every region's breeding route.

Still open:

- [ ] Add more POIs, each one entry in `SERVICE_POIS` plus (optionally) a panel
      card: a Move Tutor / TM vendor, a café / mart, a berry patch, a raid den,
      a legendary shrine.
- [ ] Add a legend / filter to the Town Map once there is more than one marker
      kind worth showing.

Relevant code: `tools/scrape-region-maps.cjs` (`MANUAL_BRIDGES`),
`tools/generate-regions.cjs` (`EXTRA_MAP_AREAS`, `levelRoutes`,
`ROUTE_BACKGROUND_RULES`, raid pools), `public/data/map-data/*.json`,
`src/game/services.js`, and the map UI (`src/components/map-node.js`,
`town-map.js`, `location-panel.js`).

Effort: **large** (data-heavy; 28a/28b mostly data, 28c an ongoing small
feature).

## 29. Minigames (companion polish)

Every region has its signature and extra minigames (see the changelog for the
full set), plus the Companion and Berry Garden. The only open idea:

- [ ] An animated buddy panel / petting scene using the existing sprite helpers
      (companion care is a static modal today).

The care decay itself is also too harsh — see #58.

Relevant code: `src/game/companion.js`, the minigame scenes under
`src/components/`, and `src/game/reducer/minigames.js`.

Effort: **small**.
## 36. Zones — route-like chunks of areas

The map is a graph of single nodes joined pair-wise. The zone model shipped in
0.13.0: `type: 'zone'` nodes group sub-areas that are hidden routes with their
own encounter buckets, and existing routes can be grouped too (`GROUP_ZONES` —
Alola's islands, Paldea's provinces). Galar's Wild Area and the Galar/Paldea
DLC are zones.

Still open:

- [ ] More sub-areas (pairs with #28a/#28b).
- [ ] A distinct zone glyph on the map.
- [ ] Inline per-sub-area encounter grids (rather than the picker + a single
      route grid).
- [ ] Give each zone / area its own zoomed-in map view with a back button — see
      #60.

Effort: **medium–large** (a small data-model change plus map/encounter UI).

## 38. Clean up the Raid Islands (later generations are bloated)

The raid scan gives each region its generation's species that appear on **no**
region's wild routes and can't be reached by breeding/evolving a route species.
Later dexes balloon (Alola 51, Galar 59, Paldea 58 pre-cleanup).

**Shipped (0.13.0):** each island is split into `raidPool` (legendaries/mythicals
with no other source — the bosses) and `raidOrdinaryPool` (ordinary finals with
no other source, capped at 15). `validate-data.cjs` checks the split, and
`raidPoolFor` still returns the full table for the UI and wild bucket.

Still open:

- [ ] Weight / level-gate the legendary pick by badges or prestige instead of a
      uniform "unseen first" pick.
- [ ] Move the Galarian birds (`g-articuno` / `g-zapdos` / `g-moltres`) back
      into the legendary pool — they are mis-flagged as ordinary today (#59).
- [ ] Relocate the remaining ordinary finals from the one-off refuge statics
      onto fitting routes as real encounters (#61), then drop the refuges.
- [ ] If a smaller Unova (13 ordinary) pool is wanted, give a few of its finals a
      real route or evolution source (part of #28/#39).

Relevant code: `tools/generate-regions.cjs` (`raidCandidates`,
`raidPoolSpecies`, `staysInRaidPool`, `FORM_RAID_REGION`, `paldeaExtrasFor`, the
raid scan), `public/data/regions.json` (`raidPool` / `raidOrdinaryPool`),
`raidPoolFor` / `raidLegendaryPoolFor` (`src/data/gameData.js`),
`pickRaidLegendary` / `resolveRoamer` (`src/game/progression.js`), the raid UI
(`src/components/town-map.js`, `location-panel.js`) and `tools/validate-data.cjs`.

Effort: **medium** (mostly balance/data plus the generator; game logic is small).

## 39. Introduce DLC regions from later games

Later games shipped whole expansion areas that today are folded into a parent
region (as zones):

- Galar — **Isle of Armor** and **Crown Tundra** (Sword/Shield Expansion Pass).
- Paldea — **Kitakami** (Teal Mask) and **Blueberry Academy / Terarium**
  (Indigo Disk). `paldea-mossui-town` is already scraped as a bare dead-end town.
- Optional older post-games: Kanto's **Sevii Islands** and Unova's Black/White 2
  areas.

**Partial (0.13.0):** these shipped as post-game zones inside their parent
region (`championDefeated`). This item is about promoting them to
**first-class regions** — their own `entry`, level curve, unlock path, raid pool
and map — so they can be opened with an Unlock Token like any other region.

- [ ] Decide the model: a region whose `generation` points at its parent gen,
      vs. a new `parentRegion` / `isDlc` flag. Regions currently map 1:1 to
      generations (`generation`, `speciesForGen`, per-gen raid pools and the
      per-generation Shiny Charm), so DLC needs an explicit answer.
- [ ] Add each area to `tools/region-maps.json` / `EXTRA_MAP_AREAS` with its own
      locations + encounters, and a `REGION_MAP_LAYOUTS` override where the
      layout needs hand-measuring.
- [ ] Give each a progression: post-game (after the parent Champion) or bought
      with an Unlock Token; decide whether it needs a league/Champion or just a
      raid/legendary endgame.
- [ ] Reconcile the dex/shininess/achievement structures:
      `GENERATION_DEX_RANGES` / `speciesKeysByGeneration` / `completedGenerations`
      key by national dex, so DLC mons already count toward their gen — decide
      whether DLC regions count toward region completion, Unlock Tokens and the
      World Tour achievement.
- [ ] Register the new region files in `assets/gameDataInjector.js` and re-export
      in `src/data/gameData.js`.
- [ ] Re-check raid pools (#38) afterwards.
- [ ] Shape the maps with **zones** (#36) where they're open-world (the
      Terarium, Wild Area-style areas).
- [ ] Suggested order: Galar DLC → Paldea DLC → older post-games.

Relevant code: `public/data/regions.json`, `tools/generate-regions.cjs` (region
construction, `speciesForGen`, `levelRoutes`, the raid scan),
`tools/scrape-region-maps.cjs`, `assets/gameDataInjector.js` (region file list),
`src/game/progression.js` (`getRegionUnlockTokens`,
`computeUnlockedLocations`), and the Town Map (`src/components/town-map.js`).

Effort: **medium–large** (data-heavy, but shares groundwork with #28/#36).

## 40. Handle Alola, Galar and Paldea's league structures

The league model assumes **8 gyms in canonical order**, then a **4-member Elite
Four** and a Champion. The data-driven league block (`badgeOrder`, `badgeTrack`,
`badgeName`, `eliteTrack`) shipped in 0.13.0: Alola is billed as the island
trials (Z-Crystals), Galar's endgame is the Champion Cup, and Paldea uses
`badgeOrder: 'free'` with a badge-count gate.

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

Relevant code: `tools/generate-regions.cjs` (`LEAGUES`, gym placement,
`gymsRequired` gates, league construction, `BADGE_NAMES` / `GYM_TOWNS`),
`public/data/regions.json` + `gym-leader-data.json` / `elite-4-data.json` /
`champion-data.json`, `src/components/gym-panel.js`, `src/game/reducer.js`
(`BOSS_BATTLE_END`, `RESET_ELITE_FOUR`), `src/data/achievements.js`,
`tools/validate-data.cjs`.

Effort: **medium** (mostly data + panel copy; the Paldea any-order gate is the
only real progression change).

## 43. Multi-battles (double / triple / rotation) as a minigame

The engine is **singles only** — the move data already flags the doubles-only
moves (Follow Me, Helping Hand, Quick/Wide Guard, …) as unimplemented (see #24),
and the ally/doubles abilities are on the #25 list. Make multi-battles a
**self-contained minigame** (a scene + a `START_*`/`END_MINIGAME` reducer pair
+ a `MINIGAME_LOCATIONS` entry, per the #29 pattern), so the main game stays
singles.

- [ ] Pick the first mode: **double battle** (2v2) is the most legible and the
      most reusable; triple and rotation battles are stretch goals.
- [ ] Decide how much of the combat engine is shared: the damage/status math is
      reusable, but target selection, spread moves and per-slot speed order are
      new.
- [ ] Minimal doubles rules: one target chosen per move, spread moves hit both,
      and the existing ally-targeted moves (#24) can finally do something.
- [ ] Give it a home location per region (a Battle Maison / Battle Tower-style
      node) and a reward table, mirroring the Battle Royal.
- [ ] Consider a "3-way / 4-way" free-for-all variant as a separate mode if the
      2v2 version lands well.

Likely touch points: `src/game/combat/` (a parallel multi-target turn
resolver), `src/components/*-scene.js`, `src/game/reducer/minigames.js`, and
`src/game/minigames/registry.js`.

Effort: **medium–large** (the shared math helps, but target/order handling is
genuinely new).
## 53. IV increment items

Add items that permanently raise a Pokemon's IVs, handed out as rewards.
Bottle-Cap style (one stat, or all stats) or a smaller +1 IV increment item.

- [ ] Add the item(s) and a bag use flow with a target-stat picker (or auto-pick
      the best/lowest stat).
- [ ] Decide the reward source: raids, the Battle Tower / Battle Royal / Dynamax
      Adventures, the Game Corner, or the Auction House.
- [ ] Mark the Pokemon as hyper-trained so the boost can't be bred down, and
      make the IV cap 31.

Likely touch points: `src/data/items.js`, `src/game/reducer/items.js`
(`USE_ITEM_ON_POKEMON`), `src/components/bag-panel.js`, the reward tables, and
`tools/download-item-sprites.cjs` for the art.

Effort: **small–medium**.

## 54. Improve Dynamax Adventures and Battle Royal

Both shipped as minimal loops (0.16.0): Dynamax Adventures is "pick a path of
three encounters, then the boss"; the Battle Royal an endless wave gauntlet.
Make them feel like real modes.

- [ ] **Dynamax Adventures**: let the player choose (or re-roll) the legendary
      they are hunting, add per-floor pick-ups / a KO limit, and use the real
      Raid boss pool for the finale.
- [ ] **Battle Royal**: clear per-round placement scoring (1st–4th), a real
      opponent pool and AI, scaling rewards and a streak / rank track.
- [ ] Both: better pacing / feedback and a unique reward worth replaying for
      (not just money / EXP).

Likely touch points: `src/game/minigames/dynamax-adventures.js`,
`src/game/minigames/gauntlet.js`, their scenes, and the reward tables.

Effort: **medium**.

## 55. Poke Radar: a guaranteed shiny every 5 levels

The Poke Radar is a memory-chain minigame whose chain only nudges shiny odds.
Give it a schedule: the **nth shiny appears at chain level 5×n** — first at 5,
then 10, then 15, and so on. Resolving the shiny (catching it, or winning the
battle) resets the chain, and the next target is 5 higher again.

- [ ] Track the chain level and the current shiny target (5, 10, 15, ...).
- [ ] When the level hits the target, force the next encounter to be shiny.
- [ ] On resolving the shiny, reset the chain and raise the next target by 5.
- [ ] Decide whether a lost / fled shiny battle resets the chain or just leaves
      the target unmet.

Likely touch points: `src/game/minigames/poke-radar.js`,
`src/components/poke-radar-scene.js`, and the reducer's radar handlers.

Effort: **small**.

## 56. Multi-effect move pass

Many moves have more than one effect, and quite a few only implement part of
their kit. Audit them and fill in the missing half:

- [ ] Recharge moves (Hyper Beam, Giga Impact, Rock Wrecker, Roar of Time, ...)
      — the user should be unable to act the next turn.
- [ ] Flinch secondaries (Bite, Iron Head, Rock Slide, Fake Out, ...) — verify
      the flinch chance and that the target actually loses its turn.
- [ ] Stat-drop / status secondaries (Psychic's Sp. Def drop, Ice Beam's freeze,
      Sludge Bomb's poison, ...) and multi-hit + secondary combinations.
- [ ] Recoil / drain moves that also carry a secondary (Brave Bird, Flare
      Blitz, ...).
- [ ] Two-turn moves that combine a charge with an effect (Sky Attack's flinch,
      Solar Blade, ...).
- [ ] Keep a checklist/table of every multi-effect move and whether each part
      is implemented, so the gaps stay visible.

Likely touch points: `src/data/move-effects.js`, `src/game/combat/` (`turn.js`,
`status.js`, `effects`), and `public/reference.html` (regenerate).

Effort: **medium**.
## 60. Areas should have their own zoomed-in map

Today a zone / large area (Galar's Wild Area, Alola's islands, Paldea's
provinces, the DLC) is a single hub node whose sub-areas are only listed in the
location panel, and a sub-area's own panel gets a `← Zone` back button — there
is no dedicated in-area map. Give each area its own **zoomed-in map** view:
entering the area from the Town Map focuses on just its sub-areas/nodes, with a
back button to return to the region map.

- [ ] Decide the scope: zones (#36), and/or every location's "area" (caves /
      POIs from #28).
- [ ] Render a focused map — reuse the `town-map.js` canvas with a filtered node
      set (or a per-area layout) showing the area's sub-areas, their unlock
      state and the player's current position.
- [ ] Add the "zoom in" transition when entering the area and a back button to
      exit to the region map (mirroring the existing zone back button in
      `location-panel.js`).
- [ ] Keep travel and encounters working off the existing `TRAVEL` /
      sub-area plumbing.

Relevant code: `src/components/town-map.js`, `src/components/location-panel.js`
(zone hub + back button), `public/data/map-data/*.json` (`type: 'zone'`,
`subAreas`), and `tools/generate-regions.cjs` (`ZONES`, `GROUP_ZONES`,
`REGION_MAP_LAYOUTS`).

Effort: **medium**.

## 61. Move the former raid gifts onto real routes

When the Raid Islands became legendary-only, each region's ordinary finals were
relocated as one-off **refuge static encounters** on that region's last route
(`RAID_REFUGE_LOCATIONS` / `refugeStatics` in `src/game/gifts.js`): Kanto's
Jynx/Omastar/Kabutops/Aerodactyl, Johto's
Cleffa/Togepi/Xatu/Unown/Smoochum/Magby, Hoenn's
Slaking/Mawile/Cradily/Metagross, Sinnoh's
Rampardos/Bastiodon/Ambipom/Spiritomb/Togekiss/Porygon-Z, Unova's 13 ordinary
finals, Kalos's Tyrantrum/Aurorus/Carbink/Gourgeist, and Galar's fossil quartet +
Indeedee-F. They should instead appear on routes that fit them, as ordinary (if
rare) entries in the encounter table, so they are repeatable and feel native
rather than bolted onto one late route as another Snorlax-style static.

- [ ] For each region, pick thematically/canonically fitting route(s) and add
      the species to `public/data/encounter-data/<region>.json` with that
      route's level band and a low weight (so they stay rare).
- [ ] Give fossils their canonical source (Sinnoh's Underground / a fossil-revive
      system — #50) instead of a wild spawn where that is more faithful.
- [ ] Leave the Galarian birds out — they belong back in `raidPool` (#59), not on
      a route.
- [ ] Retire the refuge statics once every species has a real encounter, and drop
      the now-redundant `raidOrdinaryPool` / `RAID_REFUGE_LOCATIONS` plumbing
      (keep it only if some species still need it for obtainability).
- [ ] Update `src/game/gifts.js`, `tools/apply-raid-refugees.cjs`,
      `public/data/regions.json#raidOrdinaryPool`, `tests/raid.test.mjs` and
      `tools/validate-data.cjs` so the obtainability check no longer depends on
      the refuges.
- [ ] Regenerate `public/encounter-index.html` and re-check the raid pools (#38).

Relevant code: `public/data/encounter-data/*.json`, `public/data/regions.json`,
`src/game/gifts.js`, `tools/apply-raid-refugees.cjs`, `tools/validate-data.cjs`,
`tests/raid.test.mjs`, and the raid scan in `tools/generate-regions.cjs`.

Effort: **medium** (data-heavy: one habitat decision per species).
## 65. Use minigames as unlock gates

Location unlocks are built entirely from battles won, catches, badges, gyms,
party level, champion and `requires` (`computeUnlockedLocations`). The
minigames are side content today — nothing in progression ever asks the player
to play one. Hook some of them in as gates so the minigames matter to the
route/unlock graph.

- [ ] Add a `minigame` unlock rule (e.g.
      `unlock: { minigame: 'whack', minScore: 20 }` or a simple completion
      flag) to `computeUnlockedLocations` and the `MapLocation` type.
- [ ] Persist the result: `endMinigame` / `claimMinigameReward` currently throw
      the outcome away, so record each minigame's completion and best score in
      the save (`initialGameState`, `SAVED_STATE_KEYS`, `src/types.d.ts`).
- [ ] Show the requirement in `location-panel.js` (`unlockRequirements`) with
      the current / target score and a link to the minigame's home area.
- [ ] Pick the gates thematically: e.g. a Vermilion-area route gated on
      Whack-a-Diglett, a Johto route on the Bug-Catching Contest, a Paldea
      route on the Academy Quiz. Keep them optional-ish so a player who dislikes
      a minigame is never hard-stuck if it can be avoided.
- [ ] Decide whether generated regions should emit these gates
      (`tools/generate-regions.cjs`) or they are hand-placed on the committed
      data with an `apply-*.cjs` script (the data isn't idempotent with the
      generator).
- [ ] Re-check `tools/validate-data.cjs` for the new rule shape.

Relevant code: `src/game/progression/unlocks.js` (`computeUnlockedLocations`),
`src/components/location-panel.js` (`unlockRequirements`),
`src/game/reducer/minigames.js` (`endMinigame` / `claimMinigameReward`),
`src/game/minigames/registry.js`, `public/data/map-data/*.json`, and the save
shape.

Effort: **medium** (state shape + one new rule + placement).

## 66. Ruins of Alph should award an Unown (and all 28 forms)

The Ruins of Alph sliding-picture puzzle (`sliding-puzzle.js`) pays only money
and items — its top prize is even labelled "Unown unlocked!" but it never
hands over an Unown. Worse, only a single `unown` species exists in
`pokemon-species.json`; the other 27 letter / punctuation forms (A–Z, !, ?) are
missing, so the set can't be completed.

- [ ] Award an Unown on solving the puzzle — likely a random form, or the next
      one the player is missing, so repeats help complete the set.
- [ ] Add all 28 Unown forms to `pokemon-species.json` (PokeAPI form ids
      reconciled with `tools/fix_pokemon_ids.py`), each with its abilities
      (`fetch-abilities.cjs`) and learnset (`fix-missing-learnsets.cjs`).
- [ ] Download the form sprites (`download_pokemon_sprites.cjs`) and check the
      static / animated fallbacks (`animated-sprites.json`).
- [ ] Decide how the forms read in the UI (names / dex entries) and whether the
      puzzle tracks which forms the player still needs.
- [ ] Update `tools/validate-data.cjs` (every species obtainable) once the
      puzzle is their source, and make sure the raid-pool / form placement
      (`FORM_RAID_REGION`) doesn't strand or duplicate them.

Relevant code: `src/game/minigames/sliding-puzzle.js`,
`src/components/ruins-puzzle-scene.js`, `src/game/reducer/minigames.js`
(`slidingPrize` payout / `claimMinigameReward`),
`public/data/pokemon-species.json`, `tools/fix_pokemon_ids.py`,
`tools/download_pokemon_sprites.cjs`, and `tools/validate-data.cjs`.

Effort: **medium** (mostly the 28 form entries + art; the award itself is small).

## 67. Baby Pokemon should come from breeding, not gift rewards

Breeding already hatches the baby from its catchable evolved parent — verified
Lucario→Riolu, Toxtricity→Toxel, Clefairy→Cleffa, Jynx→Smoochum, Magmar→Magby,
Togetic→Togepi and Snorlax→Munchlax — because `eggSpeciesKey` walks the
pre-evolution chain. But several baby Pokemon are instead handed out as one-off
gift/static rewards, so the Daycare is never needed: Riolu (Tower of Mastery,
Kalos), Toxel (Rose Tower Nursery, Galar), Johto's refuge statics Cleffa /
Togepi / Smoochum / Magby, and the Sinnoh Munchlax static.

- [ ] Confirm each baby's evolved form is actually obtainable (wild route, raid
      or another gift) so breeding can start. Several are not: Lucario,
      Toxtricity and Togetic appear on no route or raid table, so those lines
      are gift-only today — give the evolved form a real source.
- [ ] Remove (or repoint) the baby gift/static entries in `src/game/gifts.js`
      once breeding covers them.
- [ ] Decide the Incense question: canonically Snorlax→Munchlax,
      Roselia→Budew, Chimecho→Chingling, Sudowoodo→Bonsly, Mr. Mime→Mime Jr.,
      Chansey→Happiny, Mantine→Mantyke and Wobbuffet→Wynaut need a held Incense.
      Either model the items or keep the current simplify (always hatch the
      baby).
- [ ] Re-check obtainability in `tools/validate-data.cjs` and reconcile with
      the refuge/raid plumbing (#61) and the canonical Togepi egg (#63).

Relevant code: `src/game/breeding.js` (`eggSpeciesKey`),
`src/game/pokemon/evolution.js` (`getPreEvolutionChain`),
`src/data/gameData.js` (`preEvolutionMap`), `src/game/gifts.js`,
`public/data/breeding-data.json`, and `tools/validate-data.cjs`.

Effort: **medium** (mostly sourcing the evolved forms and removing the gifts).

## 68. Trainer teams should use all level-appropriate Pokemon

Route trainers draw from a generation slice and are heavily type-biased by
class (`TRAINER_CLASS_TYPES`), and `buildTeam` drops evolved-away, implausible
and weak species. The result is that the same handful of Pokemon show up over
and over, so a player's Pokedex **seen** log lags well behind what actually
exists at that level. Do a pass so trainers can field every level-appropriate
species, so battling through a region reveals most of its dex.

- [ ] Audit `buildTeam` (`tools/generate-regions.cjs`): keep the type theme as a
      *bias*, not a hard filter, and widen the fallback so a trainer can field
      off-theme species when the themed pool is small.
- [ ] Make sure the per-route / per-town pool reaching `buildTeam` is the full
      generation slice (level-appropriate), not already narrowed upstream.
- [ ] Spread species across trainers deterministically (offset by trainer /
      town index) so neighbouring trainers don't all field the same team.
- [ ] Keep the level-appropriate filter (no Pidgey at Lv.55) and still exclude
      legendaries (and starters where intended).
- [ ] Verify a region's dex can realistically be "seen" from trainers alone,
      without every trainer becoming a mirror match.
- [ ] Either regenerate the committed trainer data or add an `apply-*.cjs` pass
      (the data isn't idempotent with the generator).

Relevant code: `tools/generate-regions.cjs` (`buildTeam`,
`TRAINER_CLASS_TYPES`, `speciesForGen`, the route-trainer generation),
`public/data/trainer-data.json`, and the Pokedex seen tracking
(`src/game/reducer/collection.js`).

Effort: **medium** (generator tuning plus regenerating trainer data).
## 70. Day/night cycle on a 60-minute clock

There is a night flag today, but it follows the player's real-world clock:
`isNightTime()` (`src/game/catching.js`) returns true 20:00–03:59 local time and
feeds the Dusk Ball's x3 rate via `catchContext.isNight`. Add a proper game
**day/night cycle** that runs on a fixed real-time period — one full day = 60
real minutes (e.g. 30 min day, 30 min night) — independent of the wall clock.

- [ ] Define the cycle: a full loop every **60 minutes**, with day/night (and
      ideally dawn/dusk) fractions. Derive the phase from
      `Date.now() % 3_600_000` or a persisted cycle anchor so it is identical
      across slots and reloads.
- [ ] Replace `isNightTime()`'s real-clock hour check with the cycle, keeping
      the Dusk Ball (and any future time-gated catch/encounter rules) working.
- [ ] Surface it: a day/night tint / sky over the battle and location scenes,
      plus a small clock / phase indicator (a visual pass that could pair with
      the battle polish in #25).
- [ ] Decide what else it gates: night-only or day-only wild encounters,
      Sun/Moon evolution items, daily events, etc.
- [ ] Keep it cheap in the idle loop — recompute the phase on a boundary, not
      on every render, if it drives visuals.
- [ ] Note the save shape: a pure `Date.now()` derivation needs no new field,
      but a persisted anchor would (if the cycle must not shift on reload).

Relevant code: `src/game/catching.js` (`isNightTime`, `catchContext`),
`src/game/use-game-loop.js` (`isNight` in the catch context),
`src/components/battle-scene.js` / `location-panel.js` for the visuals, and
`src/data/ui.js` (backgrounds / tints).

Effort: **medium** (the logic is small; the visual pass is the work).
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

The generated maps are readable graphs; the next visual steps need art/design
decisions:

- [ ] Add more battle background art. There are only four base scenes
      (grassland, beach, mountain, cave) plus the biome colour grades; real
      forest/desert/swamp/volcano/tundra art would let `routeBackground` stop
      tinting a handful of images.
- [ ] A zone glyph/label polish pass once the terrain layer exists (pairs with
      #36).

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
