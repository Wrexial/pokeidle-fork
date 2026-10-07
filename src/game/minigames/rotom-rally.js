// Galar's Rotom Rally. Split out of game/minigames.js. Rev the bike across the
// Wild Area: hold the throttle to build speed, but the motor heat climbs with
// it. Redline and you stall for a moment. Cover the course before the clock
// runs out; a quick, clean run pays best.

/** Money spent to enter the rally. */
export const ROTOM_RALLY_COST = 500

/** Course length in rally units. */
export const ROTOM_RALLY_DISTANCE = 100

/** Time limit in seconds. */
export const ROTOM_RALLY_SECONDS = 20

/** The scene ticks this often. */
export const ROTOM_RALLY_TICK_MS = 50

/** Top speed (0-1). */
export const ROTOM_RALLY_MAX_SPEED = 1

/** Speed gained per tick while the throttle is held. */
export const ROTOM_RALLY_SPEED_STEP = 0.045

/** Speed lost per tick while coasting. */
export const ROTOM_RALLY_SPEED_DECAY = 0.03

/** Heat gained per tick while throttling (scaled by speed). */
export const ROTOM_RALLY_HEAT_RATE = 0.032

/** Heat lost per tick while coasting. */
export const ROTOM_RALLY_COOL_RATE = 0.02

/** How long a stall lasts after the motor redlines. */
export const ROTOM_RALLY_STALL_MS = 1200

/** How long the player has to reach the finish. */
export const ROTOM_RALLY_TIME_MS = ROTOM_RALLY_SECONDS * 1000

/** Course units covered per tick at top speed. */
export const ROTOM_RALLY_TICK_DISTANCE = 0.75

/**
 * The rally score from the run: distance covered plus a bonus for the time left,
 * less a penalty for each stall.
 * @param {number} distance
 * @param {number} elapsedMs
 * @param {number} stalls
 * @returns {number}
 */
export function rotomRallyScore(distance, elapsedMs, stalls) {
  const timeBonus = Math.max(0, ROTOM_RALLY_TIME_MS - elapsedMs) / 1000,
    raw = distance + timeBonus * 2 - stalls * 4
  return Math.max(0, Math.round(raw))
}

/**
 * Prize for a rally score.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function rotomRallyPrize(score) {
  if (score >= 115)
    return {
      money: 5000,
      items: [
        { itemId: 'expCandyL', quantity: 1 },
        { itemId: 'nugget', quantity: 1 },
      ],
      label: 'Wild Area champion!',
    }
  if (score >= 95)
    return {
      money: 3200,
      items: [{ itemId: 'expCandyM', quantity: 1 }],
      label: 'Clean ride',
    }
  if (score >= 70)
    return { money: 1800, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Made good time' }
  if (score >= 45) return { money: 900, items: [], label: 'Finished the course' }
  return { money: 300, items: [], label: 'Stalled out' }
}
