# Move & Ability Coverage — remaining work

Coverage sweep of every move and ability in the game database, so the battle
engine actually *does* what the data says. This file tracks what is still
inert and what each item needs. **We will pick these up later.**

## Where we are

- **Moves:** 934 total, **3 still inert**.
- **Abilities:** 313 total, **1 still inert**.
- `public/reference.html` (generated) marks the same items as "Not implemented";
  it is the living source of truth for this list.
- `npm test` (928), `npm run typecheck`, `npm run validate` and `npm run build`
  all pass.

Everything else is done: the mid-battle switch system, the Battle Maison
doubles niches, the out-of-battle abilities (Illuminate / Illusion), the five
flavour moves, the move-copy / item-lock moves (Mimic, Sketch, Snatch,
Magic Room), Ally Switch / Instruct, and Multitype / RKS System (which reuse
the existing type-boosting items as plates).

## The only thing left: PP (4 entries)

- **Moves:** `Spite`, `Grudge`, `Imprison`.
- **Ability:** `Pressure`.

All four interact with PP — reduce it / disable the move on KO / block shared
moves / double the foe's PP usage. The engine does not track PP, so they cannot
do anything yet.

Adding PP is the single change that closes the whole sweep. It touches:

- `resolveBattleTurn` (`src/game/combat/turn.js`) — per-move PP on the battler,
  decremented on use, checked before selecting a move (a move at 0 PP is
  skipped). `Pressure` doubles the enemy's PP cost; `Spite` removes PP;
  `Grudge` empties the move on KO; `Imprison` blocks moves the user also knows.
- The save/party shape (`src/types.d.ts`, `src/game/save.js`) to persist PP per
  move, and the reducer (`src/game/reducer/…`) to refill on heal / switch-in.
- `src/game/move-info.js` / `src/data/ability-info.js` to describe them, and
  `tools/generate-reference.cjs` will pick them up automatically.

## How to add one (for when we return to this)

### A move
1. Put its `effect` in `src/data/move-effects.js` (`MOVE_OVERRIDES`) if the
   extracted data lacks it.
2. Handle the `effect.type` in `src/game/combat/turn.js` — the status-move
   `if/else` chain for status moves, or the damaging-effect `switch` for added
   effects. Reusable types are documented in `handledMoveEffectTypes`.
3. Add a description to the `moveEffectText` map in `src/game/move-info.js`
   (this also marks the type "handled" for the reference page). For moves that
   are conversion-only or intentional no-ops, use `specialMoveNotes` instead.
4. Test it (`tests/status-moves.test.mjs`, `tests/move-effects.test.mjs`, …).
5. `node tools/generate-reference.cjs`.

### An ability
1. Add a helper in `src/game/abilities.js`, or inline it where it applies
   (`turn.js`, `status.js`, `end-of-turn.js`, `reducer/battle/events.js`,
   `minigames/doubles.js`).
2. Add a curated entry to `src/data/ability-info.js` — **that map is what marks
   an ability as implemented** on the reference page and gives it a tooltip.
3. Add a test (`tests/abilities.test.mjs`, `tests/doubles.test.mjs`).
4. `node tools/generate-reference.cjs` (it also cross-checks that an ability
   listed in `ability-info.js` actually appears in the engine source and warns
   otherwise — so no silent mismatches).

### New volatile battle flags
Add the field in three places, or it will silently not persist:
- `src/types.d.ts` (`VolatileState` / `BattlePokemon`),
- `src/game/combat/volatile.js` (`createVolatileState` **and**
  `volatileStateFromBattle`),
- `src/game/reducer/battle/effects.js` (`updateVolatile`, for the enemy).
And copy it into the player battler in `src/game/use-game-loop.js`.

### Out-of-battle abilities
These live in the wild-win handler in `src/game/reducer/battle/events.js`
(Pickup, Honey Gather, Illuminate's drop multiplier). Illusion's disguise is
set in `startEncounter` and broken on the first damaging hit in `consumeEvent`;
the battle scene renders `enemyPokemon.disguisedAs`.

### Item-driven types
`Multitype` / `RKS System` read `heldItemBoostType` (`src/game/held-items.js`)
at the top of each turn, next to Forecast / Mimicry in `turn.js`. The mapping
is the inverted `TYPE_BOOST_ITEM` table, so the existing type boosters double
as plates. Add a new "plate" by adding its type to `TYPE_BOOST_ITEM`.

## Reference

- Battle reference page: `public/reference.html` (regenerate with
  `node tools/generate-reference.cjs`).
- Scrape/coverage tooling used for this sweep:
  `tools/generate-z-move-data.cjs`, `tools/add-missing-forms.cjs`,
  `tools/fix-stat-changes.cjs`, `tools/fetch-abilities.cjs`.
- The Z-Move / Max-Move tables: `src/data/z-moves.js`,
  `src/data/max-moves.js` (generated).
- Switch system: `src/game/reducer/battle/switch.js`.
- Move-copy / item-lock: `mimic`/`sketch`/`snatch` handling in
  `src/game/combat/turn.js`, the `learnMove` event in
  `src/game/reducer/battle/events.js`, and `magicRoomTurns` gating
  `heldItemEffect` in `src/game/held-items.js`.
- Maison doubles niches: `src/game/minigames/doubles.js`.
