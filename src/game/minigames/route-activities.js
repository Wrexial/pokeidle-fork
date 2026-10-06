// Route-attached minigames. Unlike the fixed minigames in registry.js (one
// unique POI each), these are available wherever the terrain fits: fishing on a
// curated set of water-rich routes, foraging on land routes. Both resolve
// through the route's own encounter table so they stay consistent with normal
// wild battles.

import { encounterData, pokemonSpecies } from '../../data/gameData.js'
import { doubleSpawnChance } from '../../data/config.js'
import { consumableItems, evolutionItems, heldItems } from '../../data/items.js'
import { isCaveLocation, isWaterLocation } from '../catching.js'
import { rollWildHeldItem } from '../held-items.js'
import { monotypeSpeciesPool, speciesHasType } from '../pokemon.js'
import { DEFAULT_ROD, rodForId } from './rods.js'
import { FISHING_LOCATIONS, routeHasWaterSpecies } from './fishing.js'

/** How many attempts (casts/searches) a visit gives. */
export const ACTIVITY_ATTEMPTS = 3

/** How long one there-and-back sweep of the timing marker takes, in ms. */
export const ACTIVITY_SWEEP_MS = 1600

/** How long a held charge takes to fill from empty to full, in ms. */
export const ACTIVITY_CHARGE_MS = 900

/** Distance from the centre (in 0..1 units) that still lands a hit. */
export const ACTIVITY_HIT_ZONE = 0.28

/** Distance from the centre that lands a perfect hit. */
export const ACTIVITY_PERFECT_ZONE = 0.14

/** Distance from the centre that lands a bullseye (the best shiny/level bonus). */
export const ACTIVITY_ULTRA_ZONE = 0.055

/**
 * Route activities. `mode` picks the outcome: `encounter` starts a normal wild
 * battle from the route's table, `loot` pays out items and money. `display`
 * picks the timing visual (`bar` for fishing, `rings` for foraging) so the two
 * activities don't look alike.
 * @type {Record<string, {
 *   id: string, title: string, action: string, icon: string, hint: string,
 *   mode: 'encounter' | 'loot', display: 'bar' | 'rings' | 'swing' | 'charge' | 'depth',
 *   preferTypes?: string[], encounterChance?: number, perfectEncounterChance?: number,
 *   deepWater?: boolean,
 * }>}
 */
export const ROUTE_ACTIVITIES = {
  fishing: {
    id: 'fishing',
    title: 'Fishing',
    action: 'CAST LINE',
    icon: '\u{1f3a3}',
    hint: 'Cast into the water and reel in on the sweet spot to hook a Water Pokemon. A perfect cast in the tiny centre boosts the shiny odds and level.',
    mode: 'encounter',
    display: 'bar',
    preferTypes: ['Water'],
  },
  forage: {
    id: 'forage',
    title: 'Berry Foraging',
    action: 'SEARCH',
    icon: '\u{1fab0}',
    hint: 'Time the ring as it closes on the centre to find berries and supplies. Now and then a Grass Pokemon is hiding in the bush.',
    mode: 'loot',
    display: 'rings',
    preferTypes: ['Grass'],
    // A successful search can flush out a hidden Grass-type instead of loot.
    encounterChance: 0.3,
    perfectEncounterChance: 0.6,
  },
  rockSmash: {
    id: 'rockSmash',
    title: 'Rock Smash',
    action: 'SMASH',
    icon: '\u{1faa8}',
    hint: 'Smash a cracked boulder to shake out the Rock and Ground Pokemon sheltering inside.',
    mode: 'encounter',
    display: 'swing',
    preferTypes: ['Rock', 'Ground'],
  },
  headbutt: {
    id: 'headbutt',
    title: 'Headbutt',
    action: 'HEADBUTT',
    icon: '\u{1f333}',
    hint: 'Hold one of the three trees to charge your headbutt, then let go in the sweet spot to shake loose the Normal and Flying Pokemon roosting in it.',
    mode: 'encounter',
    display: 'charge',
    preferTypes: ['Normal', 'Flying'],
  },
  diving: {
    id: 'diving',
    title: 'Diving',
    action: 'DIVE',
    icon: '\u{1f93f}',
    hint: 'Dive under the surface to reach the deeper Water Pokemon that fishing cannot.',
    mode: 'encounter',
    display: 'depth',
    preferTypes: ['Water'],
    // Diving skips the fishing-rod gate and reaches the rarer, deeper species.
    deepWater: true,
  },
}

/**
 * Whether a route's table holds at least one species of one of `types`.
 * @param {string} routeKey
 * @param {string[]} types
 * @returns {boolean}
 */
function routeHasType(routeKey, types) {
  return (encounterData[routeKey]?.encounters ?? []).some((entry) =>
    types.some((type) => pokemonSpecies[entry.speciesKey]?.types?.includes(type))
  )
}

/** Biomes that are overgrown enough to forage for berries and supplies. */
const FORAGE_BIOMES = new Set(['grassland', 'forest', 'autumn', 'swamp'])

/**
 * Whether a location is overgrown enough to forage.
 * @param {MapLocation | undefined} location
 * @returns {boolean}
 */
function isForageLocation(location) {
  if (!location || isWaterLocation(location) || isCaveLocation(location)) return false
  if (location.biome && FORAGE_BIOMES.has(location.biome)) return true
  const name = location.name ?? ''
  return (
    location.background === '/backgrounds/grassland.png' ||
    /forest|woods|grove|park|meadow|garden|tangle|jungle|safari|plain|prairie|field/i.test(name)
  )
}

/**
 * The route activities available at a location.
 * @param {MapLocation | undefined} location
 * @returns {string[]}
 */
export function routeActivityIds(location) {
  if (!location || !encounterData[location.routeKey ?? '']) return []
  const routeKey = location.routeKey ?? ''
  /** @type {string[]} */
  const ids = []
  if (FISHING_LOCATIONS.has(location.id) && routeHasWaterSpecies(routeKey)) ids.push('fishing')
  if (isForageLocation(location)) ids.push('forage')
  if (isCaveLocation(location) && routeHasType(routeKey, ['Rock', 'Ground']))
    ids.push('rockSmash')
  if (isForageLocation(location) && routeHasType(routeKey, ['Normal', 'Flying']))
    ids.push('headbutt')
  if (isWaterLocation(location) && routeHasType(routeKey, ['Water'])) ids.push('diving')
  return ids
}

/** Level bonus an activity encounter gets, by hit quality. */
export const ACTIVITY_LEVEL_BONUS = { hit: 2, perfect: 4, ultra: 6 }

/** Shiny-odds multiplier an activity encounter gets, by hit quality. */
export const ACTIVITY_SHINY_MULTIPLIER = { hit: 2, perfect: 3, ultra: 4 }

/** Chance a hit / perfect / ultra encounter is holding an item. */
const ACTIVITY_HELD_ITEM_CHANCE = { hit: 0.25, perfect: 0.6, ultra: 1 }

/** Base chance a fishing cast gets a bite. */
export const ACTIVITY_BITE_CHANCE = 0.6

/**
 * The chance a fishing cast gets a bite. Suction Cups and Sticky Hold keep the
 * line steady and add 25%.
 * @param {string | null | undefined} ability
 * @returns {number}
 */
export function activityBiteChance(ability) {
  const bonus = ability === 'suctionCups' || ability === 'stickyHold' ? 0.25 : 0
  return Math.min(1, ACTIVITY_BITE_CHANCE + bonus)
}

/**
 * @param {'hit' | 'perfect' | 'ultra'} quality
 * @returns {number}
 */
export function activityLevelBonus(quality) {
  return ACTIVITY_LEVEL_BONUS[quality] ?? ACTIVITY_LEVEL_BONUS.hit
}

/**
 * @param {'hit' | 'perfect' | 'ultra'} quality
 * @returns {number}
 */
export function activityShinyMultiplier(quality) {
  return ACTIVITY_SHINY_MULTIPLIER[quality] ?? 1
}

/**
 * Roll a held item for an activity encounter, or null when it carries none.
 * Uses the same type-appropriate wild pool as ordinary wild battles (a berry
 * or a booster of one of the Pokemon's own types), just with a better chance
 * the cleaner the hit — no trainer-only competitive items.
 * @param {'hit' | 'perfect' | 'ultra'} quality
 * @param {string[] | null | undefined} types
 * @returns {string | null}
 */
export function rollActivityHeldItem(quality, types) {
  const chance = ACTIVITY_HELD_ITEM_CHANCE[quality] ?? 0
  return chance > 0 ? rollWildHeldItem(types, chance) : null
}

/**
 * Roll a wild encounter for an `encounter` activity, drawn from the route's
 * table and narrowed to the activity's preferred types when it has any. The
 * rod's rarity gate keeps shallow casts to the common species, and a perfect
 * result biases toward the rarer (lower-weight) half of what is reachable.
 * @param {string} activityId
 * @param {string} routeKey
 * @param {boolean} perfect
 * @param {string} [rodId]
 * @param {string | null} [monotype] Monotype challenge: only this type may appear.
 * @returns {{ speciesKey: string, level: number, isWater: boolean, multi: boolean } | null}
 */
export function rollActivityEncounter(activityId, routeKey, perfect, rodId = DEFAULT_ROD, monotype = null) {
  const activity = ROUTE_ACTIVITIES[activityId],
    rod = rodForId(rodId),
    table = encounterData[routeKey]?.encounters ?? []
  if (!activity) return null
  // A Monotype run overrides the activity's usual type preference, so fishing
  // can still hook the chosen type even on a route that has none of it.
  if (monotype) {
    const pool = monotypeSpeciesPool(monotype)
    if (pool.length === 0) return null
    const speciesKey = pool[Math.floor(Math.random() * pool.length)],
      levels = table.length > 0 ? table : [{ minLevel: 5, maxLevel: 7 }],
      min = Math.min(...levels.map((entry) => entry.minLevel)),
      max = Math.max(...levels.map((entry) => entry.maxLevel))
    return {
      speciesKey,
      level:
        min +
        Math.floor(Math.random() * (max - min + 1)) +
        (perfect ? 1 : 0) +
        (activity.id === 'fishing' ? rod.levelBonus : 0),
      isWater: speciesHasType(speciesKey, 'Water'),
      multi: false,
    }
  }
  if (table.length === 0) return null
  // Strict type filter: fishing only ever hooks Water Pokemon, so a route with
  // none has nothing to catch rather than falling back to its land species.
  const typePool = activity.preferTypes
    ? table.filter((entry) =>
        activity.preferTypes?.some((type) =>
          pokemonSpecies[entry.speciesKey]?.types?.includes(type)
        )
      )
    : table
  if (typePool.length === 0) return null
  // A rod only reaches part of the water for fishing; foraging sees the whole
  // type pool instead of the shallow end of it.
  // Only the fishing cast is limited by which rod the player owns.
  const rodGated = activity.id === 'fishing',
    reachable = rodGated
      ? [...typePool]
          .sort((left, right) => right.weight - left.weight)
          .slice(0, Math.max(1, Math.ceil(typePool.length * rod.rarity)))
      : typePool,
    sorted = [...reachable].sort((left, right) => left.weight - right.weight),
    // The rarest third of the reachable fish are "multi-catch": a first perfect
    // hook is not enough, the reel must be timed perfectly a second time.
    multiCutoff =
      sorted.length >= 3 ? sorted[Math.max(0, Math.floor((sorted.length - 1) / 3))].weight : -1,
    candidates = (perfect || activity.deepWater)
      ? sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)))
      : reachable,
    levelBonus = rodGated ? rod.levelBonus : 0,
    totalWeight = candidates.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * totalWeight
  for (const entry of candidates) {
    roll -= entry.weight
    if (roll <= 0)
      return {
        speciesKey: entry.speciesKey,
        level:
          entry.minLevel +
          Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1)) +
          (perfect ? 1 : 0) +
          levelBonus,
        isWater: (pokemonSpecies[entry.speciesKey]?.types ?? []).includes('Water'),
        multi: rodGated && entry.weight <= multiCutoff,
      }
  }
  const fallback = candidates[candidates.length - 1]
  return {
    speciesKey: fallback.speciesKey,
    level: fallback.minLevel + levelBonus,
    isWater: false,
    multi: false,
  }
}

/**
 * Roll the encounters for an activity. A headbutted tree occasionally shakes out
 * a second Pokemon as well; the player can only engage one, so the other slips
 * away.
 * @param {string} activityId
 * @param {string} routeKey
 * @param {boolean} perfect
 * @param {string} [rodId]
 * @param {string | null} [monotype] Monotype challenge: only this type may appear.
 * @returns {{ speciesKey: string, level: number, isWater: boolean, multi: boolean }[]}
 */
export function rollActivityEncounters(activityId, routeKey, perfect, rodId = DEFAULT_ROD, monotype = null) {
  const first = rollActivityEncounter(activityId, routeKey, perfect, rodId, monotype)
  if (!first) return []
  if (activityId !== 'headbutt' || Math.random() >= doubleSpawnChance) return [first]
  let second = rollActivityEncounter(activityId, routeKey, perfect, rodId, monotype)
  // Prefer a different species so the choice actually matters.
  for (let attempt = 0; attempt < 3 && second && second.speciesKey === first.speciesKey; attempt++)
    second = rollActivityEncounter(activityId, routeKey, perfect, rodId)
  return second ? [first, second] : [first]
}

/**
 * Weighted loot table for the `forage` activity.
 * @type {{ itemId: string, weight: number, min: number, max: number }[]}
 */
const FORAGE_TABLE = [
  { itemId: 'expCandyS', weight: 20, min: 1, max: 2 },
  { itemId: 'potion', weight: 18, min: 1, max: 2 },
  { itemId: 'superPotion', weight: 12, min: 1, max: 1 },
  { itemId: 'hyperPotion', weight: 8, min: 1, max: 1 },
  { itemId: 'expCandyM', weight: 10, min: 1, max: 1 },
  { itemId: 'sitrusBerry', weight: 5, min: 1, max: 1 },
  { itemId: 'lumBerry', weight: 3, min: 1, max: 1 },
  { itemId: 'rareCandy', weight: 1, min: 1, max: 1 },
]

const FORAGE_TOTAL_WEIGHT = FORAGE_TABLE.reduce((sum, entry) => sum + entry.weight, 0)

/**
 * Roll one forage find.
 * @param {boolean} perfect
 * @returns {{ itemId: string, quantity: number }}
 */
export function rollActivityLoot(perfect) {
  // A perfect search only rolls the better (lower-weight) half of the table.
  const sorted = [...FORAGE_TABLE].sort((left, right) => left.weight - right.weight),
    candidates = perfect ? sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2))) : FORAGE_TABLE,
    totalWeight =
      candidates === FORAGE_TABLE
        ? FORAGE_TOTAL_WEIGHT
        : candidates.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * totalWeight
  for (const entry of candidates) {
    roll -= entry.weight
    if (roll <= 0)
      return {
        itemId: entry.itemId,
        quantity: entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1)),
      }
  }
  const fallback = candidates[0]
  return { itemId: fallback.itemId, quantity: fallback.min }
}

/** Display name for any activity reward item id. @param {string} itemId */
export function activityRewardName(itemId) {
  return (
    consumableItems[itemId]?.name ?? evolutionItems[itemId]?.name ?? heldItems[itemId]?.name ?? itemId
  )
}
