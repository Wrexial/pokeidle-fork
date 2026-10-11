// Route-activity mastery: records the best hit quality per route/activity and
// pays the one-time bonus once every activity on a route is mastered.

import { MASTERY_REWARD, masteryProgress, recordMastery } from '../route-mastery.js'
import { withNotification } from '../reducer-helpers.js'

/**
 * Handle the `RECORD_ROUTE_MASTERY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function recordRouteMastery(state, action) {
  const { locationId, activityId, quality } = action.payload ?? {}
  const nextMastery = recordMastery(state.routeMastery, locationId, activityId, quality)
  if (nextMastery === state.routeMastery) return state
  let next = {
    ...state,
    routeMastery: /** @type {Record<string, Record<string, number>>} */ (nextMastery),
  }
  // Grant the one-time mastery bonus when the last activity is cleared.
  const { mastered } = masteryProgress(next, locationId)
  if (mastered && !(state.masteredRoutes ?? []).includes(locationId)) {
    const inventory = { ...next.inventory }
    for (const item of MASTERY_REWARD.items)
      inventory[item.itemId] = (inventory[item.itemId] ?? 0) + item.quantity
    next = withNotification(
      {
        ...next,
        money: next.money + MASTERY_REWARD.money,
        inventory,
        masteredRoutes: [...(state.masteredRoutes ?? []), locationId],
        battleLog: [
          ...next.battleLog,
          `Route mastered! Every activity there is now a perfect hit or better.`,
        ].slice(-50),
      },
      {
        message: `Route mastered: +$${MASTERY_REWARD.money} and a Rare Candy!`,
        tone: 'shiny',
        icon: '\u2605',
        dedupeKey: `mastery:${locationId}`,
      }
    )
  }
  return next
}
