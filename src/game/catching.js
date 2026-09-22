// Split from src/game/logic.js — see tools/decompile/split-logic.mjs

import { ballOrder, pokeBalls } from '../data/items.js'
import { pokemonSpecies } from '../data/gameData.js'
import { getCatchRule } from './progression.js'

/**
 * @param {string} speciesKey
 * @returns {number}
 */
export function getCatchRate(speciesKey) {
  return pokemonSpecies[speciesKey].catchRate ?? 255
}

/**
 * @param {string} speciesKey
 * @param {string} ballId
 * @returns {number}
 */
export function calculateCatchChance(speciesKey, ballId) {
  const catchRate = getCatchRate(speciesKey),
    ball = pokeBalls[ballId]
  return ball ? Math.min(1, (catchRate * ball.ballModifier) / 255) : 0
}

/**
 * @param {string} speciesKey
 * @param {string} ballId
 * @returns {boolean}
 */
export function attemptCatch(speciesKey, ballId) {
  const chance = calculateCatchChance(speciesKey, ballId)
  return Math.random() < chance
}

/**
 * @param {string} speciesKey
 * @param {string[]} enabledBalls
 * @param {Record<string, number>} inventory
 * @returns {string | null}
 */
export function selectBestBall(speciesKey, enabledBalls, inventory) {
  // The Master Ball is never picked automatically: it is a deliberate, one-off
  // throw from the battle button so a routine auto-catch can't silently spend
  // the rarest ball in the game. See THROW_MASTER_BALL in the reducer.
  const usableBalls = ballOrder.filter(
    (ballId) =>
      ballId !== 'masterball' && enabledBalls.includes(ballId) && (inventory[ballId] ?? 0) > 0
  )
  if (usableBalls.length === 0) return null
  const catchRate = getCatchRate(speciesKey)
  for (const ballId of usableBalls) if ((catchRate * pokeBalls[ballId].ballModifier) / 255 >= 1) return ballId
  return usableBalls[usableBalls.length - 1]
}

/**
 * @param {GameState} state
 * @param {string} routeKey
 * @param {string} speciesKey
 * @param {number} level
 * @param {boolean} isShiny
 * @returns {boolean}
 */
export function shouldAutoCatch(state, routeKey, speciesKey, level, isShiny) {
  const rule = getCatchRule(state, routeKey, speciesKey)
  if (!rule.enabled || rule.enabledBalls.length === 0) return !1
  switch (rule.mode) {
    case 'always':
      return !0
    case 'shiny_only':
      return isShiny
    case 'level_threshold':
      return level >= rule.levelThreshold
    case 'pokedex_new':
      return !state.pokedexCaught.includes(speciesKey)
    case 'living_dex':
      // Keep catching until one actually lives in the party or box (not just the
      // Pokedex). Held evolutions don't count; forms are separate species keys.
      return (
        !state.party.some((member) => member.speciesKey === speciesKey) &&
        !state.box.some((member) => member.speciesKey === speciesKey)
      )
    default:
      return !0
  }
}

/**
 * @param {GameState} state
 * @param {string} routeKey
 * @param {string} speciesKey
 * @returns {string | null}
 */
export function selectAutoCatchBall(state, routeKey, speciesKey) {
  const rule = getCatchRule(state, routeKey, speciesKey)
  return selectBestBall(speciesKey, rule.enabledBalls, state.inventory)
}

/**
 * A catch rate at or below this is "really hard" for a non-legendary.
 */
export const HARD_CATCH_RATE = 25

/**
 * Whether the Master Ball throw button should be offered for this encounter.
 * It is reserved for the encounters worth the rarest ball: any legendary, or
 * a genuinely hard-to-catch species the player has never registered. Routine
 * wild battles no longer advertise it, so it isn't spent by a stray tap.
 * @param {{ pokedexCaught: string[] }} state
 * @param {string} speciesKey
 * @returns {boolean}
 */
export function shouldOfferMasterBall(state, speciesKey) {
  const species = pokemonSpecies[speciesKey]
  if (!species) return false
  if (species.legendary) return true
  return !state.pokedexCaught.includes(speciesKey) && (species.catchRate ?? 255) <= HARD_CATCH_RATE
}

/**
 * @param {number} rate
 * @returns {string}
 */
export function getRarityFromRate(rate) {
  return rate >= 20
    ? 'common'
    : rate >= 10
      ? 'uncommon'
      : rate >= 5
        ? 'rare'
        : rate >= 1
          ? 'very_rare'
          : 'ultra_rare'
}
