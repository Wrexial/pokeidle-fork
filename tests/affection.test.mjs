import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  companionCareProgress,
  companionCritBonus,
  companionDodgeChance,
  companionStatusCureChance,
  createCompanionCare,
} = await import('../src/game/companion.js')
const { resolveBattleTurn } = await import('../src/game/combat.js')

/** @param {Record<string, any>} [overrides] @returns {any} */
function battler(overrides = {}) {
  return {
    speciesKey: 'pidgey',
    name: 'Pidgey',
    types: ['Normal', 'Flying'],
    level: 50,
    currentHp: 400,
    maxHp: 400,
    attack: 120,
    defense: 100,
    spAttack: 120,
    spDefense: 100,
    speed: 80,
    moves: ['tackle'],
    isPlayer: false,
    ...overrides,
  }
}

/** @param {number} value @param {() => any} body */
function withFixedRandom(value, body) {
  const original = Math.random
  try {
    Math.random = () => value
    return body()
  } finally {
    Math.random = original
  }
}

test('the affection chances all scale with companion care', () => {
  const full = createCompanionCare('a', 0),
    neglect = { ...full, fullness: 10, happiness: 10, energy: 10, cleanliness: 10 }
  assert.equal(companionCareProgress(null), 0)
  assert.equal(companionCareProgress(full), 1)
  assert.equal(companionCareProgress(neglect), 0)
  assert.ok(companionDodgeChance(full) > 0)
  assert.ok(companionStatusCureChance(full) > 0)
  assert.equal(companionCritBonus(full), 1)
  assert.equal(companionCritBonus(neglect), 0)
  // A half-kept buddy sits between.
  const half = { ...full, fullness: 80, happiness: 80, energy: 80, cleanliness: 80 }
  assert.ok(companionCareProgress(half) > 0 && companionCareProgress(half) < 1)
})

test('a companion dodge avoids the incoming move entirely', () => {
  const foe = battler({ name: 'Foe', moves: ['tackle'] }),
    dodger = battler({ name: 'Buddy', isPlayer: true, dodgeChance: 1, currentHp: 400 }),
    hpBefore = dodger.currentHp
  const events = withFixedRandom(0.5, () => resolveBattleTurn(dodger, foe, false, true))
  assert.equal(dodger.currentHp, hpBefore, 'no damage got through')
  assert.ok(
    events.some((event) => /dodged/.test(event.message ?? '')),
    'the dodge is reported'
  )
})

test('a companion shakes off a status condition at the end of the turn', () => {
  const foe = battler({ name: 'Foe', moves: ['splash'] }),
    buddy = battler({
      name: 'Buddy',
      isPlayer: true,
      status: 'burn',
      statusTurns: 3,
      statusCureChance: 1,
    })
  const events = withFixedRandom(0.5, () => resolveBattleTurn(buddy, foe, false))
  assert.equal(buddy.status, null, 'the status is cured')
  assert.ok(events.some((event) => /shook off/.test(event.message ?? '')))
})

test('a content companion gets a raised critical-hit rate', () => {
  const foe = battler({ name: 'Foe', types: ['Normal'], moves: ['splash'], currentHp: 4000, maxHp: 4000 }),
    // critBonus 3 drives the crit stage to the guaranteed tier.
    critter = battler({ name: 'Buddy', isPlayer: true, critBonus: 3, moves: ['tackle'] }),
    plain = battler({ name: 'Buddy', isPlayer: true, critBonus: 0, moves: ['tackle'] })
  const critEvents = withFixedRandom(0.5, () =>
    resolveBattleTurn(critter, battler({ ...foe }), false, true).filter(
      (event) => event.type === 'critical'
    )
  )
  const plainEvents = withFixedRandom(0.5, () =>
    resolveBattleTurn(plain, battler({ ...foe }), false, true).filter(
      (event) => event.type === 'critical'
    )
  )
  assert.ok(critEvents.length >= 1, 'the boosted battler lands a crit')
  assert.equal(plainEvents.length, 0, 'the plain battler does not crit at 1/24')
})
