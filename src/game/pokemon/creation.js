// Pokemon creation, display, battle-readiness and box helpers. Split from game/pokemon.js.

import { abilityData, pokemonSpecies } from '../../data/gameData.js'
import { randomNature } from '../../data/natures.js'
import { BOX_SORT_FIELDS } from '../../data/ui.js'
import { resolvePokemonMoves } from './evolution.js'
import { calculateRequiredExperience } from './exp.js'
import { BASE_FRIENDSHIP } from './friendship.js'
import { rollSize } from './sizes.js'
import { IV_STAT_ORDER, calculatePokemonStats, createEmptyEvs, generateIVs } from './stats.js'

/** The base chance a rolled Pokemon gets its hidden ability (10%). */
export const HIDDEN_ABILITY_CHANCE = 0.1

/**
 * Roll a species' ability: usually one of its normal abilities, with a small
 * chance of its hidden ability (raised by an SOS chain). Returns null for a
 * species with no data.
 * @param {string} speciesKey
 * @param {() => number} [rng]
 * @param {number} [hiddenChance] Chance of the hidden ability (0-1).
 * @returns {string | null}
 */
export function rollAbility(speciesKey, rng = Math.random, hiddenChance = HIDDEN_ABILITY_CHANCE) {
  const entry = abilityData[speciesKey]
  if (!entry) return null
  if (entry.hidden && rng() < hiddenChance) return entry.hidden
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
    // Effort Values start empty; only vitamins raise them.
    evs = createEmptyEvs(),
    stats = calculatePokemonStats(species, level, ivs, nature, evs),
    moves =
      inheritance?.moves && inheritance.moves.length > 0
        ? inheritance.moves
        : resolvePokemonMoves(speciesKey, level),
    inheritedEggMoves = inheritance?.eggMoves?.filter((moveId) => !!moveId) ?? []
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
    evs,
    nature,
    friendship: BASE_FRIENDSHIP,
    ability: rollAbility(speciesKey),
    heldItem: null,
    isShiny,
    gmax: false,
    // Per-individual size (0-255), mapped to an XS-XL rating for display.
    size: inheritance?.size ?? rollSize(),
    ...(inheritedEggMoves.length > 0 ? { eggMoves: [...new Set(inheritedEggMoves)] } : {}),
  }
}

/**
 * Parse a stored box-sort value into its field and direction. Accepts the
 * legacy field-only values (`dex`, `name`, `shiny`, `newest`, and the old
 * `level_asc` / `level_desc`) as well as the current `"<field>_<dir>"` form,
 * falling back to a field's default direction.
 * @param {string} [mode]
 * @returns {{ field: string, direction: string }}
 */
export function parseBoxSort(mode = 'dex') {
  const [rawField, rawDirection] = String(mode).split('_')
  // `level_asc`/`level_desc` already split cleanly; a bare field is legacy.
  const field = BOX_SORT_FIELDS.find((option) => option.value === rawField),
    direction = rawDirection === 'asc' || rawDirection === 'desc' ? rawDirection : null
  return {
    field: field?.value ?? 'dex',
    direction: direction ?? field?.defaultDirection ?? 'asc',
  }
}

/**
 * @param {string} field
 * @param {string} direction
 * @returns {string}
 */
export function formatBoxSort(field, direction) {
  return `${field}_${direction}`
}

/**
 * Sort a box by the chosen field and direction. Ties fall back to dex order,
 * then highest level, then shiny first, so the list stays stable.
 * @param {Pokemon[]} box
 * @param {string} [mode]
 * @returns {Pokemon[]}
 */
export function sortBoxMembers(box, mode = 'dex') {
  const { field, direction } = parseBoxSort(mode),
    /** @type {(pokemon: Pokemon) => number} */
    dexId = (pokemon) => pokemonSpecies[pokemon.speciesKey]?.id ?? 0,
    /** @type {(pokemon: Pokemon) => string} */
    speciesName = (pokemon) => pokemonSpecies[pokemon.speciesKey]?.name ?? pokemon.name,
    /** @type {(left: Pokemon, right: Pokemon) => number} */
    byDex = (left, right) => dexId(left) - dexId(right),
    /** @type {(left: Pokemon, right: Pokemon) => number} */
    byLevelDesc = (left, right) => right.level - left.level,
    /** @type {(left: Pokemon, right: Pokemon) => number} */
    byLevelAsc = (left, right) => left.level - right.level,
    /** @type {(left: Pokemon, right: Pokemon) => number} */
    byName = (left, right) => speciesName(left).localeCompare(speciesName(right)),
    /** @type {(left: Pokemon, right: Pokemon) => number} */
    byShiny = (left, right) => (left.isShiny === right.isShiny ? 0 : left.isShiny ? -1 : 1),
    // Ascending is normal-first; descending is shiny-first.
    /** @type {(left: Pokemon, right: Pokemon) => number} */
    byShinyAsc = (left, right) => Number(left.isShiny) - Number(right.isShiny),
    /** @type {(left: Pokemon, right: Pokemon) => number} */
    byNewest = (left, right) => Number(left.id) - Number(right.id),
    /** @type {(pokemon: Pokemon) => number} */
    ivTotal = (pokemon) =>
      IV_STAT_ORDER.reduce(
        (sum, statKey) => sum + (Number(pokemon.ivs?.[statKey]) || 0),
        0
      ),
    /** @type {(left: Pokemon, right: Pokemon) => number} */
    byIv = (left, right) => ivTotal(left) - ivTotal(right),
    /** @type {Record<string, (left: Pokemon, right: Pokemon) => number>} */
    fields = {
      dex: byDex,
      level: byLevelAsc,
      iv: byIv,
      name: byName,
      shiny: byShinyAsc,
      newest: byNewest,
    },
    fieldComparator = fields[field] ?? byDex,
    sign = direction === 'desc' ? -1 : 1,
    /** @type {(left: Pokemon, right: Pokemon) => number} */
    tieBreak = (left, right) => byDex(left, right) || byLevelDesc(left, right) || byShiny(left, right)
  return [...box].sort(
    (left, right) => sign * fieldComparator(left, right) || tieBreak(left, right)
  )
}

/**
 * Advance the sort field to the next one, keeping the current direction.
 * @param {string} [mode]
 * @returns {string}
 */
export function nextBoxSortField(mode = 'dex') {
  const { field, direction } = parseBoxSort(mode),
    index = BOX_SORT_FIELDS.findIndex((option) => option.value === field)
  return formatBoxSort(BOX_SORT_FIELDS[(index + 1) % BOX_SORT_FIELDS.length].value, direction)
}

/**
 * Flip the sort direction, keeping the current field.
 * @param {string} [mode]
 * @returns {string}
 */
export function toggleBoxSortDirection(mode = 'dex') {
  const { field, direction } = parseBoxSort(mode)
  return formatBoxSort(field, direction === 'asc' ? 'desc' : 'asc')
}

/**
 * Add a newly obtained Pokemon to the box. With the "New" field sorted
 * newest-first it is prepended so it shows up at the front; every other sort
 * appends so a deliberate manual drag order survives new catches.
 * @param {Pokemon[]} box
 * @param {Pokemon} pokemon
 * @param {string} [boxSort]
 * @returns {Pokemon[]}
 */
export function insertIntoBox(box, pokemon, boxSort = 'dex') {
  const { field, direction } = parseBoxSort(boxSort)
  return field === 'newest' && direction === 'desc' ? [pokemon, ...box] : [...box, pokemon]
}
