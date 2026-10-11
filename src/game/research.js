// Field research: per-species tasks that earn Research Points (RP), which spend
// in the Research Shop. Progress is derived from counters the game already
// keeps (pokedexCaught, shinyCaught) plus a per-species wild-defeat count, so
// no per-species task state has to be authored.

import { pokemonSpecies } from '../data/gameData.js'

/**
 * The research tasks every species shares. `kind: 'defeat'` reads the species'
 * wild-defeat counter; the others read the Pokedex.
 * @type {{ id: string, kind?: 'defeat', label: string, need: number, points: number }[]}
 */
export const RESEARCH_TASKS = [
  { id: 'catch', label: 'Catch 1', need: 1, points: 1 },
  { id: 'defeat3', kind: 'defeat', label: 'Defeat 3 in the wild', need: 3, points: 2 },
  { id: 'defeat10', kind: 'defeat', label: 'Defeat 10 in the wild', need: 10, points: 3 },
  { id: 'defeat25', kind: 'defeat', label: 'Defeat 25 in the wild', need: 25, points: 5 },
  { id: 'shiny', label: 'Catch its shiny', need: 1, points: 5 },
]

/** Total points a single species can yield. */
export const RESEARCH_MAX_POINTS = RESEARCH_TASKS.reduce((sum, task) => sum + task.points, 0)

/** Research level 10 is a fully completed species. */
export const RESEARCH_MAX_LEVEL = 10

/**
 * @typedef {Object} SpeciesResearch
 * @property {{ id: string, label: string, need: number, points: number, progress: number, done: boolean }[]} tasks
 * @property {number} earned
 * @property {number} max
 * @property {number} level
 * @property {boolean} complete
 */

/**
 * One species' research tasks, progress, earned points and level.
 * @param {GameState} state
 * @param {string} speciesKey
 * @returns {SpeciesResearch}
 */
export function speciesResearch(state, speciesKey) {
  const caught = (state.pokedexCaught ?? []).includes(speciesKey),
    shiny = (state.shinyCaught ?? []).includes(speciesKey),
    defeated = state.researchDefeated?.[speciesKey] ?? 0
  const tasks = RESEARCH_TASKS.map((task) => {
    const raw =
      task.kind === 'defeat'
        ? defeated
        : task.id === 'catch'
          ? caught
            ? 1
            : 0
          : task.id === 'shiny'
            ? shiny
              ? 1
              : 0
            : 0
    return {
      id: task.id,
      label: task.label,
      need: task.need,
      points: task.points,
      progress: Math.min(raw, task.need),
      done: raw >= task.need,
    }
  })
  const earned = tasks.reduce((sum, task) => sum + (task.done ? task.points : 0), 0)
  return {
    tasks,
    earned,
    max: RESEARCH_MAX_POINTS,
    level: Math.min(
      RESEARCH_MAX_LEVEL,
      Math.round((earned / RESEARCH_MAX_POINTS) * RESEARCH_MAX_LEVEL)
    ),
    complete: earned >= RESEARCH_MAX_POINTS,
  }
}

/**
 * Credit any newly completed research for a species into the spendable balance.
 * Pure; returns the same reference when nothing new was earned.
 * @param {GameState} state
 * @param {string} speciesKey
 * @returns {GameState}
 */
export function applyResearchEarnings(state, speciesKey) {
  if (!speciesKey || !pokemonSpecies[speciesKey]) return state
  const earned = speciesResearch(state, speciesKey).earned,
    claimed = state.researchClaimed?.[speciesKey] ?? 0
  if (earned <= claimed) return state
  return {
    ...state,
    researchPoints: (state.researchPoints ?? 0) + (earned - claimed),
    researchClaimed: { ...(state.researchClaimed ?? {}), [speciesKey]: earned },
  }
}

/**
 * Count a wild defeat of `speciesKey` and credit any research it unlocks.
 * @param {GameState} state
 * @param {string | undefined | null} speciesKey
 * @returns {GameState}
 */
export function creditResearchDefeat(state, speciesKey) {
  if (!speciesKey || !pokemonSpecies[speciesKey]) return state
  const researchDefeated = { ...(state.researchDefeated ?? {}) }
  researchDefeated[speciesKey] = (researchDefeated[speciesKey] ?? 0) + 1
  return applyResearchEarnings({ ...state, researchDefeated }, speciesKey)
}

/**
 * What the Research Shop sells, and for how many Research Points.
 * @type {{ itemId: string, cost: number }[]}
 */
export const RESEARCH_SHOP = [
  { itemId: 'expCandyL', cost: 4 },
  { itemId: 'rareCandy', cost: 8 },
  { itemId: 'fireStone', cost: 6 },
  { itemId: 'waterStone', cost: 6 },
  { itemId: 'thunderStone', cost: 6 },
  { itemId: 'leafStone', cost: 6 },
  { itemId: 'moonStone', cost: 10 },
  { itemId: 'sunStone', cost: 10 },
  { itemId: 'shinyStone', cost: 10 },
  { itemId: 'duskStone', cost: 10 },
  { itemId: 'dawnStone', cost: 10 },
  { itemId: 'iceStone', cost: 10 },
  { itemId: 'bottleCap', cost: 15 },
  { itemId: 'goldBottleCap', cost: 30 },
  { itemId: 'masterball', cost: 100 },
]

/**
 * How many species have finished their research, for a progress line.
 * @param {GameState} state
 * @returns {{ completed: number, total: number }}
 */
export function researchCompletion(state) {
  let completed = 0
  for (const speciesKey of state.pokedexCaught ?? [])
    if (speciesResearch(state, speciesKey).complete) completed += 1
  return { completed, total: (state.pokedexCaught ?? []).length }
}
