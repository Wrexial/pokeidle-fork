// Field research: per-species tasks that earn Research Points (RP), which spend
// in the Research Shop. A species' task list depends on whether it can be found
// in the wild: wild species share a defeat ladder, and the rest observe the
// species (obtain, feed, use its moves). Progress is derived from the Pokedex
// plus a few per-species counters.

import { encounterData, pokemonSpecies } from '../data/gameData.js'
import { sizeRating } from './pokemon/sizes.js'

/**
 * Research tasks for a species that actually spawns on a wild route (or a raid
 * pool), so the wild-defeat ladder is reachable. `kind` picks the counter the
 * task reads (`defeat` = its wild-defeat count, `catch` / `shiny` = Pokedex).
 * @type {{ id: string, kind: 'catch' | 'defeat' | 'shiny' | 'large', label: string, need: number, points: number }[]}
 */
export const RESEARCH_TASKS_WILD = [
  { id: 'catch', kind: 'catch', label: 'Catch 1', need: 1, points: 1 },
  { id: 'defeat3', kind: 'defeat', label: 'Defeat 3 in the wild', need: 3, points: 2 },
  { id: 'defeat10', kind: 'defeat', label: 'Defeat 10 in the wild', need: 10, points: 3 },
  { id: 'defeat25', kind: 'defeat', label: 'Defeat 25 in the wild', need: 25, points: 5 },
  { id: 'shiny', kind: 'shiny', label: 'Catch its shiny', need: 1, points: 5 },
  { id: 'large', kind: 'large', label: 'Catch a large specimen', need: 1, points: 2 },
]

/**
 * Research tasks for a species that can never be found on a wild route (evolved
 * forms, starters, fossils, gifts/statics, Game Corner prizes, breeding-only
 * babies, ...). The wild-defeat ladder would be impossible, so it observes the
 * species instead (feed it a berry, use its moves), Legends: Arceus style. The
 * point total matches the wild set so research levels stay comparable.
 * @type {{ id: string, kind: 'catch' | 'fed' | 'moves' | 'shiny' | 'large', label: string, need: number, points: number }[]}
 */
export const RESEARCH_TASKS_NON_WILD = [
  { id: 'catch', kind: 'catch', label: 'Obtain 1', need: 1, points: 1 },
  { id: 'fed', kind: 'fed', label: 'Feed it a berry', need: 1, points: 2 },
  { id: 'moves10', kind: 'moves', label: 'Use 10 of its moves', need: 10, points: 3 },
  { id: 'moves25', kind: 'moves', label: 'Use 25 of its moves', need: 25, points: 5 },
  { id: 'shiny', kind: 'shiny', label: 'Catch its shiny', need: 1, points: 5 },
  { id: 'large', kind: 'large', label: 'Obtain a large specimen', need: 1, points: 2 },
]

/**
 * Whether a Pokemon counts as a "large specimen" for the research task: an XL
 * individual (top of the size bell, see pokemon/sizes.js).
 * @param {{ size?: number } | null | undefined} pokemon
 * @returns {boolean}
 */
export function isLargeSpecimen(pokemon) {
  return sizeRating(pokemon?.size) === 'XL'
}

/** Total points a single species can yield (both task sets add up to this). */
export const RESEARCH_MAX_POINTS = RESEARCH_TASKS_WILD.reduce((sum, task) => sum + task.points, 0)

/** Cached set of every species that appears in a wild route or raid pool. @type {Set<string> | null} */
let wildSpeciesSet = null

/**
 * Whether `speciesKey` can be found (and so defeated) in the wild: any route
 * encounter bucket or raid pool. Non-wild species get the alternative task set.
 * @param {string} speciesKey
 * @returns {boolean}
 */
export function isWildSpecies(speciesKey) {
  if (!wildSpeciesSet) {
    wildSpeciesSet = new Set()
    for (const bucket of Object.values(encounterData ?? {}))
      for (const encounter of bucket?.encounters ?? []) wildSpeciesSet.add(encounter.speciesKey)
  }
  return wildSpeciesSet.has(speciesKey)
}

/**
 * The research task list for a species: the wild-defeat ladder when it spawns
 * somewhere, otherwise the observation set (obtain / feed / use moves).
 * @param {string} speciesKey
 * @returns {typeof RESEARCH_TASKS_WILD | typeof RESEARCH_TASKS_NON_WILD}
 */
export function researchTasksFor(speciesKey) {
  return isWildSpecies(speciesKey) ? RESEARCH_TASKS_WILD : RESEARCH_TASKS_NON_WILD
}

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
    defeated = state.researchDefeated?.[speciesKey] ?? 0,
    fed = state.researchFed?.[speciesKey] ?? 0,
    moves = state.researchMoves?.[speciesKey] ?? 0,
    large = state.researchLarge?.[speciesKey] ?? 0
  const tasks = researchTasksFor(speciesKey).map((task) => {
    const raw =
      task.kind === 'defeat'
        ? defeated
        : task.kind === 'fed'
          ? fed
          : task.kind === 'moves'
            ? moves
            : task.kind === 'catch'
              ? caught
                ? 1
                : 0
              : task.kind === 'shiny'
                ? shiny
                  ? 1
                  : 0
                : task.kind === 'large'
                  ? large
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
  const max = tasks.reduce((sum, task) => sum + task.points, 0),
    earned = tasks.reduce((sum, task) => sum + (task.done ? task.points : 0), 0)
  return {
    tasks,
    earned,
    max,
    level: Math.min(RESEARCH_MAX_LEVEL, Math.round((earned / max) * RESEARCH_MAX_LEVEL)),
    complete: earned >= max,
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
 * Count a berry fed to `speciesKey`, for species with no wild route to study.
 * @param {GameState} state
 * @param {string | undefined | null} speciesKey
 * @returns {GameState}
 */
export function creditResearchFeed(state, speciesKey) {
  // Only a species with no wild route reads this counter.
  if (!speciesKey || !pokemonSpecies[speciesKey] || isWildSpecies(speciesKey)) return state
  const researchFed = { ...(state.researchFed ?? {}) }
  researchFed[speciesKey] = (researchFed[speciesKey] ?? 0) + 1
  return applyResearchEarnings({ ...state, researchFed }, speciesKey)
}

/**
 * Count a large specimen of `speciesKey` obtained, for the "large specimen"
 * task. Applies to any species (wild or not), since a big catch/gift/hatch is
 * equally notable.
 * @param {GameState} state
 * @param {string | undefined | null} speciesKey
 * @returns {GameState}
 */
export function creditResearchLarge(state, speciesKey) {
  if (!speciesKey || !pokemonSpecies[speciesKey]) return state
  const researchLarge = { ...(state.researchLarge ?? {}) }
  researchLarge[speciesKey] = (researchLarge[speciesKey] ?? 0) + 1
  return applyResearchEarnings({ ...state, researchLarge }, speciesKey)
}

/**
 * Count a move used by `speciesKey` in battle, for species with no wild route.
 * @param {GameState} state
 * @param {string | undefined | null} speciesKey
 * @returns {GameState}
 */
export function creditResearchMove(state, speciesKey) {
  // Only a species with no wild route reads this counter.
  if (!speciesKey || !pokemonSpecies[speciesKey] || isWildSpecies(speciesKey)) return state
  const researchMoves = { ...(state.researchMoves ?? {}) }
  researchMoves[speciesKey] = (researchMoves[speciesKey] ?? 0) + 1
  return applyResearchEarnings({ ...state, researchMoves }, speciesKey)
}

/**
 * What the Research Shop sells, and for how many Research Points. The stock is
 * deliberately research-flavoured — growing, feeding and polishing the Pokemon
 * you have studied — so it doesn't just restock the evolution stones the
 * Kecleon Shop already sells for Victory Tokens.
 * @type {{ itemId: string, cost: number }[]}
 */
export const RESEARCH_SHOP = [
  { itemId: 'expCandyS', cost: 1 },
  { itemId: 'expCandyM', cost: 3 },
  { itemId: 'expCandyL', cost: 6 },
  { itemId: 'expCandyXL', cost: 12 },
  { itemId: 'rareCandy', cost: 8 },
  { itemId: 'poffin', cost: 3 },
  { itemId: 'abilityCapsule', cost: 12 },
  { itemId: 'abilityPatch', cost: 20 },
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
