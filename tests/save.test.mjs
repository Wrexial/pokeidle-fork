import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { initialGameState, gameReducer } = await import('../src/game/reducer.js')
const { SAVED_STATE_KEYS, repairSave, serializeSave } = await import('../src/game/save.js')

const ENVELOPE_KEYS = ['version', 'savedAt']

/** Start a Kanto run with Bulbasaur and a few persisted fields changed. */
function startedGame() {
  const base = gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey: 'bulbasaur' },
  })
  return {
    ...base,
    speed: 5,
    autoCatch: false,
    money: 1234,
    inventory: { ...base.inventory, pokeball: 7 },
    wildBattlesWon: 12,
    battlesWonByLocation: { route1: 12 },
  }
}

test('serializeSave writes exactly the declared save fields', () => {
  const saved = serializeSave(startedGame()),
    keys = Object.keys(saved)
  assert.deepEqual([...keys].sort(), [...ENVELOPE_KEYS, ...SAVED_STATE_KEYS].sort())
})

test('every declared save field exists on the initial state', () => {
  for (const key of SAVED_STATE_KEYS) {
    assert.ok(key in initialGameState, `initialGameState is missing persisted field "${key}"`)
  }
})

test('the save field list has no duplicates or envelope keys', () => {
  assert.equal(new Set(SAVED_STATE_KEYS).size, SAVED_STATE_KEYS.length)
  for (const key of ENVELOPE_KEYS)
    assert.ok(!SAVED_STATE_KEYS.includes(key), `"${key}" is written by serializeSave itself`)
})

test('serializeSave keeps the value of every persisted field', () => {
  const state = startedGame(),
    saved = serializeSave(state)
  for (const key of SAVED_STATE_KEYS) assert.deepEqual(saved[key], state[key], key)
})

test('a serialized save round-trips through repairSave', () => {
  const state = startedGame(),
    repaired = repairSave(serializeSave(state))
  assert.ok(repaired, 'a freshly serialized save must repair')
  for (const key of ['speed', 'autoCatch', 'money', 'inventory', 'wildBattlesWon', 'battlesWonByLocation'])
    assert.deepEqual(repaired[key], state[key], key)
})

test('the autosave tracks fields that are not covered by other slices', () => {
  // GameProvider derives its effect dependencies from this list, so these
  // must be present for a change to them to trigger an autosave.
  for (const key of ['speed', 'currentLocation', 'unlockedLocations', 'autoCatch', 'globalCatchDefaults', 'shinyChain', 'swarm', 'pokerus', 'daycare', 'dailyEvent'])
    assert.ok(SAVED_STATE_KEYS.includes(key), `${key} should be persisted and autosaved`)
})
