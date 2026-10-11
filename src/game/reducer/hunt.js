// Focus-hunt reducer handlers (#61): start or stop a hunt. The encounter and
// catch progress is advanced from the shared `START_ENCOUNTER` / `MARK_CAUGHT`
// handlers (see reducer/battle/events.js and reducer/collection.js).

import { createHunt, huntLabel, isValidHuntTarget } from '../hunt.js'
import { withNotification } from '../reducer-helpers.js'

/**
 * Handle the `SET_HUNT` action: focus on a species or type.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setHunt(state, action) {
  const { mode, target } = action.payload ?? {}
  if (!isValidHuntTarget(mode, target)) return state
  const hunt = createHunt(mode, target)
  return withNotification(
    { ...state, hunt },
    {
      message: `Now hunting ${huntLabel(hunt)} \u2014 it will turn up more often.`,
      tone: 'info',
      icon: '\u{1f3af}',
      dedupeKey: `hunt:${hunt.mode}:${hunt.target}`,
    }
  )
}

/**
 * Handle the `CLEAR_HUNT` action.
 * @param {GameState} state
 * @returns {GameState}
 */
export function clearHunt(state) {
  return state.hunt ? { ...state, hunt: null } : state
}
