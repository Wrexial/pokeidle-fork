// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

async function startApp() {
  await window.gameDataReady

  const loadedGameData = window.gameDataInjector.data
  return loadedGameData
}

const loadedGameData = await startApp()

export let pokemonSpecies = loadedGameData.pokemonSpecies

export let evolutionData = loadedGameData.evolutionData

export let moveLearnsets = loadedGameData.moveLearnsets

export let mapData = loadedGameData.mapData

export let encounterData = loadedGameData.mapEncounterData

export let moveData = loadedGameData.moveData

export let trainerClasses = loadedGameData.trainerClasses

export let trainerData = loadedGameData.trainerData

export let gymLeaderData = loadedGameData.gymLeaderData

export let elite4Data = loadedGameData.elite4Data

export let championData = loadedGameData.championData

export let preEvolutionMap = Object.fromEntries(
  Object.entries(evolutionData).flatMap(([speciesKey, evolutions]) =>
    evolutions.map((evolution) => [evolution.into, speciesKey])
  )
)

export let pokedexData = {}

for (const location of Object.values(encounterData))
  for (const encounter of location.encounters)
    (pokedexData[encounter.speciesKey] || (pokedexData[encounter.speciesKey] = []),
      pokedexData[encounter.speciesKey].includes(location.name) ||
        pokedexData[encounter.speciesKey].push(location.name))

export let pokedexIndexes = Object.entries(pokemonSpecies).sort(
  (left, right) => left[1].id - right[1].id
)

export const mapAreas = Object.keys(mapData)
