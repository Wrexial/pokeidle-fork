// Build the BattlePokemon object used for wild, trainer and raid opponents.
// Centralises the stat/moves block so every opponent carries the same fields.
import { pokemonSpecies } from '../../data/gameData.js'
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
    stats = calculatePokemonStats(species, level, perfectIvs ? getPerfectIVs() : generateIVs())
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
