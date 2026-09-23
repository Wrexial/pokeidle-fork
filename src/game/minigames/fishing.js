// Fishing spots and their exclusive catches. Kept separate from
// route-activities.js so the normal encounter roll can consult the fishing
// exclusives without importing the catching helpers (which would cycle).

import { encounterData, mapData, pokemonSpecies } from '../../data/gameData.js'

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

/** Route keys belonging to a fishing spot. */
const FISHING_ROUTE_KEYS = new Set(
  Object.values(mapData)
    .filter((location) => location.routeKey && FISHING_LOCATIONS.has(location.id))
    .map((location) => location.routeKey)
)

/** Whether a route is one of the curated fishing spots. @param {string} routeKey */
export function isFishingRoute(routeKey) {
  return FISHING_ROUTE_KEYS.has(routeKey)
}

/** Whether a route's table actually holds Water-type Pokemon. @param {string} routeKey */
export function routeHasWaterSpecies(routeKey) {
  return (encounterData[routeKey]?.encounters ?? []).some((entry) =>
    (pokemonSpecies[entry.speciesKey]?.types ?? []).includes('Water')
  )
}

/**
 * The rarest Water species on a fishing route. It is pulled out of the normal
 * wild table and only appears on a perfect fishing cast, so it is the route's
 * fishing-exclusive catch. Returns null when the route is not a fishing spot or
 * has too few Water species to spare one.
 * @param {string} routeKey
 * @returns {string | null}
 */
export function fishingExclusiveFor(routeKey) {
  if (!isFishingRoute(routeKey)) return null
  const water = (encounterData[routeKey]?.encounters ?? []).filter((entry) =>
    (pokemonSpecies[entry.speciesKey]?.types ?? []).includes('Water')
  )
  if (water.length < 2) return null
  return water.reduce((best, entry) => {
    if (entry.weight < best.weight) return entry
    if (entry.weight === best.weight && entry.minLevel > best.minLevel) return entry
    return best
  }, water[0]).speciesKey
}

/**
 * The normal wild table for a route with its fishing-exclusive species removed,
 * so that species can only be caught by fishing.
 * @param {string} routeKey
 * @param {EncounterEntry[]} encounters
 * @returns {EncounterEntry[]}
 */
export function encountersWithoutFishingExclusive(routeKey, encounters) {
  const exclusive = fishingExclusiveFor(routeKey)
  return exclusive ? encounters.filter((entry) => entry.speciesKey !== exclusive) : encounters
}
