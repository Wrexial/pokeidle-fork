// Kanto's Whack-a-Diglett. Split out of game/minigames.js. Diglett pop out of a
// 3x3 field; tap them for points before they duck back down, and avoid the
// Zubat that occasionally flit up instead.

/** Money spent to play. */
export const WHACK_COST = 250

/** How long a round lasts. */
export const WHACK_DURATION_MS = 20000

/** The field is 3x3. */
export const WHACK_CELLS = 9

/** How long a target stays up (at the start of the round). */
export const WHACK_POP_MS = 850

/** How long a target stays up once the round is at its fastest. */
export const WHACK_POP_MIN_MS = 380

/** Targets, with spawn weight and points (Zubat costs you a point). Dugtrio is
 * a rarer jackpot that stays up longer. */
export const WHACK_TARGETS = [
  { kind: 'diglett', weight: 6, points: 1, popMultiplier: 1 },
  { kind: 'dugtrio', weight: 1, points: 5, popMultiplier: 1.6 },
  { kind: 'zubat', weight: 2, points: -1, popMultiplier: 1 },
]

/**
 * How long a target stays up `elapsedMs` into a round. Targets get faster as the
 * timer runs down, so the round starts easy and ends hectic.
 * @param {number} elapsedMs
 * @returns {number}
 */
export function whackPopupMs(elapsedMs) {
  const progress = Math.min(1, Math.max(0, elapsedMs / WHACK_DURATION_MS))
  return Math.round(WHACK_POP_MS - (WHACK_POP_MS - WHACK_POP_MIN_MS) * progress)
}

const WHACK_TOTAL_WEIGHT = WHACK_TARGETS.reduce((sum, target) => sum + target.weight, 0)

/**
 * Roll the next target that pops up.
 * @returns {{ kind: string, points: number, popMultiplier: number }}
 */
export function rollWhackTarget() {
  let roll = Math.random() * WHACK_TOTAL_WEIGHT
  for (const target of WHACK_TARGETS) {
    roll -= target.weight
    if (roll <= 0) return target
  }
  return WHACK_TARGETS[0]
}

/**
 * Prize for a finished round.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function whackPrize(score) {
  if (score >= 30)
    return { money: 4000, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Lightning reflexes!' }
  if (score >= 20)
    return { money: 2500, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Sharp shooter' }
  if (score >= 12)
    return { money: 1200, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Good hustle' }
  return { money: 300, items: [], label: 'Better luck next time' }
}
