import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn } = await import('../src/game/combat.js')

/**
 * A fresh BattlePokemon-shaped object. `resolveBattleTurn` mutates the objects
 * it is given, so every test builds its own.
 * @param {Record<string, any>} [overrides]
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

test('a guaranteed status move afflicts the target', () => {
  const player = battler({ name: 'Player', isPlayer: true, moves: ['barbBarrage'], speed: 200 }),
    enemy = battler({ name: 'Foe', currentHp: 9999, maxHp: 9999, spDefense: 9999, defense: 9999 }),
    events = resolveBattleTurn(player, enemy, false)
  assert.ok(
    events.some((/** @type {any} */ event) => event.type === 'status'),
    'a status event should fire'
  )
  assert.equal(enemy.status, 'poison')
})

test('a drain move heals the attacker', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['gigaDrain'],
      speed: 200,
      spAttack: 500,
      currentHp: 1,
      maxHp: 1000,
    }),
    enemy = battler({ name: 'Foe', currentHp: 9999, maxHp: 9999, spDefense: 400 }),
    events = resolveBattleTurn(player, enemy, false)
  assert.ok(
    events.some((/** @type {any} */ event) => event.type === 'heal'),
    'a heal event should fire'
  )
  assert.ok(player.currentHp > 1, 'the attacker should have recovered HP')
})

test('poison deals end-of-turn residual damage', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      status: 'poison',
      currentHp: 80,
      maxHp: 80,
    }),
    enemy = battler({ name: 'Foe' }),
    events = resolveBattleTurn(player, enemy, false)
  assert.ok(
    events.some(
      (/** @type {any} */ event) => event.type === 'damage' && event.data?.target === 'player'
    )
  )
  assert.ok(player.currentHp < 80)
})

test('a roaming legendary can flee at the end of a turn', () => {
  const originalRandom = Math.random
  Math.random = () => 0
  try {
    const player = battler({ name: 'Player', isPlayer: true, speed: 200 }),
      enemy = battler({ name: 'Foe', isRoamer: true, currentHp: 500, maxHp: 500 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(
      events.some((/** @type {any} */ event) => event.type === 'flee'),
      'the roamer should flee when the roll succeeds'
    )
  } finally {
    Math.random = originalRandom
  }
})

test('a non-roamer never flees', () => {
  const originalRandom = Math.random
  Math.random = () => 0
  try {
    const player = battler({ name: 'Player', isPlayer: true, speed: 200 }),
      enemy = battler({ name: 'Foe', currentHp: 500, maxHp: 500 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(!events.some((/** @type {any} */ event) => event.type === 'flee'))
  } finally {
    Math.random = originalRandom
  }
})
