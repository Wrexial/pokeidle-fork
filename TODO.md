# TODO

Ideas and follow-ups that aren't implemented yet. Current game version: **0.24.0**
(`src/data/changelog.js`). See `AGENTS.md` for architecture, commands and data
conventions.

The two features below are the only items still open from the original feature
menu; the rest of this file is things raised in passing that were never scoped.

---

## Priority order (effort vs. gain)

A ranked work order, best return first. **Effort**: S (small) < S–M < M < M–L
< L. **Gain** is the player-facing value of shipping it (★ = nice to have,
★★★★★ = core missing feature). The numbered sections below are **unchanged**
so cross-references (`#2c`, `#24`, …) keep working — treat this list as the
working order, and the numbered sections as the details.

### Tier 1 — Quick wins (small effort, high gain)

**Shipped** in 0.9.x: #13 auto-travel, #26 README/licence, #30 caught badge +
toast queue, #1 healing items, #12 dex rewards, #21 unlock tokens, #33
Rare/Exp. Candies, #34 sellable valuables, #15 save export/import (slots and
share codes still open), #41 box "New" sort prepend, #37 the Master Ball
button, #2b natures, #14 the `node --test` suite, #5 daily events, and #16's
achievement rewards, map QoL, release rewards and notifications. The remaining
items, best return first:

1. **#16 More ideas (grab bag)** — mostly S · ★★★ — still open: monotype runs
   and a performance pass. (Nuzlocke shipped 0.23.0.)

### Tier 2 — High impact, worth the effort (medium–large)

16. ✅ **#7 Offline / idle progress** — shipped 0.9.26 (capped money + Exp.
    Candies for time away, with a "While You Were Away" report).
17. ✅ **#8 Pokémon management / IV checker** — shipped (IV judge, nicknames,
    favourite/lock, box search/filter and the release-duplicates tool).
18. ✅ **#20 Honey/Repel DexNav hunting** — shipped 0.10.0 (Honey/Repel lock
    and protect a 4+ chain).
19. **#24 Move data pass** — M–L · ★★★★½ — ~290 moves currently do nothing;
    do it in slices (healing/screens/setup first). **First slice shipped in
    0.11.0**: healing, multi-hit, high-crit, Protect, priority/data fixes;
    screens, hazards and the rest of the utility set are still open.
20. **#25 Battle engine pass** — M–L · ★★★★½ — pairs with #24; AI + healing +
    multi-hit first. **First slice shipped in 0.11.0**: the auto-battler and
    trainer AI now heal and set up; hazards/screens/accuracy stages still open.
21. ✅ **#2a Abilities** (0.15.0) and **#2c Held items** (0.16.0) — the
    biggest remaining battle-depth feature is now in. Remaining ability/item
    nuances live in sections #2a/#2c.
22. **#36 Zones (route chunks)** — M–L · ★★★★ — lets Alola/Galar/Paldea map
    as chunks of areas instead of a single-route-wide graph.
23. **#35 More Galar areas** — M · ★★★½ — Galar is the thinnest region map;
    add Wild Area sub-areas and DLC land, mostly data.
24. **#28 More region areas (DLC, caves, POIs)** — L · ★★★★½ — real content
    (Crown Tundra, Kitakami, landmark caves); data-heavy. Pairs with #35/#36.
25. **#38 Clean up the Raid Islands** — M · ★★★½ — later generations leave
    50–60 species on one raid pool, turning raids into a shapeless grab bag.
26. **#39 DLC regions from later games** — M–L · ★★★★ — promote Isle of
    Armor, Crown Tundra, Kitakami and the Terarium to first-class regions.
27. **#40 Alola / Galar / Paldea league structures** — M · ★★★½ — trials, the
    Champion Cup and any-order gyms don't fit the 8-gyms + E4 model.
28. **#18 Better settings** — M · ★★★★ — centralises QOL toggles and the
    export/import from #15.

### Tier 3 — Medium effort, medium gain

29. ✅ **#3 Daycare inheritance** — shipped 0.10.0 (3 inherited IVs, a 50%
    inherited nature, and inherited moves).
30. ✅ **#6 Friendship / happiness** — shipped 0.12.0 (friendship rises with
    levels and wins; gates 17 friendship evolutions).
31. ✅ **#9 Move tutor / TMs** — shipped 0.24.0 (per-species machine moves,
    taught for $4,000 in the Manage Moves panel).
32. **#11 NPC gifts & static encounters** — M · ★★★
33. ✅ **#17 Pokéball variants** — shipped 0.13.0 (Quick/Timer/Repeat/Net/Dive/
    Dusk/Nest/Premier with situational rates; auto-catch picks the best).
34. **#27 Gender-specific sprites** — M · ★★★ (assets are half-there)
35. **#29 Minigames** — M–L · ★★★ (small per minigame once one exists)
36. **#4 In-battle Mega evolution** — M–L · ★★★
37. ✅ **#32 Battle Tower tuning** — shipped 0.10.0 (auto-climb, rarer
    tokens, six fully evolved teams plus legendaries late).

### Tier 4 — Big and low-return, defer

38. **#10 Weather & terrain** — M · ★★½ (nice depth, no urgency)
39. **#19 Online sync** — L · ★★★ — the project's first backend; needs a
    design doc and real ops for modest player value today.

---

## 1. Healing items / Potions (#9)

The bag has **no consumables at all** — the only healing is the full-party heal
animation between battles (`HEAL_PARTY` / `healing-scene.js`). Add potions and
revives as a money sink and a tactical option.

- [ ] Add items to `src/data/items.js` (`activeItems` or a new consumable
      category): Potion / Super Potion / Hyper Potion / Revive, with `buyPrice`.
- [ ] Sell them in marts (`martShopItems` for Kanto, the generated `mart` blocks
      in `map-data`).
- [ ] Add a "Use item" action (reducer) that heals a party member / revives a
      fainted one, plus a bag UI to use it in and out of battle.
- [ ] Decide whether to auto-use at low HP (the game is idle) or require a
      manual/auto threshold setting.

Effort: **small**. No new data files.

## 2. Abilities, natures and held items (#2)

The biggest remaining feature. `pokemon-species.json` has only
`id/name/types/baseStats/baseExpYield/growthRate/catchRate` — no abilities,
natures or held items. Do it in slices:

### 2a. ✅ Abilities — shipped in 0.15.0

Done. `tools/fetch-abilities.cjs` writes `public/data/ability-data.json` (normal
+ hidden abilities from PokeAPI); `rollAbility` assigns one in `createPokemon`
(and to wild/trainer teams), old saves get one in `repairSave`, and the stats
panel shows it. `src/game/abilities.js` + `src/game/combat.js` implement a first
set: Levitate and the type-absorbing abilities (Water/Volt Absorb, Flash Fire,
Sap Sipper, Lightning Rod, Storm Drain, Motor Drive, Dry Skin, Well-Baked Body),
Thick Fat, Multiscale/Shadow Shield, Filter/Solid Rock/Prism Armor, Huge
Power/Pure Power, Guts, Overgrow/Blaze/Torrent/Swarm, Sturdy, Intimidate, Wonder
Guard, Magic Guard, Speed Boost, Shed Skin and the status/stat blockers
(Immunity, Limber, Water Veil, Insomnia/Vital Spirit, Sweet Veil, Clear Body,
White Smoke, Hyper Cutter, Big Pecks, Keen Eye). Covered by
`tests/abilities.test.mjs`. Remaining: contact abilities (Static, Flame Body,
Rough Skin), weather abilities, switch-out abilities, and the rest of the 299.

### 2b. ✅ Natures — shipped in 0.9.3

Done. `src/data/natures.js` holds the 25 natures; `createPokemon` rolls one,
`calculatePokemonStats` applies the ±10% modifier (`getLevelUpResults` callers
pass the Pokemon's nature so level-ups/evolutions stay consistent), and the
stats panel shows it. Existing saves are migrated in `repairSave` (a nature is
rolled and stats recomputed for Pokemon that lack one). Re-rolls use a
**Nature Mint** (2 Victory Tokens in the Reward Shop) consumed from the Bag on a
party Pokemon via `USE_ITEM_ON_POKEMON`. Daycare inheritance (#3) can now
inherit the parents' natures.

### 2c. ✅ Held items — shipped in 0.16.0

Done. `heldItems` (`src/data/items.js`) holds 28 items with effect descriptors;
the Bag gained a **Held Items** tab (`USE_ITEM_ON_POKEMON` equips, swapping any
previous item back to the bag, `CLEAR_HELD_ITEM` takes it off) and the stats
panel shows/removes the held item. `src/game/held-items.js` provides the pure
lookups; `combat.js` applies Leftovers, Life Orb, stat boosts (Choice
Band/Specs/Scarf, Assault Vest), Eviolite, Focus Sash, Sitrus/Lum Berries and
the 18 type boosters, and `heldItemUsed` is threaded through the volatile state.
Wild (8%) and trainer/tower (30%) Pokemon roll a held item from the same pool.
Covered by `tests/held-items.test.mjs`. Remaining: Choice-move locking, more
berries, contact items (Rocky Helmet), and the rest of the item list.

## 3. ✅ Daycare inheritance (IVs / egg moves / natures) — shipped in 0.10.0

Done. `inheritBreedingTraits` (`src/game/breeding.js`) rolls the egg's IVs,
then overwrites 3 random stats with the best of both parents' values, gives a
50% chance of a parent's nature, and pads the level-1 moveset with any of the
parents' moves that are in the family's learnset (up to 4). `createPokemon` /
`createEgg` take an optional `BreedingInheritance` argument and the Daycare
reducer passes it through. Covered by `tests/breeding.test.mjs` and
`tests/eggs.test.mjs`. A Destiny Knot / Everstone item layer is still possible
later.

## 4. In-battle Mega evolution

Megas exist only as level-100 **evolutions** (`evolution-data.json`); there's no
mid-battle transformation.

- [ ] Give Mega-capable Pokémon a held Mega Stone (ties into #2c).
- [ ] Add a battle action / auto-trigger that swaps to the Mega form for the
      rest of the battle (stats + typing), then reverts.
- [ ] Decide whether this replaces the current level-100 evolution or sits
      alongside it.

Effort: **medium–large**.

## 5. ✅ Daily / periodic events — shipped in 0.9.4

Done. `src/data/daily-events.js` defines four events (Harvest / Fortune /
Training / Lucky); one is rolled per local calendar day (deterministically from
the date, refreshed at midnight by `useDailyEvent` in `game-layout.js`) and
surfaces from a gift button in the battle top bar plus a toast. Effects use
small pure multipliers applied at their call sites: EXP (`awardExperience`),
trainer prizes (`hooks.js`), wild drops (`reducer.js`) and wild shiny odds
(`resolvePokemonEncounter`/`resolveRoamer`). `CLAIM_DAILY_GIFT` grants a
once-per-day gift; `REFRESH_DAILY_EVENT` re-rolls on a new day. Saved and
sanitised in `context.js`, covered by `tests/daily-events.test.mjs`.

## 6. ✅ Friendship / happiness — shipped in 0.12.0

Done. Every Pokemon carries a `friendship` value (base 70, shown as a \u2665 badge
in the stats panel), raised by +8 per level-up and +2 per wild battle won
(`gainFriendship` in `src/game/pokemon.js`). The canonical friendship
evolutions are now gated on friendship 160 instead of a level via
`tools/add-friendship-evolutions.cjs`: Golbat\u2192Crobat, Chansey\u2192Blissey,
Pichu\u2192Pikachu, Cleffa/Igglybuff, Togepi, Azurill, Budew, Buneary, Chingling,
Munchlax, Riolu, Woobat, Swadloon, Snom, Type: Null and Eevee\u2019s
Espeon/Umbreon/Sylveon. `getEvolutionOptions` (`src/game/breeding.js`) is now
shared by the party and box UIs and checks the friendship/level/item gates.
Covered by `tests/friendship.test.mjs`.

## 7. ✅ Offline / idle progress — shipped in 0.9.26

Done. The save records `savedAt`; on load, `computeOfflineReward` grants money
(per hour away per level of your highest party Pokemon) plus Exp. Candies,
capped at 8 hours and ignored under a minute. The reward is applied by the save
loader and surfaced once by `OfflineProgressModal` ("While You Were Away"),
cleared with `CLEAR_OFFLINE_REPORT`. Covered by `tests/offline.test.mjs`. The
online-while-hidden "away alert" (0.9.8) still covers a hidden tab; this covers
time the game was fully closed.

Effort: **medium–large** (a real design decision, but high impact).

## 8. Pokémon management / IV checker

IVs are generated in `createPokemon` but never shown, and the box has no search
or protection against releasing something valuable.

- [x] IV display / judge (sum IVs stars, like the in-game judge). Shipped in
      0.9.17 (`judgeIVs` + stat chips in the stats panel).
- [x] Nicknames — set from the stats panel, shown across the UI. Shipped
      0.9.18 (`SET_NICKNAME` + `pokemonDisplayName`).
- [x] Favourite / lock a Pokémon so Release and Wonder Trade skip it. Shipped
      in 0.9.17 (`TOGGLE_FAVOURITE`).
- [x] Box search + filter (name / species / nickname, plus Shiny/Fav). Shipped
      0.9.18.
- [x] "Release all duplicates" bulk tool. Shipped 0.9.20 (`RELEASE_DUPLICATES`),
      keeping the best of each species and protecting favourites/shinies.

Effort: **medium**.

## 9. ✅ Move tutor / TMs — shipped in 0.24.0

Done. `tools/fetch-tm-learnsets.cjs` writes `public/data/tm-learnsets.json`, the
machine (TM) moves each species can learn in its newest game (from the cached
PokeAPI `/pokemon/{id}` responses). `getTutorMoves` / `isTutorMove`
(`src/game/pokemon.js`) expose the cross-family moves, and the Manage Moves panel
lists them with a price; `SET_MOVES` charges `tutorMoveCost` ($4,000) per newly
taught TM (level-up moves stay free) and refuses if you can't afford it.
Covered by `tests/move-tutor.test.mjs`. A one-TM-per-move item list is still
possible later.

## 10. ✅ Weather & terrain — shipped in 0.17.0 / 0.20.0

Done for weather (0.17.0): `state.weather` (`{ type, turns }`) is set by Rain
Dance / Sunny Day / Sandstorm / Snowscape / Hail and by Drizzle / Drought / Sand
Stream / Snow Warning on entry, and threaded through `resolveBattleTurn` as a
`weather` event. `src/game/weather.js` holds the pure helpers: Water/Fire damage
scaling, Swift Swim / Chlorophyll / Sand Rush / Slush Rush speed, sandstorm/hail
chip damage, and Rain Dish / Dry Skin / Ice Body healing.

Done for terrain (0.20.0): `src/game/terrain.js` mirrors it \u2014 Electric / Grassy /
Misty / Psychic Terrain from their moves and the Surge abilities, with grounded
checks for damage boosts, Grassy healing and Earthquake softening, Electric
sleep immunity, Misty status immunity, and Psychic priority blocking.

Remaining:

- [ ] Terrain synergy abilities (Grass Pelt, Hadron Engine, Quark Drive), terrain
      rocks/extended duration, and route-based field effects.
- [ ] Weather-ball / move accuracy interactions (Thunder, Hurricane, Blizzard).

Effort: **medium**.

## 11. NPC gifts & static encounters

Towns are currently marts + gyms; a few one-off NPCs would add flavour and
content (and give fossils/starters a clean source outside the raid pool).

- [ ] A gift NPC per region (fossil, starter, an item) gated on a flag.
- [ ] Static overworld encounters (a fixed species/level you catch once).
- [ ] Reuse the boss-battle / wild-encounter plumbing.

Effort: **medium**. Needs small new state flags.

## 12. Dex-completion rewards

Completing a generation currently only unlocks that generation's Shiny Charm.

- [ ] Per-generation reward on completion (an item, tokens, a Master Ball, a
      rare encounter unlock).
- [ ] A "Dex rewards" section in the Records panel.

Effort: **small**.

## 13. Auto-travel / idle QoL

When a gate is satisfied the player still has to travel manually.

- [ ] Optionally advance to the next unlocked location automatically once the
      current route's gate is met.
- [ ] Optional auto-heal / auto-switch already partly exists (party switch on
      faint) — expose it as a setting.

Effort: **small**.

## 14. ✅ A lightweight test suite — shipped

Done. `npm test` runs `node --test "tests/**/*.test.mjs"`. `tests/helpers/game-data.mjs`
loads the real `public/data` JSON into `window.gameDataInjector` so the src
modules can be `import()`ed headlessly (call `installGameData()` first, then
dynamic-import). Covered: `computeUnlockedLocations` (badge gates + prestige
re-lock), `getRegionUnlockTokens`, `resolveBattleTurn` (status/drain/residual
poison/roamer flee), breeding compatibility and egg species, `checkShinyOdds`,
`shinyChainMultiplier`, natures including the mint and save migration, and the
reducer's starter/catch/box-order/Master Ball flows. See AGENTS.md for the
pattern.

## 15. Save management & sharing

A save lives in one versioned `localStorage` key with no user-facing control.

- [ ] Export the save to a JSON file / import one back (reuse the repair path).
- [ ] Multiple save slots (pick a slot at boot).
- [ ] A shareable code (base64 of the save) for trading collections.

Effort: **small–medium**.

## 16. More ideas (unsorted)

Smaller or more speculative, roughly highest-value first:

- [x] **Achievement rewards** — medals now pay a one-off reward (money /
      Victory Tokens / items, including Master Balls); claimed in
      `CLAIM_ACHIEVEMENT_REWARDS`, surfaced in the Records panel. Shipped in
      0.9.5.
- [x] **Quests / missions** — three daily quests with progress bars and
      claimable money/token/item rewards, rolled from reachable routes/species
      (`src/game/quests.js`). Shipped in 0.9.14.
- [ ] **Ball variety** — see #17.
- [x] **Pokérus** — a very rare party-wide virus caught on a wild win that
      doubles EXP for 150 battles, shown as a PKRS badge on party slots and the
      stats panel. Shipped in 0.9.10 (`tickPokerus` / `pokerusExpMultiplier`).
- [x] **Map QoL** — the active swarm's route now carries a pulsing bee badge
      (hover for species + battles left), and the map has a search box that jumps
      to (and travels to) any unlocked location. Shipped in 0.9.6.
- [x] **Notifications** — opt-in browser notifications for key events while
      the tab is hidden, plus a "while you were away" summary on return. Shipped
      in 0.9.8 (browser alerts are foreground-only until #7 adds offline
      progress).
- [x] **Challenge modes: Randomizer & Level Scaling** — toggles in Settings that
      roll random wild species / match wild levels to your active Pokemon.
      Shipped 0.9.23.
- [x] **Challenge mode: Nuzlocke** — a Settings toggle; a fainted party
      Pokemon is released for good, sparing the last one so a full wipe can't
      brick the save. Shipped 0.23.0.
- [ ] **Challenge mode: monotype** — a single-type run is still open.
- [x] **Form-changing items** — reversible transforms now use their canonical,
      **reusable** items (Rotom Catalog, Gracidea, Meteorite, DNA Splicers, …)
      sold in the Reward Shop instead of a level gate; `START_EVOLUTION` leaves
      reusable items in the bag. Shipped in 0.9.15.
- [x] **Release rewards / item selling** — releasing now pays money + an Exp.
      Candy by level tier (double for shinies) via `releaseReward`, previewed in
      the release confirmation; selling items already shipped with #34. Shipped
      in 0.9.7.
- [x] **Accessibility: motion & colour** — a settings toggle forces reduced
      motion (overrides the OS), and "Move Type Labels" prints each move's type
      so it isn't colour-only. Shipped in 0.9.12.
- [x] **Accessibility: larger text** — a "Larger Text" Settings toggle scales
      the whole UI up 15%. Shipped 0.9.24 (CSS `zoom` on `body`).
- [x] **Audio** — synthesized (no asset files) chiptune themes per region plus
      event SFX, with separate Music and Sound Effects toggles under Settings →
      Audio, both off by default. Shipped in 0.9.13 (`src/game/audio.js`).
- [x] **Combat feedback** — damage now floats above the hit Pokemon and the
      sprite shakes on impact (both honour reduced-motion). Shipped in 0.9.11.
- [ ] **Performance pass** — the idle loop dispatches a lot per tick; look at
      memoisation / batching if it ever gets heavy.

## 17. ✅ Pokéball variants — shipped in 0.13.0

Done. Added Quick, Timer, Repeat, Net, Dive, Dusk, Nest and Premier balls to
`pokeBalls`/`ballOrder` (`src/data/items.js`) and a `getBallModifier`
(`src/game/catching.js`) that scales them by context: battle length (Quick /
Timer), Pokedex registration (Repeat), types (Net), water routes (Dive),
caves/night (Dusk) and target level (Nest). `attemptCatch` /
`selectBestBall` / `selectAutoCatchBall` all take a `CatchContext`, built in
`hooks.js` from the enemy, the Pokedex and the current location/time; auto-catch
picks the highest effective rate. The balls are sold in marts via
`standardMartItems` (gated on wild wins) with `pokeballColors` entries and rack
icons. Covered by `tests/catching.test.mjs`. Heal/Luxury/Friend balls still
possible (they'd need items/friendship effects).

## 18. Better settings

`settings-modal.js` currently only offers a save reset. A real settings panel:

- [ ] Gameplay: default catch rule, auto-catch / auto-heal / auto-switch /
      auto-proceed toggles, battle speed, "auto-travel to next unlock" (#13).
- [ ] Notifications: browser notifications and which events (shiny, rare, egg
      ready, box full) — pairs with #7 and #16.
- [ ] Display: reduced motion, damage numbers, larger text, colourblind-safe
      type badges, sprite style.
- [ ] Data: export/import the save (#15) and a confirmed reset.
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

## 20. ✅ Honey/Repel DexNav hunting — shipped in 0.10.0

Done. Once the shiny chain reaches 4, `resolveActiveModifiers`
(`src/game/progression.js`) locks the hunt: Honey boosts the hunted species'
weight 25× and an active Repel suppresses every other species to 2% weight, so
the chain can't be broken by a random encounter. Without a lock they keep their
old ×2 / ×0.5 nudges. `applyEncounterModifiers` is shared with
`route-encounter-grid.js`, so the displayed odds match the real roll and a
"Hunt locked" badge appears. Covered by `tests/hunting.test.mjs`.

## 21. Region Unlock Tokens once every region is unlocked

`getRegionUnlockTokens(state) = championsBeaten − (unlockedRegions − 1)`: each
Champion beat effectively grants one token and a token opens one region. With 9
regions, unlocking them all takes 8 tokens, so after that the mechanic is dead —
a leftover token has nothing to open, yet the Town Map still shows the
token banner / unlock prompt.

- [ ] Stop showing and granting tokens once `unlockedRegions.length ===
      regions.length` (hide the banner and the unlockable tab styling).
- [ ] Give leftover tokens a use: convert them to Victory Tokens (the Reward
      Shop currency), or a one-off bonus (money / a Master Ball / a raid
      re-roll), so beating the last Champions isn't wasted.
- [ ] Decide automatic vs manual conversion (e.g. auto-convert on unlocking the
      last region, or keep them and show a "convert" button).

Relevant code: `getRegionUnlockTokens` (`src/game/progression.js`), the token
banner + `UNLOCK_REGION` (`src/components/town-map.js`, `src/game/reducer.js`),
and `victoryTokens`.

Effort: **small**.

## 24. Move data pass (first slice shipped in 0.11.0)

`possible-moves.json` only carries `name / type / category / power / accuracy /
pp / priority / effect`, and the engine understands just three effect types
(`statChange`, `drain`, `status`). That left a lot of dead data and wrong
behaviour.

**Shipped in 0.11.0** via `src/data/move-effects.js` (merged onto `moveData` in
`gameData.js`): a `heal` effect (Recover/Roost/Synthesis/Rest/…), `multiHit`
counts, `critStage` for high-crit moves, `protect`, plus corrections for Calm
Mind's stat keys, the G-Max categories and several priority values.

Still open:

- [ ] The remaining no-op status moves: screens (Reflect/Light Screen/Aurora
      Veil), hazards (Stealth Rock/Spikes/Toxic Spikes/Sticky Web), Taunt,
      Substitute, wish/protect variants, weather setters, etc.
- [ ] Re-check the rest of the priority table (the doubles-only moves).
- [ ] PP is stored but unused; decide whether to implement it or drop it.
- [ ] Z-moves / G-Max moves are otherwise dead data — decide keep/drop.

Effort: **medium–large** (the effect set is the bulk of it).

## 25. Battle engine pass (first slice shipped in 0.11.0)

`resolveBattleTurn` (`src/game/combat.js`) is fairly complete for damage +
status + stat changes, but move selection and several mechanics were missing.

**Shipped in 0.11.0**: healing (`heal` effect, including Rest's self-sleep),
multi-hit execution, critical-hit stages, Protect/Detect blocking, hyphenated
stat-key normalisation, and a `chooseMoveForBattle` chooser so the auto-battler
and trainers heal when low and set up early.

Still open:

- ✅ **Entry hazards** (Stealth Rock, Spikes, Toxic Spikes, Sticky Web) —
      shipped 0.18.0 (battle-level side state + switch-in hook).
- ✅ **Accuracy / evasion stat stages** — shipped 0.14.0.
- ✅ **Additional statuses** — paralysis/toxic/confusion (0.11.1), Leech Seed
      (0.14.0), infatuation/Curse (0.21.0) and Haze/Clear Smog stat reset (0.22.0)
      shipped. Ability-based statuses remain (see the ability list).
- ✅ **Weather / terrain** — weather (0.17.0) and terrain (0.20.0) shipped (#10).
- [ ] Ability / held-item hooks — **contact abilities (Static / Flame Body /
      Poison Point / Effect Spore / Cute Charm / Rough Skin / Iron Barbs)
      shipped 0.22.0**; the rest of the ~300 abilities remain (see #2a).
- ✅ **Damage / crit-rate balance pass** — 0.22.0: base crit is the modern
      1/24, with Super Luck (+1 stage), Sniper (2.25× crits) and Battle Armor /
      Shell Armor (crit immunity).
- ✅ **AI polish** — don't spam setup shipped 0.21.0. *(Switching on a bad
      matchup is intentionally discarded: an auto-switching opponent is
      frustrating to play against.)*
- [ ] Battle polish: move animations / damage numbers / hit feedback — see #16.

Effort: **medium–large** (do it in slices).

## 26. README + GitHub "About"

The repo root has no `README.md` and no `LICENSE`, and the GitHub repo has no
About blurb — the front door is missing. `AGENTS.md` is developer-facing and too
long/technical to double as one.

- [ ] **Header**: the playable link (demo/deploy) up top, short **badges**
      (CI/build, license, current game version) and a one-line pitch.
- [ ] **What it is**: a client-only browser incremental Pokémon game (React 19 +
      Vite, no backend, no account); progress saves to `localStorage`.
- [ ] **Screenshots / GIF** of the battle scene, town map and Pokédex.
- [ ] **Features**: a highlight list linking the full player guide
      (`public/guide.html`) — 9 regions, gyms/Elite Four/Champion, raids,
      evolution items, breeding, Wonder Trade, shiny hunting, Battle Tower,
      prestige, region unlock tokens.
- [ ] **Current version** (`GAME_VERSION` in `src/data/changelog.js`) and a link
      to the changelog / patch notes.
- [ ] **Run locally**: `npm install`; `npm run dev` → http://localhost:5173;
      `npm run build` (static `dist/`); `npm run preview`; dev checks
      `npm run typecheck` and `npm run validate`.
- [ ] **Deploy**: it's a static bundle, so GitHub Pages / Netlify / any static
      host works (point them at `dist/`).
- [ ] **Project layout**: the short table, plus "read `AGENTS.md` before
      contributing" (the `src/` tree was decompiled/de-minified and follows
      specific conventions, e.g. no semicolons, `jsx()` runtime calls).
- [ ] **Data & credits**: content is scraped/derived from **PokéAPI** (species,
      encounters, learnsets, breeding data), **Bulbapedia** (region maps,
      Paldea areas) and **Pokémon Showdown / PokéAPI sprites** — thank them and
      state the unofficial, non-commercial fan-project status (Pokémon ©
      Nintendo / Creatures / GAME FREAK).
- [ ] **FAQ / troubleshooting**: "is this official?" (no), "where is my save?"
      (`localStorage`; reset it from Settings), "why did encounter data change?"
      (data is regenerated from real games), stale-dev-server note on Windows.
- [ ] **Community**: link the subreddit the patch notes already point to
      (`r/PkmnIdle`).
- [ ] **Roadmap**: link `TODO.md` and/or the changelog.
- [ ] Decide a license (currently none) and add a `LICENSE` file.
- [ ] **CI** (optional): a GitHub Action running `typecheck` + `validate` on
      PRs — doubles as the build badge.
- [ ] GitHub **About**: a short description, the playable URL, topics/tags
      (`pokemon`, `idle-game`, `incremental`, `react`, `vite`) and a
      social-preview image.
- [ ] Optional: `CONTRIBUTING.md`, issue/PR templates and a
      `CODE_OF_CONDUCT.md`.

Effort: **small**.

## 27. Gender-specific sprites

Gender now exists (`genderForPokemon` in `src/game/breeding.js`, shown in the
stats panel) but sprites still ignore it: `getPokemonSpriteUrl(spriteId, isBack,
isShiny)` (`src/game/pokemon.js`) keys only by numeric id, so a female Pokemon
always renders the male artwork. Several species are visually different by
gender (Pikachu line, Hippopotas/Hippowdon, Unfezant, Frillish/Jellicent,
Meowstic, Pyroar, Indeedee, …), which is exactly the set the sprite tree already
carries `female/` folders for.

What already exists:

- Animated: `.../animated/female/`, `.../animated/shiny/female/`,
  `.../animated/back/female/`, `.../animated/back/shiny/female/` are committed
  for the ~96 ids that have a difference.
- Static: `public/sprites/pokemon/back/female/` and `back/shiny/female/` are
  committed (93/94 files), but the **front** and **front-shiny** female
  folders are missing, and `tools/download_pokemon_sprites.cjs` never fetches
  any female variant (see `STATIC_VARIANTS` / `ANIMATED_VARIANTS`).

- [ ] Thread gender into `getPokemonSpriteUrl` (a `gender`/`isFemale` argument,
      or look it up from the Pokemon) and build the `female/` path for each of
      the four variants; update `getPokemonSpriteFallbackUrl` too.
- [ ] Update the call sites that render a specific Pokemon (battle scene, box,
      party, daycare, dex?, bag) to pass the gender — a Pokemon's gender is
      derived from its id, so it must come from the object, not the species.
- [ ] Extend `tools/download_pokemon_sprites.cjs` with the four female
      variants (PokeAPI `female/{id}.png`, `back/female/...`,
      `shiny/female/...`, `back/shiny/...`) and download the missing front
      static files.
- [ ] Only use the female sprite for species that actually have one; fall back
      to the base sprite otherwise. Extend `animated-sprites.json` (or add a
      `gendered-sprites.json` list) so the fallback is a manifest lookup, not a
      404.
- [ ] Check genderless/undiscovered Pokemon (gender `genderless`) never request
      a female path.

Relevant code: `getPokemonSpriteUrl` / `getPokemonSpriteFallbackUrl`
(`src/game/pokemon.js`), `genderForPokemon` (`src/game/breeding.js`), the sprite
manifest loader (`src/data/gameData.js`), and
`tools/download_pokemon_sprites.cjs`.

Effort: **medium** (mostly asset plumbing; assets are partly there already).

## 28. More region areas (DLC, caves, POIs)

The maps are built from PokéAPI/Bulbapedia **towns + numbered routes** only
(`tools/scrape-region-maps.cjs`), then `tools/generate-regions.cjs` turns them
into 21-52 locations per region (Kanto 49, Hoenn 52, Unova 45, …). That leaves
three gaps:

### 28a. DLC / expansion areas

Later generations' DLC regions are simply missing, so those Pokemon have no
native route and fall into a Raid Island pool instead:

- Galar — **Isle of Armor** and **Crown Tundra** (Sword/Shield Expansion Pass).
- Paldea — **Kitakami** (Teal Mask) and **Blueberry Academy / Terarium**
  (Indigo Disk). `paldea-mossui-town` is already scraped into `paldea.json` but
  as a bare town with **no encounter bucket**, so it's a dead end.
- (Optionally earlier post-game islands: Kanto's Sevii Islands, Unova's
  Black/White 2 areas.)

- [ ] Add the DLC areas to `tools/region-maps.json` (scraper or a committed
      override) and give them encounter tables, or inject them with the
      existing `EXTRA_MAP_AREAS` mechanism, which already supports an explicit
      `node` / `species` / `connect` / `rank`.
- [ ] Slot them into the level curve and unlock order so they read as post-game
      (`levelRoutes()` ranks by route number / BFS depth today — DLC areas need
      a forced `rank` or `unlockOrder`).
- [ ] Re-check each region's `raidPool` after adding them — species that now
      have a native route must drop out of the raid pool.

### 28b. More ordinary areas

The scraper only keeps towns and routes, so caves, forests, tunnels, ruins,
towers, lakes/seas and safari zones are absent unless hand-added. `EXTRA_MAP_AREAS`
currently carries only Johto's Bell Tower / Whirl Islands / Mt. Silver.

- [ ] Grow `EXTRA_MAP_AREAS` (or scrape the remaining landmark locations) with
      their own species lists so they don't drag a whole generation slice in.
- [ ] Consider a real `type` / `areaType` field (cave, forest, sea, ruins, …)
      instead of the current binary town-vs-route; `location-panel.js` labels
      everything non-town as "Route 🌿", and the battle background comes from
      the `ROUTE_BACKGROUND_RULES` / dominant-type heuristic.

### 28c. Points of interest (POIs)

Non-route nodes that offer a service or flavour: a Daycare stop, a Move
Tutor / TM vendor, a fishing spot, a berry patch, a raid den, a static
encounter, a legendary shrine, a mart/café — whichever fits. Today services are
mostly global (Daycare) or attached to towns, so there's no map-level way to
surface them.

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

Every activity is currently automatic: battles resolve on a timer, catches roll
from `autoCatch`/catch rules, breeding and swarms advance on battle counts. A
few optional minigames would give the player something hands-on without
disturbing the idle loop. They'd all sit alongside it — the player opts in, and
the idle game keeps running if they don't.

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
and would give the friendship idea (#6) a purpose:

- [ ] Pick (or pin) one party Pokémon as the companion; add `care` state
      (hunger / happiness / energy) that decays on a real-time timer or battle
      count.
- [ ] Feed / play / rest actions with small cooldowns, costing money or berries;
      raising friendship and a temporary bonus (EXP, catch rate, shiny odds).
- [ ] Visual feedback — an animated buddy panel / petting scene using the
      existing sprite helpers.
- [ ] Decide whether care is purely a bonus or feeds evolution/breeding (it
      pairs with friendship evolutions, #6).
- [ ] Keep it optional and non-punishing (the game is idle) — neglect should
      pause bonuses, not damage the Pokémon.

### 29c. More minigame ideas (pick from these)

Minigames can share one modal + reducer pattern (`type: 'minigame'` phase or a
small self-contained state slice), so adding a second is much cheaper than the
first:

- [ ] **Casino / slots / Voltorb Flip** — a money sink with tokens or items as
      prizes (ties into the Reward Shop economy).
- [ ] **Bug Catching Contest / Safari Zone** — timed, bait/ball limited, judged
      on the catch (Johto's National Park, Kanto's Safari Zone).
- [ ] **Berry growing + blending** — plant/pick berries on a timer, blend into
      Poffins/items (ties into care and held items, #2c).
- [ ] **Sinnoh Underground / mining** — tap-to-dig for fossils, stones and
      evolution items (a clean source for the item evolutions).
- [ ] **Battle Tower already exists** — extend it with its own rewards rather
      than a new mode.

Relevant code: the real-time loop and battle-count ticks (`src/hooks.js`
`useGameLoop`, `tickBattleCounters` in `src/game/progression.js`), the reducer's
`daycare` / `activeEffects` slices (`src/game/reducer.js`), the Daycare UI
(`src/components/daycare-modal.js`) and Battle Tower as a side-activity
precedent. New state goes in `initialGameState`, `context.js` and
`src/types.d.ts`.

Effort: **small per minigame, medium–large as a feature** (each is a
self-contained modal + state slice; fishing and care are the two biggest).

## 30. Caught / event QOL indicators

The save already tracks `pokedexSeen`, `pokedexCaught` and `shinyCaught`, and
the Pokédex + `route-encounter-grid` mark what you own — but the live battle
screen doesn't, and the only transient on-screen message is the hard-coded
`LevelUpNotification` (`levelUpNotification` + `CLEAR_LEVEL_UP`). Everything
else scrolls past in the battle log. Two small QOL wins, plus a reusable hook
for custom events.

### 30a. "Already caught" indicator

- [ ] Add a caught indicator to the enemy's name row in `enemy-info-box.js`
      when `pokedexCaught.includes(pokemon.speciesKey)`, so you can tell at a
      glance whether the wild Pokemon is new. **Use a Pokéball sprite** (reuse
      `PokeballIcon` / `pokeballColors` in `src/data/ui.js`), not a text ✓ —
      the ball reads instantly as "already in the ball".
- [ ] Mirror it on the encounter list / Pokedex tile (already shows caught) and
      distinguish *seen* vs *caught* vs *shiny caught* (`shinyCaught`), e.g. a
      plain ball vs a shiny-tinted ball.
- [ ] Maybe flag the battle sprite too (a small marker), and keep it off for
      trainer teams / raids where the species isn't the reward.

### 30b. Event toasts ("You found X!", "You caught Y!")

Generalise `LevelUpNotification` into a small notification queue so events can
surface without staring at the log:

- [ ] State `notifications: []` (`{ id, message, tone, icon?, speciesKey?,
      createdAt }`) with `PUSH_NOTIFICATION` / `DISMISS_NOTIFICATION`, rendered
      by a `<NotificationStack>` (auto-dismiss + queue cap + dedupe/cooldown so
      it never spams).
- [ ] Fire on meaningful events: first-time seen ("You found a wild X!"),
      first-time caught ("X was registered in the Pokédex!"), a duplicate
      catch, shiny found/caught, egg hatch, evolution, level-up
      (existing), badge / league win, region or route unlock, achievement, rare
      item, raid start. New-catch detection is just
      `!state.pokedexCaught.includes(speciesKey)` at the dispatch site in
      `src/hooks.js`.
- [ ] Keep the message at the dispatch site or centralise a `notify(...)`
      helper (`src/game/progression.js` / a small util) so the tone and copy
      stay consistent.
- [ ] **Custom events**: because `PUSH_NOTIFICATION` is generic, data-driven
      events (patch-note promos, anniversaries, seasonal/holiday bonuses, secret
      codes, the Konami cheat) can push their own toast without new state —
      optionally behind a tiny event registry mapping an event id → message /
      icon / duration.

Relevant code: `level-up-notification.js` and the `levelUpNotification` /
`CLEAR_LEVEL_UP` case (`src/game/reducer.js`), `enemy-info-box.js`,
`route-encounter-grid.js`, and the `MARK_SEEN` / `MARK_CAUGHT` flow
(`src/hooks.js`). Render the stack from `game-layout.js` so it works on every
screen.

Effort: **small–medium**.

## 32. ✅ Battle Tower auto-climb, payout and difficulty — shipped in 0.10.0

Done. A tower win now heals the party and immediately builds/starts the next
floor in `BOSS_BATTLE_END` (`src/game/reducer.js`), so a run only ends on a
loss. `buildTowerTeam` (`src/game/progression.js`) always fields six fully
evolved Pokemon (first pick from a strong pool, so at least one is genuinely
strong), starts at Lv.55 + 3/floor, scales stats from floor 15 and allows
legendaries from floor 40 (all capped at Lv.100). Payout is 1 Victory Token
per 10 floors. Covered by `tests/battle-tower.test.mjs`.

**0.16.1:** the tower is now **Hoenn-only** (`BATTLE_TOWER_REGION` in
`src/data/config.js`). It no longer leaks a run's floor between regions or
credits another region's record, and `repairSave` consolidates legacy
per-region records into Hoenn (see `tests/battle-tower.test.mjs`). Other regions
are meant to get their own minigames instead — see #29.

**0.19.0:** the tower is a **deterministic puzzle**. `buildTowerFloor(floor)`
(`src/game/progression.js`) seeds the roster and ability/item rolls from the
floor number via `src/game/rng.js`, and `resolveBattleTurn(..., deterministic)`
drops crits, misses, damage variance, random status effects and the random AI
gates. The Gym panel previews the next floor's opponents so the player can plan.
Covered by `tests/deterministic.test.mjs`.

## 33. Rare Candy and EXP Candy as rare drops

Levelling only comes from battle EXP (`awardExperience`), and the only item
drops are balls plus the very rare wild **Master Ball**
(`wildMasterBallChance` in `src/data/config.js`, granted in the wild win path of
`src/game/reducer.js`). Add the Gen 6+ candies as rare finds so a lucky drop can
push a Pokemon forward:

- **Rare Candy** — +1 level instantly, capped at Lv.100.
- **EXP Candy S / M / L / XL** — a flat chunk of EXP (Sword/Shield style),
  tiered so bigger candies are rarer.

- [ ] Add the candies to `src/data/items.js` with a description and
      `buyPrice: null` (drops only, or a token-shop entry later).
- [ ] Add a `USE_CANDY` action that applies the level/EXP to a chosen party
      Pokemon, using `calculateRequiredExperience` and respecting the Lv.100
      cap and growth rate; needs a target picker (bag or stats panel).
- [ ] Hook a rare roll into the wild win path next to the Master Ball find
      (and optionally raids / the Tower as guaranteed or higher-tier drops):
      EXP Candy reasonably rare, Rare Candy much rarer.
- [ ] Decide tiers/amounts and whether any candy is region- or
      generation-gated.
- [ ] Add a **Candies** (or Consumables) category to `bagCategories` so they
      don't mix with balls/Key items.

Relevant code: `src/data/items.js`, the wild win path / inventory
(`src/game/reducer.js`), `awardExperience` (`src/game/progression.js`),
`calculateRequiredExperience` (`src/game/pokemon.js`), `wildMasterBallChance`
(`src/data/config.js`).

Effort: **small–medium**.

## 34. Valuable items you can sell (extend the shops)

Money only comes from winning battles and nothing can be sold: `BUY_ITEM`
(`src/game/reducer.js`) only handles `pokeBalls` and `activeItems`, no item has a
`sellPrice`, and the Bag has just `pokeballs` + `items` categories
(`bagCategories`). Add the classic treasures — Nugget, Big Nugget, Stardust,
Star Piece, Pearl, Big Pearl, Comet Shard, … — as rare drops that sell at marts.

- [ ] Add the valuables to `src/data/items.js` with a `sellPrice` (and
      `buyPrice: null`); they are found items, not stock.
- [ ] Add a `SELL_ITEM` action that removes from `inventory` and credits
      `sellPrice * quantity`, guarded by ownership.
- [ ] Extend the shops: a **Sell** tab/section in `ShopPanel`, or a sell action
      from the Bag. `ShopPanel` currently renders `shopDef.items` as buy rows
      and assumes every entry is a ball or active item.
- [ ] Add a **Valuables** bag category so treasures are listed separately.
- [ ] Roll the drops on the wild/trainer/raid win paths (like the Master Ball
      find), scaling the tier with the battle so late-game battles pay better.
- [ ] Balance selling against battle payouts (a bonus money source, not the
      dominant one), and decide whether the Reward Shop also takes treasures.
- [ ] Consider one item registry (`{ category, buyPrice, sellPrice, effect }`)
      instead of the separate `pokeBalls` / `activeItems` / `evolutionItems`
      shapes, since `BUY_ITEM` hardcodes the first two.

Relevant code: `src/data/items.js` (`bagCategories`, `martShopItems`,
`tokenShopItems`), `BUY_ITEM` / inventory (`src/game/reducer.js`), `ShopPanel`
(`src/components/shop-panel.js`), the generated `mart` blocks in
`public/data/map-data/*.json`, and the wild win path in `src/game/reducer.js`.

Effort: **small–medium** (items + sell action + a shop Sell section); larger if
the item registry is unified.

---

## 35. Go through the Galar map and add the missing areas

Galar is currently the thinnest region map. The generator only keeps PokéAPI
**towns + numbered routes**, so most of Galar is absent: the Wild Area is a
single node, and **Isle of Armor** / **Crown Tundra** (Expansion Pass) don't
exist at all. As a result a large slice of the Galar dex has no native route and
gets pushed into Galar's Raid Island pool. This is the focused Galar pass;
#28a/#28b cover the same gaps generally and #36 proposes the zone model the
Wild Area needs.

- [ ] Audit `public/data/map-data/galar.json` and
      `public/data/encounter-data/galar.json` against a real Galar map and
      write down what's missing — the Wild Area sub-areas (Rolling Fields,
      Dappled Grove, Giant's Mirror, Lake of Outrage, …), Slumbering Weald,
      Galar Mine, Glimwood Tangle, and any towns/routes the scraper skipped.
- [ ] Add what the scrapers can (`tools/scrape-region-maps.cjs` + cached
      Bulbapedia connections, then `tools/scrape-route-encounters.cjs` for the
      encounter tables); inject the rest with
      `EXTRA_MAP_AREAS` in `tools/generate-regions.cjs`, which already supports
      an explicit `node` / `species` / `connect` / `rank`.
- [ ] Model the Wild Area as a **zone** (#36) rather than one giant route, with
      each named sub-area holding its own encounter table/background.
- [ ] Re-run `tools/generate-regions.cjs` and re-check Galar's `raidPool` —
      species that now spawn natively must drop out of it.
- [ ] Keep the progression sensible: mainland Galar stays on the 5–75 curve,
      and the DLC is post-game (after the Champion) via a forced `rank` /
      `unlockOrder`.

Relevant code: `tools/scrape-region-maps.cjs` (`MANUAL_BRIDGES`, which already
carries the Wild Area links), `tools/scrape-route-encounters.cjs`,
`tools/generate-regions.cjs` (`EXTRA_MAP_AREAS`, `levelRoutes`, raid pools),
`public/data/map-data/galar.json` and `public/data/encounter-data/galar.json`,
and `raidPoolFor` in `src/data/gameData.js`.

Effort: **medium** (mostly data; the Wild Area zone work depends on #36).

## 36. Zones — route-like chunks of areas

The map is a graph of single nodes joined pair-wise: a town or one route per
node. That fits Kanto–Unova, but the later regions aren't a linear route chain,
and they map badly today:

- **Alola** is four islands of trial areas — the generator has no way to show an
  island as a unit, so areas are stitched on by proximity and several islands
  read as separate disconnected clusters.
- **Galar**'s Wild Area is dozens of named sub-areas wrapped around the map; it
  currently collapses to one node.
- **Paldea** is open-world provinces of "<Dir> Province (Area N)" with no
  numbered routes at all, so it falls back to BFS-depth ordering and trims each
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

Effort: **medium–large** (a small data-model change plus map/encounter UI, but
it unblocks the three regions that don't fit the route graph today).

## 37. ✅ Master Ball as a dedicated, animated catch — shipped in 0.9.2

Done. `THROW_MASTER_BALL` / `COMPLETE_MASTER_BALL` (`src/game/reducer.js`) catch
a live wild encounter (raids included) from a new `catching` phase that pauses
the idle loop; `MasterBallScene` (`src/components/master-ball-scene.js`) plays
the throw/flash/wobble/click animation before the catch resolves. The Master
Ball is excluded from `selectBestBall` (so auto-catch and the
always-catch-shinies rule can never spend one) and hidden from the
catch-settings ball picker; it is thrown only from the battle button, which
since 0.10.1 only appears for legendaries or hard-to-catch unregistered species.
The catch registers in the Pokedex and fires the usual new/repeat/shiny toasts.

## 38. Clean up the Raid Islands (later generations are bloated)

The raid scan gives each region its generation's species that appear on **no**
region's wild routes and can't be reached by breeding/evolving a route species.
Because later dexes are huge (and their DLC/regional forms have no native
route), the pools balloon:

| Region | Gen | raid pool |
| --- | --- | --- |
| Kanto | 1 | 9 |
| Johto | 2 | 12 |
| Hoenn | 3 | 15 |
| Sinnoh | 4 | 20 |
| Unova | 5 | 27 |
| Kalos | 6 | 10 |
| Alola | 7 | **51** |
| Galar | 8 | **59** |
| Paldea | 9 | **58** |

A 50–60 entry pool makes a Raid Island a shapeless grab bag: legendaries sit
alongside ordinary final stages, `START_RAID` rolls one uniform random entry,
and `pickRaidLegendary` just prefers unseen/uncaught — so the "special" feel is
diluted and a region's endgame becomes a big lottery. Trimming must not orphan
anything: the raid pool is the safety net for otherwise-unobtainable species,
and `npm run validate` checks every species is obtainable.

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
- [ ] Re-check raid pools (#38) afterwards: DLC mons that gain a native DLC
      route must drop out of the parent generation's pool.
- [ ] Shape the maps with **zones** (#36) where they're open-world (the
      Terarium, Wild Area-style areas).
- [ ] Suggested order: Galar DLC (fits Galar's thin map, #35) → Paldea DLC
      (relieves Paldea's 15-species trim and 58-entry raid pool) → older
      post-games if worthwhile.

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
  fabricates **8** Z-Crystal "gyms" (e.g. a Groundium Z) and spreads them across
  towns, so trial captains are ordinary trainers and the grand trials/totems
  aren't modelled at all. Alola *does* have a real E4 + Champion (Mount
  Lanakila), so only the badge track is wrong.
- **Galar** has 8 gyms but **no Elite Four**: the Championship runs the Champion
  Cup semifinals (Marnie / Hop / Bede / Raihan) then Champion Leon, with a
  post-game rematch tournament. The data fakes an E4 from those rivals and
  labels it "Elite Four & Champion".
- **Paldea** has 8 gyms challengeable **in any order** and no fixed badge
  order — the generator imposes canonical order via `gymsRequired` gates (gym
  k's gate goes on the first route after it, and later routes inherit it).
  Victory Road is also only one of three storylines (Path of Legends, Starfall
  Street), so a badge-count gate is a poor fit.

Make the league structure **data-driven per region** rather than assumed:

- [ ] Decide the model: a per-region `league` block, e.g.
      `{ badgeLabel, badgeKind: 'gym' | 'trial' | 'battle', order: 'ordered' | 'free', eliteLabel, eliteKind: 'elite4' | 'cup' | 'none' }`,
      in `regions.json` (or a new data file), vs. flags on the existing
      gym/E4/champion entries.
- [ ] **Alola**: replace the 8 fabricated "gyms" with the 7 trials + 4 grand
      trials (or an explicit, documented 8-slot mapping); decide whether a trial
      is a captain battle, a totem battle, or both, and how Z-Crystals map to
      `defeatedGyms`/badges.
- [ ] **Galar**: keep the 8 gyms; relabel the endgame as the **Champion Cup**
      and treat the E4 list as the semifinal opponents (already Marnie / Hop /
      Bede / Raihan); decide what "E4 beaten" means and how the post-game
      tournament (rematches) works.
- [ ] **Paldea**: drop canonical badge ordering — allow any-order gyms (fixed
      or level-scaled teams) and gate the league on a badge **count** instead of
      ordered `gymsRequired`; decide whether Titans / Team Star are optional
      side content.
- [ ] Make `gym-panel.js` copy data-driven — badge track, "Gym Leaders" →
      "Trial Captains" / "Gym Leaders", "Elite Four & Champion" → "Champion
      Cup" / "Championship", "Badge" → "Z-Crystal" — instead of hardcoded
      strings.
- [ ] Update the generator's badge-order gate logic, `GYM_TOWNS` / `GYM_TYPES` /
      `E4_TYPES` / `CHAMPION_TYPES`, and `tools/validate-data.cjs` (it currently
      expects 8 gyms / 4 E4 / 1 champion per region).
- [ ] Make the achievements region-aware: `badgeFull` ("all 8 badges") and the
      `allBadgesOfARegion` check should use each region's own badge count.
- [ ] Save shape is likely fine — `defeatedGyms` / `defeatedEliteFour` /
      `defeatedChampions` stay id lists — so this is mostly data + UI + the
      unlock-gate change.

Relevant code: `tools/generate-regions.cjs` (gym placement, `gymsRequired`
gates, league construction, `BADGE_NAMES` / `GYM_TOWNS`), `public/data/regions.json`
+ `gym-leader-data.json` / `elite-4-data.json` / `champion-data.json`,
`src/components/gym-panel.js`, `src/game/reducer.js` (`BOSS_BATTLE_END`,
`RESET_ELITE_FOUR`), `src/data/achievements.js`, `tools/validate-data.cjs`.

Effort: **medium** (mostly data + panel copy; the Paldea any-order gate is the
only real progression change).

## 41. Box "New" sort should add new Pokemon at the front

New Pokemon are always **appended** to `state.box` (`[...state.box, newPokemon]`
in `CATCH_POKEMON`, `WITHDRAW_DAYCARE` and `HATCH_DAYCARE_EGG`). The box is only
re-sorted when `SET_BOX_SORT` cycles the mode, so with the **New** (`newest`)
sort selected a fresh catch/hatch shows up at the *end* of the list — the
opposite of the sort's intent, and easy to miss once the box is large.

- [ ] Add a small helper (e.g. `insertIntoBox(box, pokemon, boxSort)`) that
      **prepends** when `boxSort === 'newest'` and appends otherwise, and use it
      at the three append sites: `CATCH_POKEMON`, `WITHDRAW_DAYCARE`,
      `HATCH_DAYCARE_EGG`.
- [ ] Prefer the targeted prepend over re-running `sortBoxMembers` on every add —
      that would also wipe the player's manual `REORDER_BOX` drag order in the
      other sort modes.
- [ ] Keep manual reordering intact: only "New" mode auto-prepends; other modes
      keep appending so a deliberate drag order survives new catches.

Relevant code: the catch handler (`CATCH_POKEMON`), `WITHDRAW_DAYCARE`,
`HATCH_DAYCARE_EGG`, `SET_BOX_SORT` / `REORDER_BOX` (`src/game/reducer.js`),
`sortBoxMembers` / `nextBoxSortMode` (`src/game/pokemon.js`), `BOX_SORT_OPTIONS`
(`src/data/ui.js`) and `box-panel.js`.

Effort: **small** (one helper + three call sites, or a one-line conditional at
each).

---

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
  (`src/data/config.js`) only for incompatible shape changes (add `LEGACY_SAVE_KEYS`).
- **Config constants** live in `src/data/config.js`.
- **Verifying:** `npm run typecheck`, `npm run build`, `npm run validate`, and a
  headless test (mock `window.gameDataInjector.data` with the JSON files and
  `import()` the module) works well for reducer/combat logic.
- **Versioning:** add a `GAME_VERSION` bump + `CHANGELOG` entry when a batch of
  work lands (secrets stay out of the changelog by convention).
- **Commit** each logical change; never `git push`.

## Recently done (context)

0.24.0 (Move Tutor): the Manage Moves panel lists each Pokemon's real TM moves
and teaches them for $4,000 (level-up moves stay free). #9 done.

0.23.0 (Nuzlocke): a Settings challenge toggle releases fainted party Pokemon
permanently (the last one is always spared). #16's Nuzlocke is done.

0.22.0 (battle polish): Haze/Clear Smog reset stat stages, contact abilities
(Static/Flame Body/Poison Point/Effect Spore/Cute Charm/Rough Skin/Iron Barbs)
work, and the crit system got a pass (base 1/24, Super Luck, Sniper, Battle
Armor/Shell Armor, never-miss accuracy fix). #25 is now down to battle polish.

0.21.0 (Attract & Curse): Attract infatuates opposite-gender targets (50% chance
to lose the turn); Ghost Curse costs half HP to drain the foe while other types
gain Attack/Defense and lose Speed; the AI stops spamming setup once boosted.

0.20.0 (terrain): Electric/Grassy/Misty/Psychic Terrain from moves and Surge
abilities, with grounded checks, Grassy healing, Electric sleep immunity, Misty
status immunity and Psychic priority blocking. #10 complete.

0.19.0 (deterministic Battle Tower): each floor is a fixed seeded opponent and
tower battles run without crits/misses/variance, with a Gym-panel preview so the
player can plan a counter.

0.18.0 (entry hazards): Stealth Rock, Spikes, Toxic Spikes and Sticky Web are
set per side and hit Pokemon on switch-in; the AI uses them too.

0.17.1 (Taunt & Substitute): Taunt blocks status moves for three turns;
Substitute costs 25% HP and absorbs hits/status until it breaks.

0.17.0 (weather): Rain/Sun/Sandstorm/Snow/Hail from moves and entry abilities,
with damage scaling, weather abilities, chip damage/healing and a battle badge.
First half of #10.

0.16.1 (Hoenn Battle Tower): the tower is Hoenn-only, no longer leaks a run's
floor between regions, and save repair consolidates legacy per-region records
into Hoenn.

0.16.0 (held items): Pokemon can hold items (Bag Held Items tab, stats-panel
Take button), 28 items with real effects are live, and wild/trainer Pokemon
hold them too. #2c done; #2a/#2c are now both in.

0.15.0 (abilities): every Pokemon has a real ability (fetched from PokeAPI,
shown in the stats panel) and a first set of ~40 of them work in battle. #2a done.

0.14.0 (accuracy/evasion & leech seed): stat stages now affect the hit chance
(Sand Attack, Double Team, ...), Leech Seed drains into the planter, and the
Snowscape data bug is fixed. More #24/#25 leftovers.

0.13.0 (situational balls): Quick/Timer/Repeat/Net/Dive/Dusk/Nest/Premier balls
with context-aware rates; auto-catch picks the best for the situation. #17 done.

0.12.0 (friendship): Pokemon have a friendship value that rises with levels and
wild wins and gates 17 friendship evolutions; the stats panel shows it. #6 done.

0.11.2 (screens): Reflect, Light Screen and Aurora Veil now halve incoming
physical/special damage for five turns.

0.11.1 (status effects): paralysis, toxic and confusion are modelled, and the
status moves that did nothing (Thunder Wave, Toxic, Will-O-Wisp, sleep/confusion
moves, Body Slam/Thunderbolt paralysis) now work.

0.11.0 (battle depth): healing moves work, multi-hit and high-crit moves are
modelled, Protect blocks with +4 priority, Calm Mind/G-Max/priority data bugs
are fixed, and the auto-battler and trainer AI now heal and set up. First slice
of #24/#25.

0.10.1 (Master Ball discipline): the throw button only appears for legendaries
or a hard-to-catch species you have never registered.

0.10.0 (breeding inheritance, hunting & tower): eggs inherit 3 of the parents'
best IVs, a 50% chance of a parent's nature and family moves; a 4+ shiny chain
is locked in by Honey (25x target weight) + Repel (suppresses all others); and
the Battle Tower auto-climbs, hits harder and pays 1 token per 10 floors. #3,
#20 and #32 are complete.

0.9.30 (slower egg hatching): eggs need 30-120 wild wins to hatch (was 8-40).

0.9.29 (egg ticking & secrecy): all party Eggs tick together, and eggs never
reveal shiny/species via sprite, search or filters.

0.9.28 (eggs you carry): breeding gives an Egg to collect; carry it in the party
and win battles to hatch it (steps depend on the species). Eggs can't battle.

0.9.27 (hatch details): the egg-hatch popup shows the hatchling's stats, IVs
(with judge) and nature before you keep or release it.

0.9.26 (offline progress): time away now pays money + Exp. Candies (capped at 8
hours) with a "While You Were Away" report. #7 is complete.

0.9.25 (box search fix): collapsing the box search now clears the query/filter.

0.9.24 (larger text): a Settings toggle scales the whole UI up 15% for
readability, completing the accessibility items.

0.9.23 (challenge modes): Settings gained Randomizer (random wild species) and
Level Scaling (wild levels match your active Pokemon) hard-mode toggles.

0.9.22 (collapsible box search): the box search/filters now sit behind a Search
button, and dragging a filtered Pokemon into the party works again.

0.9.21 (rarer Pokerus & heart polish): Pokerus dropped to 1 in 10,000 wild
wins, and the stats-panel favourite heart now matches the Manage/Close buttons.

0.9.20 (release duplicates): a box tool releases duplicate Pokemon (keeping the
best of each species, protecting favourites/shinies) and pays the release
rewards. #8 Pokémon management is now complete.

0.9.19 (favourite hearts): favourites use a heart (not the shiny star), and the
stats-panel toggle is a clear chip that fills red when active.

0.9.18 (nicknames & box search): Pokemon can be nicknamed from the stats panel
(shown in party/battle/daycare), and the box gained a search field with
All/Shiny/Fav filters.

0.9.17 (IV judge & favourites): the stats panel shows each Pokemon's IVs with
an in-game-style judge, and a star favourites a Pokemon so Release and Wonder
Trade skip it.

0.9.16 (dex celebration + sound on): completing a region's national dex plays a
full-screen badge/confetti celebration that pauses the game before the reward,
and SFX now default on (music still off).

0.9.15 (form-change items): reversible formes (Rotom, Giratina, Shaymin,
Deoxys, the Therian formes, Kyurem, Zygarde, Hoopa, Necrozma, Zacian/Zamazenta,
Calyrex) now use their canonical, reusable items from the Reward Shop instead
of level gates.

0.9.14 (daily quests): three per-day objectives rolled from reachable routes
and species, with progress bars and claimable rewards, from a top-bar button.

0.9.13 (audio): optional synthesized region themes and event sound effects,
with separate off-by-default Music and Sound Effects toggles.

0.9.12 (accessibility): settings to force reduced motion (overriding the OS
preference) and to print move type labels so type isn't colour-only.

0.9.11 (combat feedback): damage pops as a floating number above the struck
Pokemon and the sprite shakes on impact; both respect reduced-motion.

0.9.10 (Pokérus): a very rare party-wide virus caught on a wild win doubles
EXP for 150 battles, shown as a PKRS badge on party slots and the stats panel.

0.9.9 (nature clarity): natures now show which stat they raise (green ▲) and
lower (red ▼) on a badge, with the affected rows arrowed and coloured in the
stat grid, and the stats panel scrolls instead of clipping. Also removed the
stray Kanto "training area" debug route.

0.9.8 (notifications): an opt-in setting mirrors key toasts (shinies, new
dex entries, badges, raids, rare finds) to browser notifications while the tab
is hidden, and returning after 30s+ away shows a "while you were away" summary
of battles, new species, shinies and money.

0.9.7 (release rewards): releasing a Pokemon pays money plus an Exp. Candy for
its level tier (double candy and more money for shinies), previewed in the
confirmation; quick-releasing a hatchling pays out too.

0.9.6 (map QoL): the Town Map search box finds and jumps to any unlocked
location (travelling to ordinary ones), and the active swarm's route shows a
pulsing badge with the species and battles remaining.

0.9.5 (achievement rewards): every achievement pays a one-off reward (money /
Victory Tokens / items, including Master Balls) the moment it unlocks, tracked
in `rewardedAchievements` and shown with a claimed marker in the Records panel.

0.9.4 (daily events): one rotating event per real calendar day (double wild
drops / trainer prizes / battle EXP, or double wild shiny odds) with a
claimable once-per-day gift, surfaced from a battle top-bar button and a toast.

Test suite: `npm test` runs a `node --test` suite under `tests/` covering
unlocks, battle status/drain/flee, breeding, natures, shiny odds and the
reducer's key actions, using a helper that loads `public/data` into
`window.gameDataInjector` for headless imports (no version bump — dev-only).

0.9.3 (natures): every Pokemon rolls one of the 25 natures (shown on the stats
panel, applied in `calculatePokemonStats`, migrated for old saves); a Nature
Mint in the Reward Shop re-rolls a party Pokemon's nature.

0.9.2 (Master Ball moment): the Master Ball is no longer auto-spent. A button in
wild/raid battles throws it with a throw/flash/wobble/click animation and a
guaranteed catch, driven by a new `catching` phase that pauses the idle loop.

0.9.1 (save backup + box order): Settings can export the save to a JSON file
and import one back (stamped to the current version, so backups survive a save
shape bump); the box serializer is now shared with the autosave so the two
can't drift. With the box sorted by "New", freshly caught/hatched/withdrawn
Pokemon are prepended so they show up at the front rather than the end.

0.9.0 (Dex Rewards & Battle Clarity): potions/revives and marts, Rare/Exp.
Candies and sellable treasures with Medicine/Candies/Valuables bag tabs, dex
completion rewards + Records section, a caught-Pokemon battle indicator, a
toast notification queue, and leftover Region Unlock Tokens converting to
Victory Tokens once all regions are open.

QOL batch (box sort modes with a remembered choice, egg-hatch popup with quick
release, living-dex capture mode, and out-of-combat move editing with the
wrong-Pokemon move bug fixed); Pokemon data pass (form transformations are
reversible/all-to-all — Deoxys, Rotom, Therian formes, Kyurem, Necrozma,
Calyrex, Zygarde, Basculegion/Indeedee gender forms — plus corrected stats and
the missing Alolan Ninetales Fairy type); Cosmoem evolves; raid QOL (a wipe
ejects you from the raid zone, pools only offer final stages, level scaling caps
at 100, and the legendary pick favours species you haven't seen); status
conditions + drain moves; Battle Tower + endless scaling; roaming legendaries;
route swarms; Wonder Trade (with the hidden shiny-for-shiny perk); Records
panel; Daycare (gender/egg groups/shiny odds); Achievements; DexNav shiny chain;
region Unlock Tokens; region Prestige; working evolution items + Link Cable;
Mew / MissingNo / Master Ball secrets; and the bulk of the earlier data/audit
fixes (encounters, forms, learnsets, trainers, marts, maps, sprites).
