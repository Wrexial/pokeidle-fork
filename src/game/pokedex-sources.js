// Where a species comes from when it is not (or not only) a wild encounter.
// The Pokedex shows "Found:" route links; this fills in the non-route sources
// (the Game Corner prize track, fossil revives and the Ruins of Alph puzzle) so
// a species with no wild table doesn't look unobtainable.

import { fossilItems } from '../data/items.js'
import { pokedexData, pokemonSpecies, preEvolutionMap } from '../data/gameData.js'
import { GAME_CORNER_PRIZE_POOL } from './minigames/game-corner.js'
import { UNOWN_FORMS } from './minigames/sliding-puzzle.js'

/** @type {Map<string, string[]>} */
const sourcesBySpecies = new Map()

/**
 * @param {string[]} speciesKeys
 * @param {string} label
 */
function addSource(speciesKeys, label) {
  for (const speciesKey of speciesKeys) {
    const sources = sourcesBySpecies.get(speciesKey) ?? []
    if (!sources.includes(label)) sources.push(label)
    sourcesBySpecies.set(speciesKey, sources)
  }
}

addSource(
  GAME_CORNER_PRIZE_POOL.map((prize) => prize.speciesKey),
  'Game Corner'
)
addSource(
  Object.values(fossilItems).map((fossil) => fossil.speciesKey),
  'Fossil revive'
)
addSource(UNOWN_FORMS, 'Ruins of Alph puzzle')

/**
 * Non-wild ways to obtain a species, in display order.
 * @param {string} speciesKey
 * @returns {string[]}
 */
export function speciesSources(speciesKey) {
  return sourcesBySpecies.get(speciesKey) ?? []
}

/**
 * The Pokedex source labels for a species: the non-wild methods above, plus
 * `Evolves from <base>` when there is no wild route to fall back on.
 * @param {string} speciesKey
 * @returns {string[]}
 */
export function pokedexSourceLabels(speciesKey) {
  const labels = [...speciesSources(speciesKey)]
  if (!pokedexData[speciesKey]) {
    const base = preEvolutionMap[speciesKey]
    if (base) labels.push(`Evolves from ${pokemonSpecies[base]?.name ?? base}`)
  }
  return labels
}
