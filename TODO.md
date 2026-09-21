# TODO

Ideas and follow-ups that aren't implemented yet. Current game version: **0.8.1**
(`src/data/changelog.js`). See `AGENTS.md` for architecture, commands and data
conventions.

The two features below are the only items still open from the original feature
menu; the rest of this file is things raised in passing that were never scoped.

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

### 2a. Abilities
- [ ] Fetch per-species abilities from PokéAPI (use `tools/fetch-breeding-data.cjs`
      as the template — same caching pattern, writes a new
      `public/data/ability-data.json`, loaded via `assets/gameDataInjector.js`).
- [ ] Assign each Pokémon an ability (slot 1, or random of its slots) in
      `createPokemon` (`src/game/pokemon.js`).
- [ ] Hook ability effects into battle (`src/game/combat.js`): e.g. Intimidate
      (on switch-in), Levitate (ground immunity), Sturdy (focus sash at full HP),
      weather/type immunities, contact effects, etc. Start with a small set.
- [ ] Show the ability in the stats panel.

### 2b. Natures
- [ ] Fetch/derive natures (fixed 25-name table is fine; no fetch needed) and
      give each Pokémon a nature in `createPokemon`.
- [ ] Apply the ±10% stat modifier in `calculatePokemonStats`.
- [ ] Save/display it; decide how natures are re-rollable (mints?).

### 2c. Held items
- [ ] Add a held-item slot to `Pokemon` (type in `src/types.d.ts`, saved in
      `context.js`).
- [ ] Give wild/trainer/raid Pokémon held items from a pool.
- [ ] Implement a first set of effects (Leftovers, type boosters/plates, Choice
      Band/Specs/Scarf, Focus Sash, berries).
- [ ] UI to give/take items from the bag.

Effort: **large** (mostly 2a/2c). New data file(s) required.

## 3. Daycare inheritance (IVs / egg moves / natures)

Breeding now respects gender + egg groups and shiny odds, but eggs are level-1
with **random IVs**, no inherited moves and no nature.

- [ ] Inherit IVs: pass down a few of the parents' best IVs (real games: 3 of
      6 from the parents, plus a Destiny Knot option).
- [ ] Egg moves: let the parents' family learnset seed the baby's moves.
- [ ] Inherit/hold nature (Everstone-style), especially once #2b lands.
- [ ] `createPokemon` currently rolls random IVs and ignores parents — would
      need an options argument.

Effort: **medium**. Pairs with natures (#2b).

## 4. In-battle Mega evolution

Megas exist only as level-100 **evolutions** (`evolution-data.json`); there's no
mid-battle transformation.

- [ ] Give Mega-capable Pokémon a held Mega Stone (ties into #2c).
- [ ] Add a battle action / auto-trigger that swaps to the Mega form for the
      rest of the battle (stats + typing), then reverts.
- [ ] Decide whether this replaces the current level-100 evolution or sits
      alongside it.

Effort: **medium–large**.

## 5. Daily / periodic events

Raised once, never scoped. Could be a timed bonus (extra shiny odds, a boosted
route, a gift) on a real-time or battle-count cadence.

- [ ] Decide the cadence (real time vs battles) and where it surfaces.
- [ ] Reuse the swarm/daycare tick pattern in `gameReducer`.

Effort: **small–medium**.

## 6. Friendship / happiness

Raised once, never scoped. Could gate friendship evolutions, a small battle
bonus, or flavour.

- [ ] Add a friendship value per Pokémon, raised by levelling / battling.
- [ ] Wire any friendship evolutions still modelled as level evolutions.

Effort: **medium**.

## 7. Offline / idle progress

The game is called *Pokémon Idle* but only advances while the tab is open. This
is arguably the biggest missing idle feature: a returning player gets nothing
for the time away.

- [ ] Decide the model: bank "offline battles" and resolve them on return, or a
      simpler overnight bonus (money / EXP / encounters).
- [ ] Cap it (e.g. 8-24 hours) so it doesn't dwarf active play.
- [ ] Show a "while you were away" summary (battles, catches, shinies, money).
- [ ] Persist the timestamp in the save (`context.js`).

Effort: **medium–large** (a real design decision, but high impact).

## 8. Pokémon management / IV checker

IVs are generated in `createPokemon` but never shown, and the box has no search
or protection against releasing something valuable.

- [ ] IV display / judge (sum IVs stars, like the in-game judge).
- [ ] Nicknames.
- [ ] Favourite / lock a Pokémon so Release and Wonder Trade skip it.
- [ ] Box search + filter (name / type / level / shiny / favourite).
- [ ] "Release all duplicates" bulk tool.

Effort: **medium**.

## 9. Move tutor / TMs

`move-manager-panel.js` already lets a Pokémon (re)learn from its family's
learnset (`getFamilyLearnset`). TMs/tutors would add *cross-family* moves.

- [ ] A TM item list (one per move) bought/found, consumed on use.
- [ ] Compatibility rules (which species can learn which move).
- [ ] UI in the move manager to teach a TM move.

Effort: **medium**. Needs a compatibility data set.

## 10. Weather & terrain

A natural follow-on to status conditions; data-light and adds battle depth.

- [ ] A weather state threaded like the volatile state (rain / sun / sandstorm /
      snow), set by moves and/or per route.
- [ ] Damage modifiers, weather-damage ticks, and interactions with abilities
      (#2a) once those exist.
- [ ] Small battle indicator + log lines.

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

## 14. A lightweight test suite

There's no test runner (`AGENTS.md` calls `npm run validate` the closest thing),
so reducer/combat/breeding invariants are only checked by ad-hoc headless
scripts. `node --test` plus the existing `window.gameDataInjector.data` mock
pattern would lock them in.

- [ ] `npm test` running `node --test tools/../tests/*.test.mjs` (or similar).
- [ ] Cover: `computeUnlockedLocations` (prestige re-lock, unlock tokens),
      `resolveBattleTurn` (status/drain/flee), breeding compatibility, the
      reducer's key actions, `checkShinyOdds`.

Effort: **small–medium**, pays off every future change.

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

Status conditions + drain moves; Battle Tower + endless scaling; roaming
legendaries; route swarms; Wonder Trade (with the hidden shiny-for-shiny perk);
Records panel; Daycare (gender/egg groups/shiny odds); Achievements; DexNav
shiny chain; region Unlock Tokens; region Prestige; working evolution items +
Link Cable; Mew / MissingNo / Master Ball secrets; and the bulk of the earlier
data/audit fixes (encounters, forms, learnsets, trainers, marts, maps, sprites).
