// Breeding tracker and project queue. The tracker counts eggs hatched and
// shinies; the project queue is an ordered list of goals ("hatch a shiny
// Magikarp", "hatch one with perfect IVs", ...) that auto-complete as eggs
// hatch at the Day-Care.

import { natureName } from '../data/natures.js'
import { IV_STAT_ORDER } from './pokemon/stats.js'

/** How many breeding projects the queue can hold. */
export const MAX_BREEDING_PROJECTS = 6

/** The breeding goals a project can aim for. */
export const BREEDING_GOALS = [
  { value: 'any', label: 'Hatch one' },
  { value: 'shiny', label: 'Hatch a shiny' },
  { value: 'perfectIvs', label: 'Perfect IVs (31 each)' },
  { value: 'nature', label: 'A specific nature' },
]

/**
 * A fresh breeding tracker.
 * @returns {BreedingTracker}
 */
export function createBreedingTracker() {
  return { eggsHatched: 0, shinyEggsHatched: 0, eggsSinceShiny: 0, projects: [] }
}

/**
 * Build a project entry. `goal` is `any`, `shiny`, `perfectIvs` or `nature`
 * (which also carries the target `nature`).
 * @param {string} speciesKey
 * @param {string} goal
 * @param {string} [nature]
 * @returns {{ id: string, speciesKey: string, goal: string, nature?: string, hatches: number } | null}
 */
export function createBreedingProject(speciesKey, goal, nature) {
  if (!speciesKey) return null
  const validGoal = BREEDING_GOALS.some((entry) => entry.value === goal) ? goal : 'any'
  if (validGoal === 'nature' && !nature) return null
  return {
    id: `bp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    speciesKey,
    goal: validGoal,
    ...(validGoal === 'nature' ? { nature } : {}),
    // Eggs spent chasing this project.
    hatches: 0,
  }
}

/** A short human label for what a project is waiting for. @param {{ goal: string, nature?: string }} project */
export function breedingGoalLabel(project) {
  if (project.goal === 'shiny') return 'a shiny'
  if (project.goal === 'perfectIvs') return 'perfect IVs'
  if (project.goal === 'nature') return `${natureName(project.nature ?? '')} nature`
  return 'any hatch'
}

/**
 * Whether a hatch satisfies a project.
 * @param {{ speciesKey?: string, goal?: string, nature?: string } | null | undefined} project
 * @param {Pokemon} hatched
 * @returns {boolean}
 */
export function hatchProjectMatches(project, hatched) {
  if (!project || !hatched || project.speciesKey !== hatched.speciesKey) return false
  if (project.goal === 'shiny') return !!hatched.isShiny
  if (project.goal === 'perfectIvs')
    return IV_STAT_ORDER.every((stat) => (hatched.ivs?.[stat] ?? 0) >= 31)
  if (project.goal === 'nature') return hatched.nature === project.nature
  return true
}

/**
 * Advance the tracker for a hatched egg: bump the counters and complete the
 * front project if this hatch satisfies it. Pure; returns the next tracker and
 * the completed project (or null).
 * @param {BreedingTracker | undefined} breeding
 * @param {Pokemon} hatched
 * @returns {{ breeding: BreedingTracker, completed: BreedingProject | null }}
 */
export function advanceBreeding(breeding, hatched) {
  const current = breeding ?? createBreedingTracker(),
    projects = current.projects ?? [],
    completed = hatchProjectMatches(projects[0], hatched) ? projects[0] : null,
    // Count this egg toward the front project even when it does not complete
    // it, so a long shiny hunt shows how many eggs it has taken.
    counted =
      projects.length > 0
        ? [{ ...projects[0], hatches: (projects[0].hatches ?? 0) + 1 }, ...projects.slice(1)]
        : projects
  return {
    breeding: {
      eggsHatched: current.eggsHatched + 1,
      shinyEggsHatched: current.shinyEggsHatched + (hatched.isShiny ? 1 : 0),
      eggsSinceShiny: hatched.isShiny ? 0 : current.eggsSinceShiny + 1,
      projects: completed ? counted.slice(1) : counted,
    },
    completed,
  }
}
