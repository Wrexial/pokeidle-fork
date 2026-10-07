// Alola's Mantine Surf. Split out of game/minigames.js. Ride a run of waves: a
// rider sweeps across the wave face while a swell sits somewhere on it. Jump on
// the mark for points, and the swell narrows with every wave, so late waves take
// a steadier hand.

/** Money spent to surf. */
export const MANTINE_SURF_COST = 500

/** Waves ridden in one run. */
export const MANTINE_SURF_WAVES = 6

/** How long the rider takes to cross the wave face once. */
export const MANTINE_SURF_SWEEP_MS = 1150

/** Two full sweeps to jump each wave before it is a wash-out. */
export const MANTINE_SURF_WAVE_MS = MANTINE_SURF_SWEEP_MS * 2

/** The most a run can score (3 a wave). */
export const MANTINE_SURF_MAX_SCORE = MANTINE_SURF_WAVES * 3

/**
 * The swell for a wave: a centre and half-width on the 0-1 face. Later waves
 * put a narrower swell somewhere random across the middle of the wave.
 * @param {number} waveIndex 0-based.
 * @returns {{ center: number, halfWidth: number }}
 */
export function surfWaveZone(waveIndex) {
  const progress = Math.min(1, Math.max(0, waveIndex) / Math.max(1, MANTINE_SURF_WAVES - 1)),
    halfWidth = 0.19 - 0.08 * progress,
    // Keep the swell clear of the edges so it is always fully on the face.
    center = 0.5 + (Math.random() - 0.5) * (0.86 - halfWidth * 2)
  return { center, halfWidth }
}

/**
 * Points for a jump landing at `position` on `zone`: 3 dead centre, 2 on the
 * swell, 0 off it.
 * @param {number} position 0-1 across the wave face.
 * @param {{ center: number, halfWidth: number }} zone
 * @returns {number}
 */
export function surfWaveScore(position, zone) {
  const distance = Math.abs(position - zone.center)
  if (distance <= zone.halfWidth * 0.4) return 3
  if (distance <= zone.halfWidth) return 2
  return 0
}

/**
 * Where a sweeping rider is on the face `elapsedMs` into a wave (0-1), bouncing
 * back at each edge.
 * @param {number} elapsedMs
 * @returns {number}
 */
export function surfMarkerPosition(elapsedMs) {
  const cycle = (Math.max(0, elapsedMs) / MANTINE_SURF_SWEEP_MS) % 2
  return cycle <= 1 ? cycle : 2 - cycle
}

/**
 * Prize for a run's score (out of `MANTINE_SURF_MAX_SCORE`).
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function mantineSurfPrize(score) {
  if (score >= 16)
    return {
      money: 4500,
      items: [
        { itemId: 'expCandyL', quantity: 1 },
        { itemId: 'pearl', quantity: 1 },
      ],
      label: 'Legendary line!',
    }
  if (score >= 12)
    return {
      money: 2800,
      items: [{ itemId: 'expCandyM', quantity: 1 }],
      label: 'Style master',
    }
  if (score >= 8)
    return { money: 1500, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Clean run' }
  if (score >= 4) return { money: 700, items: [], label: 'Caught a few' }
  return { money: 250, items: [], label: 'Wiped out' }
}
