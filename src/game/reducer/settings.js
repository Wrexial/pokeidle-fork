// Reducer handlers for settings actions. Split from game/reducer.js.

import { POKEMON_TYPES } from '../../data/moves.js'
import { withNotification } from '../reducer-helpers.js'

/**
 * Handle the `SET_SPEED` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setSpeed(state, action) {
  return {
    ...state,
    speed: action.payload.speed,
  }
}

/**
 * Handle the `SET_BATTLE_STYLE` action. Switch (the default) lets the
 * auto-battler switch to a better matchup on its own; Set never switches
 * automatically.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setBattleStyle(state, action) {
  const style = action.payload?.style === 'set' ? 'set' : 'switch'
  return {
    ...state,
    battleStyle: style,
  }
}

/**
 * Handle the `SET_BATTLE_MODE` action. Auto (the default) lets the idle loop
 * resolve turns itself; manual waits for the player to choose a move or switch.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setBattleMode(state, action) {
  const mode = action.payload?.mode === 'manual' ? 'manual' : 'auto'
  return {
    ...state,
    battleMode: mode,
    // Leaving manual mode drops any half-made choice so the loop resumes clean.
    pendingPlayerMove: mode === 'manual' ? state.pendingPlayerMove : null,
  }
}

/**
 * Handle the `TOGGLE_PAUSE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function togglePause(state, action) {
  return {
    ...state,
    paused: !state.paused,
  }
}

/**
 * Handle the `CLEAR_LEVEL_UP` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function clearLevelUp(state, action) {
  return {
    ...state,
    levelUpNotification: null,
  }
}

/**
 * Handle the `PUSH_NOTIFICATION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function pushNotification(state, action) {
  return withNotification(state, action.payload)
}

/**
 * Handle the `DISMISS_NOTIFICATION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function dismissNotification(state, action) {
  return {
    ...state,
    notifications: state.notifications.filter(
      (notification) => notification.id !== action.payload.id
    ),
  }
}

/**
 * Handle the `ADD_LOG` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function addLog(state, action) {
  return {
    ...state,
    battleLog: [...state.battleLog, action.payload.message].slice(-50),
  }
}

/**
 * Handle the `TOGGLE_AUTO_PROCEED` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleAutoProceed(state, action) {
  return {
    ...state,
    autoProceed: !state.autoProceed,
  }
}

/**
 * Handle the `TOGGLE_BROWSER_NOTIFICATIONS` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleBrowserNotifications(state, action) {
  return {
    ...state,
    browserNotifications: !state.browserNotifications,
  }
}

/**
 * Handle the `TOGGLE_MART_COLLAPSED` action. Persisted so a minimised mart
 * stays minimised the next time the player opens any mart.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleMartCollapsed(state, action) {
  return {
    ...state,
    martCollapsed: !state.martCollapsed,
  }
}

/**
 * Handle the `TOGGLE_NOTIFY_SHINY` action.
 * @param {GameState} state
 * @returns {GameState}
 */
export function toggleNotifyShiny(state) {
  return {
    ...state,
    notifyShiny: !state.notifyShiny,
  }
}

/**
 * Handle the `TOGGLE_NOTIFY_RARE` action (raids, roamers and legendaries).
 * @param {GameState} state
 * @returns {GameState}
 */
export function toggleNotifyRare(state) {
  return {
    ...state,
    notifyRare: !state.notifyRare,
  }
}

/**
 * Handle the `TOGGLE_NOTIFY_EGG` action.
 * @param {GameState} state
 * @returns {GameState}
 */
export function toggleNotifyEgg(state) {
  return {
    ...state,
    notifyEgg: !state.notifyEgg,
  }
}

/**
 * Handle the `TOGGLE_REDUCED_MOTION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleReducedMotion(state, action) {
  return {
    ...state,
    reducedMotion: !state.reducedMotion,
  }
}

/**
 * Handle the `TOGGLE_COLOURBLIND_TYPES` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleColourblindTypes(state, action) {
  return {
    ...state,
    colourblindTypes: !state.colourblindTypes,
  }
}

/**
 * Handle the `TOGGLE_LARGE_TEXT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleLargeText(state, action) {
  return {
    ...state,
    largeText: !state.largeText,
  }
}

/**
 * Handle the `TOGGLE_SPRITE_STYLE` action: switch between the animated gifs and
 * the static pngs.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleSpriteStyle(state, action) {
  return {
    ...state,
    spriteStyle: state.spriteStyle === 'static' ? 'animated' : 'static',
  }
}

/**
 * Handle the `TOGGLE_MUSIC` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleMusic(state, action) {
  return {
    ...state,
    musicEnabled: !state.musicEnabled,
  }
}

/**
 * Handle the `TOGGLE_SFX` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleSfx(state, action) {
  return {
    ...state,
    sfxEnabled: !state.sfxEnabled,
  }
}

/**
 * Handle the `TOGGLE_CHALLENGE_RANDOMIZER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleChallengeRandomizer(state, action) {
  return {
    ...state,
    challengeRandomizer: !state.challengeRandomizer,
  }
}

/**
 * Handle the `TOGGLE_CHALLENGE_LEVEL_SCALE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleChallengeLevelScale(state, action) {
  return {
    ...state,
    challengeLevelScale: !state.challengeLevelScale,
  }
}

/**
 * Handle the `TOGGLE_CHALLENGE_NUZLOCKE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleChallengeNuzlocke(state, action) {
  return {
    ...state,
    challengeNuzlocke: !state.challengeNuzlocke,
  }
}

/**
 * Handle the `TOGGLE_CHALLENGE_RESTRICT_CATCHES` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function toggleChallengeRestrictCatches(state, action) {
  return {
    ...state,
    challengeRestrictCatches: !state.challengeRestrictCatches,
  }
}

/**
 * Handle the `MARK_CATCH_ROUTE` action: remember that a route's first wild
 * encounter has been used up under the Restrict Catches challenge.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function markCatchRoute(state, action) {
  const routeKey = action.payload?.routeKey
  if (!routeKey || (state.challengeCatchRoutes ?? []).includes(routeKey)) return state
  return {
    ...state,
    challengeCatchRoutes: [...(state.challengeCatchRoutes ?? []), routeKey],
  }
}

/**
 * Handle the `SET_CHALLENGE_MONOTYPE` action. The payload's `monotype` is a
 * type name, or null/anything unrecognised to turn the challenge off.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setChallengeMonotype(state, action) {
  const monotype = action.payload?.monotype
  return {
    ...state,
    challengeMonotype:
      typeof monotype === 'string' && POKEMON_TYPES.includes(monotype) ? monotype : null,
  }
}
