// Field weather. Weather is battle-scoped: the active type and remaining turns
// live in `state.weather`, are passed into `resolveBattleTurn`, and come back
// out as a `weather` event the reducer stores. Pure helpers here; the battle
// engine (src/game/combat.js) applies them.

import { abilityOf } from './abilities.js'

/** How many turns a weather effect lasts when set by a move. */
export const WEATHER_TURNS = 5

/**
 * How long a route's field weather lasts. Long enough to cover a whole idle
 * battle (the weather badge still shows it), and refreshed on each encounter.
 */
export const FIELD_WEATHER_TURNS = 99

/**
 * The weather a battle at `location` starts under, or null. A route can carry a
 * permanent `weather` field (a permanently raining route, a sandstorm desert).
 * @param {MapLocation | undefined | null} location
 * @returns {{ type: string, turns: number } | null}
 */
export function fieldWeatherFor(location) {
  return location?.weather ? { type: location.weather, turns: FIELD_WEATHER_TURNS } : null
}

/** Abilities that set weather on entry. @type {Record<string, string>} */
export const WEATHER_ABILITIES = {
  drizzle: 'rain',
  drought: 'sun',
  sandStream: 'sandstorm',
  snowWarning: 'snow',
  desolateLand: 'harshSunlight',
  primordialSea: 'heavyRain',
  deltaStream: 'strongWinds',
  orichalcumPulse: 'sun',
}

/** Weather Ball's type per weather; its power doubles in any weather. @type {Record<string, string>} */
const WEATHER_BALL_TYPES = {
  rain: 'Water',
  sun: 'Fire',
  sandstorm: 'Rock',
  snow: 'Ice',
  hail: 'Ice',
}

/** Human-readable weather name for logs/UI. @type {Record<string, string>} */
export const WEATHER_NAMES = {
  rain: 'rain',
  sun: 'harsh sunlight',
  sandstorm: 'a sandstorm',
  snow: 'snow',
  hail: 'hail',
  harshSunlight: 'extremely harsh sunlight',
  heavyRain: 'a heavy downpour',
  strongWinds: 'strong winds',
}

/** Icon per weather for the battle badge. @type {Record<string, string>} */
export const WEATHER_ICONS = {
  rain: '\ud83c\udf27',
  sun: '\u2600',
  sandstorm: '\ud83c\udf2a',
  snow: '\u2744',
  hail: '\ud83c\udf28',
  harshSunlight: '\u2600',
  heavyRain: '\ud83c\udf27',
  strongWinds: '\ud83c\udf00',
}

/**
 * The move as the weather changes it, before damage is worked out: Weather Ball
 * takes the weather's type with doubled power, and Thunder, Hurricane (rain) and
 * Blizzard (snow/hail) never miss (accuracy 0 means "can't miss" in the engine).
 * @param {{ type: string } | null | undefined} weather
 * @param {Move} moveDef
 * @returns {Move}
 */
export function applyWeatherToMove(weather, moveDef) {
  if (!weather || !moveDef) return moveDef
  const name = moveDef.name
  if (name === 'Weather Ball' && WEATHER_BALL_TYPES[weather.type])
    return { ...moveDef, type: WEATHER_BALL_TYPES[weather.type], power: (moveDef.power ?? 0) * 2 }
  const perfectInRain = weather.type === 'rain' && (name === 'Thunder' || name === 'Hurricane'),
    perfectInSnow = (weather.type === 'snow' || weather.type === 'hail') && name === 'Blizzard'
  return perfectInRain || perfectInSnow ? { ...moveDef, accuracy: 0 } : moveDef
}

/**
 * Damage multiplier the weather applies to a move.
 * @param {{ type: string } | null | undefined} weather
 * @param {Move} moveDef
 * @returns {number}
 */
export function weatherDamageMultiplier(weather, moveDef) {
  if (!weather || !moveDef) return 1
  if (weather.type === 'rain')
    return moveDef.type === 'Water' ? 1.5 : moveDef.type === 'Fire' ? 0.5 : 1
  if (weather.type === 'sun')
    return moveDef.type === 'Fire' ? 1.5 : moveDef.type === 'Water' ? 0.5 : 1
  // The extreme weathers boost their type; the nullified type is refused in
  // the turn resolver so it never reaches the damage step.
  if (weather.type === 'harshSunlight') return moveDef.type === 'Fire' ? 1.5 : 1
  if (weather.type === 'heavyRain') return moveDef.type === 'Water' ? 1.5 : 1
  return 1
}

/**
 * Speed multiplier a weather-dependent ability grants (Swift Swim, Chlorophyll,
 * Sand Rush, Slush Rush).
 * @param {{ type: string } | null | undefined} weather
 * @param {BattlePokemon} pokemon
 * @returns {number}
 */
export function weatherSpeedMultiplier(weather, pokemon) {
  if (!weather) return 1
  const ability = abilityOf(pokemon)
  if (weather.type === 'rain' && ability === 'swiftSwim') return 2
  if (weather.type === 'sun' && ability === 'chlorophyll') return 2
  if (weather.type === 'sandstorm' && ability === 'sandRush') return 2
  if (weather.type === 'snow' && ability === 'slushRush') return 2
  return 1
}

/**
 * End-of-turn weather damage (sandstorm/hail chip), 0 when the Pokemon is
 * immune or the weather is harmless.
 * @param {{ type: string } | null | undefined} weather
 * @param {BattlePokemon} pokemon
 * @returns {number}
 */
export function weatherResidualDamage(weather, pokemon) {
  if (!weather) return 0
  if (weather.type === 'sandstorm') {
    const immune = pokemon.types.some((type) => type === 'Rock' || type === 'Ground' || type === 'Steel')
    return immune ? 0 : Math.max(1, Math.floor(pokemon.maxHp / 16))
  }
  if (weather.type === 'hail') {
    return pokemon.types.includes('Ice') ? 0 : Math.max(1, Math.floor(pokemon.maxHp / 16))
  }
  return 0
}

/**
 * End-of-turn weather healing from an ability (Rain Dish, Dry Skin, Ice Body),
 * or a small Dry Skin penalty in harsh sunlight.
 * @param {{ type: string } | null | undefined} weather
 * @param {BattlePokemon} pokemon
 * @returns {number} Positive heals, negative damages.
 */
export function weatherAbilityHeal(weather, pokemon) {
  if (!weather) return 0
  const ability = abilityOf(pokemon)
  if (weather.type === 'rain' && ability === 'rainDish') return Math.max(1, Math.floor(pokemon.maxHp / 16))
  if (weather.type === 'rain' && ability === 'drySkin') return Math.max(1, Math.floor(pokemon.maxHp / 8))
  if (weather.type === 'sun' && ability === 'drySkin') return -Math.max(1, Math.floor(pokemon.maxHp / 8))
  if (weather.type === 'snow' && ability === 'iceBody') return Math.max(1, Math.floor(pokemon.maxHp / 16))
  return 0
}
