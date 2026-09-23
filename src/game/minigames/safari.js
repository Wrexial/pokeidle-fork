// Kanto Safari Zone. Split from game/minigames.js. Unlike the other minigames
// the Safari is about managing a fleeing Pokemon with a limited number of free
// Safari Balls: Bait calms it (but makes it harder to catch) and a Rock makes
// it easier to catch (but more likely to bolt).

import { breedingData, encounterData, pokemonSpecies } from '../../data/gameData.js'

/** Money spent to enter the Safari Zone. */
export const SAFARI_COST = 500

/** Safari Balls the player gets per visit. */
export const SAFARI_BALLS = 30

/** The free ball used during a Safari run. */
export const SAFARI_BALL = 'safariball'

/** The encounter bucket the Safari pulls from (its own route table). */
export const SAFARI_ROUTE_KEY = 'safariZone'

/** How many turns Bait / a Rock keeps affecting the active Pokemon. */
export const SAFARI_EFFECT_TURNS = 3

/** Catch-rate multiplier a Safari Ball applies. */
const SAFARI_BALL_MULTIPLIER = 1.5

/** The Safari Zone's own weighted encounter pool. */
const SAFARI_POOL = encounterData[SAFARI_ROUTE_KEY]?.encounters ?? []
const SAFARI_TOTAL_WEIGHT = SAFARI_POOL.reduce((sum, entry) => sum + entry.weight, 0)

/** @param {string} speciesKey @returns {'male' | 'female' | 'genderless'} */
function rollGender(speciesKey) {
  const data = breedingData[speciesKey]
  if (!data || data.genderRate === -1) return 'genderless'
  if (data.genderRate === 0) return 'male'
  if (data.genderRate === 8) return 'female'
  return Math.random() < data.genderRate / 8 ? 'female' : 'male'
}

/**
 * Roll a wild Pokemon hiding in the Safari Zone.
 * @returns {{ speciesKey: string, level: number, gender: 'male' | 'female' | 'genderless' }}
 */
export function rollSafariPokemon() {
  let roll = Math.random() * SAFARI_TOTAL_WEIGHT,
    chosen = SAFARI_POOL[SAFARI_POOL.length - 1]
  for (const entry of SAFARI_POOL) {
    roll -= entry.weight
    if (roll <= 0) {
      chosen = entry
      break
    }
  }
  return {
    speciesKey: chosen.speciesKey,
    level:
      chosen.minLevel + Math.floor(Math.random() * (chosen.maxLevel - chosen.minLevel + 1)),
    gender: rollGender(chosen.speciesKey),
  }
}

/**
 * Chance a Safari Ball catches a Pokemon, with Bait / Rock modifiers.
 * @param {string} speciesKey
 * @param {{ baited?: number, rocked?: number }} [modifiers]
 * @returns {number}
 */
export function safariCatchChance(speciesKey, modifiers = {}) {
  const catchRate = pokemonSpecies[speciesKey]?.catchRate ?? 255
  let chance = Math.min(1, (catchRate * SAFARI_BALL_MULTIPLIER) / 255)
  if (modifiers.baited) chance *= 0.75
  if (modifiers.rocked) chance *= 1.5
  return Math.min(1, chance)
}

/**
 * Chance the Pokemon flees this turn, with Bait / Rock modifiers. Rarer
 * Pokemon are more skittish.
 * @param {string} speciesKey
 * @param {{ baited?: number, rocked?: number }} [modifiers]
 * @returns {number}
 */
export function safariFleeChance(speciesKey, modifiers = {}) {
  const catchRate = pokemonSpecies[speciesKey]?.catchRate ?? 255
  let chance = Math.max(0.05, Math.min(0.5, ((255 - catchRate) / 255) * 0.6))
  if (modifiers.baited) chance *= 0.5
  if (modifiers.rocked) chance *= 1.7
  return Math.min(0.95, chance)
}

/**
 * Apply a Bait or Rock action to the active modifiers.
 * @param {{ baited?: number, rocked?: number }} modifiers
 * @param {'bait' | 'rock'} action
 * @returns {{ baited: number, rocked: number }}
 */
export function applySafariAction(modifiers, action) {
  if (action === 'bait') return { baited: SAFARI_EFFECT_TURNS, rocked: 0 }
  if (action === 'rock') return { baited: 0, rocked: SAFARI_EFFECT_TURNS }
  return { baited: modifiers.baited ?? 0, rocked: modifiers.rocked ?? 0 }
}

/**
 * Age Bait / Rock by one turn.
 * @param {{ baited?: number, rocked?: number }} modifiers
 * @returns {{ baited?: number, rocked?: number }}
 */
export function tickSafariEffects(modifiers) {
  const baited = Math.max(0, (modifiers.baited ?? 0) - 1),
    rocked = Math.max(0, (modifiers.rocked ?? 0) - 1)
  return baited || rocked ? { baited, rocked } : {}
}

/**
 * Throw a Safari Ball at the active Pokemon.
 * @param {string} speciesKey
 * @param {{ baited?: number, rocked?: number }} [modifiers]
 * @returns {boolean} Whether it was caught.
 */
export function safariThrowsBall(speciesKey, modifiers = {}) {
  return Math.random() < safariCatchChance(speciesKey, modifiers)
}

/**
 * Whether the active Pokemon bolts this turn.
 * @param {string} speciesKey
 * @param {{ baited?: number, rocked?: number }} [modifiers]
 * @returns {boolean}
 */
export function safariFlees(speciesKey, modifiers = {}) {
  return Math.random() < safariFleeChance(speciesKey, modifiers)
}
