import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn } = await import('../src/game/combat.js')
const { terrainAbilityMultiplier, terrainDamageMultiplier, terrainHeal } = await import(
  '../src/game/terrain.js'
)

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

/** @param {number} value @param {() => void} body */
function withFixedRandom(value, body) {
  const originalRandom = Math.random
  try {
    Math.random = () => value
    body()
  } finally {
    Math.random = originalRandom
  }
}

const terrainEvent = (/** @type {any[]} */ events) =>
  [...events]
    .reverse()
    .find((event) => event.type === 'terrain' && event.data && 'terrain' in event.data)

test('terrain scales damage for grounded attackers', () => {
  const attacker = battler({ types: ['Normal'] }),
    flying = battler(),
    defender = battler({ types: ['Normal'] })
  assert.equal(terrainDamageMultiplier({ type: 'grassy' }, attacker, { type: 'Grass' }, defender), 1.3)
  assert.equal(terrainDamageMultiplier({ type: 'electric' }, attacker, { type: 'Electric' }, defender), 1.3)
  assert.equal(terrainDamageMultiplier({ type: 'psychic' }, attacker, { type: 'Psychic' }, defender), 1.3)
  assert.equal(terrainDamageMultiplier({ type: 'misty' }, attacker, { type: 'Dragon' }, defender), 0.5)
  assert.equal(
    terrainDamageMultiplier({ type: 'grassy' }, attacker, { type: 'Ground', name: 'Earthquake' }, defender),
    0.5
  )
  assert.equal(
    terrainDamageMultiplier({ type: 'grassy' }, flying, { type: 'Grass' }, defender),
    1,
    'Flying attackers are not grounded'
  )
})

test('a terrain move sets the field terrain', () => {
  withFixedRandom(0.9, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['grassyTerrain'],
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] }),
      events = resolveBattleTurn(player, enemy, false, false, null, null, !1, null),
      terrain = terrainEvent(events)
    assert.equal(terrain.data.terrain.type, 'grassy')
    assert.equal(terrain.data.terrain.turns, 4, 'set for 5 turns, then ticked down')
  })
})

test('a terrain ability sets the terrain on entry', () => {
  withFixedRandom(0.9, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        ability: 'electricSurge',
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] }),
      terrain = terrainEvent(resolveBattleTurn(player, enemy, false, true, null, null, !1, null))
    assert.equal(terrain.data.terrain.type, 'electric')
  })
})

test('terrain synergy abilities boost their stat in the right terrain', () => {
  const grassPelt = battler({ ability: 'grassPelt' }),
    hadron = battler({ ability: 'hadronEngine' }),
    quark = battler({ ability: 'quarkDrive' })
  assert.equal(terrainAbilityMultiplier({ type: 'grassy' }, grassPelt, 'defense'), 1.5)
  assert.equal(terrainAbilityMultiplier({ type: 'grassy' }, grassPelt, 'attack'), 1)
  assert.equal(terrainAbilityMultiplier({ type: 'electric' }, hadron, 'spAttack'), 1.33)
  assert.equal(terrainAbilityMultiplier({ type: 'electric' }, quark, 'attack'), 1.3)
  assert.equal(terrainAbilityMultiplier({ type: 'electric' }, quark, 'spAttack'), 1.3)
  assert.equal(terrainAbilityMultiplier({ type: 'grassy' }, quark, 'attack'), 1, 'wrong terrain')
  assert.equal(terrainAbilityMultiplier(null, grassPelt, 'defense'), 1, 'no terrain')
})

test('Hadron Engine sets Electric Terrain on entry', () => {
  withFixedRandom(0.9, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        ability: 'hadronEngine',
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] }),
      terrain = terrainEvent(resolveBattleTurn(player, enemy, false, true, null, null, !1, null))
    assert.equal(terrain.data.terrain.type, 'electric')
  })
})

test('Grassy Terrain heals grounded Pokemon', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        types: ['Grass'],
        currentHp: 200,
        maxHp: 400,
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'] })
    resolveBattleTurn(player, enemy, false, false, null, null, !1, { type: 'grassy', turns: 5 })
    assert.equal(player.currentHp, 225, 'the holder heals 1/16 max HP')
    assert.equal(terrainHeal({ type: 'grassy' }, battler({ types: ['Normal'] })), 25)
  })
})

test('Electric Terrain blocks sleep', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['spore'],
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'] })
    resolveBattleTurn(player, enemy, false, false, null, null, !1, { type: 'electric', turns: 5 })
    assert.ok(!enemy.status, 'the grounded target cannot be put to sleep')
  })
})

test('Psychic Terrain blocks priority moves', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['quickAttack'],
        attack: 200,
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'], currentHp: 400, maxHp: 400 }),
      events = resolveBattleTurn(player, enemy, false, false, null, null, !1, {
        type: 'psychic',
        turns: 5,
      })
    assert.equal(enemy.currentHp, 400, 'the priority move was blocked')
    assert.ok(events.some((/** @type {any} */ event) => event.message?.includes('protected by the terrain')))
  })
})
