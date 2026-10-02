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
 * Distinct legendaries the player can scout for the finale, drawn from the
 * region's real raid pool. Re-rolls offer a fresh set.
 * @param {string} [regionId]
 * @param {string | null} [monotype]
 * @param {number} [count]
 * @returns {{ speciesKey: string, level: number, name: string }[]}
 */
export function dynamaxBossOptions(regionId = 'galar', monotype = null, count = 3) {
  const region = regions.find((candidate) => candidate.id === regionId)
  let pool = (region?.raidPool ?? []).filter((entry) => pokemonSpecies[entry.speciesKey])
  if (monotype) {
    const typed = pool.filter((entry) => speciesHasType(entry.speciesKey, monotype))
    if (typed.length > 0) pool = typed
  }
  if (pool.length === 0) return [randomOpponent(DYNAMAX_BOSS_LEVEL)]
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.max(1, Math.min(count, shuffled.length))).map((entry) => ({
    speciesKey: entry.speciesKey,
    level: Math.max(DYNAMAX_BOSS_LEVEL, entry.level ?? DYNAMAX_BOSS_LEVEL),
    name: pokemonSpecies[entry.speciesKey]?.name ?? entry.speciesKey,
  }))
}

/** In-run pickups found after each cleared stage. @type {{ id: string, label: string, icon: string, description: string }[]} */
export const DYNAMAX_PICKUPS = [
  {
    id: 'heal',
    label: 'Max Honey',
    icon: '\u{1F36F}',
    description: 'Heals the active Pokemon for half its HP.',
  },
  {
    id: 'revive',
    label: 'Revive',
    icon: '\u{1F4AB}',
    description: 'Brings one fainted Pokemon back at half HP.',
  },
  {
    id: 'fullHeal',
    label: 'Full Restore',
    icon: '\u{2728}',
    description: 'Fully heals the whole squad.',
  },
]

/**
 * Roll a pickup for a cleared stage. `heal` is twice as likely as the others.
 * @param {() => number} [random]
 * @returns {{ id: string, label: string, icon: string, description: string }}
 */
export function dynamaxPickup(random = Math.random) {
  const table = [DYNAMAX_PICKUPS[0], DYNAMAX_PICKUPS[0], DYNAMAX_PICKUPS[1], DYNAMAX_PICKUPS[2]]
  return table[Math.floor(random() * table.length)]
}

/**
 * Apply a pickup to a squad of battlers.
 * @param {string} pickupId
 * @param {any[]} squad
 * @param {number} activeIndex
 * @returns {any[]}
 */
export function applyDynamaxPickup(pickupId, squad, activeIndex) {
  const next = squad.map((member) => ({ ...member }))
  if (pickupId === 'fullHeal') {
    for (const member of next) if (member.currentHp > 0) member.currentHp = member.maxHp
    return next
  }
  if (pickupId === 'revive') {
    const index = next.findIndex((member) => member.currentHp <= 0)
    if (index !== -1) next[index].currentHp = Math.max(1, Math.round(next[index].maxHp * 0.5))
    else if (next[activeIndex] && next[activeIndex].currentHp > 0)
      next[activeIndex].currentHp = next[activeIndex].maxHp
    return next
  }
  const active = next[activeIndex]
  if (active && active.currentHp > 0)
    active.currentHp = Math.min(active.maxHp, active.currentHp + Math.round(active.maxHp * 0.5))
  return next
}

/**
 * How many faints the squad can take before the adventure is called off.
 * @param {number} partySize
 * @returns {number}
 */
export function dynamaxKoLimit(partySize) {
  return Math.max(2, Math.ceil(partySize / 2))
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
        { itemId: 'bottleCap', quantity: 1 },
        { itemId: 'natureMint', quantity: 1 },
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
