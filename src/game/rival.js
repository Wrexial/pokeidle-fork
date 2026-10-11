// The recurring rival: a named trainer who turns up at badge milestones with a
// team that scales to your own, and remembers how many times you've beaten them.

import { baseRegions, pokemonSpecies, speciesKeysByGeneration } from '../data/gameData.js'

/** The rival's name per region. @type {Record<string, string>} */
export const RIVAL_NAMES = {
  kanto: 'Blue',
  johto: 'Silver',
  hoenn: 'Wally',
  sinnoh: 'Barry',
  unova: 'Hugh',
  kalos: 'Calem',
  alola: 'Hau',
  galar: 'Hop',
  paldea: 'Nemona',
}

/** Badge counts that trigger a rival challenge, in order (one per stage). */
export const RIVAL_MILESTONES = [2, 4, 6, 8]

/** How many projects the queue can hold is elsewhere; the rival caps at the milestones. */

/**
 * The rival's name for a region.
 * @param {string} regionId
 * @returns {string}
 */
export function rivalName(regionId) {
  return RIVAL_NAMES[regionId] ?? 'Rival'
}

/**
 * How many times the player has beaten a region's rival.
 * @param {{ rivals?: Record<string, number> }} state
 * @param {string} regionId
 * @returns {number}
 */
export function rivalStage(state, regionId) {
  return state.rivals?.[regionId] ?? 0
}

/**
 * Whether a region's rival is waiting for a challenge: there is another
 * milestone to clear and the player has earned enough badges for it.
 * @param {{ rivals?: Record<string, number> }} state
 * @param {string} regionId
 * @param {number} badgeCount Badges earned in the region.
 * @returns {{ ready: boolean, stage: number, requiredBadges: number | null }}
 */
export function rivalChallenge(state, regionId, badgeCount) {
  const stage = rivalStage(state, regionId),
    requiredBadges = RIVAL_MILESTONES[stage] ?? null
  return { ready: requiredBadges != null && badgeCount >= requiredBadges, stage, requiredBadges }
}

/**
 * The region's generation index (region order == generation order).
 * @param {string} regionId
 * @returns {number}
 */
function generationForRegion(regionId) {
  const index = baseRegions.findIndex((region) => region.id === regionId)
  return index >= 0 ? index : 0
}

/**
 * The species a rival can field in a region: real, non-legendary species from
 * that region's generation.
 * @param {string} regionId
 * @returns {string[]}
 */
function rivalSpeciesPool(regionId) {
  const speciesKeys = speciesKeysByGeneration[generationForRegion(regionId)] ?? []
  return speciesKeys.filter((key) => {
    const species = pokemonSpecies[key]
    return species && species.id > 0 && species.id <= 1025 && !species.legendary
  })
}

/**
 * Build a rival's team: `2 + stage` distinct species from the region's
 * generation, all at a level a little above the player's lead so the fight
 * scales with them.
 * @param {string} regionId
 * @param {number} stage
 * @param {number} playerLevel
 * @param {() => number} [rng]
 * @returns {{ speciesKey: string, level: number }[]}
 */
export function buildRivalTeam(regionId, stage, playerLevel, rng = Math.random) {
  const pool = rivalSpeciesPool(regionId),
    size = Math.max(1, Math.min(5, 2 + stage)),
    level = Math.max(5, Math.min(100, Math.round(playerLevel || 5) + stage)),
    team = [],
    used = new Set()
  for (let attempt = 0; attempt < 200 && team.length < size && pool.length > 0; attempt++) {
    const key = pool[Math.floor(rng() * pool.length)]
    if (used.has(key)) continue
    used.add(key)
    // The later members (the rival's ace) sit at the base level; earlier ones
    // are a level or two below, so the team reads as a real curve.
    team.push({ speciesKey: key, level: Math.max(5, level - (size - 1 - team.length)) })
  }
  return team
}
