import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { canGigantamax, gmaxFormFor, gmaxEvolveReady } = await import(
  '../src/data/mega-evolution.js'
)
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { applyBattleForm } = await import('../src/game/combat.js')

/** A battling state with `pokemon` as the active Pokemon. */
function battlingState(pokemon) {
  return {
    ...initialGameState,
    phase: 'battling',
    party: [pokemon],
    playerPokemon: pokemon,
    enemyPokemon: { speciesKey: 'pidgey', level: 5 },
    playerVolatile: null,
  }
}

test('only species with a Gigantamax form can Gigantamax', () => {
  assert.ok(canGigantamax('charizard'))
  assert.equal(gmaxFormFor('charizard'), 'gx-charizard')
  assert.ok(canGigantamax('pikachu'))
  assert.equal(canGigantamax('rattata'), false)
  assert.equal(gmaxFormFor('rattata'), null)
})

test('the Max Mushroom grants the Gigantamax Factor to a valid Pokemon', () => {
  const charizard = createPokemon('charizard', 50, 'a'),
    state = { ...initialGameState, inventory: { maxMushroom: 2 }, party: [charizard], playerPokemon: charizard },
    used = gameReducer(state, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'maxMushroom', pokemonId: 'a', quantity: 1 },
    })
  assert.equal(used.party[0].gmax, true, 'the mark is gained')
  assert.equal(used.inventory.maxMushroom, 1, 'the mushroom is consumed')
  // Feeding a second soup to the same Pokemon is refused.
  const again = gameReducer(used, {
    type: 'USE_ITEM_ON_POKEMON',
    payload: { itemId: 'maxMushroom', pokemonId: 'a', quantity: 1 },
  })
  assert.equal(again, used)
})

test('the Max Mushroom is refused for a Pokemon with no Gigantamax form', () => {
  const rattata = createPokemon('rattata', 50, 'b'),
    state = { ...initialGameState, inventory: { maxMushroom: 1 }, party: [rattata], playerPokemon: rattata },
    used = gameReducer(state, {
      type: 'USE_ITEM_ON_POKEMON',
      payload: { itemId: 'maxMushroom', pokemonId: 'b', quantity: 1 },
    })
  assert.equal(used, state, 'the use is a no-op')
  assert.equal(used.inventory.maxMushroom, 1, 'the mushroom is not consumed')
})

test('a marked Pokemon Gigantamaxes in battle, once', () => {
  const charizard = { ...createPokemon('charizard', 100, 'a'), gmax: true },
    state = battlingState(charizard)
  assert.equal(gmaxEvolveReady(state), true, 'the marker can transform')
  const transformed = gameReducer(state, { type: 'GMAX_EVOLVE' })
  assert.equal(transformed.playerVolatile.formKey, 'gx-charizard')
  assert.equal(gmaxEvolveReady(transformed), false, 'it only transforms once per battle')
})

test('an unmarked Pokemon cannot Gigantamax', () => {
  const charizard = createPokemon('charizard', 100, 'a'),
    state = battlingState(charizard)
  assert.equal(gmaxEvolveReady(state), false)
  assert.equal(gameReducer(state, { type: 'GMAX_EVOLVE' }), state)
})

test('a battle form keeps the persistent max HP instead of compounding it', () => {
  // Eternamax is the one G-Max form with a different max HP. Rebuilding the
  // battler from the party member each turn used to re-apply the form's HP
  // ratio against the base maximum, so Eternatus's HP grew every turn.
  const eternatus = { ...createPokemon('eternatus', 70, 'e'), gmax: true },
    baseMax = eternatus.maxHp,
    battle = { ...eternatus, formKey: 'gx-eternatus' }
  applyBattleForm(battle)
  assert.equal(battle.maxHp, baseMax, 'the form keeps the base max HP')
  assert.equal(battle.currentHp, baseMax)

  // Rebuilding the battler from the party member each turn is idempotent.
  for (let i = 0; i < 5; i++) {
    const rebuilt = { ...eternatus, formKey: 'gx-eternatus', currentHp: baseMax - i * 10 }
    applyBattleForm(rebuilt)
    assert.equal(rebuilt.maxHp, baseMax)
    assert.equal(rebuilt.currentHp, baseMax - i * 10)
  }

  // Zygarde-Complete has the same trap (108 -> 216 base HP).
  const zygarde = { ...createPokemon('zygarde', 70, 'z'), formKey: 'zygarde-c' },
    baseZygardeHp = zygarde.maxHp
  applyBattleForm(zygarde)
  assert.equal(zygarde.maxHp, baseZygardeHp)
})

test('a form change does not revive a fainted battler', () => {
  const fainted = {
    ...createPokemon('eternatus', 70, 'e'),
    currentHp: 0,
    formKey: 'gx-eternatus',
  }
  applyBattleForm(fainted)
  assert.equal(fainted.currentHp, 0)
})
