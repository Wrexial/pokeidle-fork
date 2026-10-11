// Reducer handler for the Research Shop (see game/research.js).

import { consumableItems, evolutionItems, heldItems } from '../../data/items.js'
import { RESEARCH_SHOP } from '../research.js'

/**
 * Handle `BUY_RESEARCH_ITEM`: spend Research Points on a shop item.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function buyResearchItem(state, action) {
  const itemId = action.payload?.itemId,
    entry = RESEARCH_SHOP.find((row) => row.itemId === itemId)
  if (!entry) return state
  if ((state.researchPoints ?? 0) < entry.cost) return state
  const name =
    consumableItems[itemId]?.name ?? evolutionItems[itemId]?.name ?? heldItems[itemId]?.name ?? itemId
  return {
    ...state,
    researchPoints: state.researchPoints - entry.cost,
    inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] ?? 0) + 1 },
    battleLog: [...state.battleLog, `Bought ${name} with Research Points.`].slice(-50),
  }
}
