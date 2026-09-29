// Galar's Dynamax Adventures. Split out of game/minigames.js. A short roguelike:
// pick a path through three encounters, then face a legendary from Galar's raid
// pool. Win the boss and you catch it; wipe and you go home empty-handed.

import { pokemonSpecies, regions } from '../../data/gameData.js'
import { speciesHasType } from '../pokemon.js'
import { BATTLE_ROYAL_POOL } from './battle-royal.js'

/** Money spent to enter an adventure. */
export const DYNAMAX_ADVENTURES_COST = 800

/** Path choices before the legendary boss. */
export const DYNAMAX_STAGES = 3

/** Level the party should gain on before the boss. */
export const DYNAMAX_BOSS_LEVEL = 72

/** @param {number} level @param {string[]} [pool] @returns {{ speciesKey: string, level: number, name: string }} */
function randomOpponent(level, pool = BATTLE_ROYAL_POOL) {
  const speciesKey = pool[Math.floor(Math.random() * pool.length)],
    name = pokemonSpecies[speciesKey]?.name ?? speciesKey
  return { speciesKey, level, name }
}

/**
 * The two paths offered at a stage. The player picks one to fight.
 * @param {number} stage 0-based.
 * @param {number} baseLevel The party's best level.
 * @returns {{ speciesKey: string, level: number, name: string }[]}
 */
export function dynamaxPaths(stage, baseLevel) {
  const level = Math.max(5, Math.min(100, Math.round(baseLevel + stage * 3)))
  return [randomOpponent(level), randomOpponent(level)]
}

/**
 * The adventure's legendary boss, drawn from the region's raid pool. Under a
 * Monotype run the pool is narrowed to legends of the chosen type (falling back
 * to the full pool when the type has none).
 * @param {string} [regionId]
 * @param {string | null} [monotype]
 * @returns {{ speciesKey: string, level: number, name: string }}
 */
export function dynamaxBoss(regionId = 'galar', monotype = null) {
  const region = regions.find((candidate) => candidate.id === regionId)
  let pool = (region?.raidPool ?? []).filter((entry) => pokemonSpecies[entry.speciesKey])
  if (monotype) {
    const typed = pool.filter((entry) => speciesHasType(entry.speciesKey, monotype))
    if (typed.length > 0) pool = typed
  }
  if (pool.length === 0) return randomOpponent(DYNAMAX_BOSS_LEVEL)
  const entry = pool[Math.floor(Math.random() * pool.length)]
  return {
    speciesKey: entry.speciesKey,
    level: Math.max(DYNAMAX_BOSS_LEVEL, entry.level ?? DYNAMAX_BOSS_LEVEL),
    name: pokemonSpecies[entry.speciesKey]?.name ?? entry.speciesKey,
  }
}

/**
 * Prize for an adventure.
 * @param {number} stagesCleared
 * @param {boolean} bossWon
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function dynamaxPrize(stagesCleared, bossWon) {
  if (bossWon)
    return {
      money: 12000,
      items: [
        { itemId: 'rareCandy', quantity: 2 },
        { itemId: 'goldBottleCap', quantity: 1 },
      ],
      label: 'Adventure complete!',
    }
  if (stagesCleared >= DYNAMAX_STAGES)
    return {
      money: 5000,
      items: [{ itemId: 'rareCandy', quantity: 1 }],
      label: 'The legendary got away',
    }
  return {
    money: 800 * Math.max(0, stagesCleared),
    items: stagesCleared >= 1 ? [{ itemId: 'expCandyL', quantity: 1 }] : [],
    label: 'Adventure over',
  }
}
