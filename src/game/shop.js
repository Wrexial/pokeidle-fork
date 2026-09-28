// Poke Mart stock helpers. Kept out of the ShopPanel component so the
// per-mart distribution can be unit-tested without a DOM.

import { mapData } from '../data/gameData.js'
import { martShopItems, regionalMartItems } from '../data/items.js'

/**
 * Every mart location in a region, in progression order. A location counts as a
 * mart if it has generated `mart` data or a hand-curated `martShopItems` entry
 * (Kanto).
 * @param {string} regionId
 * @returns {string[]}
 */
export function regionMartIds(regionId) {
  return Object.values(mapData)
    .filter(
      (loc) => (loc.region ?? 'kanto') === regionId && (loc.mart || martShopItems[loc.id])
    )
    .sort((left, right) => (left.unlockOrder ?? 0) - (right.unlockOrder ?? 0))
    .map((loc) => loc.id)
}

/**
 * The advanced (regional) stock a specific mart carries.
 *
 * Each region's advanced items are dealt out across its marts as a rotating
 * window of roughly half the list, so neighbouring towns carry different
 * shelves instead of every mart selling the whole regional set. The basics in
 * `coreMartItems` stay common to every mart. `regionalMartItems` is currently
 * empty (battle held items moved to the Grand Auction House), so this returns []
 * and every mart shows its location stock plus the core basics.
 * @param {string} regionId
 * @param {string} locationId
 * @returns {{ itemId: string, unlockWildBattlesWon?: number }[]}
 */
export function regionalStockForMart(regionId, locationId) {
  const items = regionalMartItems[regionId] ?? []
  if (items.length === 0) return items
  const count = items.length,
    martIndex = Math.max(0, regionMartIds(regionId).indexOf(locationId)),
    windowSize = Math.max(1, Math.ceil(count / 2))
  return items.filter(
    (_, index) => (((index - martIndex) % count) + count) % count < windowSize
  )
}
