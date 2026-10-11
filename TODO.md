# TODO

Open ideas and follow-ups. Current game version: **0.24.0**
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

1. **#24 Move data pass** — M · ★★★ — Quick/Wide Guard's side protection and
   the PP / Z-Move keep-or-drop decisions.
2. **#25 Battle engine pass** — M–L · ★★★ — Illusion, more berries / Rocky
   Helmet, and battle polish.
3. **#18 Better settings** — M · ★★★ — more cosmetic options if wanted;
   account controls blocked on #19 (auto-heal, the default catch rule and two
   Display toggles shipped).
4. **#43 Multi-battles (triple / rotation)** — M–L · ★★½ — build on the
   shipped doubles engine.

### Tier 2 — Big / low-return, defer

5. **#56 Multi-effect move pass (residual)** — S · ★★ — moves that carry a
   third effect, which the single `secondary` slot cannot express.
6. **#19 Online sync** — L · ★★★ — the project's first backend; needs a design
   doc and real ops for modest player value today.

### Tier 3 — New ideas (route activities, idle depth, endgame)

7. **#69 Legendary quests** — M · ★★★.
8. **#65 Prestige perks** — M–L · ★★★.
9. **#71 Breeding project queue** — M · ★★★.
10. **#62 Offline depth** — M · ★★★.
11. **#72 QoL pass** — S–M · ★★★ — IV sort, move preview and team presets
    shipped; box bulk-release remains.
12. **#67 Ribbons + ribbon case** — S–M · ★★½.
13. **#68 Generation-completion rewards** — done.
14. **#59 Activity goals & per-route mastery** — S–M · ★★.
15. **#61 Focus / target hunting** — S–M · ★★½.
16. **#66 Battle Frontier facilities** — M–L · ★★½.
17. **#70 Recurring rival** — M · ★★½.
18. **#73 Weather system on routes** — S–M · ★★ — there is no world weather
    system, so the weather-favoured activities can almost never trigger.
19. **#74 Pokemon sizes (XS–XL)** — S–M · ★★½ — a Legends-style size roll per
    individual.
20. **#75 Legends Z-A area (Kalos)** — M · ★★★ — Lumiose City's Wild Zones as a
    post-game zone.
21. **#76 Legends Arceus / Hisui areas (Sinnoh)** — M · ★★★ — ancient Sinnoh as a
    post-game zone.
22. **#77 UI consistency pass (sliders / steppers)** — S–M · ★★.
23. **#78 Alola Ultra Warp Ride** — M · ★★★ — a warp minigame to reach the Ultra
    Beasts and legends.
24. **#79 Johto Poké Ball crafting (Kurt)** — M · ★★★ — Apricorn/berry crafting
    and the seven Apricorn balls.
25. **#80 Companion affection perks** — shipped; the optional status-shake /
    dodge / crit extras remain.

---

## 18. Better settings

`settings-modal.js` exposes gameplay, notification, display and audio toggles,
and the preferences live outside the save (`pokemon-idle-settings`,
`src/game/settings.js`) so they survive a save reset and are shared across slots.

Done: a Display pair of toggles (damage numbers and shiny sparkles) beside the
sprite style; a Default Catch Rule in Settings (mode, level threshold and
enabled balls) for any route the player has not customised; and Auto-Heal, which
tops the party up at the Pokemon Center whenever the map is idle (skipping the
healing animation, and never during a raid).

Still open:

- [ ] **Account**: sign in / sync controls — blocked on #19.
- [ ] **Display**: any further cosmetic options beyond the sprite style,
      damage numbers and shiny sparkles.

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
swaps, the two-turn/charging moves, the status-condition conditionals, the
multi-status rolls (Tri Attack, Dire Claw), Retaliate, Round / Echoed Voice and
the faint-heals all shipped.

Not done:

- [ ] Quick Guard / Wide Guard only protect the user as generic `protect`
      moves; they should shield the user's whole side in the doubles minigame
      (#43). Every other doubles-only move (After You, Ally Switch, Follow Me,
      Helping Hand, Rage Powder, …) already plays in the Battle Maison.
- [ ] PP is stored but unused; decide whether to implement it or drop it.
- [ ] Z-moves / G-Max moves are otherwise dead data — decide keep/drop.

Effort: **medium** (the effect set is done; what is left is design calls).

## 25. Battle engine pass (mostly done)

`resolveBattleTurn` (`src/game/combat.js`) is fairly complete for damage +
status + stat changes. Healing, multi-hit, Protect, hazards, accuracy/evasion
stages, the extra statuses, weather/terrain, the crit-rate pass, the
auto-battler AI, the contact abilities, the mid-battle form-change subsystem,
the battle-only synthetic-species table, and most singles abilities
(Synchronize, Magic Bounce, Rivalry, Quick Draw, Stakeout, Supreme Overlord,
Choice locking) have shipped.

Done: the ally ability set is complete in the doubles engine — Battery, Power
Spot, Friend Guard, Healer, Telepathy, Aroma/Flower Veil, Costar, Commander,
Hospitality, Symbiosis and Gulp Missile all act.

Not done:

- [ ] Illusion (deferred: its disguise is cosmetic plus an AI read, which an
      idle auto-battler barely shows).
- [ ] Overworld-only abilities (no effect in an idle auto-battler): Illuminate,
      Run Away.
- [ ] The remaining item nuances: more berries (the pinch berries beyond
      Sitrus/Lum) and Rocky Helmet (blocked on a bag sprite). Choice locking
      shipped.
- [ ] Battle polish: move animations / hit feedback (damage numbers already
      float over the sprite and have a Settings toggle).

*(Switching on a bad matchup is intentionally discarded: an auto-switching
opponent is frustrating to play against.)*

Effort: **medium–large** (do it in slices).

## 28. More region areas (DLC, caves, POIs)

The Galar / Paldea DLC and Kanto's Sevii Islands are first-class `isDlc`
regions, the Unova Black 2 / White 2 areas and ~100 landmark areas are on the
map (`tools/lib/ordinary-areas.cjs`), Johto's Whirl Islands is a zone, and the
service POI set (Day-Care, Berry Garden, Battle Tower, Raid Den, Legendary
Shrine, Cafe) is in. **No open items.**

## 36. Zones — route-like chunks of areas

The map is a graph of single nodes joined pair-wise. The zone model shipped in
0.13.0: `type: 'zone'` nodes group sub-areas that are hidden routes with their
own encounter buckets, and existing routes can be grouped too (`GROUP_ZONES` —
Alola's islands, Paldea's provinces).

Shipped: the Galar Wild Area (13 habitats), the four DLC zones, Alola's
islands, Paldea's provinces and Area Zero, and Johto's Whirl Islands all have
their sub-areas, spaced in a ring for the focused map view. **No open items.**

## 43. Multi-battles (double / triple / rotation) as a minigame

The **doubles** 2v2 minigame shipped at Kalos's Battle Maison: two of the party
face two foes, every battler picks a target, spread moves hit both, fainted
Pokemon tag in from the bench, and the ally abilities (Battery, Power Spot,
Friend Guard, Healer) work. It reuses the singles engine one action at a time.

The doubles-only moves and ally abilities ship too (Follow Me, Rage Powder,
Spotlight, Helping Hand, After You, Quash, Ally Switch, Instruct, Dancer, plus
the ally ability set in #25).

Still open:

- [ ] Triple and rotation battles.
- [ ] A 3-way / 4-way free-for-all variant (the Battle Royal is the closest
      thing today).
- [ ] A doubles home in more regions (currently only Kalos's Battle Maison).
- [ ] Quick Guard / Wide Guard should protect the whole side, not just the user
      (they are generic `protect` moves today).

Relevant code: `src/game/minigames/doubles.js`,
`src/components/doubles-scene.js`, `src/game/reducer/minigames.js`, and
`src/game/minigames/registry.js`.

## 56. Multi-effect move pass (mostly done)

Shipped: the move data supports a primary effect plus one `secondary`, the
recharge flag is back, the missing secondaries were filled in, the elemental
fangs carry both effects, Fake Out is first-turn-only, and
`public/reference.html` is the live checklist of every implemented effect.

Still open:

- [ ] Moves that carry a third effect (a primary effect plus two riders), which
      the single `secondary` slot still cannot express.

Relevant code: `src/data/move-effects.js`, `src/game/combat/turn.js`,
`src/game/move-info.js`, and `public/reference.html` (regenerate with
`node tools/generate-reference.cjs`).

Effort: **small** (the remaining bits are one-offs).

## 59. Activity goals & per-route mastery

Persist the best hit quality per route/activity, grant a mastery bonus once a
route's activities are all cleared, and add activity-flavoured daily quests.

Effort: **small–medium**.

## 61. Focus / target hunting

Pick a species or type to focus; boost its wild and activity encounter rate and
track hunt progress (encounters, best quality, time to catch).

Effort: **small–medium**.

## 62. Offline depth

Richer offline reports and queued work: which routes/activities ran, what was
caught, and a catch-up simulation that matches `offline.js`.

Effort: **medium**.

## 65. Prestige perks

Prestige currently only resets map progress for Victory Tokens; add a
persistent talent tree so prestiging invests in something across runs.

Effort: **medium–large**.

## 66. Battle Frontier facilities

Rule-variant facilities (inverse battles, rental teams, no-items) built on the
Tower / Maison scenes.

Effort: **medium–large**.

## 67. Ribbons + ribbon case

Award ribbons for contest wins, tower clears, gym sweeps and the like, with a
per-Pokemon ribbon case UI. Contest minigame already exists.

Effort: **small–medium**.

## 68. Generation-completion rewards

A generation's dex completion already pays 3 Victory Tokens and a Master Ball
(not just the Shiny Charm), shows a certificate scene
(`dex-complete-scene.js`), lists each generation's completion and shiny odds in
Records, and feeds the per-generation Shiny Charm. **No open items.**

## 69. Legendary quests

Multi-step relic hunts for the box legendaries instead of pure Raid RNG.

Effort: **medium**.

## 70. Recurring rival

A rival who appears at badge/Champion milestones with a scaling team and
dialogue.

Effort: **medium**.

## 71. Breeding project queue & shiny tracking

A day-care project queue, surfaced Masuda odds, and a shiny-egg tracker.

Effort: **medium**.

## 72. QoL pass

Done: box sort by total IVs; a damage/effectiveness preview on the battle move
buttons (a type multiplier, plus a KO tag from `estimateMoveDamage`); party
team presets (`src/components/team-presets.js`, saved in the save and restored
by `APPLY_TEAM_PRESET`); and JSON save export/import in Settings.

Still open:

- [ ] Box bulk-release (multi-select or a filtered "release all"); the Box
      already has one-tap "Release Duplicates".

Effort: **small–medium**.

## 73. Weather system on routes (gap)

Route activities and the battle field weather both read a **weather** value, but
behind them there is no weather *system*:

- `fieldWeatherFor(location)` (`src/game/weather.js`) only returns weather when
the location data carries a permanent `weather` field, which exactly **7
locations** do: Galar Route 10 (snow), Hoenn Routes 111 (sandstorm) and 119
(rain), Kalos Route 17 (snow), Sinnoh Routes 216/217 (snow) and Unova Route 4
(sandstorm). Moves and abilities can set weather too, but only **inside a
battle**.
- Nothing changes the weather over time — there is no weather cycle like the
fixed 60-minute day/night cycle — so apart from those 7 routes it is
effectively always clear.

Consequence: the activities that favour **rain** (Fishing, Overcharge) can only
hit their favoured bonus on Hoenn Route 119; everywhere else the weather half of
`activityConditionMatches` is unreachable, so that condition is near-dead. The
player guide calls these out ("fishing and overcharging love the rain"), which
reads as though weather were a world feature.

Options when we pick this up:

- [ ] Add a lightweight world weather cycle (per region or per route, changing
      over time like the day/night cycle), show it in the Town Map header beside
      the phase, and feed it to `fieldWeatherFor` and the activity conditions.
- [ ] Or let the activity condition read the current *battle* weather as well,
      so a Rain Dance-buffed fight counts, instead of a world value.
- [ ] Or drop the weather condition from activities and keep the day/night one
      only.

Effort: **small–medium** (the weather mechanics and battle side already exist;
the work is a world weather value plus wiring it into `fieldWeatherFor`).

## 74. Pokemon sizes (XS–XL) (gap)

In Legends: Arceus every Pokemon has a size, shown as a rating from XS to XL,
with larger specimens worth more and research tasks asking for them. The game has
no size concept today: `pokemon-species.json` carries a `weight` (used by Heat
Crash / Heavy Slam / Low Kick / Grass Knot) but **no `height`**, and an
individual only rolls IVs, a nature and an ability.

- [ ] Roll a per-individual `size` value when a Pokemon is created (a variance
      around the species' baseline, like IVs), and map it to a rating
      (XS / S / M / L / XL).
- [ ] Show the rating (and maybe the numeric value) in the stats panel beside
      the IVs, with a plain-English tooltip.
- [ ] Optionally add an **alpha** flag for the very largest specimens (Arceus's
      alphas) — a small EXP/money bonus and a Box marker.
- [ ] Tie it into **Field research** (#63, shipped): tasks such as "catch a large
      specimen" and "catch an XL specimen". Size is per-individual, so the
      research counter has to watch caught individuals, not just species.
- [ ] Decide the baseline: roll around `weight`, or add `height` to the species
      data with a PokeAPI pass (like `fetch-weights.cjs`).

Effort: **small–medium** (the roll and UI are small; the research hook and a
height fetch are the extra).

## 75. Legends Z-A area (Kalos post-game zone)

Legends: Z-A is set in Lumiose City, with Wild Zones carved out of the city. The
game already ships the Z-A **Mega Evolutions** (the "Z" variants in
`src/data/mega-evolution.js`), but not the setting itself.

- [ ] Add **Lumiose City** as a post-game `type: 'zone'` hub on Kalos (like the
      DLC and Sevii zones), gated on the Kalos Champion, with the **Wild Zones**
      as hidden sub-areas, each with its own wild table.
- [ ] Reuse the zone plumbing: `ZONES` / `lib/zone-areas.cjs` in the generator, or
      `apply-zone-areas.cjs` on the committed data, then `apply-zone-layout.cjs`
      and `generate-encounter-index.cjs`.
- [ ] Pick the Wild Zone species from Kalos's generation (and any Z-A-only forms)
      that fit an inner-city setting.

Effort: **medium** (map data, encounters and a generator pass; the zone model
already exists).

## 76. Legends Arceus / Hisui areas (Sinnoh post-game zone)

Legends: Arceus is set in Hisui, the ancient Sinnoh. The game already ships every
**Hisuian form** (`h-*` species are grouped in the Pokedex and obtainable), but
not the region.

- [ ] Add **Hisui** as a post-game zone on **Sinnoh**, gated on the Sinnoh
      Champion: a Jubilife Village hub plus the five areas — Obsidian Fieldlands,
      Crimson Mirelands, Cobalt Coastlands, Coronet Highlands and Alabaster
      Icelands — as sub-areas with their own wild tables.
- [ ] The noble / ride Pokemon could be statics or Raid Island additions, and the
      space-time distortions a swarm-style event.
- [ ] Same zone plumbing as #75; keep the Hisuian species' acquisition paths
      consistent so nothing is orphaned.

Effort: **medium**.

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

Johto's signature ball-crafting has no home yet: the game ships 13 balls
(Poké / Great / Ultra, the situational set and the Master Ball) but **no Apricorn
balls and no crafting**. Add **Kurt** in Azalea Town and the seven Apricorn balls.

- [ ] Add the **Apricorn** items (Red, Blue, Yellow, Green, Pink, White, Black),
      gathered on Johto routes — or grown/harvested, since the user framed this as
      berry crafting; the Berry Garden (`garden.js`) grows Oran / Sitrus / Lum
      today, so either add Apricorns to it or give the trees their own gathering.
- [ ] Add the seven balls with their real effects: **Level** (lower-level foes),
      **Lure** (fishing), **Friend** (sets friendship), **Heavy** (heavier foes),
      **Love** (opposite gender), **Fast** (fast / fleeing foes) and **Moon**
      (Moon Stone evolvers).
- [ ] Wire each ball's catch-rate modifier into `src/game/catching.js` and the
      auto-catch ball picker, alongside the existing situational balls.
- [ ] The crafting loop: hand Kurt the Apricorns and collect the balls after a
      few wild wins (his canonical turnaround), or make it instant.
- [ ] Sprites via `tools/download-item-sprites.cjs` (add the new ids to its
      name map).

Effort: **medium**.

## 80. Companion affection perks (tough it out)

In the games, a Pokémon with high affection (Amie / Refresh / Camp) can **tough
out** a would-be KO at 1 HP — "X toughed it out so you wouldn't feel sad!" —
on top of the other affection effects (shaking off status, dodging a move, extra
crits, bonus EXP). The game has both halves already but they don't meet:

- **Friendship** is a per-Pokémon value (`gainFriendship`, friendship
evolutions), and the **companion** (`src/game/companion.js`) has care stats
(fullness / happiness / energy / cleanliness) and already grants +15% EXP when
all four are at 50+.
Done: the 1 HP save ships. In the damage step (`src/game/combat/turn.js`, beside
`abilitySurvivesAtFullHp` / Endure / `heldSurvivesAtFullHp`), when the pinned
companion is the active battler and a hit would KO it, `companionToughOutChance`
(`src/game/companion.js`) is rolled — starting at an average care of 60 and
scaling to 30% at full care — leaving it at 1 HP with the log line "X toughed it
out so you wouldn't feel sad!". It is spent once per battle via `toughOutUsed`
in the volatile state.

Still open (optional extras if we want the full affection set):

- [ ] Shake off a status condition, dodge a move, or a bumped crit rate.
- [ ] Let a high-friendship non-companion benefit too, if the companion-only
      gate feels too narrow.

Effort: **small–medium** (one hook, one roll and a log line; the state already
exists).

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
