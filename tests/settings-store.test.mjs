import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

// The settings store talks to localStorage, which Node doesn't provide.
const memory = new Map()
globalThis.localStorage = /** @type {any} */ ({
  getItem: (/** @type {string} */ key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (/** @type {string} */ key, /** @type {string} */ value) => {
    memory.set(key, String(value))
  },
  removeItem: (/** @type {string} */ key) => {
    memory.delete(key)
  },
  clear: () => memory.clear(),
})

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { SAVED_STATE_KEYS } = await import('../src/game/save.js')
const { clearSave } = await import('../src/data/config.js')
const {
  SETTINGS_KEYS,
  SETTINGS_STORAGE_KEY,
  clearStoredSettings,
  loadStoredSettings,
  mergeStoredSettings,
  storeSettings,
} = await import('../src/game/settings.js')

test('every preference key exists on the state but not in the save', () => {
  for (const key of SETTINGS_KEYS) {
    assert.ok(key in initialGameState, `initialGameState is missing preference "${key}"`)
    assert.ok(
      !SAVED_STATE_KEYS.includes(key),
      `preference "${key}" must not be written into the save`
    )
  }
})

test('storeSettings persists only the preference fields', () => {
  clearStoredSettings()
  const state = { ...initialGameState, speed: 25, battleStyle: 'set', money: 999999, wildBattlesWon: 42 }
  storeSettings(state)
  const stored = loadStoredSettings()
  assert.equal(stored?.speed, 25)
  assert.equal(stored?.battleStyle, 'set')
  assert.equal(stored?.money, undefined, 'run progress must not leak into the settings store')
  assert.equal(stored?.wildBattlesWon, undefined)
})

test('mergeStoredSettings overlays the store on a loaded state', () => {
  clearStoredSettings()
  storeSettings({ ...initialGameState, speed: 5, reducedMotion: true })
  const merged = mergeStoredSettings(initialGameState)
  assert.equal(merged.speed, 5)
  assert.equal(merged.reducedMotion, true)
  // Untouched fields keep the state's own values.
  assert.equal(merged.money, initialGameState.money)
})

test('preferences survive a save reset', () => {
  clearStoredSettings()
  const state = { ...initialGameState, speed: 25, musicEnabled: true }
  // A save reset only clears the slot keys; the settings key is left alone.
  useEffectSave(state)
  clearSave(1)
  const stored = loadStoredSettings()
  assert.equal(stored?.speed, 25)
  assert.equal(stored?.musicEnabled, true)
})

/** @param {GameState} state */
function useEffectSave(state) {
  // Mirror what GameProvider does when a preference changes.
  storeSettings(state)
  assert.ok(memory.has(SETTINGS_STORAGE_KEY), 'the settings key was written')
}

test('loadStoredSettings tolerates missing or corrupt data', () => {
  memory.delete(SETTINGS_STORAGE_KEY)
  assert.equal(loadStoredSettings(), null)
  memory.set(SETTINGS_STORAGE_KEY, '{not json')
  assert.equal(loadStoredSettings(), null)
})

test('notification category toggles flip their settings', () => {
  assert.equal(initialGameState.notifyShiny, true)
  assert.equal(initialGameState.notifyRare, true)
  assert.equal(initialGameState.notifyEgg, true)
  assert.equal(
    gameReducer(initialGameState, { type: 'TOGGLE_NOTIFY_SHINY' }).notifyShiny,
    false
  )
  assert.equal(
    gameReducer(initialGameState, { type: 'TOGGLE_NOTIFY_RARE' }).notifyRare,
    false
  )
  assert.equal(gameReducer(initialGameState, { type: 'TOGGLE_NOTIFY_EGG' }).notifyEgg, false)
})

test('shiny toasts are tagged with a kind for the notification filter', async () => {
  const { withNotification } = await import('../src/game/reducer-helpers.js')
  const shiny = withNotification(initialGameState, {
    message: 'A shiny appeared!',
    tone: 'shiny',
  })
  assert.equal(shiny.notifications.at(-1)?.kind, 'shiny')
  const plain = withNotification(initialGameState, { message: 'A badge!' })
  assert.equal(plain.notifications.at(-1)?.kind, null)
})
