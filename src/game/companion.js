// Companion care: pin one of your Pokemon and keep it fed, happy and rested.
// Care decays with every wild win and a content companion grants a small EXP
// bonus, so it is worth checking in between battles — but neglect only pauses
// the bonus, it never harms the Pokemon.

import { MAX_FRIENDSHIP } from './pokemon/friendship.js'

/** Care stats start (and cap) at this value. */
export const COMPANION_MAX_CARE = 100

/** Care lost from each stat per wild win. */
const COMPANION_DECAY_PER_WIN = 1

/** Every care stat must be at least this for the companion to count as content. */
export const COMPANION_CONTENT_THRESHOLD = 40

/** EXP multiplier while the companion is content. */
export const COMPANION_EXP_MULTIPLIER = 1.15

/** Average care a companion needs before it can tough out a knockout. */
export const COMPANION_TOUGH_OUT_MIN_CARE = 60

/** Best-case chance to tough out a knockout, at full care. */
export const COMPANION_TOUGH_OUT_MAX_CHANCE = 0.3

/** Friendship a non-companion needs before it can also tough out a knockout. */
export const FRIENDSHIP_TOUGH_OUT_MIN = 220

/** Best-case chance a high-friendship non-companion toughs out a knockout. */
export const FRIENDSHIP_TOUGH_OUT_MAX_CHANCE = 0.15

/** Money each feed costs. */
export const COMPANION_FEED_COST = 500

/** Money each wash costs (soap). */
const COMPANION_WASH_COST = 200

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
    changes: { happiness: 30, energy: -5 },
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
    changes: { cleanliness: 60, energy: -5 },
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

/**
 * A care stat and the mood it suggests when it is the lowest one.
 * @type {{ stat: 'fullness' | 'happiness' | 'energy' | 'cleanliness', label: string, icon: string }[]}
 */
export const COMPANION_MOODS = [
  { stat: 'fullness', label: 'Hungry', icon: '\u{1F35C}' },
  { stat: 'happiness', label: 'Bored', icon: '\u{1F614}' },
  { stat: 'energy', label: 'Sleepy', icon: '\u{1F4A4}' },
  { stat: 'cleanliness', label: 'Mucky', icon: '\u{1FAE7}' },
]

/**
 * The companion's mood for the buddy panel: happy while content, otherwise the
 * lowest care stat. Null when nothing is pinned.
 * @param {Companion} companion
 * @returns {{ label: string, icon: string } | null}
 */
export function companionMood(companion) {
  if (!companion?.id) return null
  if (isCompanionContent(companion)) return { label: 'Happy', icon: '\u{1F60A}' }
  return COMPANION_MOODS.reduce((worst, entry) =>
    companion[entry.stat] < companion[worst.stat] ? entry : worst
  )
}

/** EXP multiplier from the companion's care (1x when there is no content companion). @param {Companion} companion */
export function companionExpMultiplier(companion) {
  return isCompanionContent(companion) ? COMPANION_EXP_MULTIPLIER : 1
}

/**
 * The chance the pinned companion toughs out a would-be knockout, so a
 * well-kept buddy hangs on more often. Zero when nothing is pinned or its care
 * has fallen too far.
 * @param {Companion} companion
 * @returns {number}
 */
export function companionToughOutChance(companion) {
  if (!companion?.id) return 0
  const average =
    (companion.fullness + companion.happiness + companion.energy + companion.cleanliness) / 4
  if (average < COMPANION_TOUGH_OUT_MIN_CARE) return 0
  const progress =
    (average - COMPANION_TOUGH_OUT_MIN_CARE) / (COMPANION_MAX_CARE - COMPANION_TOUGH_OUT_MIN_CARE)
  return Math.min(1, Math.max(0, progress)) * COMPANION_TOUGH_OUT_MAX_CHANCE
}

/**
 * The chance a non-companion Pokemon toughs out a knockout from its own
 * friendship alone, so a maxed bond is worth something even without pinning it.
 * Half the best companion rate at full friendship, and zero below the gate.
 * @param {{ friendship?: number } | null | undefined} pokemon
 * @returns {number}
 */
export function friendshipToughOutChance(pokemon) {
  const friendship = pokemon?.friendship ?? 0
  if (friendship < FRIENDSHIP_TOUGH_OUT_MIN) return 0
  const progress =
    (friendship - FRIENDSHIP_TOUGH_OUT_MIN) / (MAX_FRIENDSHIP - FRIENDSHIP_TOUGH_OUT_MIN)
  return Math.min(1, Math.max(0, progress)) * FRIENDSHIP_TOUGH_OUT_MAX_CHANCE
}

/**
 * Decay the pinned companion's care after a wild win. Only a battle the
 * companion actually took part in drains it, and only a single care point
 * total — applied to a rotating stat so the four bars drain evenly rather
 * than one dropping to zero first. Neglect only pauses the content EXP bonus;
 * it never harms the Pokemon.
 * @param {Companion} companion
 * @param {boolean} [fought] Whether the companion was in the battle.
 * @param {number} [battleIndex] A counter used to rotate which stat drains.
 */
export function tickCompanion(companion, fought = !0, battleIndex = 0) {
  if (!companion?.id || !fought) return companion
  /** @type {('fullness' | 'happiness' | 'energy' | 'cleanliness')[]} */
  const stats = ['fullness', 'happiness', 'energy', 'cleanliness'],
    stat = stats[Math.abs(Math.trunc(battleIndex)) % stats.length]
  return { ...companion, [stat]: Math.max(0, companion[stat] - COMPANION_DECAY_PER_WIN) }
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
