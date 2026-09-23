// Reducer handlers for companion care and the Berry Garden. Split from
// game/reducer.js.

import {
  COMPANION_CARE_ACTIONS,
  applyCareAction,
  createCompanionCare,
} from '../companion.js'
import { BLEND_BERRY_COST, BLEND_RESULT_ITEM, GARDEN_BERRIES, isPlantableBerry, rollHarvest } from '../garden.js'
import { consumableItems, heldItems } from '../../data/items.js'
import { gainFriendship } from '../pokemon.js'

/** @param {string} berryId */
function berryName(berryId) {
  return consumableItems[berryId]?.name ?? heldItems[berryId]?.name ?? berryId
}

/** @param {GameState} state */
function companionName(state) {
  const id = state.companion?.id,
    member = [...state.party, ...state.box].find((candidate) => candidate.id === id)
  return member?.nickname || member?.name || 'your companion'
}

/**
 * Handle the `SET_COMPANION` action. `pokemonId` null unpins the companion;
 * pinning a Pokemon resets its care to full.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function setCompanion(state, action) {
  const pokemonId = action.payload?.pokemonId ?? null
  if (pokemonId === null)
    return state.companion?.id === null ? state : { ...state, companion: { ...state.companion, id: null } }
  if (state.companion?.id === pokemonId) return state
  const member = [...state.party, ...state.box].find((candidate) => candidate.id === pokemonId)
  if (!member) return state
  return {
    ...state,
    companion: createCompanionCare(pokemonId, state.wildBattlesWon),
    battleLog: [
      ...state.battleLog,
      `${member.nickname || member.name} is now your companion!`,
    ].slice(-50),
  }
}

/**
 * Handle the `CARE_COMPANION` action. One care action is allowed per wild win,
 * and feeding costs money.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function careCompanion(state, action) {
  const actionId = action.payload?.action,
    careAction = COMPANION_CARE_ACTIONS[actionId],
    companion = state.companion
  if (!careAction || !companion?.id) return state
  // One care action per wild win keeps it a light touch, not a clicker.
  if (state.wildBattlesWon <= companion.careBattle) return state
  if (careAction.cost > 0 && state.money < careAction.cost) return state
  const cared = applyCareAction(companion, actionId)
  if (!cared) return state
  /** @param {Pokemon} member */
  const raiseFriendship = (member) =>
    member.id === companion.id
      ? { ...member, friendship: gainFriendship(member, careAction.friendship) }
      : member
  return {
    ...state,
    money: state.money - careAction.cost,
    companion: { ...cared, careBattle: state.wildBattlesWon },
    party: state.party.map(raiseFriendship),
    box: state.box.map(raiseFriendship),
    playerPokemon: state.playerPokemon
      ? raiseFriendship(state.playerPokemon)
      : state.playerPokemon,
    battleLog: [...state.battleLog, `You ${careAction.verb} ${companionName(state)}.`].slice(-50),
  }
}

/**
 * Handle the `PLANT_BERRY` action. Consumes one berry from the bag.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function plantBerry(state, action) {
  const plotIndex = action.payload?.plotIndex,
    berryId = action.payload?.berryId,
    plots = state.garden?.plots
  if (!plots || !isPlantableBerry(berryId)) return state
  if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= plots.length) return state
  if (plots[plotIndex]) return state
  if ((state.inventory[berryId] ?? 0) <= 0) return state
  const nextPlots = [...plots]
  nextPlots[plotIndex] = {
    berryId,
    battlesRemaining: GARDEN_BERRIES[berryId].growBattles,
  }
  return {
    ...state,
    inventory: { ...state.inventory, [berryId]: state.inventory[berryId] - 1 },
    garden: { ...state.garden, plots: nextPlots },
    battleLog: [...state.battleLog, `Planted a ${berryName(berryId)} in the garden.`].slice(-50),
  }
}

/**
 * Handle the `HARVEST_BERRY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function harvestBerry(state, action) {  const plotIndex = action.payload?.plotIndex,
    plots = state.garden?.plots,
    plot = plots?.[plotIndex]
  if (!plots || !plot || plot.battlesRemaining > 0) return state
  const quantity = rollHarvest(plot.berryId),
    nextPlots = [...plots]
  nextPlots[plotIndex] = null
  return {
    ...state,
    inventory: { ...state.inventory, [plot.berryId]: (state.inventory[plot.berryId] ?? 0) + quantity },
    garden: { ...state.garden, plots: nextPlots },
    battleLog: [...state.battleLog, `Harvested ${quantity}x ${berryName(plot.berryId)}.`].slice(-50),
  }
}

/**
 * Handle the `BLEND_BERRIES` action. Consumes a few berries of one kind and
 * produces a Poffin.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function blendBerries(state, action) {
  const berryId = action.payload?.berryId
  if (!isPlantableBerry(berryId)) return state
  if ((state.inventory[berryId] ?? 0) < BLEND_BERRY_COST) return state
  return {
    ...state,
    inventory: {
      ...state.inventory,
      [berryId]: state.inventory[berryId] - BLEND_BERRY_COST,
      [BLEND_RESULT_ITEM]: (state.inventory[BLEND_RESULT_ITEM] ?? 0) + 1,
    },
    battleLog: [
      ...state.battleLog,
      `Blended ${BLEND_BERRY_COST}x ${berryName(berryId)} into a Poffin.`,
    ].slice(-50),
  }
}
