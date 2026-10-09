// Split from src/game/logic.js.

import { ballOrder, pokeBalls } from '../data/items.js'
import { pokemonSpecies } from '../data/gameData.js'
import { getCatchRule } from './progression.js'
import { isNightTime } from './day-night.js'

export { isNightTime }

/**
 * @param {string} speciesKey
 * @returns {number}
 */
function getCatchRate(speciesKey) {
  return pokemonSpecies[speciesKey].catchRate ?? 255
}

/**
 * Situational multiplier for a ball. Balls without a situation fall back to
 * their flat `ballModifier`. `context.turn` is how many turns the battle
 * lasted, which is when the ball is actually thrown in this idle game.
 * @param {string} ballId
 * @param {CatchContext} [context]
 * @returns {number}
 */
export function getBallModifier(ballId, context = {}) {
  const ball = pokeBalls[ballId]
  if (!ball) return 0
  switch (ballId) {
    case 'quickball':
      return (context.turn ?? 1) <= 1 ? 5 : 1
    case 'timerball': {
      const turns = Math.max(1, context.turn ?? 1)
      return Math.min(4, 1 + (turns - 1) * 0.3)
    }
    case 'repeatball':
      return context.alreadyCaught ? 3.5 : 1
    case 'netball':
      return (context.types ?? []).some((type) => type === 'Water' || type === 'Bug') ? 3.5 : 1
    case 'diveball':
      return context.isWater ? 3.5 : 1
    case 'duskball':
      return context.isCave || context.isNight ? 3 : 1
    case 'nestball':
      return Math.max(1, Math.min(4, (41 - (context.level ?? 50)) / 10))
    default:
      return ball.ballModifier
  }
}

/** Catch-rate multiplier Honey gives the species it is applied to. */
export const HONEY_CATCH_BONUS = 1.5

/**
 * @param {string} speciesKey
 * @param {string} ballId
 * @param {CatchContext} [context]
 * @returns {number}
 */
export function calculateCatchChance(speciesKey, ballId, context) {
  const catchRate = getCatchRate(speciesKey),
    modifier = getBallModifier(ballId, context)
  if (modifier <= 0) return 0
  const honeyBonus = context?.honey ? HONEY_CATCH_BONUS : 1
  return Math.min(1, (catchRate * modifier * honeyBonus) / 255)
}

/**
 * @param {string} speciesKey
 * @param {string} ballId
 * @param {CatchContext} [context]
 * @returns {boolean}
 */
export function attemptCatch(speciesKey, ballId, context) {
  const chance = calculateCatchChance(speciesKey, ballId, context)
  return Math.random() < chance
}

/**
 * @param {string} speciesKey
 * @param {string[]} enabledBalls
 * @param {Record<string, number>} inventory
 * @param {CatchContext} [context]
 * @returns {string | null}
 */
export function selectBestBall(speciesKey, enabledBalls, inventory, context) {
  // The Master Ball is never picked automatically: it is a deliberate, one-off
  // throw from the battle button so a routine auto-catch can't silently spend
  // the rarest ball in the game. See THROW_MASTER_BALL in the reducer.
  const usableBalls = ballOrder.filter(
    (ballId) =>
      ballId !== 'masterball' && enabledBalls.includes(ballId) && (inventory[ballId] ?? 0) > 0
  )
  if (usableBalls.length === 0) return null
  const catchRate = getCatchRate(speciesKey)
  for (const ballId of usableBalls)
    if ((catchRate * getBallModifier(ballId, context)) / 255 >= 1) return ballId
  return usableBalls.reduce((best, ballId) =>
    getBallModifier(ballId, context) > getBallModifier(best, context) ? ballId : best
  )
}

/** Whether a route's location reads as water (for the Dive Ball). @param {MapLocation | undefined} location */
export function isWaterLocation(location) {
  if (!location) return !1
  // The committed biome is authoritative once apply-biomes.cjs has run; the
  // name/description heuristic keeps hand-authored data working.
  if (location.biome === 'coast') return !0
  const text = `${location.name ?? ''} ${location.description ?? ''}`.toLowerCase()
  return (
    location.background === '/backgrounds/beach.webp' ||
    /sea|ocean|lake|bay|river|water|cove|harbou?r|coast|beach|island|surf|whirl/.test(text)
  )
}

/** Whether a route's location reads as a cave (for the Dusk Ball). @param {MapLocation | undefined} location */
export function isCaveLocation(location) {
  if (!location) return !1
  // Ruins and towers are dark, enclosed spaces too, so the Dusk Ball boosts there.
  if (location.biome === 'cave' || location.biome === 'ruins') return !0
  const text = `${location.name ?? ''} ${location.description ?? ''}`.toLowerCase()
  return location.background === '/backgrounds/cave.webp' || /cave|tunnel|mine|cavern|grotto/.test(text)
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
 * @param {CatchContext} [context]
 * @returns {string | null}
 */
export function selectAutoCatchBall(state, routeKey, speciesKey, context) {
  const rule = getCatchRule(state, routeKey, speciesKey)
  return selectBestBall(speciesKey, rule.enabledBalls, state.inventory, context)
}

/**
 * A catch rate at or below this is "really hard" for a non-legendary.
 */
const HARD_CATCH_RATE = 25

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
 * The Pokedex status of a species for the caught indicators, strongest first:
 * a shiny that has been caught, a caught species, or one only seen so far.
 * @param {{ pokedexSeen: string[], pokedexCaught: string[], shinyCaught: string[] }} state
 * @param {string} speciesKey
 * @returns {'seen' | 'caught' | 'shiny' | null}
 */
export function getDexStatus(state, speciesKey) {
  if (state.shinyCaught.includes(speciesKey)) return 'shiny'
  if (state.pokedexCaught.includes(speciesKey)) return 'caught'
  if (state.pokedexSeen.includes(speciesKey)) return 'seen'
  return null
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
