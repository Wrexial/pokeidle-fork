import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolvePokemonEncounter } = await import('../src/game/progression.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { generateIVs } = await import('../src/game/pokemon.js')
const { encounterData, pokemonSpecies } = await import('../src/data/gameData.js')

test('challenge-mode toggles flip their flags', () => {
  const random = gameReducer(initialGameState, { type: 'TOGGLE_CHALLENGE_RANDOMIZER' })
  assert.equal(random.challengeRandomizer, true)
  assert.equal(
    gameReducer(random, { type: 'TOGGLE_CHALLENGE_RANDOMIZER' }).challengeRandomizer,
    false
  )

  const scaled = gameReducer(initialGameState, { type: 'TOGGLE_CHALLENGE_LEVEL_SCALE' })
  assert.equal(scaled.challengeLevelScale, true)
  assert.equal(
    gameReducer(scaled, { type: 'TOGGLE_CHALLENGE_LEVEL_SCALE' }).challengeLevelScale,
    false
  )
})

test('Randomizer rolls a non-legendary species from the dex', () => {
  const route = encounterData.route1,
    encounter = resolvePokemonEncounter(route, [], new Set(), undefined, 1, true, 0)
  assert.ok(pokemonSpecies[encounter.speciesKey], 'should pick a real species')
  assert.ok(!pokemonSpecies[encounter.speciesKey].legendary, 'should not pick a legendary')
  assert.ok(encounter.level >= 1)
})

test('level scaling overrides the encounter level', () => {
  const route = encounterData.route1,
    scaled = resolvePokemonEncounter(route, [], new Set(), undefined, 1, false, 42)
  assert.equal(scaled.level, 42)
})

test('repairSave defaults the challenge flags off and keeps them on', () => {
  const save = (/** @type {Record<string, any>} */ overrides) => ({
      version: 2,
      playerPokemon: {
        id: '1',
        speciesKey: 'bulbasaur',
        level: 5,
        ivs: generateIVs(),
        moves: ['tackle'],
        currentHp: 20,
        maxHp: 20,
      },
      party: [],
      box: [],
      nextPokemonId: 2,
      inventory: {},
      ...overrides,
    }),
    defaults = repairSave(save({})),
    enabled = repairSave(save({ challengeRandomizer: true, challengeLevelScale: true }))
  assert.equal(defaults.challengeRandomizer, false)
  assert.equal(defaults.challengeLevelScale, false)
  assert.equal(enabled.challengeRandomizer, true)
  assert.equal(enabled.challengeLevelScale, true)
})
