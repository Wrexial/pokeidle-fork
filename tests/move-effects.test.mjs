import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

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

test('move overrides enrich the loaded move table', () => {
  assert.deepEqual(moveData.bulletSeed.multiHit, [2, 5])
  assert.equal(moveData.slash.critStage, 1)
  assert.equal(moveData.wickedBlow.critStage, 3)
  assert.equal(moveData.recover.effect.type, 'heal')
  assert.equal(moveData.rest.effect.percentage, 100)
  assert.equal(moveData.rest.effect.status, 'sleep')
  assert.equal(moveData.protect.protect, true)
  assert.equal(moveData.protect.priority, 4)
  assert.equal(moveData.extremeSpeed.priority, 2)
  assert.equal(moveData.gMaxDrumSolo.category, 'physical')
  assert.equal(moveData.gMaxHydrosnipe.category, 'special')
  assert.deepEqual(moveData.calmMind.effect.changes, { spAttack: 1, spDefense: 1 })
})

test('a healing move restores HP when the auto-battler is low', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['recover'],
      currentHp: 20,
      maxHp: 400,
      speed: 200,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] }),
    events = resolveBattleTurn(player, enemy, false)
  assert.ok(
    events.some((/** @type {any} */ event) => event.type === 'heal'),
    'a heal event should fire'
  )
  assert.ok(player.currentHp > 20, 'the battler should recover HP')
})

test('Rest heals fully and puts its user to sleep', () => {
  const player = battler({
      name: 'Player',
      isPlayer: true,
      moves: ['rest'],
      currentHp: 20,
      maxHp: 400,
      speed: 200,
    }),
    enemy = battler({ name: 'Foe', moves: ['splash'] }),
    events = resolveBattleTurn(player, enemy, false)
  assert.equal(player.currentHp, 400)
  assert.equal(player.status, 'sleep')
  assert.ok(events.some((/** @type {any} */ event) => event.type === 'heal'))
})

test('multi-hit moves strike more than once', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['bulletSeed'],
        speed: 200,
        attack: 400,
      }),
      enemy = battler({ name: 'Foe', currentHp: 9999, maxHp: 9999, defense: 500 }),
      events = resolveBattleTurn(player, enemy, false),
      damageEvent = events.find((/** @type {any} */ event) => event.type === 'damage')
    assert.ok(damageEvent, 'the move should deal damage')
    assert.match(damageEvent.message, /2 hits/)
  })
})

test('a maxed crit stage always lands a critical hit', () => {
  withZeroRandom(() => {
    const result = calculateDamage(
      50,
      200,
      100,
      moveData.wickedBlow,
      ['Dark'],
      ['Normal'],
      0,
      0,
      3
    )
    assert.equal(result.isCrit, true)
  })
})

test('Protect blocks the opponent for the turn', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['protect'],
        speed: 1,
        currentHp: 400,
      }),
      enemy = battler({ name: 'Foe', moves: ['tackle'], speed: 200 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(
      events.some((/** @type {any} */ event) => event.type === 'protect'),
      'Protect should fire'
    )
    assert.ok(
      !events.some(
        (/** @type {any} */ event) => event.type === 'damage' && event.data?.target === 'player'
      ),
      'the opponent should not damage the protected battler'
    )
  })
})

test('Calm Mind raises special stats, not attack and defense', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['calmMind'],
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] })
    resolveBattleTurn(player, enemy, false)
    assert.equal(player.statStages.spAttack, 1)
    assert.equal(player.statStages.spDefense, 1)
    assert.equal(player.statStages.attack ?? 0, 0)
    assert.equal(player.statStages.defense ?? 0, 0)
  })
})

test('paralysis and toxic moves carry their status', () => {
  assert.equal(moveData.thunderWave.effect.status, 'paralysis')
  assert.equal(moveData.toxic.effect.status, 'toxic')
  assert.equal(moveData.confuseRay.effect.type, 'confusion')
  assert.equal(moveData.nuzzle.effect.status, 'paralysis')
})

/** @param {number} value */
function withFixedRandom(value, /** @type {() => void} */ body) {
  const originalRandom = Math.random
  try {
    Math.random = () => value
    body()
  } finally {
    Math.random = originalRandom
  }
}

test('Thunder Wave paralyzes, but not an Electric type', () => {
  withFixedRandom(0.5, () => {
    const attacker = battler({ name: 'Player', isPlayer: true, moves: ['thunderWave'], speed: 200 }),
      normalFoe = battler({
        name: 'Foe',
        moves: ['splash'],
        types: ['Normal'],
        currentHp: 9999,
        maxHp: 9999,
      }),
      electricFoe = battler({
        name: 'Zap',
        moves: ['splash'],
        types: ['Electric'],
        currentHp: 9999,
        maxHp: 9999,
      })
    const firstEvents = resolveBattleTurn(attacker, normalFoe, false)
    assert.ok(firstEvents.some((/** @type {any} */ event) => event.type === 'status'))
    assert.equal(normalFoe.status, 'paralysis')
    const electricEvents = resolveBattleTurn(attacker, electricFoe, false)
    assert.ok(
      !electricEvents.some(
        (/** @type {any} */ event) =>
          event.type === 'status' && event.message.includes('paralyzed')
      )
    )
    assert.ok(!electricFoe.status, 'Electric types cannot be paralysed')
  })
})

test('badly poisoned damage escalates each turn', () => {
  withFixedRandom(0.99, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        status: 'toxic',
        statusTurns: 1,
        currentHp: 160,
        maxHp: 160,
        moves: ['splash'],
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 9999, maxHp: 9999 }),
      events = resolveBattleTurn(player, enemy, false),
      toxicEvent = events.find(
        (/** @type {any} */ event) => event.type === 'damage' && event.message.includes('toxic')
      )
    assert.ok(toxicEvent, 'toxic should tick')
    assert.equal(toxicEvent.data.damage, 10, '1/16 of 160')
    assert.equal(player.statusTurns, 2)
  })
})

test('paralysis halves speed for turn order', () => {
  withFixedRandom(0.9, () => {
    const player = battler({
        name: 'Slow',
        isPlayer: true,
        status: 'paralysis',
        speed: 100,
        moves: ['tackle'],
        attack: 200,
      }),
      enemy = battler({ name: 'Foe', speed: 60, moves: ['splash'] }),
      events = resolveBattleTurn(player, enemy, false),
      firstAttack = events.find((/** @type {any} */ event) => event.type === 'attack')
    assert.match(firstAttack.message, /^Foe/, 'the un-halved foe should move first')
  })
})

test('confusion can make a battler hurt itself', () => {
  withZeroRandom(() => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['tackle'],
        confusionTurns: 2,
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 9999, maxHp: 9999 }),
      events = resolveBattleTurn(player, enemy, false)
    assert.ok(
      events.some(
        (/** @type {any} */ event) => event.type === 'recoil' && event.message.includes('confused')
      )
    )
    assert.equal(player.confusionTurns, 1)
  })
})
