import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const {
  MINIGAME_LOCATIONS,
  POI_LOCATIONS,
  SAFARI_BALL,
  SAFARI_BALLS,
  SAFARI_COST,
  SAFARI_EFFECT_TURNS,
  applySafariAction,
  rollSafariPokemon,
  safariCatchChance,
  safariFlees,
  safariFleeChance,
  safariThrowsBall,
  tickSafariEffects,
} = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { mapEncounterData: encounterData, pokemonSpecies } = gameData

test('the Safari Zone is a registered POI minigame', () => {
  assert.equal(MINIGAME_LOCATIONS.safariZone, 'safari')
  assert.ok(POI_LOCATIONS.has('safariZone'))
})

test('Safari Pokemon come from the Safari Zone encounter table', () => {
  const table = encounterData.safariZone.encounters,
    keys = new Set(table.map((entry) => entry.speciesKey)),
    minLevel = Math.min(...table.map((entry) => entry.minLevel)),
    maxLevel = Math.max(...table.map((entry) => entry.maxLevel))
  for (let roll = 0; roll < 60; roll++) {
    const pokemon = rollSafariPokemon()
    assert.ok(keys.has(pokemon.speciesKey), `${pokemon.speciesKey} should be in the Safari pool`)
    assert.ok(pokemon.level >= minLevel && pokemon.level <= maxLevel)
    assert.ok(['male', 'female', 'genderless'].includes(pokemon.gender))
  }
})

test('Bait lowers catch odds and Rock raises them', () => {
  // A rare species so the chance is not already capped at 1.
  const rare = 'dratini',
    base = safariCatchChance(rare),
    baited = safariCatchChance(rare, { baited: SAFARI_EFFECT_TURNS }),
    rocked = safariCatchChance(rare, { rocked: SAFARI_EFFECT_TURNS })
  assert.ok(base > 0 && base < 1)
  assert.ok(baited < base, 'bait makes it harder to catch')
  assert.ok(rocked > base, 'a rock makes it easier to catch')
  assert.ok(safariCatchChance('magikarp') === 1, 'a common Pokemon is a guaranteed catch')
})

test('Bait calms a Pokemon and Rock spooks it', () => {
  const rare = 'dratini',
    base = safariFleeChance(rare),
    baited = safariFleeChance(rare, { baited: SAFARI_EFFECT_TURNS }),
    rocked = safariFleeChance(rare, { rocked: SAFARI_EFFECT_TURNS })
  assert.ok(baited < base, 'bait makes it less likely to flee')
  assert.ok(rocked > base, 'a rock makes it more likely to flee')
  assert.ok(safariFleeChance('magikarp') < safariFleeChance(rare), 'rarer is skittish')
})

test('Safari actions set and age their effects', () => {
  const baited = applySafariAction({}, 'bait'),
    rocked = applySafariAction(baited, 'rock')
  assert.equal(baited.baited, SAFARI_EFFECT_TURNS)
  assert.equal(rocked.rocked, SAFARI_EFFECT_TURNS)
  assert.equal(rocked.baited, 0, 'bait and rock replace each other')
  assert.deepEqual(tickSafariEffects({ baited: 2, rocked: 1 }), { baited: 1, rocked: 0 })
  assert.deepEqual(tickSafariEffects({ baited: 1, rocked: 0 }), {})
})

test('throws and flees follow the odds', () => {
  const original = Math.random
  try {
    Math.random = () => 0 // always under any positive chance
    assert.equal(safariThrowsBall('dratini'), true)
    assert.equal(safariFlees('dratini'), true)
    Math.random = () => 0.999 // always over the chance
    assert.equal(safariThrowsBall('dratini'), false)
    assert.equal(safariFlees('dratini'), false)
  } finally {
    Math.random = original
  }
})

test('START_SAFARI charges entry and enters the scene', () => {
  const started = gameReducer(
      { ...initialGameState, phase: 'idle', money: SAFARI_COST + 100 },
      { type: 'START_SAFARI' }
    ),
    broke = gameReducer(
      { ...initialGameState, phase: 'idle', money: SAFARI_COST - 1 },
      { type: 'START_SAFARI' }
    )
  assert.equal(started.phase, 'safari')
  assert.equal(started.money, 100)
  assert.equal(broke.phase, 'idle')
  assert.equal(broke.money, SAFARI_COST - 1)
})

test('END_SAFARI returns to idle', () => {
  assert.equal(
    gameReducer({ ...initialGameState, phase: 'safari' }, { type: 'END_SAFARI' }).phase,
    'idle'
  )
})

test('the Safari Ball exists for the scene to use', async () => {
  const { pokeBalls } = await import('../src/data/items.js')
  assert.ok(pokeBalls[SAFARI_BALL], 'safariball should be defined')
  assert.equal(SAFARI_BALLS, 30)
  assert.ok(pokemonSpecies[rollSafariPokemon().speciesKey])
})
