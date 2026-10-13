// Reducer handlers for the Secret Base (see game/secret-base.js): pick a route,
// buy and place decorations, and collect the banked daily yield.

import { todayKey } from '../../data/daily-events.js'
import { mapData } from '../../data/gameData.js'
import { createIdleBattleState } from '../progression.js'
import {
  SECRET_BASE_RELOCATE_COST,
  createSecretBase,
  decorationById,
  decorationUnlocked,
  isSecretBaseYieldReady,
  ownedDecorationCount,
  placeDecoration as placeBaseDecoration,
  removeDecoration as removeBaseDecoration,
  secretBaseDailyYield,
} from '../secret-base.js'
import { enterMinigame, withNotification } from '../reducer-helpers.js'

/**
 * Handle the `START_SECRET_BASE` action: open the base scene.
 * @param {GameState} state
 * @returns {GameState}
 */
export function startSecretBase(state) {
  if (!state.secretBase?.locationId) return state
  return enterMinigame(state, 'secretBase', 0, 'You ducked into your Secret Base.')
}

/**
 * Handle the `END_SECRET_BASE` action: leave the base scene.
 * @param {GameState} state
 * @returns {GameState}
 */
export function endSecretBase(state) {
  if (state.phase !== 'secretBase') return state
  return { ...state, ...createIdleBattleState(), secretBaseCollect: null }
}

/**
 * Handle the `SETUP_SECRET_BASE` action: establish (or move) the base at a
 * route. Moving costs a fee; the first setup is free.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setupSecretBase(state, action) {
  const locationId = action.payload?.locationId ?? state.currentLocation,
    location = mapData[locationId],
    base = state.secretBase ?? createSecretBase()
  if (!location || location.type !== 'route') return state
  if (base.locationId === locationId) return state
  const cost = base.locationId ? SECRET_BASE_RELOCATE_COST : 0
  if (state.money < cost) return state
  return withNotification(
    {
      ...state,
      money: state.money - cost,
      secretBase: { ...base, locationId },
      battleLog: [
        ...state.battleLog,
        cost > 0
          ? `You moved your Secret Base to ${location.name}.`
          : `You set up a Secret Base on ${location.name}!`,
      ].slice(-50),
    },
    {
      message: cost > 0 ? `Secret Base moved to ${location.name}.` : 'Secret Base established!',
      tone: 'success',
      icon: '\u{1F3D5}\uFE0F',
      dedupeKey: `secret-base-setup:${locationId}`,
    }
  )
}

/**
 * Handle the `BUY_DECORATION` action: buy a decoration. Furniture and plushies
 * cost money; trophies are free milestone rewards (and unique).
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function buyDecoration(state, action) {
  const decoration = decorationById(action.payload?.decorationId)
  if (!decoration) return state
  if (!decorationUnlocked(decoration, state)) return state
  const base = state.secretBase ?? createSecretBase()
  // A milestone trophy is a one-off reward.
  if (decoration.milestone && ownedDecorationCount(base, decoration.id) > 0) return state
  if (state.money < decoration.cost) return state
  return {
    ...state,
    money: state.money - decoration.cost,
    secretBase: {
      ...base,
      inventory: {
        ...base.inventory,
        [decoration.id]: (base.inventory[decoration.id] ?? 0) + 1,
      },
    },
  }
}

/**
 * Handle the `PLACE_DECORATION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function placeDecoration(state, action) {
  const { decorationId, x, y } = action.payload ?? {},
    base = state.secretBase
  if (!base) return state
  const placed = placeBaseDecoration(base, decorationId, x, y)
  return placed ? { ...state, secretBase: placed } : state
}

/**
 * Handle the `REMOVE_DECORATION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function removeDecoration(state, action) {
  const { x, y } = action.payload ?? {},
    base = state.secretBase
  if (!base) return state
  const removed = removeBaseDecoration(base, x, y)
  return removed ? { ...state, secretBase: removed } : state
}

/**
 * Handle the `COLLECT_SECRET_BASE_YIELD` action: pay the once-a-day yield.
 * @param {GameState} state
 * @returns {GameState}
 */
export function collectSecretBaseYield(state) {
  const base = state.secretBase
  if (!isSecretBaseYieldReady(base)) return state
  const { money, items } = secretBaseDailyYield(base),
    inventory = { ...state.inventory }
  for (const item of items)
    inventory[item.itemId] = (inventory[item.itemId] ?? 0) + item.quantity
  return {
    ...state,
    money: state.money + money,
    inventory,
    secretBase: {
      ...base,
      lastYieldDate: todayKey(),
      yieldProgress: 0,
      totalYield: (base.totalYield ?? 0) + money,
    },
    secretBaseCollect: { money, items },
    battleLog: [...state.battleLog, `Your Secret Base yielded $${money.toLocaleString()}.`].slice(-50),
  }
}

/**
 * Handle the `DISMISS_SECRET_BASE_COLLECT` action.
 * @param {GameState} state
 * @returns {GameState}
 */
export function dismissSecretBaseCollect(state) {
  return state.secretBaseCollect ? { ...state, secretBaseCollect: null } : state
}
