import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { generateIVs } = await import('../src/game/pokemon.js')

test('accessibility toggles flip their settings', () => {
  const reduced = gameReducer(initialGameState, { type: 'TOGGLE_REDUCED_MOTION' })
  assert.equal(reduced.reducedMotion, true)
  assert.equal(
    gameReducer(reduced, { type: 'TOGGLE_REDUCED_MOTION' }).reducedMotion,
    false
  )

  const colourblind = gameReducer(initialGameState, { type: 'TOGGLE_COLOURBLIND_TYPES' })
  assert.equal(colourblind.colourblindTypes, true)
  assert.equal(
    gameReducer(colourblind, { type: 'TOGGLE_COLOURBLIND_TYPES' }).colourblindTypes,
    false
  )
})

test('repairSave defaults the accessibility settings off and keeps them on', () => {
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
    enabled = repairSave(save({ reducedMotion: true, colourblindTypes: true }))
  assert.equal(defaults.reducedMotion, false)
  assert.equal(defaults.colourblindTypes, false)
  assert.equal(enabled.reducedMotion, true)
  assert.equal(enabled.colourblindTypes, true)
})
