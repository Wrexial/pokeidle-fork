// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

async function startApp() {
  await window.gameDataReady

  const loadedGameData = window.gameDataInjector.data
  return loadedGameData
}

const loadedGameData = await startApp()

export let pokemonSpecies = /** @type {Record<string, Species>} */ (loadedGameData.pokemonSpecies)

export let evolutionData = /** @type {Record<string, Evolution[]>} */ (loadedGameData.evolutionData)

export let moveLearnsets = /** @type {Record<string, [number, string][]>} */ (
  loadedGameData.moveLearnsets
)

export let mapData = /** @type {Record<string, MapLocation>} */ (loadedGameData.mapData)

export let encounterData = /** @type {Record<string, EncounterData>} */ (
  loadedGameData.mapEncounterData
)

export let moveData = /** @type {Record<string, Move>} */ (loadedGameData.moveData)

export let trainerClasses = /** @type {Record<string, string>} */ (loadedGameData.trainerClasses)

export let trainerData = /** @type {Record<string, any[]>} */ (loadedGameData.trainerData)

export let gymLeaderData = /** @type {any[]} */ (loadedGameData.gymLeaderData)

export let elite4Data = /** @type {any[]} */ (loadedGameData.elite4Data)

export let championData = /** @type {any[]} */ (loadedGameData.championData)

export let regions = /** @type {Region[]} */ (loadedGameData.regions || [])

/**
 * Raid pool for a region — its generation's Pokemon that can't be caught in
 * the region (empty if the region is unknown).
 * @param {string} regionId
 * @returns {{ speciesKey: string, level: number }[]}
 */
export function raidPoolFor(regionId) {
  return regions.find((region) => region.id === regionId)?.raidPool ?? []
}

/** @type {Record<string, string>} */
export let preEvolutionMap = Object.fromEntries(
  Object.entries(evolutionData).flatMap(([speciesKey, evolutions]) =>
    evolutions.map((evolution) => [evolution.into, speciesKey])
  )
)

/** @type {Record<string, string[]>} */
export let pokedexData = {}

for (const location of Object.values(encounterData))
  for (const encounter of location.encounters)
    (pokedexData[encounter.speciesKey] || (pokedexData[encounter.speciesKey] = []),
      pokedexData[encounter.speciesKey].includes(location.name) ||
        pokedexData[encounter.speciesKey].push(location.name))

/** @type {string[]} */
export const wildSpeciesKeys = [
  ...new Set(
    Object.values(encounterData).flatMap((route) =>
      route.encounters.map((encounter) => encounter.speciesKey)
    )
  ),
]

/** Number of distinct species obtainable as wild encounters (global Pokédex goal). */
export const catchableSpeciesCount = wildSpeciesKeys.length

/**
 * Wild species per region — the regional Pokédex goal. Each region's routes and
 * Raid Island are its `mapData` locations, whose `routeKey` points at the
 * matching `encounterData` bucket, so this partitions `wildSpeciesKeys` by
 * region.
 * @type {Record<string, string[]>}
 */
export const wildSpeciesKeysByRegion = (() => {
  /** @type {Record<string, Set<string>>} */
  const byRegion = {}
  for (const location of Object.values(mapData)) {
    const bucket = location.routeKey ? encounterData[location.routeKey] : null
    if (!bucket) continue
    const region = location.region ?? 'kanto'
    ;(byRegion[region] || (byRegion[region] = new Set()))
    for (const encounter of bucket.encounters) byRegion[region].add(encounter.speciesKey)
  }
  return Object.fromEntries(
    Object.entries(byRegion).map(([region, speciesSet]) => [region, [...speciesSet]])
  )
})()

/** Distinct wild species count per region (regional Shiny Charm goal). */
export const catchableSpeciesCountByRegion = Object.fromEntries(
  Object.entries(wildSpeciesKeysByRegion).map(([region, speciesKeys]) => [region, speciesKeys.length])
)

/**
 * Whether every wild species of `regionId` has been caught — the regional
 * Shiny Charm condition.
 * @param {string} regionId
 * @param {string[]} pokedexCaught
 * @returns {boolean}
 */
export function isRegionalDexComplete(regionId, pokedexCaught) {
  const requiredSpecies = wildSpeciesKeysByRegion[regionId]
  if (!requiredSpecies || requiredSpecies.length === 0) return false
  const caught = new Set(pokedexCaught)
  return requiredSpecies.every((speciesKey) => caught.has(speciesKey))
}

/** @type {[string, Species][]} */
export let pokedexIndexes = Object.entries(pokemonSpecies).sort(
  (left, right) => left[1].id - right[1].id
)

/** @type {string[]} */
export const mapAreas = Object.keys(mapData)
