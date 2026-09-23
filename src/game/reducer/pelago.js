// Reducer handlers for Poké Pelago's passive islands. Split from
// game/reducer.js.

import { rollMiningReward } from '../minigames.js'
import {
  PELAGO_BEANS_PER_POKEMON,
  PELAGO_ISLANDS,
  PELAGO_SLOTS,
  PELAGO_TRAINING_EXP,
  grantExperience,
} from '../pelago.js'

/**
 * Handle the `ASSIGN_PELAGO` action. A boxed Pokemon joins one island if it has
 * a free slot and isn't already working on another island.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function assignPelago(state, action) {
  const { islandId, pokemonId } = action.payload ?? {},
    island = state.pelago?.[islandId]
  if (!PELAGO_ISLANDS[islandId] || !island) return state
  if (island.assigned.includes(pokemonId) || island.assigned.length >= PELAGO_SLOTS) return state
  if (!state.box.some((member) => member.id === pokemonId)) return state
  if (Object.values(state.pelago).some((entry) => entry.assigned.includes(pokemonId))) return state
  return {
    ...state,
    pelago: {
      ...state.pelago,
      [islandId]: { ...island, assigned: [...island.assigned, pokemonId] },
    },
  }
}

/**
 * Handle the `UNASSIGN_PELAGO` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function unassignPelago(state, action) {
  const { islandId, pokemonId } = action.payload ?? {},
    island = state.pelago?.[islandId]
  if (!island) return state
  return {
    ...state,
    pelago: {
      ...state.pelago,
      [islandId]: {
        ...island,
        assigned: island.assigned.filter((id) => id !== pokemonId),
      },
    },
  }
}

/**
 * Handle the `COLLECT_PELAGO` action. Pays out every banked completion on an
 * island and clears its ready count.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function collectPelago(state, action) {
  const { islandId } = action.payload ?? {},
    island = state.pelago?.[islandId]
  if (!PELAGO_ISLANDS[islandId] || !island || island.ready <= 0) return state
  const count = island.ready,
    workers = Math.max(1, island.assigned.length),
    inventory = { ...state.inventory }
  let box = state.box
  const log = []
  if (islandId === 'beans') {
    const quantity = PELAGO_BEANS_PER_POKEMON * workers * count
    inventory.pokebean = (inventory.pokebean ?? 0) + quantity
    log.push(`The Bean Farm produced ${quantity}x Poke Bean!`)
  } else if (islandId === 'caves') {
    const pulls = workers * count
    for (let index = 0; index < pulls; index++) {
      const reward = rollMiningReward()
      inventory[reward.itemId] = (inventory[reward.itemId] ?? 0) + reward.quantity
    }
    log.push(`The Isle Caves yielded ${pulls} haul${pulls === 1 ? '' : 's'} from the deep!`)
  } else if (islandId === 'training') {
    const exp = PELAGO_TRAINING_EXP * count
    box = box.map((member) =>
      island.assigned.includes(member.id) ? grantExperience(member, exp) : member
    )
    log.push(`The Training Isle earned your Pokemon ${exp.toLocaleString()} EXP each!`)
  }
  return {
    ...state,
    inventory,
    box,
    pelago: { ...state.pelago, [islandId]: { ...island, ready: 0 } },
    battleLog: [...state.battleLog, ...log].slice(-50),
  }
}
