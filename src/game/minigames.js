// Region minigames. Hoenn's Battle Tower is one; the other regions get their
// own, starting with Sinnoh's Underground mining. Each minigame keeps its
// interactive state in its scene and returns to idle when it finishes.
import { consumableItems, evolutionItems } from '../data/items.js'
import { breedingData, pokemonSpecies } from '../data/gameData.js'
import { calculateCatchChance } from './catching.js'

/** Region -> minigame id. Hoenn's tower is handled separately. */
/** @type {Record<string, string>} */
export const MINIGAME_BY_REGION = {
  kanto: 'gameCorner',
  johto: 'bugContest',
  sinnoh: 'mining',
}

/**
 * Region -> the location that must be unlocked before that region's minigame
 * becomes available (Hoenn's Battle Tower included).
 * @type {Record<string, string>}
 */
export const MINIGAME_UNLOCK_LOCATION = {
  kanto: 'celadonCity',
  johto: 'johto-route-35',
  hoenn: 'hoenn-route-111',
  sinnoh: 'sinnoh-eterna-city',
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

/** Bushes offered each rustle; the player picks one to scare out a bug. */
export const BUG_CONTEST_BUSHES = 3

/** How many rustles (bush reveals) the player gets per run. */
export const BUG_CONTEST_RUSTLES = 5

/** The ball supplied for free, in unlimited quantity, during the contest. */
export const BUG_CONTEST_BALL = 'netball'

/** How far a bug's level may stray from the player's active Pokemon. */
const CONTEST_LEVEL_SPREAD = 3

/**
 * Every Bug-type is eligible for the contest \u2014 legendaries included. Common
 * bugs (high catch rate) turn up more often; the hard-to-catch headline acts
 * are rare.
 * @type {{ speciesKey: string, weight: number }[]}
 */
export const BUG_CONTEST_POOL = Object.entries(pokemonSpecies)
  .filter(([, entry]) => entry.id > 0 && entry.id <= 1025 && (entry.types ?? []).includes('Bug'))
  .map(([speciesKey, entry]) => ({
    speciesKey,
    // 255 catch rate -> 43; 45 -> 8.
    weight: Math.max(1, Math.round((entry.catchRate ?? 255) / 6)),
  }))

const BUG_TOTAL_WEIGHT = BUG_CONTEST_POOL.reduce((sum, entry) => sum + entry.weight, 0)

/**
 * A bug's contest score: its total base stats.
 * @param {string} speciesKey
 * @returns {number}
 */
export function contestScore(speciesKey) {
  const species = pokemonSpecies[speciesKey]
  return species
    ? Object.values(species.baseStats ?? {}).reduce((sum, value) => sum + value, 0)
    : 0
}

/**
 * How likely a bug is to flee after a failed throw. Rarer bugs (lower catch
 * rate) are more skittish; the common ones almost always stay put.
 * @param {string} speciesKey
 * @returns {number} A 0-1 chance.
 */
export function bugFleeChance(speciesKey) {
  const catchRate = pokemonSpecies[speciesKey]?.catchRate ?? 255
  return Math.max(0.03, Math.min(0.5, ((255 - catchRate) / 255) * 0.55))
}

/**
 * Roll a bug's gender from its species' gender rate. Species with no breeding
 * data (or a -1 rate) are genderless.
 * @param {string} speciesKey
 * @returns {'male' | 'female' | 'genderless'}
 */
export function rollContestGender(speciesKey) {
  const data = breedingData[speciesKey]
  if (!data || data.genderRate === -1) return 'genderless'
  if (data.genderRate === 0) return 'male'
  if (data.genderRate === 8) return 'female'
  return Math.random() < data.genderRate / 8 ? 'female' : 'male'
}

/**
 * Roll the bug hiding in a rustled bush.
 * @param {number} [baseLevel] The player's active Pokemon level; the bug stays
 *   within {@link CONTEST_LEVEL_SPREAD} levels of it.
 * @returns {{ speciesKey: string, level: number, gender: 'male' | 'female' | 'genderless', fleeChance: number }}
 */
export function rollContestBug(baseLevel = 20) {
  let roll = Math.random() * BUG_TOTAL_WEIGHT,
    chosen = BUG_CONTEST_POOL[BUG_CONTEST_POOL.length - 1]
  for (const entry of BUG_CONTEST_POOL) {
    roll -= entry.weight
    if (roll <= 0) {
      chosen = entry
      break
    }
  }
  const level = Math.max(
    5,
    Math.min(75, Math.round(baseLevel + (Math.random() * 2 - 1) * CONTEST_LEVEL_SPREAD))
  )
  return {
    speciesKey: chosen.speciesKey,
    level,
    gender: rollContestGender(chosen.speciesKey),
    fleeChance: bugFleeChance(chosen.speciesKey),
  }
}

/**
 * Chance a free contest Net Ball catches a bug.
 * @param {string} speciesKey
 * @returns {number}
 */
export function bugCatchChance(speciesKey) {
  return calculateCatchChance(speciesKey, BUG_CONTEST_BALL, {
    types: pokemonSpecies[speciesKey]?.types ?? [],
  })
}

/**
 * Throw a Net Ball at a contest bug.
 * @param {string} speciesKey
 * @returns {boolean} Whether the bug was caught.
 */
export function throwNetBall(speciesKey) {
  return Math.random() < bugCatchChance(speciesKey)
}

/**
 * Whether a bug stays put after a failed throw (otherwise it flees).
 * @param {string} speciesKey
 * @returns {boolean}
 */
export function bugStays(speciesKey) {
  return Math.random() >= bugFleeChance(speciesKey)
}

/** Fake rival names for the results board. */
const BUG_CONTEST_RIVALS = [
  'Bug Catcher Doug',
  'Youngster Joey',
  'Camper Barry',
  'Picnicker Liz',
  'Fisherman Ralph',
  'Ace Trainer Kelsey',
]

/**
 * Roll the fake rivals' submitted catches. Each brings one to three bugs from
 * the same pool the player sees.
 * @param {number} [baseLevel]
 * @param {number} [count]
 * @returns {{ name: string, bugs: ReturnType<typeof rollContestBug>[] }[]}
 */
export function rollContestRivals(baseLevel = 20, count = 3) {
  const names = [...BUG_CONTEST_RIVALS].sort(() => Math.random() - 0.5).slice(0, count)
  return names.map((name) => ({
    name,
    bugs: Array.from(
      { length: 1 + Math.floor(Math.random() * 3) },
      () => rollContestBug(baseLevel)
    ),
  }))
}

/**
 * The highest-scoring bug in a list, or null when the list is empty.
 * @param {ReturnType<typeof rollContestBug>[]} bugs
 * @returns {ReturnType<typeof rollContestBug> | null}
 */
function contestBest(bugs) {
  let best = null
  for (const bug of bugs)
    if (!best || contestScore(bug.speciesKey) > contestScore(best.speciesKey)) best = bug
  return best
}

/**
 * Build the ranked results board: every bug the player caught, plus each fake
 * rival's single best find, strongest first (ties broken by level).
 * @param {ReturnType<typeof rollContestBug>[]} playerBugs
 * @param {number} [baseLevel]
 * @param {number} [rivalCount]
 * @returns {{ owner: string, isPlayer: boolean, speciesKey: string, level: number, gender: 'male' | 'female' | 'genderless', score: number }[]}
 */
export function buildContestResults(playerBugs, baseLevel = 20, rivalCount = 3) {
  const board = playerBugs.map((bug) => ({
    ...bug,
    owner: 'You',
    isPlayer: true,
    score: contestScore(bug.speciesKey),
  }))
  for (const rival of rollContestRivals(baseLevel, rivalCount)) {
    const best = contestBest(rival.bugs)
    if (best)
      board.push({
        ...best,
        owner: rival.name,
        isPlayer: false,
        score: contestScore(best.speciesKey),
      })
  }
  return board.sort((a, b) => b.score - a.score || b.level - a.level)
}

/**
 * The player's best finishing rank on the results board (1-based), or null if
 * none of their catches placed.
 * @param {{ isPlayer: boolean }[]} results
 * @returns {number | null}
 */
export function contestPlayerRank(results) {
  const index = results.findIndex((entry) => entry.isPlayer)
  return index >= 0 ? index + 1 : null
}

/**
 * Prize for the player's finishing rank (1-3), or the participant consolation
 * when they did not place. Matches the podium in the results scene.
 * @param {number | null} rank
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function bugContestPrize(rank) {
  if (rank === 1)
    return { money: 4000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'First place' }
  if (rank === 2)
    return { money: 2000, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Second place' }
  if (rank === 3)
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
    hint: `Rustle the park bushes to scare out a bug, then throw a free Net Ball or let it go. You get ${BUG_CONTEST_RUSTLES} rustles \u2014 keep whatever you catch, but the rarer bugs may flee. Placing in the top three wins a cash and candy prize. Entry is $${BUG_CONTEST_COST.toLocaleString()}.`,
  },
  gameCorner: {
    title: 'Game Corner',
    cost: 0,
    action: 'ENTER GAME CORNER',
    hint: 'Try the slots \u2014 $200 a spin. Match all three reels for a payout (the Star top prize is 1,500x).',
  },
}

// --- Kanto Game Corner slots ----------------------------------------------

/** Money spent per slot spin. */
export const SLOT_SPIN_COST = 200

/**
 * Slot symbols, their relative weight and the multiplier they pay on three of
 * a kind. The payouts are tuned to a ~92% return.
 * @type {{ id: string, name: string, icon: string, weight: number, payout: number }[]}
 */
export const SLOT_SYMBOLS = [
  { id: 'cherry', name: 'Cherry', icon: '\ud83c\udf52', weight: 40, payout: 6 },
  { id: 'bell', name: 'Bell', icon: '\ud83d\udd14', weight: 24, payout: 12 },
  { id: 'bar', name: 'Bar', icon: '\ud83c\uddff', weight: 18, payout: 30 },
  { id: 'seven', name: 'Seven', icon: '7', weight: 10, payout: 100 },
  { id: 'diamond', name: 'Diamond', icon: '\ud83d\udc8e', weight: 6, payout: 400 },
  { id: 'star', name: 'Star', icon: '\u2b50', weight: 2, payout: 1500 },
]

const SLOT_TOTAL_WEIGHT = SLOT_SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0)

/** The top slot multiplier. */
export const SLOT_JACKPOT = Math.max(...SLOT_SYMBOLS.map((symbol) => symbol.payout))

/** @returns {typeof SLOT_SYMBOLS[number]} */
function rollSymbol() {
  let roll = Math.random() * SLOT_TOTAL_WEIGHT
  for (const symbol of SLOT_SYMBOLS) {
    roll -= symbol.weight
    if (roll <= 0) return symbol
  }
  return SLOT_SYMBOLS[0]
}

/**
 * Spin the reels.
 * @returns {{ reels: typeof SLOT_SYMBOLS, payout: number, jackpot: boolean }}
 */
export function spinSlots() {
  const reels = [rollSymbol(), rollSymbol(), rollSymbol()],
    match = reels.every((symbol) => symbol.id === reels[0].id),
    jackpot = match && reels[0].id === 'star'
  return {
    reels,
    payout: match ? reels[0].payout * SLOT_SPIN_COST : 0,
    jackpot,
  }
}

