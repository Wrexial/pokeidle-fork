// Kurt's Apricorn Ball workshop: hand him an Apricorn and he carves it over a
// few wild wins (the canonical delayed turnaround). The queue is pure state so
// the reducer and the tests share it.

import { consumableItems } from '../data/items.js'

/** Wild wins Kurt takes to carve one Apricorn into its ball. */
export const KURT_CRAFT_BATTLES = 10

/**
 * One Apricorn Kurt is carving.
 * @typedef {{ apricornId: string, ballId: string, battlesRemaining: number }} KurtCraft
 */

/**
 * Add a stack of the same Apricorn to Kurt's queue. Each Apricorn becomes its
 * own craft, all started at the same time. Clamps the count to a whole number
 * and returns the same array when there is nothing to queue, so a caller can
 * cheaply skip a state update.
 * @param {KurtCraft[] | undefined} crafts
 * @param {string} apricornId
 * @param {number} [quantity]
 * @returns {KurtCraft[]}
 */
export function queueKurtCrafts(crafts, apricornId, quantity = 1) {
  const apricorn = consumableItems[apricornId],
    count = Math.max(0, Math.floor(quantity))
  if (!apricorn?.kurtBall || count <= 0) return crafts ?? []
  const queued = Array.from({ length: count }, () => ({
    apricornId,
    ballId: /** @type {string} */ (apricorn.kurtBall),
    battlesRemaining: KURT_CRAFT_BATTLES,
  }))
  return [...(crafts ?? []), ...queued]
}

/**
 * Add a single Apricorn to Kurt's queue. Returns the same array when the item
 * isn't an Apricorn, so a caller can cheaply skip a state update.
 * @param {KurtCraft[] | undefined} crafts
 * @param {string} apricornId
 * @returns {KurtCraft[]}
 */
export function queueKurtCraft(crafts, apricornId) {
  return queueKurtCrafts(crafts, apricornId, 1)
}

/**
 * Advance every craft by one wild win. Returns the same array when nothing is
 * pending, so the caller can skip a state update.
 * @param {KurtCraft[] | undefined} crafts
 * @returns {KurtCraft[]}
 */
export function tickKurtCrafts(crafts) {
  if (!crafts?.some((craft) => craft.battlesRemaining > 0)) return crafts ?? []
  return crafts.map((craft) =>
    craft.battlesRemaining > 0 ? { ...craft, battlesRemaining: craft.battlesRemaining - 1 } : craft
  )
}

/**
 * The crafts that are finished and waiting to be collected.
 * @param {KurtCraft[] | undefined} crafts
 * @returns {KurtCraft[]}
 */
export function readyKurtCrafts(crafts) {
  return (crafts ?? []).filter((craft) => craft.battlesRemaining <= 0)
}
