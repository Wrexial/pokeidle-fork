// Johto's Pokeathlon. Split out of game/minigames.js. Three micro-events, each
// scored 0-100 and added up for a medal: a button-mash Sprint, a timing Hurdle
// and a moving-target Throw.

/** Money spent to enter the Pokeathlon. */
export const POKEATHLON_COST = 500

/** Each of the three events is scored out of this. */
export const POKEATHLON_EVENT_MAX = 100

/** The Sprint runs for five seconds. */
export const POKEATHLON_SPRINT_MS = 5000

/** Attempts in the Hurdle and Throw events. */
export const POKEATHLON_ATTEMPTS = 3

/** Presses per second that earn a perfect Sprint. */
const SPRINT_TARGET_RATE = 12

/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Sprint score from the number of button presses in the window.
 * @param {number} presses
 * @param {number} [ms]
 * @returns {number} 0-100
 */
export function sprintScore(presses, ms = POKEATHLON_SPRINT_MS) {
  const seconds = Math.max(1, ms / 1000),
    rate = presses / seconds
  return clamp(Math.round((rate / SPRINT_TARGET_RATE) * 100), 0, 100)
}

/**
 * Score a timing attempt from how far off centre it landed.
 * @param {number} offset 0 (dead centre) to 1 (the very edge).
 * @returns {number} 0-100
 */
export function accuracyScore(offset) {
  return clamp(Math.round((1 - clamp(offset, 0, 1)) * 100), 0, 100)
}

/**
 * The medal for a combined three-event total.
 * @param {number} total 0-{@link POKEATHLON_EVENT_MAX} * 3
 * @returns {{ label: string, tier: string, money: number, items: { itemId: string, quantity: number }[] }}
 */
export function pokeathlonPrize(total) {
  if (total >= 270)
    return {
      label: 'Gold medal!',
      tier: 'gold',
      money: 6000,
      items: [{ itemId: 'rareCandy', quantity: 2 }],
    }
  if (total >= 210)
    return {
      label: 'Silver medal',
      tier: 'silver',
      money: 3500,
      items: [{ itemId: 'rareCandy', quantity: 1 }],
    }
  if (total >= 150)
    return {
      label: 'Bronze medal',
      tier: 'bronze',
      money: 2000,
      items: [{ itemId: 'expCandyL', quantity: 1 }],
    }
  return {
    label: 'Good effort',
    tier: 'none',
    money: 600,
    items: [{ itemId: 'expCandyM', quantity: 1 }],
  }
}
