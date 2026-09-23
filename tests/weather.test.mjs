import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn } = await import('../src/game/combat.js')
const { applyWeatherToMove, weatherDamageMultiplier, weatherResidualDamage } = await import(
  '../src/game/weather.js'
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

const lastWeather = (/** @type {any[]} */ events) =>
  [...events]
    .reverse()
    .find((event) => event.type === 'weather' && event.data && 'weather' in event.data)

test('weather scales Water and Fire damage', () => {
  const water = { type: 'Water', power: 90 },
    fire = { type: 'Fire', power: 90 }
  assert.equal(weatherDamageMultiplier({ type: 'rain' }, water), 1.5)
  assert.equal(weatherDamageMultiplier({ type: 'rain' }, fire), 0.5)
  assert.equal(weatherDamageMultiplier({ type: 'sun' }, fire), 1.5)
  assert.equal(weatherDamageMultiplier({ type: 'sun' }, water), 0.5)
  assert.equal(weatherDamageMultiplier(null, water), 1)
})

test('a weather move sets the field weather', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['rainDance'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'] }),
      events = resolveBattleTurn(player, enemy, false, false, null),
      weather = lastWeather(events)
    assert.ok(weather, 'a weather event should be emitted')
    assert.equal(weather.data.weather.type, 'rain')
    assert.equal(weather.data.weather.turns, 4, 'set for 5 turns, then ticked down')
  })
})

test('a weather ability sets the weather on entry', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['splash'],
        ability: 'drizzle',
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'] }),
      weather = lastWeather(resolveBattleTurn(player, enemy, false, true, null))
    assert.equal(weather.data.weather.type, 'rain')
  })
})

test('sandstorm chips non-immune Pokemon', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['splash'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Rock'], currentHp: 400, maxHp: 400 })
    resolveBattleTurn(player, enemy, false, false, { type: 'sandstorm', turns: 5 })
    assert.equal(enemy.currentHp, 400, 'Rock types are immune')
    assert.equal(weatherResidualDamage({ type: 'sandstorm' }, battler()), 25)
  })
})

test('Swift Swim doubles speed in the rain', () => {
  withFixedRandom(0.9, () => {
    const make = (/** @type {any} */ weather) => {
      const player = battler({
          name: 'Swimmer',
          isPlayer: true,
          moves: ['tackle'],
          attack: 200,
          speed: 50,
          ability: 'swiftSwim',
        }),
        enemy = battler({ name: 'Foe', moves: ['splash'], speed: 80 })
      const events = resolveBattleTurn(player, enemy, false, false, weather)
      return events.find((/** @type {any} */ event) => event.type === 'attack').message
    }
    assert.match(make(null), /^Foe/)
    assert.match(make({ type: 'rain', turns: 5 }), /^Swimmer/)
  })
})

test('weather rewrites Weather Ball and makes some moves never miss', () => {
  const weatherBall = { name: 'Weather Ball', type: 'Normal', power: 50, accuracy: 100 },
    thunder = { name: 'Thunder', type: 'Electric', power: 110, accuracy: 70 }
  assert.deepEqual(applyWeatherToMove({ type: 'rain' }, weatherBall), {
    ...weatherBall,
    type: 'Water',
    power: 100,
  })
  assert.equal(applyWeatherToMove({ type: 'sun' }, weatherBall).type, 'Fire')
  assert.equal(applyWeatherToMove({ type: 'sandstorm' }, weatherBall).type, 'Rock')
  assert.equal(applyWeatherToMove({ type: 'snow' }, weatherBall).type, 'Ice')
  assert.equal(applyWeatherToMove(null, weatherBall), weatherBall, 'unchanged with no weather')
  assert.equal(applyWeatherToMove({ type: 'rain' }, thunder).accuracy, 0, 'Thunder cannot miss in rain')
  assert.equal(applyWeatherToMove({ type: 'sun' }, thunder).accuracy, 70, 'but can outside it')
  assert.equal(
    applyWeatherToMove({ type: 'snow' }, { name: 'Blizzard', type: 'Ice', power: 110, accuracy: 70 })
      .accuracy,
    0
  )
})

test('Weather Ball takes the weather type in battle', () => {
  withFixedRandom(0.5, () => {
    const player = battler({
        name: 'Player',
        isPlayer: true,
        moves: ['weatherBall'],
        spAttack: 200,
        speed: 200,
      }),
      enemy = battler({ name: 'Foe', moves: ['splash'], types: ['Fire'] }),
      events = resolveBattleTurn(player, enemy, false, false, { type: 'rain', turns: 5 })
    assert.ok(
      events.some((/** @type {any} */ event) => event.message === "It's super effective!"),
      'a Water Weather Ball is super effective against Fire'
    )
  })
})

test('Thunder never misses in the rain', () => {
  withFixedRandom(0.99, () => {
    const missed = (/** @type {any} */ weather) => {
      const player = battler({ name: 'Player', isPlayer: true, moves: ['thunder'], speed: 200 }),
        enemy = battler({ name: 'Foe', moves: ['splash'] })
      return resolveBattleTurn(player, enemy, false, false, weather).some(
        (/** @type {any} */ event) => event.message?.includes('missed')
      )
    }
    assert.equal(missed(null), true, 'Thunder can miss normally')
    assert.equal(missed({ type: 'rain', turns: 5 }), false, 'but never in the rain')
  })
})

test('weather expires after its turns run out', () => {
  withFixedRandom(0.5, () => {
    const player = battler({ name: 'Player', isPlayer: true, moves: ['splash'], speed: 200 }),
      enemy = battler({ name: 'Foe', moves: ['splash'] }),
      events = resolveBattleTurn(player, enemy, false, false, { type: 'rain', turns: 1 }),
      weather = lastWeather(events)
    assert.equal(weather.data.weather, null, 'the last turn clears the weather')
    assert.ok(events.some((/** @type {any} */ event) => event.message?.includes('subsided')))
  })
})
