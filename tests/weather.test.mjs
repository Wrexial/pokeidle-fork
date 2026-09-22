import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn } = await import('../src/game/combat.js')
const { weatherDamageMultiplier, weatherResidualDamage } = await import('../src/game/weather.js')

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
