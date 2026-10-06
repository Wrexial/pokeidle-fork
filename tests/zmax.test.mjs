import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn } = await import('../src/game/combat.js')
const { moveData } = await import('../src/data/gameData.js')
const { Z_MOVE_BY_TYPE, zMoveBasePower } = await import('../src/data/z-moves.js')
const { maxMoveBasePower } = await import('../src/data/max-moves.js')

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

test('the Z-Move power curve matches the games', () => {
  assert.equal(zMoveBasePower(40), 100)
  assert.equal(zMoveBasePower(90), 175)
  assert.equal(zMoveBasePower(120), 190)
  assert.equal(zMoveBasePower(140), 200)
})

test('the Max-Move power curve matches the games', () => {
  assert.equal(maxMoveBasePower(40, 'Normal'), 90)
  assert.equal(maxMoveBasePower(90, 'Fire'), 130)
  assert.equal(maxMoveBasePower(120, 'Water'), 140)
  assert.equal(maxMoveBasePower(40, 'Fighting'), 70)
  assert.equal(maxMoveBasePower(110, 'Poison'), 95)
})

test('a Z-Crystal upgrades a matching damaging move once per battle', () => {
  withFixedRandom(0.5, () => {
    const damageWith = (/** @type {string | null} */ crystal) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['flamethrower'],
          speed: 200,
          spAttack: 200,
          heldItem: crystal,
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'], currentHp: 4000, maxHp: 4000 })
      resolveBattleTurn(player, enemy, false)
      return 4000 - enemy.currentHp
    }
    assert.ok(
      damageWith('firiumZ') > damageWith(null),
      'Inferno Overdrive hits harder than Flamethrower'
    )
    assert.ok(Z_MOVE_BY_TYPE.Fire)
  })
})

test('a used Z-Crystal is spent for the rest of the battle', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['flamethrower'],
      speed: 200,
      spAttack: 200,
      heldItem: 'firiumZ',
    })
    const enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'], currentHp: 9999, maxHp: 9999 })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.zMoveUsed, true)
  })
})

test('a Z-Crystal on a status move applies its Z-boost', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      heldItem: 'normaliumZ',
      statStages: {},
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] })
  resolveBattleTurn(player, enemy, false)
  assert.equal(player.statStages.attack, 3, 'Z-Splash raises Attack by three')
  assert.equal(player.zMoveUsed, true)
})

test('Gigantamax converts damaging moves into Max Moves', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Charizard',
        isPlayer: true,
        moves: ['tackle'],
        speed: 200,
        attack: 200,
        speciesKey: 'gx-charizard',
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 4000, maxHp: 4000, statStages: {} })
    resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.statStages.speed, -1, 'Max Strike lowers the foe Speed')
  })
})

test('Gigantamax uses the species G-Max move and type Max Moves for the rest', () => {
  withFixedRandom(0.5, () => {
    // Eternatus has no G-Max Fire move, so Flamethrower becomes Max Flare (sun).
    const player = battler({
        name: 'Eternatus',
        isPlayer: true,
        moves: ['flamethrower'],
        speed: 200,
        spAttack: 200,
        speciesKey: 'gx-eternatus',
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Normal'], currentHp: 4000, maxHp: 4000 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(
      events.some(
        (/** @type {any} */ event) => event.type === 'weather' && /sunlight|sun/i.test(event.message ?? '')
      ),
      'Max Flare sets the sun'
    )
  })
})

test('a Gigantamaxed status move becomes Max Guard', () => {
  const player = battler({
      name: 'Charizard',
      isPlayer: true,
      moves: ['splash'],
      speed: 200,
      speciesKey: 'gx-charizard',
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] }),
    events = resolveBattleTurn(player, enemy, false)
  assert.ok(
    events.some((/** @type {any} */ event) => /Max Guard|protected|protected itself/i.test(event.message ?? '')),
    'Max Guard went up'
  )
  assert.ok(moveData.maxGuard)
})
