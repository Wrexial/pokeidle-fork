// Reducer handlers for minigames actions. Split from game/reducer.js.

import { BATTLE_ROYAL_COST, BUG_CONTEST_COST, CONTEST_COST, CURRY_COST, DYNAMAX_ADVENTURES_COST, LIGHTS_OUT_COST, MINING_COST, POKEATHLON_COST, POKE_RADAR_COST, POKESTAR_COST, QUIZ_COST, ROUTE_ACTIVITIES, SAFARI_COST, VOLTORB_FLIP_COST, routeActivityIds } from '../minigames.js'
import { mapData } from '../../data/gameData.js'
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
 * Handle the `START_SAFARI` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startSafari(state, action) {
  return enterMinigame(
    state,
    'safari',
    SAFARI_COST,
    'You headed into the Safari Zone!'
  )
}

/**
 * Handle the `END_SAFARI` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endSafari(state, action) {
  return state.phase === 'safari' ? { ...state, ...createIdleBattleState() } : state
}

/**
 * Handle the `START_ACADEMY_QUIZ` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startAcademyQuiz(state, action) {
  return enterMinigame(
    state,
    'academyQuiz',
    QUIZ_COST,
    'You sat down for the Academy Quiz.'
  )
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
 * Handle the `START_VOLTORB_FLIP` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startVoltorbFlip(state, action) {
  return enterMinigame(
    state,
    'voltorbFlip',
    VOLTORB_FLIP_COST,
    'You sat down at the Voltorb Flip table.'
  )
}

/**
 * Handle the `START_AUCTION_HOUSE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startAuctionHouse(state, action) {
  return enterMinigame(state, 'auctionHouse', 0, 'You took a seat at the Grand Auction House.')
}

/**
 * Handle the `START_CONTEST` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startContest(state, action) {
  return enterMinigame(
    state,
    'contest',
    CONTEST_COST,
    'You stepped onto the Contest stage.'
  )
}

/**
 * Handle the `START_POKEATHLON` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPokeathlon(state, action) {
  return enterMinigame(
    state,
    'pokeathlon',
    POKEATHLON_COST,
    'You signed up for the Pokeathlon.'
  )
}

/**
 * Handle the `START_POKE_RADAR` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPokeRadar(state, action) {
  return enterMinigame(
    state,
    'pokeRadar',
    POKE_RADAR_COST,
    'You raised the Poke Radar and the grass began to rustle.'
  )
}

/**
 * Handle the `START_BATTLE_ROYAL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startBattleRoyal(state, action) {
  return enterMinigame(
    state,
    'battleRoyal',
    BATTLE_ROYAL_COST,
    'You stepped into the Battle Royal ring.'
  )
}

/**
 * Handle the `START_DYNAMAX_ADVENTURES` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startDynamaxAdventures(state, action) {
  return enterMinigame(
    state,
    'dynamaxAdventures',
    DYNAMAX_ADVENTURES_COST,
    'You descended into the Max Lair.'
  )
}

/**
 * Handle the `START_LIGHTS_OUT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startLightsOut(state, action) {
  return enterMinigame(state, 'lightsOut', LIGHTS_OUT_COST, 'You flicked the lights off.')
}

/**
 * Handle the `START_CURRY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startCurry(state, action) {
  return enterMinigame(state, 'curry', CURRY_COST, 'You set up a campfire to cook.')
}

/**
 * Handle the `START_POKESTAR` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startPokestar(state, action) {
  return enterMinigame(state, 'pokestar', POKESTAR_COST, 'You stepped onto the Pokestar lot.')
}

/**
 * Handle the `END_MINIGAME` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endMinigame(state, action) {
  return state.phase === 'mining' ||
    state.phase === 'gameCorner' ||
    state.phase === 'academyQuiz' ||
    state.phase === 'voltorbFlip' ||
    state.phase === 'auctionHouse' ||
    state.phase === 'contest' ||
    state.phase === 'pokeathlon' ||
    state.phase === 'pokeRadar' ||
    state.phase === 'battleRoyal' ||
    state.phase === 'dynamaxAdventures' ||
    state.phase === 'lightsOut' ||
    state.phase === 'curry' ||
    state.phase === 'pokestar'
    ? { ...state, ...createIdleBattleState() }
    : state
}

/**
 * Handle the `START_ROUTE_ACTIVITY` action. Only starts an activity that is
 * actually available at the current location.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startRouteActivity(state, action) {
  const activityId = action.payload?.activityId,
    activity = ROUTE_ACTIVITIES[activityId]
  if (!activity || !routeActivityIds(mapData[state.currentLocation]).includes(activityId))
    return state
  const base = enterMinigame(
    state,
    'routeActivity',
    0,
    `You started ${activity.title.toLowerCase()}.`
  )
  return base === state ? state : { ...base, routeActivity: activityId }
}

/**
 * Handle the `END_ROUTE_ACTIVITY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endRouteActivity(state, action) {
  return state.phase === 'routeActivity'
    ? { ...state, ...createIdleBattleState(), routeActivity: null }
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
