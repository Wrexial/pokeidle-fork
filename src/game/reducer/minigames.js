// Reducer handlers for minigames actions. Split from game/reducer.js.

import { BUG_CONTEST_COST, MINING_COST } from '../minigames.js'
import { createIdleBattleState } from '../progression.js'
import { enterMinigame } from '../reducer-helpers.js'

/**
 * Handle the `START_BUG_CONTEST` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startBugContest(state, action) {
  return enterMinigame(
    state,
    'bugCatching',
    BUG_CONTEST_COST,
    'You entered the Bug Catching Contest!'
  )
}

/**
 * Handle the `END_BUG_CONTEST` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endBugContest(state, action) {
  return state.phase === 'bugCatching' ? { ...state, ...createIdleBattleState() } : state
}

/**
 * Handle the `START_MINING` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startMining(state, action) {
  return enterMinigame(
    state,
    'mining',
    MINING_COST,
    'You headed down into the Underground.'
  )
}

/**
 * Handle the `START_GAME_CORNER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startGameCorner(state, action) {
  return enterMinigame(state, 'gameCorner', 0, 'You stepped up to the Game Corner slots.')
}

/**
 * Handle the `END_MINIGAME` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endMinigame(state, action) {
  return state.phase === 'mining' || state.phase === 'gameCorner'
    ? { ...state, ...createIdleBattleState() }
    : state
}

/**
 * Handle the `PAY_MINIGAME_FEE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function payMinigameFee(state, action) {
  const amount = action.payload?.amount ?? 0
  if (amount <= 0 || state.money < amount) return state
  return {
    ...state,
    money: state.money - amount,
  }
}

/**
 * Handle the `CLAIM_MINIGAME_REWARD` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function claimMinigameReward(state, action) {
  const { money = 0, items = [] } = action.payload ?? {},
    inventory = { ...state.inventory }
  for (const item of items)
    if (item?.itemId && item.quantity > 0)
      inventory[item.itemId] = (inventory[item.itemId] ?? 0) + item.quantity
  return {
    ...state,
    money: state.money + money,
    inventory,
    battleLog: [...state.battleLog, 'Minigame reward claimed.'].slice(-50),
  }
}

/**
 * Handle the `COLLECT_MINING` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function collectMining(state, action) {
  const rewards = Array.isArray(action.payload?.rewards) ? action.payload.rewards : []
  if (rewards.length === 0) return state
  const inventory = { ...state.inventory }
  for (const reward of rewards)
    if (reward?.itemId && reward.quantity > 0)
      inventory[reward.itemId] = (inventory[reward.itemId] ?? 0) + reward.quantity
  return {
    ...state,
    inventory,
    battleLog: [...state.battleLog, 'Collected the Underground finds.'].slice(-50),
  }
}
