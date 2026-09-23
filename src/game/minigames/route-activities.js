// Route-attached minigames. Unlike the fixed minigames in registry.js (one
// unique POI each), these are available wherever the terrain fits: fishing on a
// curated set of water-rich routes, foraging on land routes. Both resolve
// through the route's own encounter table so they stay consistent with normal
// wild battles.

import { encounterData, pokemonSpecies } from '../../data/gameData.js'
import { consumableItems, evolutionItems, heldItems } from '../../data/items.js'
import { isCaveLocation, isWaterLocation } from '../catching.js'
import { DEFAULT_ROD, rodForId } from './rods.js'
import { FISHING_LOCATIONS, encountersWithoutFishingExclusive, fishingExclusiveFor, routeHasWaterSpecies } from './fishing.js'

/** How many attempts (casts/searches) a visit gives. */
export const ACTIVITY_ATTEMPTS = 3

/** How long one sweep of the timing bar takes, in ms. */
export const ACTIVITY_SWEEP_MS = 1100

/** Distance from the centre (in 0..1 bar units) that still lands a hit. */
export const ACTIVITY_HIT_ZONE = 0.22

/** Distance from the centre that lands a perfect hit. */
export const ACTIVITY_PERFECT_ZONE = 0.08

/** Distance from the centre that lands a perfect catch (route-exclusive). */
export const ACTIVITY_ULTRA_ZONE = 0.03

/**
 * Route activities. `mode` picks the outcome: `encounter` starts a normal wild
 * battle from the route's table, `loot` pays out items and money.
 * @type {Record<string, {
 *   id: string, title: string, action: string, icon: string, hint: string,
 *   mode: 'encounter' | 'loot', preferTypes?: string[],
 * }>}
 */
export const ROUTE_ACTIVITIES = {
  fishing: {
    id: 'fishing',
    title: 'Fishing',
    action: 'CAST LINE',
    icon: '\u{1f3a3}',
    hint: 'Cast into the water and reel in on the sweet spot to hook a Water Pokemon. A perfect cast in the tiny centre hooks this route\u2019s exclusive catch.',
    mode: 'encounter',
    preferTypes: ['Water'],
  },
  forage: {
    id: 'forage',
    title: 'Berry Foraging',
    action: 'SEARCH',
    icon: '\u{1fab0}',
    hint: 'Search the undergrowth for berries, candy and supplies. The closer to the sweet spot, the better the find.',
    mode: 'loot',
  },
}

/**
 * Whether a location is overgrown enough to forage.
 * @param {MapLocation | undefined} location
 * @returns {boolean}
 */
function isForageLocation(location) {
  if (!location || isWaterLocation(location) || isCaveLocation(location)) return false
  const name = location.name ?? ''
  return (
    location.background === '/backgrounds/forest.png' ||
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
  /** @type {string[]} */
  const ids = []
  if (FISHING_LOCATIONS.has(location.id) && routeHasWaterSpecies(location.routeKey ?? ''))
    ids.push('fishing')
  if (isForageLocation(location)) ids.push('forage')
  return ids
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
 * @returns {{ speciesKey: string, level: number, isWater: boolean } | null}
 */
export function rollActivityEncounter(activityId, routeKey, perfect, rodId = DEFAULT_ROD) {
  const activity = ROUTE_ACTIVITIES[activityId],
    rod = rodForId(rodId),
    // The fishing-exclusive species is pulled from normal casts; it only
    // appears on a perfect cast (see `rollFishingExclusive`).
    table = encountersWithoutFishingExclusive(
      routeKey,
      encounterData[routeKey]?.encounters ?? []
    )
  if (!activity || table.length === 0) return null
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
  const
    // A rod only reaches part of the water: keep the most common entries for
    // shallower rods, the whole table for the Super Rod.
    reachable = [...typePool].sort((left, right) => right.weight - left.weight),
    rodPool = reachable.slice(0, Math.max(1, Math.ceil(reachable.length * rod.rarity))),
    sorted = [...rodPool].sort((left, right) => left.weight - right.weight),
    candidates = perfect ? sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2))) : rodPool,
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
          rod.levelBonus,
        isWater: (pokemonSpecies[entry.speciesKey]?.types ?? []).includes('Water'),
      }
  }
  const fallback = candidates[candidates.length - 1]
  return {
    speciesKey: fallback.speciesKey,
    level: fallback.minLevel + rod.levelBonus,
    isWater: false,
  }
}

/**
 * Roll the route's fishing-exclusive species, which is only reachable on a
 * perfect cast (the tiny centre of the timing bar).
 * @param {string} routeKey
 * @returns {{ speciesKey: string, level: number, isWater: boolean } | null}
 */
export function rollFishingExclusive(routeKey) {
  const speciesKey = fishingExclusiveFor(routeKey),
    entry = speciesKey
      ? encounterData[routeKey]?.encounters?.find(
          (candidate) => candidate.speciesKey === speciesKey
        )
      : null
  if (!speciesKey || !entry) return null
  return {
    speciesKey,
    level: entry.minLevel + Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1)),
    isWater: true,
  }
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
