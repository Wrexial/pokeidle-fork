// Build the BattlePokemon object used for wild, trainer and raid opponents.
// Centralises the stat/moves block so every opponent carries the same fields.
import { pokemonSpecies } from '../../data/gameData.js'
import { FORM_SPECIES } from '../../data/form-species.js'
import { rollGender } from '../breeding.js'
import { rollWildHeldItem } from '../held-items.js'
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
 *   leadAbility?: string | null,
 *   leadGender?: string | null,
 *   hiddenAbilityChance?: number,
 * }} [options] `wild` rolls an ability, held item and gender; `gender` rolls
 * only the gender (trainer teams). `perfectIvs` uses 31 IVs instead of random.
 * `leadAbility` / `leadGender` let out-of-combat lead abilities bias the wild
 * roll (Super Luck / Compound Eyes hold items, Cute Charm gender);
 * `hiddenAbilityChance` raises the hidden-ability rate (an SOS chain).
 * @returns {any}
 */
export function createBattlePokemon(speciesKey, level, options = {}) {
  const {
      isShiny = false,
      isRoamer = false,
      perfectIvs = false,
      gender = false,
      wild = false,
      leadAbility = null,
      leadGender = null,
      hiddenAbilityChance,
    } = options,
    species = pokemonSpecies[speciesKey],
    ivs = perfectIvs ? getPerfectIVs() : generateIVs(),
    stats = calculatePokemonStats(species, level, ivs),
    // Super Luck / Compound Eyes make the foe twice as likely to hold an item.
    heldItemChance = leadAbility === 'superLuck' || leadAbility === 'compoundEyes' ? 0.2 : 0.05,
    // Cute Charm biases the wild toward the opposite gender to the lead.
    genderBias =
      leadAbility === 'cuteCharm' && (leadGender === 'male' || leadGender === 'female')
        ? leadGender === 'male'
          ? 'female'
          : 'male'
        : null
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
          ability: rollAbility(speciesKey, Math.random, hiddenAbilityChance),
          heldItem: rollWildHeldItem(species.types, heldItemChance),
          gender: rollGender(speciesKey, genderBias),
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
  const stats = calculatePokemonStats(
    form,
    pokemon.level,
    pokemon.ivs ?? getPerfectIVs(),
    pokemon.nature,
    pokemon.evs
  )
  pokemon.speciesKey = pokemon.formKey
  pokemon.name = form.name
  pokemon.types = form.types
  pokemon.typesOverride = null
  // The max HP stays the persistent (base form) value. The battler is rebuilt
  // from the party member every turn, so adopting a form's own max HP (only
  // Eternamax and Zygarde-Complete differ) re-scaled the HP against the base
  // maximum each turn and compounded into effectively infinite HP. A battle
  // form is cosmetic plus stat changes, like a Mega — not a Dynamax HP boost.
  pokemon.currentHp = pokemon.currentHp <= 0 ? 0 : Math.min(pokemon.currentHp, pokemon.maxHp)
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
