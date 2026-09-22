import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { pokerusDurationBattles } = await import('../src/data/config.js')
const { pokerusExpMultiplier, tickPokerus } = await import('../src/game/progression.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave } = await import('../src/game/context.js')
const { createPokemon, generateIVs } = await import('../src/game/pokemon.js')

/** @param {number} value */
function withRandom(value, run) {
  const original = Math.random
  Math.random = () => value
  try {
    return run()
  } finally {
    Math.random = original
  }
}

test('pokerusExpMultiplier doubles EXP only while infected', () => {
  assert.equal(pokerusExpMultiplier(null), 1)
  assert.equal(pokerusExpMultiplier(undefined), 1)
  assert.equal(pokerusExpMultiplier({ battlesRemaining: 5 }), 2)
})

test('tickPokerus infects on a rare roll', () => {
  assert.deepEqual(withRandom(0, () => tickPokerus(null)), {
    pokerus: { battlesRemaining: pokerusDurationBattles },
    infected: true,
    cured: false,
  })
})

test('tickPokerus does nothing on an ordinary roll', () => {
  assert.deepEqual(withRandom(0.99, () => tickPokerus(null)), {
    pokerus: null,
    infected: false,
    cured: false,
  })
})

test('tickPokerus counts down and cures at zero', () => {
  assert.deepEqual(tickPokerus({ battlesRemaining: 5 }), {
    pokerus: { battlesRemaining: 4 },
    infected: false,
    cured: false,
  })
  assert.deepEqual(tickPokerus({ battlesRemaining: 1 }), {
    pokerus: null,
    infected: false,
    cured: true,
  })
})

test('a wild win can infect the party with Pokerus', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    enemy = createPokemon('pidgey', 5, 2),
    battling = {
      ...base,
      phase: 'battling',
      enemyPokemon: { ...enemy, currentHp: 0 },
      pendingEvents: [
        { type: 'faint', message: 'Pidgey fainted!', data: { target: 'enemy' } },
      ],
    },
    next = withRandom(0, () => gameReducer(battling, { type: 'CONSUME_EVENT' }))
  assert.ok(next.pokerus, 'the party should be infected')
  assert.equal(next.pokerus.battlesRemaining, pokerusDurationBattles)
  assert.ok(
    next.battleLog.some((line) => line.includes('Pokerus')),
    'the infection should be logged'
  )
})

test('repairSave keeps a valid Pokerus and drops a broken one', () => {
  const save = (/** @type {any} */ pokerus) => ({
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
      pokerus,
    })
  assert.deepEqual(repairSave(save({ battlesRemaining: 42 })).pokerus, { battlesRemaining: 42 })
  assert.equal(repairSave(save({ battlesRemaining: 0 })).pokerus, null)
  assert.equal(repairSave(save('nope')).pokerus, null)
})
