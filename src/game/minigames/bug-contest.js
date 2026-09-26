// Johto Bug Catching Contest. Split from game/minigames.js.

import { breedingData, pokemonSpecies } from '../../data/gameData.js'
import { doubleSpawnChance } from '../../data/config.js'
import { calculateCatchChance } from '../catching.js'
import { monotypeSpeciesPool } from '../pokemon.js'

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
function rollContestGender(speciesKey) {
  const data = breedingData[speciesKey]
  if (!data || data.genderRate === -1) return 'genderless'
  if (data.genderRate === 0) return 'male'
  if (data.genderRate === 8) return 'female'
  return Math.random() < data.genderRate / 8 ? 'female' : 'male'
}

/**
 * Roll the bug hiding in a rustled bush. Under a Monotype run the contest
 * yields a Pokemon of the chosen type instead.
 * @param {number} [baseLevel] The player's active Pokemon level; the bug stays
 *   within {@link CONTEST_LEVEL_SPREAD} levels of it.
 * @param {string | null} [monotype]
 * @returns {{ speciesKey: string, level: number, gender: 'male' | 'female' | 'genderless', fleeChance: number }}
 */
export function rollContestBug(baseLevel = 20, monotype = null) {
  const monotypePool = monotype ? monotypeSpeciesPool(monotype) : []
  let chosen
  if (monotypePool.length > 0)
    chosen = { speciesKey: monotypePool[Math.floor(Math.random() * monotypePool.length)] }
  else {
    let roll = Math.random() * BUG_TOTAL_WEIGHT
    chosen = BUG_CONTEST_POOL[BUG_CONTEST_POOL.length - 1]
    for (const entry of BUG_CONTEST_POOL) {
      roll -= entry.weight
      if (roll <= 0) {
        chosen = entry
        break
      }
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
 * Rustle a contest bush: usually one bug, but sometimes a second bursts out
 * too. You can only keep one, so the other flees.
 * @param {number} [baseLevel]
 * @param {string | null} [monotype]
 * @returns {ReturnType<typeof rollContestBug>[]}
 */
export function rollContestBugs(baseLevel = 20, monotype = null) {
  const first = rollContestBug(baseLevel, monotype)
  if (Math.random() >= doubleSpawnChance) return [first]
  let second = rollContestBug(baseLevel, monotype)
  // Prefer a different species so the choice actually matters.
  for (let attempt = 0; attempt < 3 && second.speciesKey === first.speciesKey; attempt++)
    second = rollContestBug(baseLevel, monotype)
  return [first, second]
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
function rollContestRivals(baseLevel = 20, count = 3) {
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
 * Build the ranked results board: the player's single best catch, plus each
 * fake rival's single best find, strongest first (ties broken by level). Every
 * bug the player caught is kept, but only their best one is judged so a run
 * cannot take more than one of the top three places.
 * @param {ReturnType<typeof rollContestBug>[]} playerBugs
 * @param {number} [baseLevel]
 * @param {number} [rivalCount]
 * @returns {{ owner: string, isPlayer: boolean, speciesKey: string, level: number, gender: 'male' | 'female' | 'genderless', score: number }[]}
 */
export function buildContestResults(playerBugs, baseLevel = 20, rivalCount = 3) {
  const playerBest = contestBest(playerBugs),
    board = playerBest
      ? [
          {
            ...playerBest,
            owner: 'You',
            isPlayer: true,
            score: contestScore(playerBest.speciesKey),
          },
        ]
      : []
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
