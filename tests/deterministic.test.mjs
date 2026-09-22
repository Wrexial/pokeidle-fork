import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { buildTowerTeam, buildTowerFloor } = await import('../src/game/progression.js')
const { calculateDamage, resolveBattleTurn } = await import('../src/game/combat.js')
const { moveData } = await import('../src/data/gameData.js')

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

test('a tower floor is the same every time it is generated', () => {
  const describe = (/** @type {any[]} */ team) =>
    team.map((member) => `${member.speciesKey}|${member.level}`)
  assert.deepEqual(describe(buildTowerTeam(7)), describe(buildTowerTeam(7)))
  const built = (/** @type {any[]} */ team) =>
    team.map(
      (member) => `${member.speciesKey}|${member.level}|${member.ability}|${member.heldItem}`
    )
  assert.deepEqual(built(buildTowerFloor(7)), built(buildTowerFloor(7)))
})

test('different floors still get different opponents', () => {
  const first = buildTowerTeam(1).map((member) => member.speciesKey),
    second = buildTowerTeam(2).map((member) => member.speciesKey)
  assert.notDeepEqual(first, second)
})

test('deterministic damage never crits or misses', () => {
  for (let roll = 0; roll < 20; roll++) {
    const result = calculateDamage(
      50,
      200,
      100,
      moveData.tackle,
      ['Normal'],
      ['Normal'],
      0,
      0,
      0,
      !1,
      0,
      0,
      !0
    )
    assert.equal(result.isCrit, false)
    assert.notEqual(result.effectivenessLabel, 'miss')
  }
})

test('a deterministic battle plays out identically', () => {
  const run = () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle', 'thunderWave'],
        speed: 200,
        attack: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['tackle'], speed: 90, attack: 120 })
    return resolveBattleTurn(player, enemy, true, true, null, null, !0).map(
      (/** @type {any} */ event) => event.message
    )
  }
  assert.deepEqual(run(), run())
})
