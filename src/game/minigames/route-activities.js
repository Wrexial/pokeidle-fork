// Route-attached minigames. Unlike the fixed minigames in registry.js (one
// unique POI each), these are available wherever the terrain fits: fishing on a
// curated set of water-rich routes, foraging on land routes. Both resolve
// through the route's own encounter table so they stay consistent with normal
// wild battles.

import { encounterData, pokemonSpecies } from '../../data/gameData.js'
import { consumableItems, evolutionItems, heldItems } from '../../data/items.js'
import { isCaveLocation, isWaterLocation } from '../catching.js'
import { DEFAULT_ROD, rodForId } from './rods.js'

/** How many attempts (casts/searches) a visit gives. */
export const ACTIVITY_ATTEMPTS = 3

/** How long one sweep of the timing bar takes, in ms. */
export const ACTIVITY_SWEEP_MS = 1100

/** Distance from the centre (in 0..1 bar units) that still lands a hit. */
export const ACTIVITY_HIT_ZONE = 0.22

/** Distance from the centre that lands a perfect hit. */
export const ACTIVITY_PERFECT_ZONE = 0.08

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
    hint: 'Cast into the water and reel in on the sweet spot to hook a Water Pokemon from this route.',
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
 * The hand-picked water-rich routes where fishing is available. A cast only
 * ever hooks a Water-type Pokemon, so rather than offering it on every route
 * that merely sounds watery, this list names the routes whose tables are
 * actually made of Water species.
 * @type {Set<string>}
 */
export const FISHING_LOCATIONS = new Set([
  // Kanto
  'seafoamIslands',
  'route19',
  'route20',
  'route21',
  // Johto
  'johto-whirl-islands',
  'johto-sea-route-40',
  'johto-sea-route-41',
  // Hoenn
  'hoenn-route-124',
  'hoenn-route-126',
  'hoenn-route-128',
  'hoenn-route-134',
  // Sinnoh
  'sinnoh-sea-route-220',
  'sinnoh-route-219',
  'sinnoh-sea-route-223',
  'sinnoh-route-213',
  // Unova
  'unova-route-17',
  'unova-route-21',
  'unova-route-4',
  // Kalos
  'kalos-route-12',
  'kalos-route-8',
  'kalos-route-22',
  // Alola
  'alola-route-15',
  'alola-route-7',
  'alola-route-9',
  // Galar
  'galar-route-9',
  'galar-route-2',
  'galar-crown-tundra-frigid-sea',
  // Paldea
  'paldea-terarium-coastal-biome',
  'paldea-east-province-area-two',
  'paldea-west-province-area-one',
])

/**
 * Whether a route's table actually holds Water-type Pokemon.
 * @param {string} routeKey
 * @returns {boolean}
 */
function hasWaterSpecies(routeKey) {
  return (encounterData[routeKey]?.encounters ?? []).some((entry) =>
    (pokemonSpecies[entry.speciesKey]?.types ?? []).includes('Water')
  )
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
  if (FISHING_LOCATIONS.has(location.id) && hasWaterSpecies(location.routeKey ?? ''))
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
    table = encounterData[routeKey]?.encounters ?? []
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
