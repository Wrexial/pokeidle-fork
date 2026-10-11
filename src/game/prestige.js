// Prestige perks: a persistent talent tree bought with Prestige Points, which
// are earned each time a region is prestiged. The perks survive region resets
// (and even a save's region progress), so prestiging invests in something.

/** Points awarded each time a region is prestiged. */
export const PRESTIGE_POINT_REWARD = 2

/**
 * The perks, and which global multiplier each feeds.
 * @type {{ id: string, name: string, description: string, effect: 'experience' | 'fortune' | 'capture', maxRank: number, baseCost: number, costStep: number }[]}
 */
export const PRESTIGE_PERKS = [
  {
    id: 'experience',
    name: 'Experience',
    description: '+8% EXP per rank.',
    effect: 'experience',
    maxRank: 5,
    baseCost: 1,
    costStep: 1,
  },
  {
    id: 'fortune',
    name: 'Fortune',
    description: '+10% prize money per rank.',
    effect: 'fortune',
    maxRank: 5,
    baseCost: 1,
    costStep: 1,
  },
  {
    id: 'capture',
    name: 'Capture',
    description: '+5% catch rate per rank.',
    effect: 'capture',
    maxRank: 5,
    baseCost: 2,
    costStep: 1,
  },
]

/**
 * The rank the player owns for a perk.
 * @param {{ prestigePerks?: Record<string, number> }} state
 * @param {string} perkId
 * @returns {number}
 */
export function perkRank(state, perkId) {
  return state.prestigePerks?.[perkId] ?? 0
}

/**
 * The point cost of the next rank of a perk, or null when it is maxed/unknown.
 * @param {string} perkId
 * @param {number} currentRank
 * @returns {number | null}
 */
export function perkCost(perkId, currentRank) {
  const perk = PRESTIGE_PERKS.find((entry) => entry.id === perkId)
  if (!perk || currentRank >= perk.maxRank) return null
  return perk.baseCost + currentRank * perk.costStep
}

/**
 * The global multipliers the owned perks grant. All 1 when no perks are owned.
 * @param {{ prestigePerks?: Record<string, number> }} state
 * @returns {{ experience: number, fortune: number, capture: number }}
 */
export function prestigeMultipliers(state) {
  const rank = (/** @type {string} */ id) => state.prestigePerks?.[id] ?? 0
  return {
    experience: 1 + rank('experience') * 0.08,
    fortune: 1 + rank('fortune') * 0.1,
    capture: 1 + rank('capture') * 0.05,
  }
}
