// Companion care: pin one of your Pokemon and keep it fed, happy and rested.
// Care decays with every wild win and a content companion grants a small EXP
// bonus, so it is worth checking in between battles — but neglect only pauses
// the bonus, it never harms the Pokemon.

/** Care stats start (and cap) at this value. */
export const COMPANION_MAX_CARE = 100

/** Care lost from each stat per wild win. */
export const COMPANION_DECAY_PER_WIN = 2

/** Every care stat must be at least this for the companion to count as content. */
export const COMPANION_CONTENT_THRESHOLD = 50

/** EXP multiplier while the companion is content. */
export const COMPANION_EXP_MULTIPLIER = 1.15

/** Money each feed costs. */
export const COMPANION_FEED_COST = 500

/** Money each wash costs (soap). */
export const COMPANION_WASH_COST = 200

/**
 * The care actions and what they change. `friendship` is how much the pinned
 * Pokemon's friendship rises.
 * @type {Record<string, { label: string, icon: string, cost: number, changes: { fullness?: number, happiness?: number, energy?: number, cleanliness?: number }, friendship: number, verb: string }>}
 */
export const COMPANION_CARE_ACTIONS = {
  feed: {
    label: 'Feed',
    icon: '\u{1f356}',
    cost: COMPANION_FEED_COST,
    changes: { fullness: 40, energy: 5 },
    friendship: 4,
    verb: 'fed',
  },
  play: {
    label: 'Play',
    icon: '\u{1f3be}',
    cost: 0,
    changes: { happiness: 30, energy: -10 },
    friendship: 3,
    verb: 'played with',
  },
  pat: {
    label: 'Pat',
    icon: '\u270b',
    cost: 0,
    changes: { happiness: 12 },
    friendship: 2,
    verb: 'patted',
  },
  brush: {
    label: 'Brush',
    icon: '\u{1f9f9}',
    cost: 0,
    changes: { cleanliness: 35, happiness: 5 },
    friendship: 3,
    verb: 'brushed',
  },
  wash: {
    label: 'Wash',
    icon: '\u{1f6c1}',
    cost: COMPANION_WASH_COST,
    changes: { cleanliness: 60, energy: -10 },
    friendship: 4,
    verb: 'washed',
  },
  rest: {
    label: 'Rest',
    icon: '\u{1f4a4}',
    cost: 0,
    changes: { energy: 40 },
    friendship: 1,
    verb: 'rested',
  },
}

/**
 * A pinned companion's care block, at full.
 * @param {string | null} id
 * @param {number} wildBattlesWon
 */
export function createCompanionCare(id, wildBattlesWon = 0) {
  return {
    id,
    fullness: COMPANION_MAX_CARE,
    happiness: COMPANION_MAX_CARE,
    energy: COMPANION_MAX_CARE,
    cleanliness: COMPANION_MAX_CARE,
    // Care is one action per wild win; the first is allowed straight away.
    careBattle: wildBattlesWon - 1,
  }
}

/** Whether the companion is content (every care stat at or above the threshold). @param {Companion} companion */
export function isCompanionContent(companion) {
  return (
    !!companion?.id &&
    companion.fullness >= COMPANION_CONTENT_THRESHOLD &&
    companion.happiness >= COMPANION_CONTENT_THRESHOLD &&
    companion.energy >= COMPANION_CONTENT_THRESHOLD &&
    companion.cleanliness >= COMPANION_CONTENT_THRESHOLD
  )
}

/** EXP multiplier from the companion's care (1x when there is no content companion). @param {Companion} companion */
export function companionExpMultiplier(companion) {
  return isCompanionContent(companion) ? COMPANION_EXP_MULTIPLIER : 1
}

/** Decay every care stat after a wild win. Never drops below 0. @param {Companion} companion */
export function tickCompanion(companion) {
  if (!companion?.id) return companion
  /** @param {number} value */
  const decay = (value) => Math.max(0, value - COMPANION_DECAY_PER_WIN)
  return {
    ...companion,
    fullness: decay(companion.fullness),
    happiness: decay(companion.happiness),
    energy: decay(companion.energy),
    cleanliness: decay(companion.cleanliness),
  }
}

/**
 * Apply one care action. Returns the next companion block, or null when the
 * action is unknown or nothing is pinned.
 * @param {Companion} companion
 * @param {string} actionId
 */
export function applyCareAction(companion, actionId) {
  const action = COMPANION_CARE_ACTIONS[actionId]
  if (!companion?.id || !action) return null
  /** @param {number} value */
  const clamp = (value) => Math.max(0, Math.min(COMPANION_MAX_CARE, value))
  return {
    ...companion,
    fullness: clamp(companion.fullness + (action.changes.fullness ?? 0)),
    happiness: clamp(companion.happiness + (action.changes.happiness ?? 0)),
    energy: clamp(companion.energy + (action.changes.energy ?? 0)),
    cleanliness: clamp(companion.cleanliness + (action.changes.cleanliness ?? 0)),
  }
}
