// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

async function startApp() {
  await window.gameDataReady

  const loadedGameData = window.gameDataInjector.data
  return loadedGameData
}

const loadedGameData = await startApp()

export let pokemonSpecies = /** @type {Record<string, Species>} */ (loadedGameData.pokemonSpecies)

/** Gender rate + egg groups per species (see tools/fetch-breeding-data.cjs). */
export let breedingData = /** @type {Record<string, BreedingData>} */ (
  loadedGameData.breedingData ?? {}
)

/** Animated sprite ids with no gif, per variant (see download_pokemon_sprites.cjs). */
export let animatedSprites = /** @type {{ front: number[], back: number[], shiny: number[], backShiny: number[] }} */ (
  loadedGameData.animatedSprites ?? { front: [], back: [], shiny: [], backShiny: [] }
)

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

/**
 * A form reversing to its base (e.g. Palafin-H -> Palafin) must not be recorded
 * as that base's pre-evolution, or breeding/learnset chains start from a form
 * instead of the real root. Regional-form evolutions (id > 1025 on both sides,
 * like a-rattata -> a-raticate) are real and kept.
 * @param {string} from
 * @param {string} into
 */
const isFormRevert = (from, into) =>
  Number(pokemonSpecies[from]?.id) > 1025 &&
  (evolutionData[into] ?? []).some((evolution) => evolution.into === from)

/** @type {Record<string, string>} */
export let preEvolutionMap = Object.fromEntries(
  Object.entries(evolutionData).flatMap(([speciesKey, evolutions]) =>
    evolutions
      .filter((evolution) => !isFormRevert(speciesKey, evolution.into))
      .map((evolution) => [evolution.into, speciesKey])
  )
)
// A transform between two forms (Galarian Darmanitan <-> Galarian Darmanitan-Z)
// drops both directions above, leaving one form with no predecessor; reattach it
// to its partner so breeding/learnset chains still reach the real base.
let formChainChanged = true
while (formChainChanged) {
  formChainChanged = false
  for (const [from, evolutions] of Object.entries(evolutionData)) {
    if (Number(pokemonSpecies[from]?.id) <= 1025) continue
    for (const evolution of evolutions) {
      if (Number(pokemonSpecies[evolution.into]?.id) <= 1025) continue
      if (!(evolutionData[evolution.into] ?? []).some((back) => back.into === from)) continue
      if (preEvolutionMap[from] === undefined && preEvolutionMap[evolution.into] !== undefined)
        (preEvolutionMap[from] = evolution.into), (formChainChanged = true)
      else if (preEvolutionMap[evolution.into] === undefined && preEvolutionMap[from] !== undefined)
        (preEvolutionMap[evolution.into] = from), (formChainChanged = true)
    }
  }
}

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
 * Species that spawn on exactly one (non-raid) route, keyed by that route.
 * Used to badge the route-exclusive Pokemon in the Wild Pokemon grid.
 * @type {Record<string, Set<string>>}
 */
export const routeExclusiveSpecies = (() => {
  /** @type {Record<string, Set<string>>} */
  const routesBySpecies = {}
  for (const [routeKey, bucket] of Object.entries(encounterData)) {
    if (mapData[routeKey]?.type === 'raid') continue
    for (const encounter of bucket.encounters)
      (routesBySpecies[encounter.speciesKey] ??= new Set()).add(routeKey)
  }
  /** @type {Record<string, Set<string>>} */
  const exclusive = {}
  for (const [speciesKey, routes] of Object.entries(routesBySpecies)) {
    if (routes.size !== 1) continue
    const [routeKey] = routes
    ;(exclusive[routeKey] ??= new Set()).add(speciesKey)
  }
  return exclusive
})()

/**
 * National-dex range for each generation (Gen 1-9), in order. Shared by the
 * Pokedex tabs and the per-generation Shiny Charm.
 */
export const GENERATION_DEX_RANGES = [
  [1, 151],
  [152, 251],
  [252, 386],
  [387, 493],
  [494, 649],
  [650, 721],
  [722, 809],
  [810, 905],
  [906, 1025],
]

/** Species keys per generation, in national-dex order. */
export const speciesKeysByGeneration = GENERATION_DEX_RANGES.map(([lowId, highId]) =>
  Object.keys(pokemonSpecies).filter(
    (speciesKey) => pokemonSpecies[speciesKey].id >= lowId && pokemonSpecies[speciesKey].id <= highId
  )
)

/**
 * 0-based generation index for a national-dex id, or -1 for alternate forms
 * (ids above 1025) and placeholders.
 * @param {number} dexId
 * @returns {number}
 */
export function generationIndexForDexId(dexId) {
  return GENERATION_DEX_RANGES.findIndex(([lowId, highId]) => dexId >= lowId && dexId <= highId)
}

/**
 * @param {string} speciesKey
 * @returns {number}
 */
export function generationIndexForSpecies(speciesKey) {
  const species = pokemonSpecies[speciesKey]
  return species ? generationIndexForDexId(species.id) : -1
}

/**
 * Generation indices whose entire national dex has been caught. The Shiny Charm
 * works per generation, so each collected generation boosts the odds for its
 * own species.
 * @param {string[]} pokedexCaught
 * @returns {Set<number>}
 */
export function completedGenerations(pokedexCaught) {
  const caught = new Set(pokedexCaught)
  /** @type {Set<number>} */
  const completed = new Set()
  speciesKeysByGeneration.forEach((speciesKeys, generationIndex) => {
    if (speciesKeys.length > 0 && speciesKeys.every((speciesKey) => caught.has(speciesKey)))
      completed.add(generationIndex)
  })
  return completed
}

/**
 * Whether the Shiny Charm is active for `speciesKey` (its generation's dex is
 * complete).
 * @param {string} speciesKey
 * @param {Set<number>} completedGenerationSet
 * @returns {boolean}
 */
export function isSpeciesCharmed(speciesKey, completedGenerationSet) {
  const generationIndex = generationIndexForSpecies(speciesKey)
  return generationIndex >= 0 && completedGenerationSet.has(generationIndex)
}

/** @type {[string, Species][]} */
export let pokedexIndexes = Object.entries(pokemonSpecies).sort(
  (left, right) => left[1].id - right[1].id
)

/** @type {string[]} */
export const mapAreas = Object.keys(mapData)
