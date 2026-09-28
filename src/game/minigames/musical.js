// Unova's Pokemon Musical. A four-lane rhythm game: notes fall down each lane
// and the player taps the matching arrow in time. Timing decides the grade, and
// the total score sets the prize.

/** Money spent to take the stage. */
export const MUSICAL_COST = 300

/** The four lanes, in StepMania dance-pad order (left, down, up, right). */
export const MUSICAL_LANES = ['left', 'down', 'up', 'right']

/** Notes in a routine. */
export const MUSICAL_NOTES = 24

/** Time between consecutive notes, in ms. */
export const MUSICAL_BEAT_MS = 540

/** Delay before the first note, in ms. */
export const MUSICAL_LEAD_MS = 1800

/** How far ahead a note is visible on the track, in ms. */
export const MUSICAL_VIEW_MS = 1500

/** Timing windows, in ms either side of the beat. */
export const MUSICAL_PERFECT_MS = 70
export const MUSICAL_GOOD_MS = 150
export const MUSICAL_OK_MS = 260

/** Best possible score (a perfect hit on every note). */
export const MUSICAL_MAX_SCORE = MUSICAL_NOTES * 100

/**
 * Build a routine of notes at a steady beat. Lanes are random, but never the
 * same two beats in a row, so the chart is always playable.
 * @param {number} [count]
 * @param {number} [beatMs]
 * @param {number} [leadMs]
 * @returns {{ id: number, lane: number, time: number }[]}
 */
export function generateMusicalPattern(
  count = MUSICAL_NOTES,
  beatMs = MUSICAL_BEAT_MS,
  leadMs = MUSICAL_LEAD_MS
) {
  const notes = []
  let previous = -1
  for (let index = 0; index < count; index++) {
    let lane = Math.floor(Math.random() * MUSICAL_LANES.length)
    if (lane === previous) lane = (lane + 1) % MUSICAL_LANES.length
    previous = lane
    notes.push({ id: index, lane, time: leadMs + index * beatMs })
  }
  return notes
}

/**
 * A routine's total running time: the last note plus its judgement window and a
 * short outro.
 * @param {{ time: number }[]} pattern
 * @returns {number}
 */
export function musicalTotalMs(pattern) {
  const last = pattern.length > 0 ? pattern[pattern.length - 1].time : 0
  return last + MUSICAL_OK_MS + 400
}

/**
 * Grade a tap by how many milliseconds it missed the beat.
 * @param {number} deltaMs
 * @returns {{ grade: 'perfect' | 'good' | 'ok' | 'miss', points: number }}
 */
export function judgeMusicalHit(deltaMs) {
  const delta = Math.abs(deltaMs)
  if (delta <= MUSICAL_PERFECT_MS) return { grade: 'perfect', points: 100 }
  if (delta <= MUSICAL_GOOD_MS) return { grade: 'good', points: 60 }
  if (delta <= MUSICAL_OK_MS) return { grade: 'ok', points: 30 }
  return { grade: 'miss', points: 0 }
}

/**
 * Prize for a finished routine.
 * @param {number} score
 * @param {number} [max]
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function musicalPrize(score, max = MUSICAL_MAX_SCORE) {
  const ratio = max > 0 ? score / max : 0
  if (ratio >= 0.9)
    return { money: 3500, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Standing ovation!' }
  if (ratio >= 0.7)
    return { money: 2200, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Star performer' }
  if (ratio >= 0.4)
    return { money: 1200, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Nice routine' }
  return { money: 300, items: [], label: 'The crowd is unsure' }
}
