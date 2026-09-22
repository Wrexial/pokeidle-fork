// Sinnoh Underground mining runs. Split from game/minigames.js.

import { consumableItems, evolutionItems } from '../../data/items.js'

/** Money spent to start a mining run. */
export const MINING_COST = 1500

/** Tiles in the mining grid. */
export const MINING_TILES = 30

/** Hidden rewards in the grid. */
export const MINING_REWARD_TILES = 12

/** Digs the player gets per run. */
export const MINING_DIGS = 10

/**
 * Weighted reward table. `min`/`max` bound the quantity per find.
 * @type {{ itemId: string, weight: number, min: number, max: number }[]}
 */
const MINING_REWARD_TABLE = [
  { itemId: 'stardust', weight: 22, min: 1, max: 2 },
  { itemId: 'pearl', weight: 14, min: 1, max: 1 },
  { itemId: 'nugget', weight: 9, min: 1, max: 1 },
  { itemId: 'bigPearl', weight: 6, min: 1, max: 1 },
  { itemId: 'starPiece', weight: 4, min: 1, max: 1 },
  { itemId: 'bigNugget', weight: 2, min: 1, max: 1 },
  { itemId: 'cometShard', weight: 1, min: 1, max: 1 },
  // Evolution stones and items.
  { itemId: 'fireStone', weight: 5, min: 1, max: 1 },
  { itemId: 'waterStone', weight: 5, min: 1, max: 1 },
  { itemId: 'thunderStone', weight: 5, min: 1, max: 1 },
  { itemId: 'leafStone', weight: 5, min: 1, max: 1 },
  { itemId: 'moonStone', weight: 4, min: 1, max: 1 },
  { itemId: 'sunStone', weight: 4, min: 1, max: 1 },
  { itemId: 'shinyStone', weight: 3, min: 1, max: 1 },
  { itemId: 'duskStone', weight: 3, min: 1, max: 1 },
  { itemId: 'dawnStone', weight: 3, min: 1, max: 1 },
  { itemId: 'iceStone', weight: 3, min: 1, max: 1 },
  { itemId: 'ovalStone', weight: 2, min: 1, max: 1 },
  { itemId: 'metalCoat', weight: 2, min: 1, max: 1 },
  { itemId: 'kingsRock', weight: 2, min: 1, max: 1 },
  { itemId: 'protector', weight: 1, min: 1, max: 1 },
  { itemId: 'razorClaw', weight: 1, min: 1, max: 1 },
  // Candies.
  { itemId: 'expCandyL', weight: 4, min: 1, max: 2 },
  { itemId: 'rareCandy', weight: 1, min: 1, max: 1 },
]

/** Total weight of the reward table. */
const TOTAL_WEIGHT = MINING_REWARD_TABLE.reduce((sum, entry) => sum + entry.weight, 0)

/**
 * Roll one mining reward.
 * @returns {{ itemId: string, quantity: number }}
 */
export function rollMiningReward() {
  let roll = Math.random() * TOTAL_WEIGHT
  for (const entry of MINING_REWARD_TABLE) {
    roll -= entry.weight
    if (roll <= 0)
      return {
        itemId: entry.itemId,
        quantity: entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1)),
      }
  }
  const fallback = MINING_REWARD_TABLE[0]
  return { itemId: fallback.itemId, quantity: 1 }
}

/** Display name for any reward item id. @param {string} itemId */
export function rewardItemName(itemId) {
  return consumableItems[itemId]?.name ?? evolutionItems[itemId]?.name ?? itemId
}

// --- Johto Bug Catching Contest -------------------------------------------
