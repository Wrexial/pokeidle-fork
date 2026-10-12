// Horde encounters: a wild battle against a pack of 3-5 of one species. The
// pack is resolved with the doubles round engine (`runDoublesRound`), so a
// spread move hits every member while a single-target move picks one. Clearing
// the whole pack pays capped extra EXP and drops, and a horde counts as a
// single wild win for the per-win systems so it stays idle-friendly.

import { HORDE_DROP_ROLLS_CAP, HORDE_MAX_ROUNDS, HORDE_SIZE_MAX, HORDE_SIZE_MIN } from '../data/config.js'
import { createBattlePokemon } from './combat.js'
import { runDoublesRound } from './minigames/doubles.js'

/** @param {any} pokemon */
export function hordeAlive(pokemon) {
  return !!pokemon && pokemon.currentHp > 0
}

/** Roll a horde's size (3-5). */
export function rollHordeSize() {
  return HORDE_SIZE_MIN + Math.floor(Math.random() * (HORDE_SIZE_MAX - HORDE_SIZE_MIN + 1))
}

/**
 * EXP multiplier for clearing a pack of `size`: 2x for three members, 3x for
 * five, and never more than 3x so a horde can't out-earn a trainer grind.
 * @param {number} size
 * @returns {number}
 */
export function hordeExpMultiplier(size) {
  const count = Math.max(
    HORDE_SIZE_MIN,
    Math.min(HORDE_SIZE_MAX, Math.floor(size) || HORDE_SIZE_MIN)
  )
  return Math.min(3, 1 + (count - 1) * 0.5)
}

/**
 * Extra drop rolls a cleared pack pays (one per member, capped). The cap keeps
 * a five-pack from raining items.
 * @param {number} size
 * @returns {number}
 */
export function hordeDropRolls(size) {
  return Math.max(1, Math.min(HORDE_DROP_ROLLS_CAP, Math.floor(size) || 1))
}

/**
 * Build a pack of `speciesKey`. A horde is never shiny (the pack is defeated,
 * not caught), so the shiny roll is left to the normal solo encounter.
 * @param {string} speciesKey
 * @param {number} level
 * @param {{ size?: number, leadAbility?: string | null, leadGender?: string | null, hiddenAbilityChance?: number }} [options]
 * @returns {any[]}
 */
export function buildHorde(speciesKey, level, options = {}) {
  const size = options.size ?? rollHordeSize()
  return Array.from({ length: size }, () =>
    createBattlePokemon(speciesKey, level, {
      wild: true,
      leadAbility: options.leadAbility ?? null,
      leadGender: options.leadGender ?? null,
      hiddenAbilityChance: options.hiddenAbilityChance,
    })
  )
}

/**
 * Resolve a whole horde headlessly: loop the doubles round engine until one
 * side is down (or the round cap is hit). Mutates `player` and the `pack`.
 * Used by tests and the offline sim.
 * @param {any} player
 * @param {any[]} pack
 * @param {{ maxRounds?: number, deterministic?: boolean, weather?: any, terrain?: any }} [options]
 * @returns {{ won: boolean, rounds: number, log: string[] }}
 */
export function simulateHorde(player, pack, options = {}) {
  const maxRounds = options.maxRounds ?? HORDE_MAX_ROUNDS,
    log = /** @type {string[]} */ ([])
  let rounds = 0
  while (rounds < maxRounds && hordeAlive(player) && pack.some(hordeAlive)) {
    rounds++
    const result = runDoublesRound([player], pack, options)
    log.push(...result.log)
  }
  return {
    won: pack.every((member) => !hordeAlive(member)) && hordeAlive(player),
    rounds,
    log,
  }
}
