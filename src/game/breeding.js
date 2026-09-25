// Breeding rules: gender and egg-group compatibility for the Daycare.

import { breedingData, evolutionData, pokemonSpecies } from '../data/gameData.js'
import { evolutionItems } from '../data/items.js'
import { isMegaOrPrimalForm } from '../data/mega-evolution.js'
import { randomNature } from '../data/natures.js'
import {
  IV_STAT_ORDER,
  generateIVs,
  getFamilyLearnset,
  getPreEvolutionChain,
  resolvePokemonMoves,
} from './pokemon.js'

const isDitto = (/** @type {string} */ speciesKey) => speciesKey === 'ditto'

/**
 * Evolution options available to a Pokemon, with requirement labels and
 * whether each is currently met. Shared by the party and box UIs (gender
 * variants only offer the form matching this Pokemon's gender).
 * @param {Pokemon} pokemon
 * @param {Record<string, number>} inventory
 * @returns {{ targetName: string, canEvolve: boolean, requirementLabel: string, targetKey: string, itemId?: string }[]}
 */
export function getEvolutionOptions(pokemon, inventory) {
  const evolutionChain = evolutionData[pokemon.speciesKey]
  if (!evolutionChain) return []
  return evolutionChain
    .filter((evolution) => !isMegaOrPrimalForm(evolution.into))
    .filter((evolution) => !evolution.gender || evolution.gender === genderForPokemon(pokemon))
    .map((evolution) => {
      const targetSpecies = pokemonSpecies[evolution.into],
        levelMet = !evolution.level || pokemon.level >= evolution.level,
        itemOwned = !evolution.item || (inventory[evolution.item] ?? 0) > 0,
        friendshipMet = !evolution.friendship || (pokemon.friendship ?? 0) >= evolution.friendship,
        canEvolve = levelMet && itemOwned && friendshipMet,
        requirementParts = []
      if (evolution.level) requirementParts.push(`Lv. ${evolution.level}`)
      if (evolution.item) {
        const itemName =
          evolution.item in evolutionItems ? evolutionItems[evolution.item].name : evolution.item
        requirementParts.push(itemName)
      }
      if (evolution.friendship) requirementParts.push(`Friendship ${evolution.friendship}`)
      return {
        targetName: targetSpecies?.name ?? evolution.into,
        canEvolve,
        requirementLabel: requirementParts.join(' + ') || 'Ready',
        targetKey: evolution.into,
        itemId: evolution.item,
      }
    })
}

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
 * A Pokemon's gender: fixed for a gender-form species, then any gender stored
 * on the Pokemon (e.g. rolled by the Bug Catching Contest), otherwise derived
 * deterministically from its id (so it's stable across reloads without being
 * saved) using its species' gender rate.
 * @param {{ speciesKey: string, id?: string | number, gender?: 'male' | 'female' | 'genderless' }} pokemon
 * @returns {'male' | 'female' | 'genderless'}
 */
export function genderForPokemon(pokemon) {
  const fixedGender = GENDER_FORM_SPECIES[pokemon.speciesKey]
  if (fixedGender) return fixedGender
  if (pokemon.gender) return pokemon.gender
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
 * Whether a Pokemon should use the female sprite. Species without a female
 * variant simply keep the shared art, so this is only a hint for the renderer.
 * @param {{ speciesKey: string, id?: string | number, gender?: 'male' | 'female' | 'genderless' }} pokemon
 * @returns {boolean}
 */
export function isFemalePokemon(pokemon) {
  return genderForPokemon(pokemon) === 'female'
}

/**
 * Roll a fresh gender from a species' gender rate. Battle-only rivals have no
 * id to derive a stable gender from, so this is rolled once when they appear.
 * @param {string} speciesKey
 * @returns {'male' | 'female' | 'genderless'}
 */
export function rollGender(speciesKey) {
  const fixedGender = GENDER_FORM_SPECIES[speciesKey]
  if (fixedGender) return fixedGender
  const data = breedingData[speciesKey]
  if (!data || data.genderRate === -1) return 'genderless'
  if (data.genderRate === 0) return 'male'
  if (data.genderRate === 8) return 'female'
  return Math.random() < data.genderRate / 8 ? 'female' : 'male'
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

/** Fisher-Yates shuffle (in place). @param {any[]} items */
function shuffle(items) {
  for (let index = items.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

/**
 * Roll the egg's IVs, then overwrite 3 randomly chosen stats with the best of
 * the two parents' value, so breeding can improve a bloodline (like the real
 * games' inherited IVs).
 * @param {Pokemon[]} parents
 * @returns {Record<string, number>}
 */
export function inheritIVs(parents) {
  const ivs = /** @type {Record<string, number>} */ (generateIVs())
  for (const stat of shuffle([...IV_STAT_ORDER]).slice(0, 3))
    ivs[stat] = Math.max(...parents.map((parent) => parent.ivs?.[stat] ?? 0))
  return ivs
}

/**
 * 50% chance the egg inherits one parent's nature (Everstone-style), otherwise
 * it rolls a fresh one.
 * @param {Pokemon[]} parents
 * @returns {string}
 */
export function inheritNature(parents) {
  const natures = /** @type {string[]} */ (
    parents.map((parent) => parent.nature).filter((nature) => !!nature)
  )
  return natures.length > 0 && Math.random() < 0.5
    ? natures[Math.floor(Math.random() * natures.length)]
    : randomNature()
}

/**
 * The egg's starting moves: its level-1 learnset, padded up to four moves with
 * any moves its parents know that are also in the family's learnset (so a
 * parent's hard-earned moves can be passed down as an early head start).
 * @param {Pokemon[]} parents
 * @param {string} speciesKey
 * @returns {string[]}
 */
export function inheritMoves(parents, speciesKey) {
  const inherited = resolvePokemonMoves(speciesKey, 1),
    familyMoves = new Set(getFamilyLearnset(speciesKey, 1000).map((entry) => entry.moveId))
  for (const parent of parents)
    for (const moveId of parent.moves ?? []) {
      if (inherited.length >= 4) break
      if (familyMoves.has(moveId) && !inherited.includes(moveId)) inherited.push(moveId)
    }
  return inherited
}

/**
 * All the traits a Daycare egg inherits from its parents at once: IVs, nature
 * and starting moves.
 * @param {Pokemon[]} parents
 * @param {string} speciesKey
 * @returns {BreedingInheritance}
 */
export function inheritBreedingTraits(parents, speciesKey) {
  return {
    ivs: inheritIVs(parents),
    nature: inheritNature(parents),
    moves: inheritMoves(parents, speciesKey),
  }
}
