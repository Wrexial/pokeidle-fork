import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { initialGameState, gameReducer } = await import('../src/game/reducer.js')
const { SAVED_STATE_KEYS, decodeShareCode, encodeShareCode, repairSave, serializeSave } = await import('../src/game/save.js')

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
  for (const key of ['money', 'inventory', 'wildBattlesWon', 'battlesWonByLocation'])
    assert.deepEqual(repaired[key], state[key], key)
})

test('preferences are not written into the save', () => {
  const saved = serializeSave(startedGame())
  for (const key of ['speed', 'autoCatch', 'battleStyle', 'browserNotifications', 'musicEnabled'])
    assert.ok(!(key in saved), `preference "${key}" should live in the settings store, not the save`)
})

test('repairSave opens a zone region entry hub for a stuck save', () => {
  // An Alola save whose entry hub was gated behind an unreachable catch goal:
  // the repair has to open the hub and its first area so the region is playable.
  const stuck = {
      ...startedGame(),
      startRegion: 'alola',
      currentLocation: 'alola-iki-town',
      currentRoute: 'route1',
      unlockedLocations: ['alola-iki-town'],
      unlockedRegions: ['alola'],
    },
    repaired = repairSave(serializeSave(stuck))
  assert.ok(repaired, 'the stuck save repairs')
  assert.ok(repaired.unlockedLocations.includes('alola-melemele-island'), 'the zone hub is opened')
  assert.ok(repaired.unlockedLocations.includes('alola-route-1'), 'the first sub-area is opened')
  assert.equal(repaired.currentRoute, 'alola-route-1', 'the wrong-region route is replaced')
})

test('the autosave tracks fields that are not covered by other slices', () => {
  // GameProvider derives its effect dependencies from this list, so these
  // must be present for a change to them to trigger an autosave. Preferences
  // are tracked separately by the settings store instead.
  for (const key of ['currentLocation', 'unlockedLocations', 'shinyChain', 'swarm', 'pokerus', 'daycare', 'dailyEvent'])
    assert.ok(SAVED_STATE_KEYS.includes(key), `${key} should be persisted and autosaved`)
})

test('a save round-trips through a share code', () => {
  const state = startedGame(),
    code = encodeShareCode(serializeSave(state)),
    decoded = decodeShareCode(code)
  assert.ok(decoded, 'the code decodes')
  assert.equal(decoded.money, state.money)
  assert.equal(decoded.currentLocation, state.currentLocation)
  assert.ok(repairSave(decoded), 'the decoded blob repairs like the original')
})

test('a share code is URL-safe base64 without padding', () => {
  assert.match(encodeShareCode(serializeSave(startedGame())), /^[A-Za-z0-9_-]+$/)
})

test('a share code tolerates pasted whitespace', () => {
  const code = encodeShareCode(serializeSave(startedGame())),
    spaced = `  ${code.slice(0, 12)}\n${code.slice(12)}  `
  assert.deepEqual(decodeShareCode(spaced), decodeShareCode(code))
})

test('share codes keep non-Latin characters intact', () => {
  const state = startedGame()
  state.party[0].nickname = 'Pok\u00e9 \u2728'
  const decoded = decodeShareCode(encodeShareCode(serializeSave(state)))
  assert.equal(decoded.party[0].nickname, 'Pok\u00e9 \u2728')
})

test('decodeShareCode returns null for junk', () => {
  assert.equal(decodeShareCode('not a share code!!'), null)
  assert.equal(decodeShareCode(''), null)
  // Valid base64 JSON that is not a save still decodes; repairSave rejects it.
  assert.equal(repairSave(decodeShareCode(btoa('{"nope":true}'))), null)
})
