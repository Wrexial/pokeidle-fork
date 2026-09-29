// Monotype-challenge helpers, shared by the random Monotype starter and the
// Pokemon-reward minigames. Every find in a Monotype run must carry the chosen
// type, even when the minigame (fishing, the Safari Zone, ...) normally draws
// from a route- or theme-specific pool.

import { pokemonSpecies } from '../../data/gameData.js'

/**
 * Whether a species carries `type` (e.g. "Water"). Used by the Monotype
 * challenge to keep encounters on-type.
 * @param {string} speciesKey
 * @param {string} type
 * @returns {boolean}
 */
export function speciesHasType(speciesKey, type) {
  return !!pokemonSpecies[speciesKey]?.types?.includes(type)
}

/**
 * National-dex species a challenge roll may draw: no alternate forms, no
 * legendaries and no MissingNo.
 * @type {string[]}
 */
export const challengeEligibleSpecies = Object.keys(pokemonSpecies).filter((speciesKey) => {
  const species = pokemonSpecies[speciesKey]
  return species.id > 0 && species.id <= 1025 && !species.legendary
})

/**
 * Every challenge-eligible species carrying `type`.
 * @param {string} type
 * @returns {string[]}
 */
export function monotypeSpeciesPool(type) {
  return challengeEligibleSpecies.filter((speciesKey) => speciesHasType(speciesKey, type))
}
