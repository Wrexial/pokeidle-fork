// Build the BattlePokemon object used for wild, trainer and raid opponents.
// Centralises the stat/moves block so every opponent carries the same fields.
import { pokemonSpecies } from '../../data/gameData.js'
import { FORM_SPECIES } from '../../data/form-species.js'
import { rollGender } from '../breeding.js'
import { rollHeldItem } from '../held-items.js'
import { calculatePokemonStats, generateIVs, getPerfectIVs, resolvePokemonMoves, rollAbility } from '../pokemon.js'

/**
 * @param {string} speciesKey
 * @param {number} level
 * @param {{
 *   isShiny?: boolean,
 *   isRoamer?: boolean,
 *   perfectIvs?: boolean,
 *   gender?: boolean,
 *   wild?: boolean,
 * }} [options] `wild` rolls an ability, held item and gender; `gender` rolls
 * only the gender (trainer teams). `perfectIvs` uses 31 IVs instead of random.
 * @returns {any}
 */
export function createBattlePokemon(speciesKey, level, options = {}) {
  const { isShiny = false, isRoamer = false, perfectIvs = false, gender = false, wild = false } = options,
    species = pokemonSpecies[speciesKey],
    ivs = perfectIvs ? getPerfectIVs() : generateIVs(),
    stats = calculatePokemonStats(species, level, ivs)
  return {
    speciesKey,
    name: species.name,
    types: species.types,
    level,
    currentHp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    spAttack: stats.spAttack,
    spDefense: stats.spDefense,
    speed: stats.speed,
    moves: resolvePokemonMoves(speciesKey, level),
    // Kept so a mid-battle form change can recompute the new form's stats.
    ivs,
    ...(wild
      ? {
          ability: rollAbility(speciesKey),
          heldItem: rollHeldItem(0.08),
          gender: rollGender(speciesKey),
          isRoamer,
        }
      : gender
        ? { gender: rollGender(speciesKey) }
        : {}),
    isPlayer: !1,
    isShiny,
  }
}

/**
 * A species entry by key, falling back to the battle-only synthetic forms
 * (Castform's weather forms, Morpeko Hangry, Minior Core, ...).
 * @param {string} speciesKey
 * @returns {any}
 */
export function battleSpecies(speciesKey) {
  return pokemonSpecies[speciesKey] ?? FORM_SPECIES[speciesKey] ?? null
}

/**
 * Rebuild a battle Pokemon's species, types and stats from its `formKey` (a
 * mid-battle form change), preserving the HP ratio. Does nothing when there is
 * no pending form.
 * @param {any} pokemon
 * @returns {any}
 */
export function applyBattleForm(pokemon) {
  if (!pokemon?.formKey) return pokemon
  const form = battleSpecies(pokemon.formKey)
  if (!form) return pokemon
  const stats = calculatePokemonStats(form, pokemon.level, pokemon.ivs ?? getPerfectIVs(), pokemon.nature),
    hpRatio = pokemon.maxHp > 0 ? pokemon.currentHp / pokemon.maxHp : 1
  pokemon.speciesKey = pokemon.formKey
  pokemon.name = form.name
  pokemon.types = form.types
  pokemon.typesOverride = null
  pokemon.maxHp = stats.hp
  pokemon.currentHp = Math.max(1, Math.round(stats.hp * hpRatio))
  pokemon.attack = stats.attack
  pokemon.defense = stats.defense
  pokemon.spAttack = stats.spAttack
  pokemon.spDefense = stats.spDefense
  pokemon.speed = stats.speed
  return pokemon
}

/**
 * Change a battle Pokemon into `formKey` and push a log event.
 * @param {any} pokemon
 * @param {string} formKey
 * @param {any[]} events
 * @param {boolean} isPlayer
 */
export function changeBattleForm(pokemon, formKey, events, isPlayer) {
  if (!pokemon || pokemon.speciesKey === formKey || !battleSpecies(formKey)) return
  pokemon.formKey = formKey
  applyBattleForm(pokemon)
  events.push({
    type: 'status',
    message: `${pokemon.name} changed form!`,
    data: { target: isPlayer ? 'player' : 'enemy' },
  })
}
