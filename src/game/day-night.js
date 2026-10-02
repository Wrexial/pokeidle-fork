// The game's day/night cycle. One full day runs every 60 real minutes,
// independent of the wall clock, and is derived from Date.now() so it is
// identical across saves and reloads (no save field needed). It feeds the Dusk
// Ball's night rate and the phase indicator/tint.

/** One full day/night loop: 60 real minutes. */
export const DAY_NIGHT_CYCLE_MS = 60 * 60 * 1000

/**
 * The phases of the cycle, as fractions of it. `dawn`/`dusk` are short
 * transitions; `dusk` and `night` count as night for the Dusk Ball.
 * @type {{ id: 'dawn' | 'day' | 'dusk' | 'night', label: string, icon: string, start: number, end: number, isNight: boolean }[]}
 */
export const DAY_PHASES = [
  { id: 'dawn', label: 'Dawn', icon: '\u{1F305}', start: 0, end: 0.06, isNight: false },
  { id: 'day', label: 'Day', icon: '\u2600\uFE0F', start: 0.06, end: 0.62, isNight: false },
  { id: 'dusk', label: 'Dusk', icon: '\u{1F307}', start: 0.62, end: 0.7, isNight: true },
  { id: 'night', label: 'Night', icon: '\u{1F319}', start: 0.7, end: 1, isNight: true },
]

/** Position in the current cycle, 0-1. @param {number} now */
function cycleProgress(now) {
  return ((now % DAY_NIGHT_CYCLE_MS) + DAY_NIGHT_CYCLE_MS) % DAY_NIGHT_CYCLE_MS / DAY_NIGHT_CYCLE_MS
}

/**
 * The phase at a moment in time.
 * @param {number} [now] Epoch milliseconds.
 * @returns {{ id: 'dawn' | 'day' | 'dusk' | 'night', label: string, icon: string, isNight: boolean, progress: number }}
 */
export function dayPhaseAt(now = Date.now()) {
  const progress = cycleProgress(now),
    phase = DAY_PHASES.find((entry) => progress >= entry.start && progress < entry.end) ?? DAY_PHASES[0]
  return { ...phase, progress }
}

/** Whether it is night (for the Dusk Ball's rate). @param {number} [now] */
export function isNightTime(now = Date.now()) {
  return dayPhaseAt(now).isNight
}

/**
 * Milliseconds until the next phase boundary, so a UI can update on the
 * boundary instead of on every render/tick. Always at least one second.
 * @param {number} [now]
 * @returns {number}
 */
export function msUntilPhaseChange(now = Date.now()) {
  const progress = cycleProgress(now),
    next = DAY_PHASES.find((entry) => entry.start > progress),
    nextStart = next ? next.start : 1
  return Math.max(1000, (nextStart - progress) * DAY_NIGHT_CYCLE_MS)
}
