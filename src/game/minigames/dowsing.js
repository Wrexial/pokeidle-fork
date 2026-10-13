// Dowsing Machine. Split from the other minigames because, unlike the fixed
// POIs in registry.js, it works on any wild route: every route hides a small,
// day-seeded set of items that a hot/cold grid probe can uncover. The grid and
// reward plumbing mirror game/minigames/mining.js, but the set is deterministic
// for a route + calendar day and each route can only be swept once a day.

import { todayKey } from '../../data/daily-events.js'
import { hashString, mulberry32 } from '../rng.js'
import { rewardItemName } from './mining.js'

/** Columns in the dowsing grid (the mining grid is 6 wide too). */
export const DOWSING_COLS = 6

/** Rows in the dowsing grid. */
export const DOWSING_ROWS = 5

/** Tiles in the dowsing grid. */
export const DOWSING_TILES = DOWSING_COLS * DOWSING_ROWS

/** Hidden items a route keeps per day. */
export const DOWSING_ITEMS = 3

/** Probes a single sweep gives. */
export const DOWSING_PROBES = 10

/** Short "how to play" steps, shown on the launch card. */
export const DOWSING_TUTORIAL = [
  `Probe a tile to read how close the nearest hidden item is \u2014 Blazing is right next door, Cold is far away.`,
  `Every route hides ${DOWSING_ITEMS} items a day and each sweep gives ${DOWSING_PROBES} probes.`,
  'Found items are banked straight away, and the route refills tomorrow.',
]

/**
 * Weighted reward table for the hidden items. Modest on purpose: the Dowsing
 * Machine is a free daily route activity, so it leans on sellables, supplies
 * and berries with only a rare evolution stone or candy.
 * @type {{ itemId: string, weight: number, min: number, max: number }[]}
 */
const DOWSING_REWARD_TABLE = [
  { itemId: 'stardust', weight: 16, min: 1, max: 2 },
  { itemId: 'pearl', weight: 12, min: 1, max: 1 },
  { itemId: 'hardStone', weight: 8, min: 1, max: 1 },
  { itemId: 'nugget', weight: 6, min: 1, max: 1 },
  { itemId: 'bigPearl', weight: 4, min: 1, max: 1 },
  { itemId: 'starPiece', weight: 2, min: 1, max: 1 },
  { itemId: 'bigNugget', weight: 1, min: 1, max: 1 },
  { itemId: 'cometShard', weight: 1, min: 1, max: 1 },
  { itemId: 'hyperPotion', weight: 10, min: 1, max: 1 },
  { itemId: 'expCandyS', weight: 10, min: 1, max: 2 },
  { itemId: 'expCandyM', weight: 6, min: 1, max: 1 },
  { itemId: 'ultraball', weight: 8, min: 1, max: 2 },
  { itemId: 'sitrusBerry', weight: 6, min: 1, max: 1 },
  { itemId: 'lumBerry', weight: 3, min: 1, max: 1 },
  { itemId: 'rareCandy', weight: 2, min: 1, max: 1 },
  { itemId: 'fireStone', weight: 2, min: 1, max: 1 },
  { itemId: 'waterStone', weight: 2, min: 1, max: 1 },
  { itemId: 'thunderStone', weight: 2, min: 1, max: 1 },
  { itemId: 'leafStone', weight: 2, min: 1, max: 1 },
  { itemId: 'moonStone', weight: 1, min: 1, max: 1 },
  { itemId: 'sunStone', weight: 1, min: 1, max: 1 },
]

/** Total weight of the reward table. */
const TOTAL_WEIGHT = DOWSING_REWARD_TABLE.reduce((sum, entry) => sum + entry.weight, 0)

/**
 * The seeded hidden-item set for a route on a date. The tile positions are a
 * shuffled slice of the grid and the rewards are rolled from the table with the
 * same PRNG, so the whole sweep is reproducible. Cached per route + day.
 * @type {Map<string, { index: number, itemId: string, quantity: number }[]>}
 */
const gridCache = new Map()

/**
 * @param {string} routeKey
 * @param {string} [dateKey]
 * @returns {{ index: number, itemId: string, quantity: number }[]}
 */
export function dowsingFinds(routeKey, dateKey = todayKey()) {
  const cacheKey = `${routeKey}@${dateKey}`,
    cached = gridCache.get(cacheKey)
  if (cached) return cached
  const random = mulberry32(hashString(cacheKey)),
    indices = [...Array(DOWSING_TILES).keys()]
  for (let index = indices.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    ;[indices[index], indices[swap]] = [indices[swap], indices[index]]
  }
  const finds = indices.slice(0, DOWSING_ITEMS).map((index) => {
    let roll = random() * TOTAL_WEIGHT
    for (const entry of DOWSING_REWARD_TABLE) {
      roll -= entry.weight
      if (roll <= 0)
        return {
          index,
          itemId: entry.itemId,
          quantity: entry.min + Math.floor(random() * (entry.max - entry.min + 1)),
        }
    }
    const fallback = DOWSING_REWARD_TABLE[0]
    return { index, itemId: fallback.itemId, quantity: 1 }
  })
  gridCache.set(cacheKey, finds)
  return finds
}

/**
 * Manhattan distance between two tile indices on the dowsing grid.
 * @param {number} from
 * @param {number} to
 * @returns {number}
 */
export function dowsingDistance(from, to) {
  const fromRow = Math.floor(from / DOWSING_COLS),
    fromCol = from % DOWSING_COLS,
    toRow = Math.floor(to / DOWSING_COLS),
    toCol = to % DOWSING_COLS
  return Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol)
}

/**
 * The heat reading a probe gets on an empty tile: how close the nearest hidden
 * item is. Distance 0 is the item itself (handled before this is called).
 * @param {number} distance
 * @returns {{ key: string, label: string, icon: string }}
 */
export function dowsingHeat(distance) {
  if (distance <= 1) return { key: 'blazing', label: 'Blazing', icon: '\u{1f525}' }
  if (distance === 2) return { key: 'hot', label: 'Hot', icon: '\u2668\ufe0f' }
  if (distance === 3) return { key: 'warm', label: 'Warm', icon: '\u2600\ufe0f' }
  if (distance === 4) return { key: 'cool', label: 'Cool', icon: '\u{1f343}' }
  return { key: 'cold', label: 'Cold', icon: '\u2744\ufe0f' }
}

/**
 * The heat reading for a probed tile: the nearest hidden item in the route's
 * day set, or `null` when the tile itself holds one.
 * @param {{ index: number }[]} finds
 * @param {number} tileIndex
 * @returns {{ key: string, label: string, icon: string } | null}
 */
export function dowsingReading(finds, tileIndex) {
  let nearest = Infinity
  for (const find of finds) {
    const distance = dowsingDistance(tileIndex, find.index)
    if (distance === 0) return null
    if (distance < nearest) nearest = distance
  }
  return dowsingHeat(nearest)
}

/**
 * Whether a route's hidden items are still waiting for the day. `searches` is
 * the persisted route-key -> date map.
 * @param {Record<string, string> | null | undefined} searches
 * @param {string} routeKey
 * @param {string} [dateKey]
 * @returns {boolean}
 */
export function dowsingAvailable(searches, routeKey, dateKey = todayKey()) {
  return !routeKey || searches?.[routeKey] !== dateKey
}

/** Display name for any dowsing reward item id. @param {string} itemId */
export function dowsingRewardName(itemId) {
  return rewardItemName(itemId)
}
