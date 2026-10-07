// Sinnoh's Berry Blender. Split out of game/minigames.js. A rhythm control game:
// the blender's speed always sags, and each tap revs it back up. Keep the needle
// inside the sweet spot as it sweeps back and forth to blend a smooth Poffin.

/** Money spent to blend. */
export const BERRY_BLENDER_COST = 350

/** How long a blend lasts. */
export const BERRY_BLENDER_MS = 12000

/** How often the scene updates. */
export const BERRY_BLENDER_TICK_MS = 50

/** Half-width of the moving sweet spot (0-1 of the bar). */
export const BERRY_BLENDER_ZONE = 0.16

/** Speed added by one tap. */
export const BERRY_BLENDER_TAP = 0.06

/** Speed lost each tick while coasting. */
export const BERRY_BLENDER_DECAY = 0.028

/**
 * Berries on offer, purely for the recipe display.
 * @type {{ id: string, name: string, color: string }[]}
 */
export const BERRY_BLENDER_BERRIES = [
  { id: 'cheri', name: 'Cheri Berry', color: '#e04038' },
  { id: 'chesto', name: 'Chesto Berry', color: '#4a3a6a' },
  { id: 'pecha', name: 'Pecha Berry', color: '#f0a0c0' },
  { id: 'rawst', name: 'Rawst Berry', color: '#78c850' },
  { id: 'aspear', name: 'Aspear Berry', color: '#f8d030' },
  { id: 'leppa', name: 'Leppa Berry', color: '#e05038' },
  { id: 'oran', name: 'Oran Berry', color: '#6890f0' },
  { id: 'sitrus', name: 'Sitrus Berry', color: '#f8d030' },
]

/**
 * Where the sweet spot is `elapsedMs` into a blend. It sweeps back and forth so
 * the player has to keep adjusting the tap rhythm.
 * @param {number} elapsedMs
 * @returns {{ center: number, halfWidth: number }}
 */
export function blenderSweetSpot(elapsedMs) {
  return {
    center: 0.5 + Math.sin(Math.max(0, elapsedMs) / 900) * 0.24,
    halfWidth: BERRY_BLENDER_ZONE,
  }
}

/**
 * Whether a speed is inside the sweet spot.
 * @param {number} speed
 * @param {{ center: number, halfWidth: number }} zone
 * @returns {boolean}
 */
export function blenderInZone(speed, zone) {
  return Math.abs(speed - zone.center) <= zone.halfWidth
}

/**
 * The blend score (0-100) from the fraction of time spent in the sweet spot.
 * @param {number} quality 0-1.
 * @returns {number}
 */
export function blenderScore(quality) {
  return Math.round(Math.max(0, Math.min(1, quality)) * 100)
}

/**
 * Prize for a blend's score.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function blenderPrize(score) {
  if (score >= 85)
    return {
      money: 4000,
      items: [
        { itemId: 'expCandyL', quantity: 1 },
        { itemId: 'sitrusBerry', quantity: 2 },
      ],
      label: 'Perfect blend!',
    }
  if (score >= 65)
    return {
      money: 2500,
      items: [{ itemId: 'expCandyM', quantity: 1 }],
      label: 'Smooth and sweet',
    }
  if (score >= 45)
    return {
      money: 1400,
      items: [{ itemId: 'expCandyS', quantity: 1 }],
      label: 'Drinkable',
    }
  if (score >= 20) return { money: 700, items: [], label: 'A bit lumpy' }
  return { money: 250, items: [], label: 'Lumpy mush' }
}
