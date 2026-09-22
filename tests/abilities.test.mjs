import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const data = installGameData()

const { abilityAttackMultiplier, abilityPreventsStatus } = await import('../src/game/abilities.js')
const { resolveBattleTurn } = await import('../src/game/combat.js')
const { abilityDisplayName, rollAbility } = await import('../src/game/pokemon.js')

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

test('ability data loads for every species and rolls a real ability', () => {
  assert.equal(data.abilityData.bulbasaur.abilities[0], 'overgrow')
  assert.ok(['runAway', 'adaptability', 'anticipation'].includes(rollAbility('eevee')))
  assert.ok(['overgrow', 'chlorophyll'].includes(rollAbility('bulbasaur')))
})

test('abilityDisplayName prettifies a camelCase key', () => {
  assert.equal(abilityDisplayName('waterAbsorb'), 'Water Absorb')
  assert.equal(abilityDisplayName('hugePower'), 'Huge Power')
})

test('Levitate blocks Ground moves without healing', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['earthquake'], speed: 200 }),
      enemy = battler({ name: 'Foe', ability: 'levitate', currentHp: 400, maxHp: 400, types: ['Normal'] }),
      events = resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.currentHp, 400, 'the Ground move should be blocked')
    assert.ok(
      !events.some(
        (/** @type {any} */ event) => event.type === 'damage' && event.data?.target === 'enemy'
      )
    )
  })
})

test('Water Absorb heals instead of taking damage', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['waterGun'], speed: 200 }),
      enemy = battler({
        name: 'Foe',
        ability: 'waterAbsorb',
        currentHp: 200,
        maxHp: 400,
        types: ['Normal'],
      }),
      events = resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.currentHp, 300, 'the holder heals a quarter of its max HP')
    assert.ok(events.some((/** @type {any} */ event) => event.type === 'heal'))
  })
})

test('Thick Fat halves Fire damage', () => {
  withFixedRandom(0.5, () => {
    const damage = (/** @type {string | undefined} */ ability) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['ember'],
          speed: 200,
          spAttack: 300,
        }),
        enemy = battler({
          name: 'Foe',
          ability,
          currentHp: 9999,
          maxHp: 9999,
          types: ['Normal'],
        }),
        events = resolveBattleTurn(player, enemy, false)
      return events.find(
        (/** @type {any} */ event) => event.type === 'damage' && event.data?.target === 'enemy'
      ).data.damage
    }
    assert.equal(damage('thickFat'), Math.max(1, Math.floor(damage(undefined) / 2)))
  })
})

test('Sturdy survives a full-HP knockout with 1 HP', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['hyperBeam'],
        speed: 200,
        attack: 9999,
        spAttack: 9999,
      }),
      enemy = battler({ name: 'Foe', ability: 'sturdy', currentHp: 300, maxHp: 300, defense: 1 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.equal(enemy.currentHp, 1)
    assert.ok(!events.some((/** @type {any} */ event) => event.type === 'faint' && event.data?.target === 'enemy'))
  })
})

test('Intimidate lowers the opponent once on entry', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, ability: 'intimidate', speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false, true)
    assert.equal(enemy.statStages.attack, -1)
  })
})

test('an ability can block a status condition', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['thunderWave'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], ability: 'limber', types: ['Normal'] })
    resolveBattleTurn(player, enemy, false)
    assert.ok(!enemy.status)
    assert.equal(abilityPreventsStatus({ ability: 'limber' }, 'paralysis'), true)
  })
})

test('Guts raises Attack while statused', () => {
  assert.equal(abilityAttackMultiplier({ ability: 'guts' }), 1)
  assert.equal(abilityAttackMultiplier({ ability: 'guts', status: 'burn' }), 1.5)
  assert.equal(abilityAttackMultiplier({ ability: 'hugePower' }), 2)
})
