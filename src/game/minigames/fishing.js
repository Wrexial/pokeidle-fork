// Fishing spots. Kept separate from route-activities.js so the crafted
// water-rich route list can be shared without importing the catching helpers
// (which would cycle). The rare species on these routes are no longer fishing
// exclusives: a good cast simply boosts the shiny odds and level instead.

import { encounterData, pokemonSpecies } from '../../data/gameData.js'

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

/** Whether a route's table actually holds Water-type Pokemon. @param {string} routeKey */
export function routeHasWaterSpecies(routeKey) {
  return (encounterData[routeKey]?.encounters ?? []).some((entry) =>
    (pokemonSpecies[entry.speciesKey]?.types ?? []).includes('Water')
  )
}
