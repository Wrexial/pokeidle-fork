// Field weather. Weather is battle-scoped: the active type and remaining turns
// live in `state.weather`, are passed into `resolveBattleTurn`, and come back
// out as a `weather` event the reducer stores. Pure helpers here; the battle
// engine (src/game/combat.js) applies them.

import { abilityOf } from './abilities.js'
import { currentSeason } from './seasons.js'

/** How many turns a weather effect lasts when set by a move. */
export const WEATHER_TURNS = 5

/**
 * How long a route's field weather lasts. Long enough to cover a whole idle
 * battle (the weather badge still shows it), and refreshed on each encounter.
 */
export const FIELD_WEATHER_TURNS = 99

/** One full world-weather period: 15 real minutes. */
export const WORLD_WEATHER_MS = 15 * 60 * 1000

/** How long a weather a battle introduced (Rain Dance, Drizzle, ...) lingers. */
export const LINGERING_WEATHER_MS = WORLD_WEATHER_MS

/**
 * A per-region flavour added to the biome's weather roll, so Hoenn rains more
 * and Alola has more sun (Galar is famously foggy).
 * @type {Record<string, string[]>}
 */
const REGION_WEATHER_BIAS = {
  johto: ['rain'],
  hoenn: ['rain', 'sun'],
  sinnoh: ['snow'],
  kalos: ['rain', 'fog'],
  alola: ['sun', 'sun'],
  galar: ['rain', 'fog', 'fog'],
  paldea: ['sun'],
}

/**
 * A per-season flavour added to the weather roll, so winter is snowier, summer
 * sunnier and spring/autumn wetter (see src/game/seasons.js).
 * @type {Record<string, string[]>}
 */
const SEASON_WEATHER_BIAS = {
  spring: ['rain', 'rain'],
  summer: ['sun', 'sun'],
  autumn: ['fog', 'rain'],
  winter: ['snow', 'snow'],
}

/**
 * The weathers a biome can roll, with `null` meaning clear. Duplicates weight
 * the roll, so most biomes are clear more often than not. A cave is sheltered.
 * @type {Record<string, (string | null)[]>}
 */
const BIOME_WEATHER_ROLLS = {
  desert: ['sandstorm', 'sun', null, null, null, null],
  volcanic: ['sun', null, null, null],
  tundra: ['snow', 'snow', 'strongWinds', null, null, null],
  swamp: ['rain', 'fog', null, null, null],
  coast: ['rain', 'strongWinds', null, null, null],
  forest: ['rain', 'fog', null, null, null, null],
  autumn: ['rain', 'fog', null, null, null, null],
  ruins: ['sandstorm', 'fog', null, null, null, null],
  mountain: ['snow', 'rain', 'strongWinds', null, null, null],
  grassland: ['rain', 'sun', 'fog', null, null, null],
  cave: [null],
}

/** Human names for the world-weather chip. @type {Record<string, string>} */
export const WORLD_WEATHER_LABELS = {
  rain: 'Rain',
  sun: 'Sun',
  sandstorm: 'Sandstorm',
  snow: 'Snow',
  fog: 'Fog',
  strongWinds: 'Strong Winds',
}

/**
 * A stable 32-bit hash of a string (FNV-1a), so the same seed always picks the
 * same weather without storing anything.
 * @param {string} value
 * @returns {number}
 */
function hashString(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * The world weather a location is under right now, derived from the 15-minute
 * cycle and its region/biome so it is identical across saves and reloads. A
 * location with a permanent `weather` field keeps that; a location with no
 * region (a bare test object) is clear.
 * @param {{ region?: string, biome?: string, weather?: string } | null | undefined} location
 * @param {number} [now]
 * @returns {string | null}
 */
export function worldWeatherAt(location, now = Date.now()) {
  if (location?.weather) return location.weather
  if (!location?.region) return null
  const biome = location.biome ?? 'grassland'
  // A cave is sheltered from the world weather and from the seasonal bias.
  if (biome === 'cave') return null
  const bucket = Math.floor(now / WORLD_WEATHER_MS),
    season = currentSeason(now),
    rolls = [
      ...(BIOME_WEATHER_ROLLS[biome] ?? BIOME_WEATHER_ROLLS.grassland),
      ...(REGION_WEATHER_BIAS[location.region] ?? []),
      ...(SEASON_WEATHER_BIAS[season] ?? []),
    ],
    seed = hashString(`${location.region}|${biome}|${season}|${bucket}`)
  return rolls[seed % rolls.length]
}

/**
 * The field weather in effect at a location: a battle-introduced weather that
 * is still fresh wins over the world cycle, so a Rain Dance-buffed fight keeps
 * reading as rainy at the route's activities.
 * @param {{ id?: string, region?: string, biome?: string, weather?: string } | null | undefined} location
 * @param {{ locationId?: string, type?: string | null, setAt?: number } | null | undefined} lingering
 * @param {number} [now]
 * @returns {string | null}
 */
export function effectiveWeatherAt(location, lingering, now = Date.now()) {
  if (
    lingering?.type &&
    lingering.locationId &&
    lingering.locationId === location?.id &&
    now - (lingering.setAt ?? 0) < LINGERING_WEATHER_MS
  )
    return lingering.type
  return worldWeatherAt(location, now)
}

/** Milliseconds until the world weather changes. @param {number} [now] */
export function msUntilWeatherChange(now = Date.now()) {
  return Math.max(1000, WORLD_WEATHER_MS - (now % WORLD_WEATHER_MS))
}

/**
 * The weather a battle at `location` starts under, or null. A route can carry a
 * permanent `weather` field (a permanently raining route, a sandstorm desert);
 * otherwise the world weather cycle applies.
 * @param {MapLocation | undefined | null} location
 * @param {number} [now]
 * @returns {{ type: string, turns: number } | null}
 */
export function fieldWeatherFor(location, now = Date.now()) {
  const type = worldWeatherAt(location, now)
  return type ? { type, turns: FIELD_WEATHER_TURNS } : null
}

/**
 * The weather a battle starts under, honouring a still-fresh battle-introduced
 * weather at this location (see {@link effectiveWeatherAt}).
 * @param {{ id?: string, region?: string, biome?: string, weather?: string } | null | undefined} location
 * @param {{ locationId?: string, type?: string | null, setAt?: number } | null | undefined} lingering
 * @param {number} [now]
 * @returns {{ type: string, turns: number } | null}
 */
export function fieldWeatherAt(location, lingering, now = Date.now()) {
  const type = effectiveWeatherAt(location, lingering, now)
  return type ? { type, turns: FIELD_WEATHER_TURNS } : null
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
  fog: 'fog',
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
  fog: '\ud83c\udf2b',
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
  // Fog thickens the air: every move that can miss is a little less accurate.
  if (weather.type === 'fog' && moveDef.accuracy > 0 && moveDef.accuracy <= 100)
    return { ...moveDef, accuracy: Math.max(1, Math.round(moveDef.accuracy * 0.9)) }
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
