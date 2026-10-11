// Per-route activity mastery: the best hit quality the player has scored for
// each activity on a route, and the one-time bonus for clearing them all.
// A route is mastered once every activity it offers has been scored at least
// `perfect`.

import { mapData } from '../data/gameData.js'
import { routeActivityIds } from './minigames/route-activities.js'

/** The rank of each activity hit quality. A miss (`null`) is 0. */
export const ACTIVITY_QUALITY_RANK = { hit: 1, perfect: 2, ultra: 3 }

/** The rank an activity must reach to count toward a route's mastery. */
export const MASTERY_RANK = 2

/** The one-time reward for mastering every activity on a route. */
export const MASTERY_REWARD = { money: 3000, items: [{ itemId: 'rareCandy', quantity: 1 }] }

/** @param {'hit' | 'perfect' | 'ultra' | null | undefined} quality */
export function activityQualityRank(quality) {
  return ACTIVITY_QUALITY_RANK[/** @type {keyof typeof ACTIVITY_QUALITY_RANK} */ (quality)] ?? 0
}

/**
 * The activities on a location that count toward its mastery.
 * @param {string} locationId
 * @returns {string[]}
 */
export function masteryActivities(locationId) {
  return routeActivityIds(mapData[locationId])
}

/**
 * Record a best quality for a location + activity. Returns the same map when
 * it is not an improvement, so a caller can cheaply skip a state update.
 * @param {Record<string, Record<string, number>> | undefined} mastery
 * @param {string} locationId
 * @param {string} activityId
 * @param {'hit' | 'perfect' | 'ultra' | null | undefined} quality
 * @returns {Record<string, Record<string, number>> | undefined}
 */
export function recordMastery(mastery, locationId, activityId, quality) {
  const rank = activityQualityRank(quality)
  if (!locationId || !activityId || rank <= 0) return mastery
  const routeMap = mastery?.[locationId] ?? {}
  if ((routeMap[activityId] ?? 0) >= rank) return mastery
  return { ...(mastery ?? {}), [locationId]: { ...routeMap, [activityId]: rank } }
}

/**
 * How many of a route's activities are mastered (rank >= MASTERY_RANK), and
 * whether every activity the route offers is.
 * @param {{ routeMastery?: Record<string, Record<string, number>> }} state
 * @param {string} locationId
 * @returns {{ done: number, total: number, mastered: boolean }}
 */
export function masteryProgress(state, locationId) {
  const activities = masteryActivities(locationId),
    routeMap = state.routeMastery?.[locationId] ?? {},
    done = activities.filter((activityId) => (routeMap[activityId] ?? 0) >= MASTERY_RANK).length
  return { done, total: activities.length, mastered: activities.length > 0 && done === activities.length }
}
