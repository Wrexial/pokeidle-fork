// Pokemon creation, display, battle-readiness and box helpers. Split from game/pokemon.js.

import { abilityData, pokemonSpecies } from '../../data/gameData.js'
import { randomNature } from '../../data/natures.js'
import { BOX_SORT_OPTIONS } from '../../data/ui.js'
import { resolvePokemonMoves } from './evolution.js'
import { calculateRequiredExperience } from './exp.js'
import { BASE_FRIENDSHIP } from './friendship.js'
import { calculatePokemonStats, generateIVs } from './stats.js'

/**
 * Roll a species' ability: usually one of its normal abilities, with a small
 * chance of its hidden ability. Returns null for a species with no data.
 * @param {string} speciesKey
 * @param {() => number} [rng]
 * @returns {string | null}
 */
export function rollAbility(speciesKey, rng = Math.random) {
  const entry = abilityData[speciesKey]
  if (!entry) return null
  if (entry.hidden && rng() < 0.1) return entry.hidden
  return entry.abilities?.length > 0
    ? entry.abilities[Math.floor(rng() * entry.abilities.length)]
    : (entry.hidden ?? null)
}

/** Display name for an ability key (e.g. `waterAbsorb` -> `Water Absorb`). @param {string} abilityKey */
export function abilityDisplayName(abilityKey) {
  return abilityKey
    ? abilityKey.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase())
    : ''
}

/**
 * The name to show for a Pokemon: its nickname if it has one, else its species
 * name.
 * @param {{ name?: string, nickname?: string }} pokemon
 * @returns {string}
 */
export function pokemonDisplayName(pokemon) {
  return pokemon.nickname || pokemon.name || ''
}

/**
 * Whether a Pokemon can fight: eggs cannot, and neither can fainted Pokemon.
 * @param {{ isEgg?: boolean, currentHp?: number }} pokemon
 * @returns {boolean}
 */
export function isBattleReady(pokemon) {
  return !pokemon.isEgg && (pokemon.currentHp ?? 0) > 0
}

/**
 * A Daycare egg: a level-1 Pokemon that needs `steps` wild wins in the party
 * before it hatches. Its species/nature/IVs are fixed at creation, optionally
 * inherited from its parents (see `inheritBreedingTraits`).
 * @param {string} speciesKey
 * @param {number | string} id
 * @param {boolean} isShiny
 * @param {number} steps
 * @param {BreedingInheritance} [inheritance]
 * @returns {Pokemon}
 */
export function createEgg(speciesKey, id, isShiny, steps, inheritance) {
  return {
    ...createPokemon(speciesKey, 1, id, isShiny, inheritance),
    isEgg: true,
    eggStepsRemaining: steps,
  }
}

/**
 * @param {string} speciesKey
 * @param {number} level
 * @param {number | string} id
 * @param {boolean} [isShiny]
 * @param {BreedingInheritance} [inheritance] Traits passed down from Daycare parents.
 * @returns {Pokemon}
 */
export function createPokemon(speciesKey, level, id, isShiny = !1, inheritance) {
  const species = pokemonSpecies[speciesKey],
    ivs = inheritance?.ivs ?? generateIVs(),
    nature = inheritance?.nature ?? randomNature(),
    stats = calculatePokemonStats(species, level, ivs, nature),
    moves =
      inheritance?.moves && inheritance.moves.length > 0
        ? inheritance.moves
        : resolvePokemonMoves(speciesKey, level)
  return {
    id: String(id),
    speciesKey,
    name: species.name,
    types: species.types,
    level,
    totalExp: calculateRequiredExperience(level, species.growthRate),
    moves,
    currentHp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    spAttack: stats.spAttack,
    spDefense: stats.spDefense,
    speed: stats.speed,
    ivs,
    nature,
    friendship: BASE_FRIENDSHIP,
    ability: rollAbility(speciesKey),
    heldItem: null,
    isShiny,
  }
}

/**
 * Sort a box by the chosen mode. Dex keeps the original order (dex number,
 * then highest level, then shiny first); the others lead with their own key.
 * @param {Pokemon[]} box
 * @param {string} [mode]
 * @returns {Pokemon[]}
 */
export function sortBoxMembers(box, mode = 'dex') {
  /** @type {(pokemon: Pokemon) => number} */
  const dexId = (pokemon) => pokemonSpecies[pokemon.speciesKey]?.id ?? 0
  /** @type {(pokemon: Pokemon) => string} */
  const speciesName = (pokemon) => pokemonSpecies[pokemon.speciesKey]?.name ?? pokemon.name
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byDex = (left, right) => dexId(left) - dexId(right)
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byLevelDesc = (left, right) => right.level - left.level
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byLevelAsc = (left, right) => left.level - right.level
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byName = (left, right) => speciesName(left).localeCompare(speciesName(right))
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byShiny = (left, right) => (left.isShiny === right.isShiny ? 0 : left.isShiny ? -1 : 1)
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byNewest = (left, right) => Number(right.id) - Number(left.id)
  /** @type {Record<string, (left: Pokemon, right: Pokemon) => number>} */
  const comparators = {
    dex: (left, right) => byDex(left, right) || byLevelDesc(left, right) || byShiny(left, right),
    level_desc: (left, right) => byLevelDesc(left, right) || byDex(left, right),
    level_asc: (left, right) => byLevelAsc(left, right) || byDex(left, right),
    name: (left, right) => byName(left, right) || byDex(left, right),
    shiny: (left, right) => byShiny(left, right) || byDex(left, right),
    newest: (left, right) => byNewest(left, right) || byDex(left, right),
  }
  return [...box].sort(comparators[mode] ?? comparators.dex)
}

/**
 * Add a newly obtained Pokemon to the box. With the "New" (newest) sort active
 * it is prepended so it shows up at the front of the list; every other sort
 * mode appends so a deliberate manual drag order survives new catches.
 * @param {Pokemon[]} box
 * @param {Pokemon} pokemon
 * @param {string} [boxSort]
 * @returns {Pokemon[]}
 */
export function insertIntoBox(box, pokemon, boxSort = 'dex') {
  return boxSort === 'newest' ? [pokemon, ...box] : [...box, pokemon]
}

/**
 * The next box sort mode in the cycle. `BOX_SORT_OPTIONS` is the source of
 * truth for the order; keep this tolerant of unknown values.
 * @param {string} [mode]
 * @returns {string}
 */
export function nextBoxSortMode(mode = 'dex') {
  const index = BOX_SORT_OPTIONS.findIndex((option) => option.value === mode)
  return BOX_SORT_OPTIONS[(index + 1) % BOX_SORT_OPTIONS.length].value
}
