// The game's slow seasonal cycle. Four seasons loop on top of the day/night
// clock: one season lasts four in-game days (`DAYS_PER_SEASON`), and an in-game
// day is the 60-minute day/night loop (see src/game/day-night.js), so a season
// is four real hours and a full year is sixteen. Like the day/night phase and
// the world weather it is derived from Date.now(), so it is identical across
// saves and reloads and needs no save field.
//
// The season gates wild encounters (see `encountersForPhase`), reweights the
// world weather roll (`src/game/weather.js`) and swaps the artwork of the
// Pokemon whose form follows the seasons (Deerling/Sawsbuck, Burmy, Cherrim).

import { DAY_NIGHT_CYCLE_MS } from './day-night.js'

/** In-game days per season. One in-game day is the 60-minute day/night loop. */
export const DAYS_PER_SEASON = 4

/** One full seasonal year: 16 real hours, four real hours per season. */
export const SEASON_CYCLE_MS = DAYS_PER_SEASON * DAY_NIGHT_CYCLE_MS

/**
 * The seasons of the year, as fractions of the cycle. Each is a quarter of it.
 * @type {{ id: 'spring' | 'summer' | 'autumn' | 'winter', label: string, icon: string, start: number, end: number }[]}
 */
export const SEASONS = [
  { id: 'spring', label: 'Spring', icon: '\u{1F338}', start: 0, end: 0.25 },
  { id: 'summer', label: 'Summer', icon: '\u2600\uFE0F', start: 0.25, end: 0.5 },
  { id: 'autumn', label: 'Autumn', icon: '\u{1F342}', start: 0.5, end: 0.75 },
  { id: 'winter', label: 'Winter', icon: '\u2744\uFE0F', start: 0.75, end: 1 },
]

/** Position in the current year, 0-1. @param {number} now */
function cycleProgress(now) {
  return ((now % SEASON_CYCLE_MS) + SEASON_CYCLE_MS) % SEASON_CYCLE_MS / SEASON_CYCLE_MS
}

/**
 * The season at a moment in time, with its label/icon and how far through it we
 * are.
 * @param {number} [now] Epoch milliseconds.
 * @returns {{ id: 'spring' | 'summer' | 'autumn' | 'winter', label: string, icon: string, progress: number }}
 */
export function seasonAt(now = Date.now()) {
  const progress = cycleProgress(now),
    season = SEASONS.find((entry) => progress >= entry.start && progress < entry.end) ?? SEASONS[0]
  return { ...season, progress }
}

/**
 * The current season id (e.g. "winter"). A shorthand for {@link seasonAt}.
 * @param {number} [now]
 * @returns {'spring' | 'summer' | 'autumn' | 'winter'}
 */
export function currentSeason(now = Date.now()) {
  return seasonAt(now).id
}

/**
 * Milliseconds until the next season starts, so a UI can update on the boundary
 * instead of on every render/tick. Always at least one second.
 * @param {number} [now]
 * @returns {number}
 */
export function msUntilSeasonChange(now = Date.now()) {
  const progress = cycleProgress(now),
    next = SEASONS.find((entry) => entry.start > progress),
    nextStart = next ? next.start : 1
  return Math.max(1000, (nextStart - progress) * SEASON_CYCLE_MS)
}

/**
 * The artwork variant for the species whose form follows the season, keyed by
 * base sprite id. The value is the sprite filename suffix (e.g. `585-summer`),
 * or `null` to keep the base art. Only the species with committed seasonal art
 * are listed; everything else keeps its single sprite all year.
 * @type {Record<number, Partial<Record<'spring' | 'summer' | 'autumn' | 'winter', string | null>>>}
 */
export const SEASONAL_FORM_IDS = {
  // Burmy's cloak: the plant cloak in the growing seasons, a sandy cloak in
  // autumn's winds and a trash cloak through the winter.
  412: { spring: null, summer: null, autumn: 'sandy', winter: 'trash' },
  // Wormadam's cloak follows the Burmy that evolved; its seasonal art is only
  // animated (the static set has the plant cloak alone).
  413: { spring: null, summer: null, autumn: 'sandy', winter: 'trash' },
  // Cherrim only opens into its Sunshine form in the summer sun.
  421: { spring: null, summer: 'sunshine', autumn: null, winter: null },
  // Deerling and Sawsbuck change their coat every season.
  585: { spring: null, summer: 'summer', autumn: 'autumn', winter: 'winter' },
  586: { spring: null, summer: 'summer', autumn: 'autumn', winter: 'winter' },
}

/** Species ids whose seasonal art exists only in the animated set. */
export const ANIMATED_ONLY_SEASONAL_FORMS = new Set([413])
