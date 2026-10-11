// Prestige perks: a persistent talent tree bought with Prestige Points, which
// are earned each time a region is prestiged. The perks survive region resets
// (and even a save's region progress), so prestiging invests in something.

/** Points awarded each time a region is prestiged. */
export const PRESTIGE_POINT_REWARD = 2

/**
 * The perks, and which global multiplier each feeds.
 * @type {{ id: string, name: string, description: string, effect: 'experience' | 'fortune' | 'capture' | 'shiny' | 'drops' | 'hatch', maxRank: number, baseCost: number, costStep: number }[]}
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
  {
    id: 'radiant',
    name: 'Radiant',
    description: '+10% shiny odds per rank.',
    effect: 'shiny',
    maxRank: 5,
    baseCost: 2,
    costStep: 1,
  },
  {
    id: 'scavenger',
    name: 'Scavenger',
    description: '+10% wild item drops per rank.',
    effect: 'drops',
    maxRank: 5,
    baseCost: 1,
    costStep: 1,
  },
  {
    id: 'incubation',
    name: 'Incubation',
    description: '+12% egg hatching speed per rank.',
    effect: 'hatch',
    maxRank: 5,
    baseCost: 1,
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
 * @returns {{ experience: number, fortune: number, capture: number, shiny: number, drops: number, hatch: number }}
 */
export function prestigeMultipliers(state) {
  const rank = (/** @type {string} */ id) => state.prestigePerks?.[id] ?? 0
  return {
    experience: 1 + rank('experience') * 0.08,
    fortune: 1 + rank('fortune') * 0.1,
    capture: 1 + rank('capture') * 0.05,
    shiny: 1 + rank('radiant') * 0.1,
    drops: 1 + rank('scavenger') * 0.1,
    hatch: 1 + rank('incubation') * 0.12,
  }
}

/**
 * The Prestige Points sunk into a perk at a given rank (its purchase history).
 * @param {string} perkId
 * @param {number} rank
 * @returns {number}
 */
export function perkInvested(perkId, rank) {
  const perk = PRESTIGE_PERKS.find((entry) => entry.id === perkId)
  if (!perk || rank <= 0) return 0
  let total = 0
  for (let index = 0; index < Math.min(rank, perk.maxRank); index += 1)
    total += perk.baseCost + index * perk.costStep
  return total
}

/**
 * Every Prestige Point the player has spent across all perks, i.e. what a
 * respec would refund.
 * @param {{ prestigePerks?: Record<string, number> }} state
 * @returns {number}
 */
export function totalPrestigeInvested(state) {
  return PRESTIGE_PERKS.reduce(
    (sum, perk) => sum + perkInvested(perk.id, perkRank(state, perk.id)),
    0
  )
}
