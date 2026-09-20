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

export let championData = /** @type {any} */ (loadedGameData.championData)

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

/** @type {[string, Species][]} */
export let pokedexIndexes = Object.entries(pokemonSpecies).sort(
  (left, right) => left[1].id - right[1].id
)

/** @type {string[]} */
export const mapAreas = Object.keys(mapData)
