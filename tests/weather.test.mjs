import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { resolveBattleTurn } = await import('../src/game/combat.js')
const {
  applyWeatherToMove,
  FIELD_WEATHER_TURNS,
  fieldWeatherFor,
  msUntilWeatherChange,
  worldWeatherAt,
  WORLD_WEATHER_MS,
  weatherDamageMultiplier,
  weatherResidualDamage,
} = await import('../src/game/weather.js')
const { encountersForPhase } = await import('../src/game/progression.js')
const { mapData } = await import('../src/data/gameData.js')

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

test('the extreme weather abilities set their weather on entry', () => {
  withFixedRandom(0.5, () => {
    const weatherFor = (/** @type {string} */ ability) => {
      const player = battler({ name: 'Player', isPlayer: true, moves: ['splash'], speed: 200, ability }),
        enemy = battler({ name: 'Foe', moves: ['splash'] }),
        weather = lastWeather(resolveBattleTurn(player, enemy, false, !0))
      return weather?.data?.weather?.type
    }
    assert.equal(weatherFor('desolateLand'), 'harshSunlight')
    assert.equal(weatherFor('primordialSea'), 'heavyRain')
    assert.equal(weatherFor('deltaStream'), 'strongWinds')
  })
})

test('harsh sunlight negates Water moves and heavy rain negates Fire moves', () => {
  withFixedRandom(0.5, () => {
    const run = (/** @type {string} */ move, weather) => {
      const player = battler({ name: 'Player', isPlayer: true, moves: [move], speed: 200 }),
        enemy = battler({ name: 'Foe', moves: ['splash'], currentHp: 400, maxHp: 400 })
      const events = resolveBattleTurn(player, enemy, false, false, weather)
      return {
        hp: enemy.currentHp,
        negated: events.some((/** @type {any} */ event) =>
          event.message?.includes('negated by the extreme weather')
        ),
      }
    }
    const water = run('waterGun', { type: 'harshSunlight', turns: 5 })
    assert.equal(water.hp, 400)
    assert.equal(water.negated, true)
    const fire = run('flamethrower', { type: 'heavyRain', turns: 5 })
    assert.equal(fire.hp, 400)
    assert.equal(fire.negated, true)
  })
})

test('Delta Stream cancels Flying weaknesses', () => {
  withFixedRandom(0.5, () => {
    const damage = (/** @type {any} */ weather) => {
      const player = battler({
          name: 'Player',
          isPlayer: true,
          moves: ['thunderbolt'],
          speed: 200,
          spAttack: 300,
        }),
        enemy = battler({
          name: 'Foe',
          moves: ['splash'],
          types: ['Flying'],
          currentHp: 2000,
          maxHp: 2000,
        })
      resolveBattleTurn(player, enemy, false, false, weather)
      return 2000 - enemy.currentHp
    }
    assert.ok(damage({ type: 'strongWinds', turns: 5 }) < damage(null), 'the Electric weakness is removed')
  })
})

test('a location field weather starts the battle under it', () => {
  assert.equal(fieldWeatherFor(null), null, 'no location, no weather')
  assert.equal(fieldWeatherFor({}), null, 'a location with no weather is clear')
  assert.deepEqual(fieldWeatherFor({ weather: 'rain' }), {
    type: 'rain',
    turns: FIELD_WEATHER_TURNS,
  })
  assert.equal(mapData['hoenn-route-119'].weather, 'rain', 'Route 119 is permanently rainy')
  assert.equal(mapData['hoenn-route-111'].weather, 'sandstorm')
})

test('the world weather cycle is deterministic and changes over time', () => {
  const location = { region: 'kanto', biome: 'grassland' }
  // The same 15-minute bucket always picks the same weather.
  assert.equal(worldWeatherAt(location, 0), worldWeatherAt(location, 1000))
  // Across buckets, grassland sees both clear and weather.
  const samples = Array.from({ length: 60 }, (_, index) =>
    worldWeatherAt(location, index * WORLD_WEATHER_MS)
  )
  assert.ok(samples.some((sample) => sample === null), 'clear weather happens')
  assert.ok(samples.some((sample) => sample !== null), 'weather happens')
  // A cave is sheltered, a permanent weather wins, and a bare object is clear.
  assert.equal(worldWeatherAt({ region: 'kanto', biome: 'cave' }, 0), null)
  assert.equal(worldWeatherAt({ region: 'kanto', weather: 'rain' }, 0), 'rain')
  assert.equal(worldWeatherAt({}, 0), null)
  assert.equal(worldWeatherAt(null), null)
  // A desert is sandstorm-prone at least sometimes.
  assert.ok(
    Array.from({ length: 40 }, (_, index) =>
      worldWeatherAt({ region: 'kanto', biome: 'desert' }, index * WORLD_WEATHER_MS)
    ).includes('sandstorm')
  )
  // The weather timer lands inside one period.
  assert.equal(msUntilWeatherChange(0), WORLD_WEATHER_MS)
  assert.equal(msUntilWeatherChange(WORLD_WEATHER_MS - 500), 1000)
  assert.ok(msUntilWeatherChange(WORLD_WEATHER_MS / 3) <= WORLD_WEATHER_MS)
})

test('fieldWeatherFor falls back to the world weather', () => {
  const real = { region: 'kanto', biome: 'grassland' },
    at = (/** @type {number} */ now) => fieldWeatherFor(real, now)
  // Some bucket in the cycle gives a real weather, others null.
  const results = Array.from({ length: 60 }, (_, index) => at(index * WORLD_WEATHER_MS))
  assert.ok(results.some((result) => result === null))
  const weathered = results.find((result) => result)
  assert.ok(weathered && weathered.turns === FIELD_WEATHER_TURNS)
})

test('time-gated encounters follow the day/night phase', () => {
  const table = [
    { speciesKey: 'hoothoot', time: 'night' },
    { speciesKey: 'pidgey', time: 'day' },
    { speciesKey: 'rattata' },
  ]
  assert.deepEqual(
    encountersForPhase(table, true).map((entry) => entry.speciesKey),
    ['hoothoot', 'rattata']
  )
  assert.deepEqual(
    encountersForPhase(table, false).map((entry) => entry.speciesKey),
    ['pidgey', 'rattata']
  )
  const nightOnly = [{ speciesKey: 'hoothoot', time: 'night' }]
  assert.deepEqual(encountersForPhase(nightOnly, false), nightOnly, 'an empty phase falls back')
})
