import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

// Minimal in-memory localStorage for the slot tests. The game modules read
// the bare `localStorage` global, which Node does not provide.
const store = new Map()
globalThis.localStorage = {
  getItem: (/** @type {string} */ key) => (store.has(key) ? store.get(key) : null),
  setItem: (/** @type {string} */ key, /** @type {string} */ value) =>
    store.set(key, String(value)),
  removeItem: (/** @type {string} */ key) => store.delete(key),
  clear: () => store.clear(),
  key: (/** @type {number} */ index) => [...store.keys()][index] ?? null,
  get length() {
    return store.size
  },
}

const { ACTIVE_SLOT_KEY, SAVE_KEY, SAVE_SLOT_COUNT, clearSave, getActiveSlot, saveSlotKey, setActiveSlot } =
  await import('../src/data/config.js')
const {
  listSaveSlots,
  loadSavedState,
  needsSlotChoice,
  persistSave,
  resolveBootSlot,
} = await import('../src/game/save.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

/** @param {string} speciesKey */
function startedSave(speciesKey = 'bulbasaur') {
  return gameReducer(initialGameState, {
    type: 'SELECT_STARTER',
    payload: { region: 'kanto', speciesKey },
  })
}

test('slot 1 keeps the original versioned key and others are suffixed', () => {
  assert.equal(saveSlotKey(1), SAVE_KEY)
  assert.equal(saveSlotKey(2), `${SAVE_KEY}-slot2`)
})

test('persistSave and loadSavedState keep slots independent', () => {
  store.clear()
  persistSave(startedSave('charmander'), 1)
  persistSave(startedSave('squirtle'), 2)
  assert.equal(getActiveSlot(), 2)
  assert.equal(loadSavedState(1).playerPokemon.speciesKey, 'charmander')
  assert.equal(loadSavedState(2).playerPokemon.speciesKey, 'squirtle')
})

test('resolveBootSlot migrates one save and asks when several exist', () => {
  store.clear()
  assert.equal(resolveBootSlot(), 1, 'a new player starts in slot 1')
  assert.equal(needsSlotChoice(), false)

  persistSave(startedSave(), 2)
  store.delete(ACTIVE_SLOT_KEY)
  assert.equal(resolveBootSlot(), 2, 'a lone slot auto-loads')
  assert.equal(needsSlotChoice(), false)

  persistSave(startedSave(), 1)
  store.delete(ACTIVE_SLOT_KEY)
  assert.equal(needsSlotChoice(), true, 'two full slots need a choice')
  assert.equal(resolveBootSlot(), null)

  setActiveSlot(1)
  assert.equal(needsSlotChoice(), false, 'a chosen slot skips the picker')
  assert.equal(resolveBootSlot(), 1)
})

test('clearSave removes only the requested slot', () => {
  store.clear()
  persistSave(startedSave(), 1)
  persistSave(startedSave(), 2)
  clearSave(2)
  assert.equal(loadSavedState(2), null)
  assert.ok(loadSavedState(1))
})

test('a legacy single save migrates into slot 1', () => {
  store.clear()
  store.set('pokemon-idle-save', JSON.stringify(startedSave('bulbasaur')))
  assert.equal(resolveBootSlot(), 1)
  const state = loadSavedState(1)
  assert.ok(state)
  assert.equal(state.playerPokemon.speciesKey, 'bulbasaur')
})

test('listSaveSlots summarises each slot', () => {
  store.clear()
  persistSave(startedSave('charmander'), 1)
  const slots = listSaveSlots()
  assert.equal(slots.length, SAVE_SLOT_COUNT)
  assert.equal(slots[0].empty, false)
  assert.equal(slots[0].regionId, 'kanto')
  assert.equal(slots[0].level, 5)
  assert.equal(slots[0].badges, 0)
  assert.ok((slots[0].savedAt ?? 0) > 0)
  assert.equal(slots[1].empty, true)
  assert.equal(slots[2].empty, true)
})
