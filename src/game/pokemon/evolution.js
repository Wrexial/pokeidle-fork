// Evolution chains and the level-up/TM learnsets. Split from game/pokemon.js.

import { evolutionData, moveLearnsets, pokemonSpecies, preEvolutionMap, tmLearnsets } from '../../data/gameData.js'

/**
 * @param {string} speciesKey
 * @returns {string[]}
 */
export function getPreEvolutionChain(speciesKey) {
  const chain = [speciesKey],
    seen = new Set([speciesKey])
  let current = speciesKey
  // Special forms (e.g. darmanitan <-> darmanitan-z) make `preEvolutionMap`
  // cyclic, so stop once we revisit a species instead of looping forever.
  for (let next = preEvolutionMap[current]; next && !seen.has(next); next = preEvolutionMap[current]) {
    current = next
    seen.add(current)
    chain.unshift(current)
  }
  return chain
}

/**
 * @param {string} speciesKey
 * @param {number} level
 * @returns {{ moveId: string, learnLevel: number, fromSpecies: string }[]}
 */
export function getFamilyLearnset(speciesKey, level) {
  const chain = getPreEvolutionChain(speciesKey),
    seen = new Set(),
    moves = []
  for (const chainSpeciesKey of chain) {
    const learnset = moveLearnsets[chainSpeciesKey] || []
    for (const [learnLevel, moveId] of learnset)
      learnLevel <= level &&
        !seen.has(moveId) &&
        (seen.add(moveId),
        moves.push({
          moveId,
          learnLevel,
          fromSpecies: chainSpeciesKey,
        }))
  }
  return moves
}

/**
 * @param {string} speciesKey
 * @param {number} level
 * @returns {string[]}
 */
export function resolvePokemonMoves(speciesKey, level) {
  return (moveLearnsets[speciesKey] || [])
    .filter(([learnLevel]) => learnLevel <= level)
    .map(([, moveId]) => moveId)
    .slice(-4)
}

/**
 * TM moves a Pokemon can be tutored that aren't already in its family's
 * level-up learnset, in stable order.
 * @param {string} speciesKey
 * @returns {string[]}
 */
export function getTutorMoves(speciesKey) {
  const tmMoves = tmLearnsets[speciesKey]
  if (!tmMoves) return []
  const familyMoves = new Set(
    getFamilyLearnset(speciesKey, 1000).map((entry) => entry.moveId)
  )
  return tmMoves.filter((moveId) => !familyMoves.has(moveId))
}

/**
 * Whether a move is a Move Tutor (TM) move for this species.
 * @param {string} speciesKey
 * @param {string} moveId
 * @returns {boolean}
 */
export function isTutorMove(speciesKey, moveId) {
  return getTutorMoves(speciesKey).includes(moveId)
}

/**
 * Whether a species has an ordinary (non-form) evolution left, used by the
 * Eviolite. Megas/Gigantamax and alternate-form ids are ignored.
 * @param {string} speciesKey
 * @returns {boolean}
 */
export function canEvolveFurther(speciesKey) {
  return (evolutionData[speciesKey] || []).some(
    (evolution) =>
      !evolution.form &&
      pokemonSpecies[evolution.into] &&
      pokemonSpecies[evolution.into].id <= 1025
  )
}
