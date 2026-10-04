// Sinnoh Underground mining runs. Split from game/minigames.js.

import { consumableItems, evolutionItems, fossilItems, heldItems, pokeBalls } from '../../data/items.js'
import { getTmInfo, isTmItem } from '../../data/tms.js'

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
  // Fossils: the repeatable source. They are revived at Cinnabar Island.
  { itemId: 'helixFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'domeFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'oldAmber', weight: 2, min: 1, max: 1 },
  { itemId: 'rootFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'clawFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'skullFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'armorFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'coverFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'plumeFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'jawFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'sailFossil', weight: 2, min: 1, max: 1 },
  { itemId: 'fossilizedBird', weight: 2, min: 1, max: 1 },
  { itemId: 'fossilizedDino', weight: 2, min: 1, max: 1 },
  { itemId: 'fossilizedFish', weight: 2, min: 1, max: 1 },
  { itemId: 'fossilizedDrake', weight: 2, min: 1, max: 1 },
  // Candies.
  { itemId: 'expCandyL', weight: 4, min: 1, max: 2 },
  { itemId: 'rareCandy', weight: 1, min: 1, max: 1 },
  // Held battle items. These are the mart's late-game stock; the Underground
  // is the alternate source so they are never “unobtainable”.
  { itemId: 'silkScarf', weight: 2, min: 1, max: 1 },
  { itemId: 'charcoal', weight: 2, min: 1, max: 1 },
  { itemId: 'mysticWater', weight: 2, min: 1, max: 1 },
  { itemId: 'magnet', weight: 2, min: 1, max: 1 },
  { itemId: 'miracleSeed', weight: 2, min: 1, max: 1 },
  { itemId: 'neverMeltIce', weight: 2, min: 1, max: 1 },
  { itemId: 'blackBelt', weight: 2, min: 1, max: 1 },
  { itemId: 'poisonBarb', weight: 2, min: 1, max: 1 },
  { itemId: 'softSand', weight: 2, min: 1, max: 1 },
  { itemId: 'sharpBeak', weight: 2, min: 1, max: 1 },
  { itemId: 'twistedSpoon', weight: 2, min: 1, max: 1 },
  { itemId: 'silverPowder', weight: 2, min: 1, max: 1 },
  { itemId: 'hardStone', weight: 2, min: 1, max: 1 },
  { itemId: 'spellTag', weight: 2, min: 1, max: 1 },
  { itemId: 'dragonFang', weight: 2, min: 1, max: 1 },
  { itemId: 'blackGlasses', weight: 2, min: 1, max: 1 },
  { itemId: 'ironPlate', weight: 2, min: 1, max: 1 },
  { itemId: 'pixiePlate', weight: 2, min: 1, max: 1 },
  { itemId: 'eviolite', weight: 2, min: 1, max: 1 },
  { itemId: 'focusSash', weight: 2, min: 1, max: 1 },
  { itemId: 'sitrusBerry', weight: 3, min: 1, max: 1 },
  { itemId: 'lumBerry', weight: 2, min: 1, max: 1 },
  { itemId: 'choiceBand', weight: 1, min: 1, max: 1 },
  { itemId: 'choiceSpecs', weight: 1, min: 1, max: 1 },
  { itemId: 'choiceScarf', weight: 1, min: 1, max: 1 },
  { itemId: 'leftovers', weight: 1, min: 1, max: 1 },
  { itemId: 'lifeOrb', weight: 1, min: 1, max: 1 },
  { itemId: 'assaultVest', weight: 1, min: 1, max: 1 },
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
  return (
    (isTmItem(itemId) ? getTmInfo(itemId).name : null) ??
    pokeBalls[itemId]?.name ??
    consumableItems[itemId]?.name ??
    evolutionItems[itemId]?.name ??
    fossilItems[itemId]?.name ??
    heldItems[itemId]?.name ??
    itemId
  )
}

// --- Johto Bug Catching Contest -------------------------------------------
