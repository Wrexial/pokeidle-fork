// Region minigames. Hoenn's Battle Tower is one; the other regions get their
// own, starting with Sinnoh's Underground mining. Each minigame keeps its
// interactive state in its modal and dispatches a single collect action.
import { consumableItems, evolutionItems } from '../data/items.js'
import { pokemonSpecies } from '../data/gameData.js'

/** Region -> minigame id. Hoenn's tower is handled separately. */
/** @type {Record<string, string>} */
export const MINIGAME_BY_REGION = {
  johto: 'bugContest',
  sinnoh: 'mining',
}

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
export const MINING_REWARD_TABLE = [
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

/** Money spent to enter the contest. */
export const BUG_CONTEST_COST = 800

/** How many times you may pass on a bug before you must keep one. */
export const BUG_CONTEST_SEARCHES = 5

/**
 * Contest bugs, with a weight (how often it turns up) and a score (how good it
 * is). Weaker bugs are common, the big ones are rare.
 * @type {{ speciesKey: string, weight: number }[]}
 */
export const BUG_CONTEST_POOL = [
  { speciesKey: 'caterpie', weight: 22 },
  { speciesKey: 'weedle', weight: 22 },
  { speciesKey: 'ledyba', weight: 16 },
  { speciesKey: 'spinarak', weight: 16 },
  { speciesKey: 'paras', weight: 12 },
  { speciesKey: 'venonat', weight: 10 },
  { speciesKey: 'pineco', weight: 9 },
  { speciesKey: 'yanma', weight: 6 },
  { speciesKey: 'ariados', weight: 5 },
  { speciesKey: 'forretress', weight: 4 },
  { speciesKey: 'scyther', weight: 2 },
  { speciesKey: 'pinsir', weight: 2 },
  { speciesKey: 'heracross', weight: 2 },
]

const BUG_TOTAL_WEIGHT = BUG_CONTEST_POOL.reduce((sum, entry) => sum + entry.weight, 0)

/** Total base stats for a species (its contest score). @param {string} speciesKey */
export function contestScore(speciesKey) {
  const species = pokemonSpecies[speciesKey]
  return species
    ? Object.values(species.baseStats).reduce((sum, value) => sum + value, 0)
    : 0
}

/**
 * Roll the next bug to appear.
 * @returns {{ speciesKey: string, score: number }}
 */
export function rollContestBug() {
  let roll = Math.random() * BUG_TOTAL_WEIGHT
  for (const entry of BUG_CONTEST_POOL) {
    roll -= entry.weight
    if (roll <= 0) return { speciesKey: entry.speciesKey, score: contestScore(entry.speciesKey) }
  }
  const fallback = BUG_CONTEST_POOL[0]
  return { speciesKey: fallback.speciesKey, score: contestScore(fallback.speciesKey) }
}

/**
 * Prize for a caught bug's score.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function bugContestPrize(score) {
  if (score >= 480) return { money: 4000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'First place' }
  if (score >= 400)
    return { money: 2000, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Second place' }
  if (score >= 300)
    return { money: 1000, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Third place' }
  return { money: 400, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Participant' }
}

/** Region -> minigame section metadata for the Gyms panel. */
/** @type {Record<string, { title: string, cost: number, action: string, hint: string }>} */
export const MINIGAME_INFO = {
  mining: {
    title: 'Sinnoh Underground',
    cost: MINING_COST,
    action: 'GO MINING',
    hint: `Dig for evolution stones, treasures and candies. Each run costs $${MINING_COST.toLocaleString()} and gives ${MINING_DIGS} digs.`,
  },
  bugContest: {
    title: 'Bug Catching Contest',
    cost: BUG_CONTEST_COST,
    action: 'ENTER CONTEST',
    hint: `Search the park for bugs \u2014 rarer ones score higher. Entry is $${BUG_CONTEST_COST.toLocaleString()}, and you get ${BUG_CONTEST_SEARCHES} chances to look before you must keep one.`,
  },
}

