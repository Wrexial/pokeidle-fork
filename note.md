# Move & Ability Coverage — remaining work

Coverage sweep of every move and ability in the game database, so the battle
engine actually *does* what the data says. This file tracks what is still
inert and what each item needs. **We will pick these up later.**

## Where we are

- **Moves:** 934 total, **14 still inert** (everything else has a real effect or
  is a plain attack).
- **Abilities:** 313 total, **3 still inert**.
- `public/reference.html` (generated) marks the same items as "Not implemented";
  it is the living source of truth for this list.
- `npm test` (919), `npm run typecheck`, `npm run validate` and `npm run build`
  all pass as of commit `c756d84b`.

Done since this note was first written: the mid-battle **switch system** and
all its moves/abilities, the **Battle Maison doubles niches** (Commander,
Dancer, Flower Veil, Power of Alchemy, Receiver, Symbiosis, Telepathy), and the
two **out-of-battle abilities** (Illuminate's item-drop bonus, Illusion's wild
disguise).

## Remaining moves (14)

### Needs a PP system (3)
`Spite`, `Grudge`, `Imprison`
- All three interact with PP (reduce it / disable the move on KO / block shared
  moves). The engine does not track PP, so they cannot do anything yet.
- Adding PP is the single change that would unlock these (plus `Pressure`).
  It touches `resolveBattleTurn` (per-move PP on the battler) and the reducer
  (persist PP in the party / restore on heal).

### Doubles-only (2)
`Ally Switch`, `Instruct`
- The Battle Maison module (`src/game/minigames/doubles.js`) is 2v2, but
  positions do not matter (targets are explicit) so `Ally Switch` is a no-op,
  and `Instruct` (repeat the ally's last move) needs an action replay the module
  does not model.
- Everything else doubles-only is done (redirects, Helping Hand, After You,
  Quash, Gear Up, Coaching, Telepathy, and the ally abilities).

### Move-copy / item-lock (4)
`Mimic`, `Sketch`, `Snatch`, `Magic Room`
- `Mimic` / `Sketch` permanently copy a move into the user's moveset (Sketch
  even overwrites), which needs a moveset-edit path in the reducer.
- `Snatch` steals the foe's status move before it resolves — needs a
  pre-resolution interception point.
- `Magic Room` disables held items for five turns; the engine reads held items
  in many places (`held-items.js` helpers), so it needs a single central
  `itemsDisabled(pokemon)` gate threaded through them.

### Flavour / no battle effect (5)
`Splash`, `Celebrate`, `Hold Hands`, `Happy Hour`, `Fairy Lock`
- In the real games these do nothing to the battle (`Happy Hour` doubles prize
  money; `Fairy Lock` stops switching for a turn in doubles). They are
  deliberately inert and effectively "done".

## Remaining abilities (3)

- `Pressure` — PP (see above). Doubles the foe's PP usage; does nothing else.
- `Multitype` / `RKS System` — Arceus / Silvally change type with the held
  plate / memory. Only `ironPlate` and `pixiePlate` exist as items today; the
  other 16 plates and all memories would need adding (`src/data/items.js`) plus
  a type-from-item resolution in `createBattlePokemon`/`turn.js`.

## How to add one (for when we return to this)

### A move
1. Put its `effect` in `src/data/move-effects.js` (`MOVE_OVERRIDES`) if the
   extracted data lacks it.
2. Handle the `effect.type` in `src/game/combat/turn.js` — the status-move
   `if/else` chain for status moves, or the damaging-effect `switch` for added
   effects. Reusable types are documented in `handledMoveEffectTypes`.
3. Add a description to the `moveEffectText` map in `src/game/move-info.js`
   (this also marks the type "handled" for the reference page).
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
(Pickup, Honey Gather, and now Illuminate's drop multiplier). Illusion's
disguise is set in `startEncounter` and broken on the first damaging hit in
`consumeEvent`; the battle scene renders `enemyPokemon.disguisedAs`.

## Reference

- Battle reference page: `public/reference.html` (regenerate with
  `node tools/generate-reference.cjs`).
- Scrape/coverage tooling used for this sweep:
  `tools/generate-z-move-data.cjs`, `tools/add-missing-forms.cjs`,
  `tools/fix-stat-changes.cjs`, `tools/fetch-abilities.cjs`.
- The Z-Move / Max-Move tables: `src/data/z-moves.js`,
  `src/data/max-moves.js` (generated).
- Switch system: `src/game/reducer/battle/switch.js` and the commit `c756d84b`.
- Maison doubles niches: `src/game/minigames/doubles.js`.
