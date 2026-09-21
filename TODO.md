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
