// Breeding rules: gender and egg-group compatibility for the Daycare.

import { breedingData, pokemonSpecies } from '../data/gameData.js'
import { getPreEvolutionChain } from './pokemon.js'

const isDitto = (/** @type {string} */ speciesKey) => speciesKey === 'ditto'

/**
 * Species whose form *is* their gender — the male/female variants are fixed,
 * not transformable. Basculegion/Oinkologne pick theirs on evolution (see the
 * `gender` tag in `evolution-data.json`); Indeedee has no evolution, so each
 * variant is simply its own fixed-gender species.
 * @type {Record<string, 'male' | 'female'>}
 */
const GENDER_FORM_SPECIES = {
  basculegion: 'male',
  'basculegion-f': 'female',
  indeedee: 'male',
  'indeedee-f': 'female',
  oinkologne: 'male',
  'oinkologne-f': 'female',
}

/**
 * A Pokemon's gender: fixed for a gender-form species, otherwise derived
 * deterministically from its id (so it's stable across reloads without being
 * saved) using its species' gender rate.
 * @param {Pokemon} pokemon
 * @returns {'male' | 'female' | 'genderless'}
 */
export function genderForPokemon(pokemon) {
  const fixedGender = GENDER_FORM_SPECIES[pokemon.speciesKey]
  if (fixedGender) return fixedGender
  const data = breedingData[pokemon.speciesKey]
  if (!data || data.genderRate === -1) return 'genderless'
  if (data.genderRate === 0) return 'male'
  if (data.genderRate === 8) return 'female'
  const threshold = data.genderRate / 8,
    numericId = Number(pokemon.id),
    seed =
      Number.isFinite(numericId) && numericId > 0
        ? numericId
        : [...String(pokemon.id)].reduce(
            (accumulator, char) => (accumulator * 31 + char.charCodeAt(0)) >>> 0,
            7
          ),
    // Knuth multiplicative hash: spreads sequential ids across [0, 1).
    fraction = ((seed * 2654435761) % 4294967296) / 4294967296
  return fraction < threshold ? 'female' : 'male'
}

/** Symbol shown next to a Pokemon's name. */
export function genderSymbol(/** @type {'male' | 'female' | 'genderless'} */ gender) {
  return gender === 'male' ? '♂' : gender === 'female' ? '♀' : '—'
}

/**
 * Whether two Daycare parents can produce an egg. Ditto breeds with any other
 * breedable Pokemon; otherwise the pair must be opposite genders and share an
 * egg group. Genderless and undiscovered species only breed via Ditto.
 * @param {Pokemon[]} parents
 * @returns {{ ok: boolean, reason: string }}
 */
export function breedingCompatibility(parents) {
  if (parents.length < 2) return { ok: false, reason: 'Deposit two Pokemon to breed.' }
  const [first, second] = parents,
    dataA = breedingData[first.speciesKey],
    dataB = breedingData[second.speciesKey]
  if (!dataA || !dataB) return { ok: false, reason: 'This Pokemon cannot breed.' }
  if (dataA.undiscovered || dataB.undiscovered)
    return { ok: false, reason: 'This Pokemon is in the Undiscovered egg group.' }
  const aDitto = isDitto(first.speciesKey),
    bDitto = isDitto(second.speciesKey)
  if (aDitto && bDitto) return { ok: false, reason: 'Two Ditto cannot breed.' }
  if (aDitto || bDitto) return { ok: true, reason: 'Ditto can breed with almost anything.' }
  const genderA = genderForPokemon(first),
    genderB = genderForPokemon(second)
  if (genderA === 'genderless' || genderB === 'genderless')
    return { ok: false, reason: 'Genderless Pokemon need a Ditto to breed.' }
  if (genderA === genderB) return { ok: false, reason: `Both parents are ${genderA}.` }
  if (!dataA.eggGroups.some((group) => dataB.eggGroups.includes(group)))
    return { ok: false, reason: 'The parents share no egg group.' }
  return { ok: true, reason: 'Compatible parents.' }
}

/** @param {Pokemon[]} parents @returns {boolean} */
export function canBreed(parents) {
  return breedingCompatibility(parents).ok
}

/**
 * The species the egg will hatch into: the mother's base form (or the
 * non-Ditto parent's, when one parent is Ditto).
 * @param {Pokemon[]} parents
 * @returns {string | null}
 */
export function eggSpeciesKey(parents) {
  const [first, second] = parents
  if (!first || !second) return null
  const aDitto = isDitto(first.speciesKey),
    bDitto = isDitto(second.speciesKey),
    mother =
      aDitto && !bDitto
        ? second
        : bDitto && !aDitto
          ? first
          : genderForPokemon(first) === 'female'
            ? first
            : second,
    base = getPreEvolutionChain(mother.speciesKey)[0] ?? mother.speciesKey
  return pokemonSpecies[base] ? base : null
}

/**
 * How many wild battles an egg of this species needs to hatch. Stronger and
 * rarer species take longer (base-stat total scaled into 30-120 battles).
 * @param {string} speciesKey
 * @returns {number}
 */
export function eggHatchSteps(speciesKey) {
  const species = pokemonSpecies[speciesKey],
    total = species
      ? Object.values(species.baseStats).reduce((sum, value) => sum + value, 0)
      : 300
  return Math.max(30, Math.min(120, Math.round(total / 5)))
}
