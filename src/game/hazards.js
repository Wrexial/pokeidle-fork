// Entry hazards (Stealth Rock, Spikes, Toxic Spikes, Sticky Web). The field
// state lives in `state.battleHazards` (one bucket per side), is set by moves in
// `resolveBattleTurn` and applied here when a Pokemon switches in.
import { typechart } from '../data/moves.js'
import { abilityOf } from './abilities.js'

/** @typedef {{ stealthRock: boolean, spikes: number, toxicSpikes: number, stickyWeb: boolean }} Hazards */

/** @returns {Hazards} */
export function emptyHazards() {
  return { stealthRock: !1, spikes: 0, toxicSpikes: 0, stickyWeb: !1 }
}

/** @returns {{ player: Hazards, enemy: Hazards }} */
export function emptyBattleHazards() {
  return { player: emptyHazards(), enemy: emptyHazards() }
}

/**
 * Rock-type effectiveness against a set of defending types (for Stealth Rock).
 * @param {string[]} types
 * @returns {number}
 */
function rockEffectiveness(types) {
  let multiplier = 1
  for (const type of types) multiplier *= typechart.Rock?.[type] ?? 1
  return multiplier
}

/** Whether a Pokemon is grounded (not Flying-type or Levitate). @param {BattlePokemon} pokemon */
export function isGrounded(pokemon) {
  return !pokemon.types.includes('Flying') && abilityOf(pokemon) !== 'levitate'
}

/**
 * What the hazards on a side do to a Pokemon switching in.
 * @param {Hazards | undefined} hazards
 * @param {BattlePokemon} pokemon
 * @returns {{ damage: number, speedStage: number, status: string | null, absorbed: boolean }}
 */
export function applyEntryHazards(hazards, pokemon) {
  const result = { damage: 0, speedStage: 0, status: /** @type {string | null} */ (null), absorbed: !1 }
  if (!hazards) return result
  if (hazards.stealthRock) {
    const effectiveness = rockEffectiveness(pokemon.types)
    if (effectiveness > 0)
      result.damage += Math.max(1, Math.floor((pokemon.maxHp * effectiveness) / 8))
  }
  const grounded = isGrounded(pokemon)
  if (grounded && hazards.spikes > 0) {
    const divisor = hazards.spikes >= 3 ? 4 : hazards.spikes === 2 ? 6 : 8
    result.damage += Math.max(1, Math.floor(pokemon.maxHp / divisor))
  }
  if (grounded && hazards.stickyWeb) result.speedStage = -1
  if (grounded && hazards.toxicSpikes > 0) {
    // Poison types absorb Toxic Spikes instead of being poisoned.
    if (pokemon.types.includes('Poison')) result.absorbed = !0
    else if (!pokemon.types.includes('Steel'))
      result.status = hazards.toxicSpikes >= 2 ? 'toxic' : 'poison'
  }
  return result
}
