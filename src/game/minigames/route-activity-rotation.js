// Route-activity rotation. The Dowsing Machine and Hide-and-Seek spots used to
// show on every wild route, which let a single region offer a dozen of each.
// They now rotate through a small, day-seeded subset of a region's routes, so
// each region offers only a couple of spots a day. The pick is deterministic
// for a region + calendar day, so the reducer guard and the location panel
// always agree without persisting a selection; the per-route daily gating (the
// `dowsingSearches` / `hideAndSeekSearches` maps) is unchanged.

import { encounterData, mapData } from '../../data/gameData.js'
import { todayKey } from '../../data/daily-events.js'
import { hashString, mulberry32 } from '../rng.js'
import { hideAndSeekPool } from './hide-and-seek.js'

/** Spots of a route activity a region offers per day. */
export const ROUTE_ACTIVITY_SPOTS = 2

/**
 * Every wild route in a region that can host an activity, ordered by progress
 * (`unlockOrder`) then id so the pick is stable regardless of the data file's
 * key order. Hide-and-Seek only counts routes with a rare Pokemon to hide.
 * @param {string} regionId
 * @param {'dowsing' | 'hideAndSeek'} activity
 * @returns {string[]}
 */
function activityRouteKeys(regionId, activity) {
  return Object.values(mapData)
    .filter(
      (location) =>
        location.type === 'route' &&
        (location.region ?? 'kanto') === regionId &&
        location.routeKey &&
        (encounterData[location.routeKey]?.encounters?.length ?? 0) > 0 &&
        (activity !== 'hideAndSeek' || hideAndSeekPool(location.routeKey).length > 0)
    )
    .sort(
      (left, right) =>
        (left.unlockOrder ?? 0) - (right.unlockOrder ?? 0) || left.id.localeCompare(right.id)
    )
    .map((location) => /** @type {string} */ (location.routeKey))
}

/** Day-seeded rotation results, cached per activity + region + date. @type {Map<string, string[]>} */
const rotationCache = new Map()

/**
 * The day-seeded route keys a region's activity is offered on, at most
 * `ROUTE_ACTIVITY_SPOTS`. Deterministic for a region + date, so the panel and
 * the reducer guard resolve the same routes.
 * @param {string} regionId
 * @param {'dowsing' | 'hideAndSeek'} activity
 * @param {string} [dateKey]
 * @returns {string[]}
 */
function routesForActivity(regionId, activity, dateKey = todayKey()) {
  const cacheKey = `${activity}:${regionId}:${dateKey}`,
    cached = rotationCache.get(cacheKey)
  if (cached) return cached
  const routeKeys = activityRouteKeys(regionId, activity)
  if (routeKeys.length <= ROUTE_ACTIVITY_SPOTS) {
    rotationCache.set(cacheKey, routeKeys)
    return routeKeys
  }
  const random = mulberry32(hashString(cacheKey)),
    indices = [...routeKeys.keys()]
  for (let index = indices.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    ;[indices[index], indices[swap]] = [indices[swap], indices[index]]
  }
  // Keep the picks in progress order so the list reads predictably.
  const chosen = new Set(indices.slice(0, ROUTE_ACTIVITY_SPOTS).map((index) => routeKeys[index])),
    result = routeKeys.filter((routeKey) => chosen.has(routeKey))
  rotationCache.set(cacheKey, result)
  return result
}

/**
 * The routes a region's Dowsing Machine sweeps today.
 * @param {string} regionId
 * @param {string} [dateKey]
 * @returns {string[]}
 */
export function dowsingRoutesForRegion(regionId, dateKey = todayKey()) {
  return routesForActivity(regionId, 'dowsing', dateKey)
}

/**
 * The routes a region's Hide-and-Seek spots hide on today.
 * @param {string} regionId
 * @param {string} [dateKey]
 * @returns {string[]}
 */
export function hideAndSeekRoutesForRegion(regionId, dateKey = todayKey()) {
  return routesForActivity(regionId, 'hideAndSeek', dateKey)
}

/**
 * Whether a route is one of its region's Dowsing spots today.
 * @param {string} regionId
 * @param {string | null | undefined} routeKey
 * @param {string} [dateKey]
 * @returns {boolean}
 */
export function dowsingRouteForRegion(regionId, routeKey, dateKey = todayKey()) {
  return !!routeKey && dowsingRoutesForRegion(regionId, dateKey).includes(routeKey)
}

/**
 * Whether a route is one of its region's Hide-and-Seek spots today.
 * @param {string} regionId
 * @param {string | null | undefined} routeKey
 * @param {string} [dateKey]
 * @returns {boolean}
 */
export function hideAndSeekRouteForRegion(regionId, routeKey, dateKey = todayKey()) {
  return !!routeKey && hideAndSeekRoutesForRegion(regionId, dateKey).includes(routeKey)
}
