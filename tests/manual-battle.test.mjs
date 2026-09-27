import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn } = await import('../src/game/combat.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { SETTINGS_KEYS } = await import('../src/game/settings.js')
const { SAVED_STATE_KEYS } = await import('../src/game/save.js')

/**
 * @param {Record<string, any>} [overrides]
 * @returns {any}
 */
function battler(overrides = {}) {
  return {
    speciesKey: 'pidgey',
    name: 'Pidgey',
    types: ['Normal', 'Flying'],
    level: 50,
    currentHp: 400,
    maxHp: 400,
    attack: 150,
    defense: 120,
    spAttack: 150,
    spDefense: 120,
    speed: 80,
    moves: ['splash'],
    isPlayer: false,
    ...overrides,
  }
}

/** @param {() => void} body */
function withZeroRandom(body) {
  const originalRandom = Math.random
  try {
    Math.random = () => 0
    body()
  } finally {
    Math.random = originalRandom
  }
}

test('a manual move choice overrides the auto-battler', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle', 'waterGun'],
        speed: 200,
        attack: 200,
        spAttack: 300,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        types: ['Fire'],
        currentHp: 9999,
        maxHp: 9999,
      }),
      // Choose Tackle even though the AI would prefer the super-effective Water Gun.
      events = resolveBattleTurn(player, enemy, false, false, null, null, false, null, null, null, false, 'tackle'),
      playerAttack = events.find(
        (/** @type {any} */ event) => event.type === 'attack' && event.data?.target === 'enemy'
      )
    assert.match(playerAttack.message, /used Tackle!/)
  })
})

test('an invalid manual choice falls back to the auto-battler', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle', 'waterGun'],
        speed: 200,
        attack: 100,
        spAttack: 300,
      }),
      enemy = battler({
        name: 'Foe',
        moves: ['splash'],
        types: ['Fire'],
        currentHp: 9999,
        maxHp: 9999,
      }),
      events = resolveBattleTurn(player, enemy, false, false, null, null, false, null, null, null, false, 'flamethrower'),
      playerAttack = events.find(
        (/** @type {any} */ event) => event.type === 'attack' && event.data?.target === 'enemy'
      )
    assert.match(playerAttack.message, /used Water Gun!/)
  })
})

test('battle mode is a preference, not save progress', () => {
  assert.ok(SETTINGS_KEYS.includes('battleMode'))
  assert.ok(!SAVED_STATE_KEYS.includes('battleMode'))
  assert.equal(initialGameState.battleMode, 'auto')
  assert.equal(
    gameReducer(initialGameState, {
      type: 'SET_BATTLE_MODE',
      payload: { mode: 'manual' },
    }).battleMode,
    'manual'
  )
  // An unrecognised mode falls back to Auto.
  assert.equal(
    gameReducer(initialGameState, {
      type: 'SET_BATTLE_MODE',
      payload: { mode: 'nonsense' },
    }).battleMode,
    'auto'
  )
})

/** A minimal manual battling state with a two-move active Pokemon. */
function manualBattlingState() {
  return {
    ...initialGameState,
    phase: 'battling',
    battleMode: 'manual',
    enemyPokemon: { ...battler({ name: 'Foe' }) },
    playerPokemon: { id: '1', speciesKey: 'pidgey', moves: ['tackle', 'ember'] },
  }
}

test('CHOOSE_PLAYER_MOVE stores a valid move in a manual battle', () => {
  const state = manualBattlingState(),
    chosen = gameReducer(state, { type: 'CHOOSE_PLAYER_MOVE', payload: { moveId: 'ember' } })
  assert.equal(chosen.pendingPlayerMove, 'ember')
  // A move that isn't in the moveset is ignored.
  assert.equal(
    gameReducer(state, { type: 'CHOOSE_PLAYER_MOVE', payload: { moveId: 'hydroPump' } })
      .pendingPlayerMove,
    null
  )
  // Auto mode never records a choice.
  assert.equal(
    gameReducer(
      { ...state, battleMode: 'auto' },
      { type: 'CHOOSE_PLAYER_MOVE', payload: { moveId: 'ember' } }
    ).pendingPlayerMove,
    null
  )
})

test('a spent turn clears the pending manual move', () => {
  const state = { ...manualBattlingState(), pendingPlayerMove: 'ember' },
    afterTurn = gameReducer(state, { type: 'EXECUTE_TURN', payload: { events: [] } })
  assert.equal(afterTurn.pendingPlayerMove, null)
})

test('switching back to auto clears a pending manual move', () => {
  const state = { ...manualBattlingState(), pendingPlayerMove: 'ember' },
    autoState = gameReducer(state, { type: 'SET_BATTLE_MODE', payload: { mode: 'auto' } })
  assert.equal(autoState.battleMode, 'auto')
  assert.equal(autoState.pendingPlayerMove, null)
})
