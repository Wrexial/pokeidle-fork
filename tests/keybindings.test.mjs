import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const {
  KEYBINDING_ACTIONS,
  DEFAULT_KEYBINDINGS,
  actionForKey,
  hotkeyActions,
  keyForEvent,
  keyLabel,
  sanitizeKeybindings,
} = await import('../src/data/keybindings.js')

test('every action has a default binding and defaults cover the action set', () => {
  for (const action of KEYBINDING_ACTIONS) {
    assert.equal(typeof action.defaultKey, 'string')
    assert.ok(action.defaultKey.length > 0)
    assert.equal(DEFAULT_KEYBINDINGS[action.id], action.defaultKey)
  }
  assert.equal(
    Object.keys(DEFAULT_KEYBINDINGS).length,
    KEYBINDING_ACTIONS.length,
    'no stray keys in the default map'
  )
  assert.deepEqual(initialGameState.keybindings, DEFAULT_KEYBINDINGS)
})

test('sanitizeKeybindings fills gaps and drops junk', () => {
  const cleaned = sanitizeKeybindings({ togglePause: 'q', speedUp: 42, unknown: 'x' })
  assert.equal(cleaned.togglePause, 'q')
  assert.equal(cleaned.speedUp, DEFAULT_KEYBINDINGS.speedUp, 'non-string falls back')
  assert.equal(cleaned.toggleAutoCatch, DEFAULT_KEYBINDINGS.toggleAutoCatch, 'missing falls back')
  assert.equal(cleaned.unknown, undefined, 'unknown action dropped')
  assert.deepEqual(sanitizeKeybindings(null), DEFAULT_KEYBINDINGS)
})

test('keyForEvent normalises letters, symbols and modifiers', () => {
  assert.equal(keyForEvent({ key: 'P' }), 'p')
  assert.equal(keyForEvent({ key: '+' }), '=', 'shifted symbol folds to its base key')
  assert.equal(keyForEvent({ key: '!' }), '1')
  assert.equal(keyForEvent({ key: 'ArrowUp' }), 'arrowup')
  assert.equal(keyForEvent({ key: ' ' }), 'space')
  assert.equal(keyForEvent({ key: 'c', ctrlKey: true }), 'ctrl+c')
  assert.equal(keyForEvent({ key: 'Control' }), null, 'bare modifiers are not bindable')
})

test('actionForKey resolves the stored map with a default fallback', () => {
  assert.equal(actionForKey(DEFAULT_KEYBINDINGS, 'p'), 'togglePause')
  assert.equal(actionForKey(DEFAULT_KEYBINDINGS, 'm'), 'toggleBattleMode')
  assert.equal(actionForKey(undefined, 'c'), 'toggleAutoCatch', 'missing map uses defaults')
  assert.equal(actionForKey({ toggleAutoCatch: 'q' }, 'q'), 'toggleAutoCatch')
  assert.equal(actionForKey({ toggleAutoCatch: 'q' }, 'c'), null, 'old default no longer fires')
  assert.equal(actionForKey(DEFAULT_KEYBINDINGS, 'ctrl+c'), null, 'modifier combo does not match c')
  assert.equal(actionForKey(DEFAULT_KEYBINDINGS, null), null)
})

test('keyLabel is human readable', () => {
  assert.equal(keyLabel('p'), 'P')
  assert.equal(keyLabel('arrowup'), '\u2191')
  assert.equal(keyLabel('space'), 'Space')
  assert.equal(keyLabel('ctrl+c'), 'Ctrl + C')
  assert.equal(keyLabel(null), 'Unbound')
})

test('hotkeyActions maps a binding to the right game action', () => {
  const base = { ...initialGameState, speed: 2, battleMode: 'auto', paused: false }
  assert.deepEqual(hotkeyActions('togglePause', base), [{ type: 'TOGGLE_PAUSE' }])
  assert.deepEqual(hotkeyActions('toggleBattleMode', base), [
    { type: 'SET_BATTLE_MODE', payload: { mode: 'manual' } },
  ])
  assert.deepEqual(hotkeyActions('toggleAutoCatch', base), [{ type: 'TOGGLE_AUTO_CATCH' }])
  assert.deepEqual(hotkeyActions('speedUp', base), [
    { type: 'SET_SPEED', payload: { speed: 5 } },
  ])
  assert.deepEqual(hotkeyActions('speedDown', base), [
    { type: 'SET_SPEED', payload: { speed: 1 } },
  ])
  // Stepping the speed while paused also resumes, like the on-screen control.
  assert.deepEqual(hotkeyActions('speedUp', { ...base, paused: true }), [
    { type: 'TOGGLE_PAUSE' },
    { type: 'SET_SPEED', payload: { speed: 5 } },
  ])
  // Already at the ends: no speed change is dispatched.
  assert.deepEqual(hotkeyActions('speedUp', { ...base, speed: 25 }), [])
  assert.deepEqual(hotkeyActions('nope', base), [])
})

test('the reducer rebinds and resets hotkeys', () => {
  const rebound = gameReducer(initialGameState, {
    type: 'SET_KEYBINDING',
    payload: { actionId: 'togglePause', key: 'q' },
  })
  assert.equal(rebound.keybindings.togglePause, 'q')
  assert.equal(rebound.keybindings.toggleAutoCatch, DEFAULT_KEYBINDINGS.toggleAutoCatch)

  const ignored = gameReducer(initialGameState, {
    type: 'SET_KEYBINDING',
    payload: { actionId: 'notAnAction', key: 'q' },
  })
  assert.equal(ignored, initialGameState, 'unknown action ids are ignored')

  const reset = gameReducer(rebound, { type: 'RESET_KEYBINDINGS' })
  assert.deepEqual(reset.keybindings, DEFAULT_KEYBINDINGS)
  assert.notEqual(reset.keybindings, DEFAULT_KEYBINDINGS, 'reset returns a fresh map')
})
