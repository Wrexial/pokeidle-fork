// The Technial Machine (TM) catalogue. TMs are reusable, one copy per move,
// derived from the species' machine learnsets (`tm-learnsets.json`) so the set
// always matches what the Move Tutor can actually teach. Each TM is an item
// whose id is `tm:<moveId>`; `getItemInfo` / `ItemIcon` special-case that so no
// per-move sprite is needed. Acquisition lives in `src/game/tms.js`.

import { moveData, tmLearnsets } from './gameData.js'

/** Item-id prefix shared by every TM. */
export const TM_ITEM_PREFIX = 'tm:'

const tmMoveIdSet = new Set()
for (const moveIds of Object.values(tmLearnsets))
  for (const moveId of moveIds) tmMoveIdSet.add(moveId)

/** Every distinct machine move with real move data, in stable order. */
export const TM_MOVE_IDS = [...tmMoveIdSet].filter((moveId) => moveData[moveId]).sort()

/**
 * 1-based catalogue number for each machine move, in `TM_MOVE_IDS` order. The
 * number is a stable label ("TM142"), not a game-canonical TM number.
 * @type {Map<string, number>}
 */
const TM_NUMBERS = new Map(TM_MOVE_IDS.map((moveId, index) => [moveId, index + 1]))

/**
 * Machine moves grouped by move type, for type-themed rewards (a gym hands out
 * TMs of its own type, a Bug Catcher minigame hands out Bug TMs, ...).
 * @type {Record<string, string[]>}
 */
export const TM_MOVES_BY_TYPE = {}
for (const moveId of TM_MOVE_IDS) {
  const type = moveData[moveId].type
  if (!TM_MOVES_BY_TYPE[type]) TM_MOVES_BY_TYPE[type] = []
  TM_MOVES_BY_TYPE[type].push(moveId)
}

/**
 * The item id for a machine move.
 * @param {string} moveId
 * @returns {string}
 */
export function tmItemId(moveId) {
  return `${TM_ITEM_PREFIX}${moveId}`
}

/**
 * Whether an item id represents a TM.
 * @param {string} itemId
 * @returns {boolean}
 */
export function isTmItem(itemId) {
  return typeof itemId === 'string' && itemId.startsWith(TM_ITEM_PREFIX)
}

/**
 * The move a TM teaches, or null for a non-TM id.
 * @param {string} itemId
 * @returns {string | null}
 */
export function tmMoveId(itemId) {
  return isTmItem(itemId) ? itemId.slice(TM_ITEM_PREFIX.length) : null
}

/**
 * The catalogue number of a TM, by item id (`tm:<moveId>`) or raw move id.
 * @param {string} itemIdOrMoveId
 * @returns {number | null}
 */
export function tmNumber(itemIdOrMoveId) {
  const moveId = isTmItem(itemIdOrMoveId) ? tmMoveId(itemIdOrMoveId) : itemIdOrMoveId
  return (moveId && TM_NUMBERS.get(moveId)) || null
}

/**
 * Name and effect text for a TM item, shaped like the other `getItemInfo`
 * entries (so the bag, tooltips and reward summaries can show it).
 * @param {string} itemId
 * @returns {{ name: string, description: string }}
 */
export function getTmInfo(itemId) {
  const move = moveData[tmMoveId(itemId) ?? '']
  if (!move) return { name: String(itemId), description: '' }
  const number = tmNumber(itemId)
  return {
    name: number != null ? `TM${number} ${move.name}` : `TM ${move.name}`,
    description: `TM${number != null ? ` ${number}` : ''} teaches ${move.name} to a compatible Pokemon. Reusable.`,
  }
}

/**
 * The move type of a TM item, used to colour its bag / reward icon.
 * @param {string} itemId
 * @returns {string | null}
 */
export function tmMoveType(itemId) {
  return moveData[tmMoveId(itemId) ?? '']?.type ?? null
}
