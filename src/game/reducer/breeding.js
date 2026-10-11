// Breeding project queue handlers (see game/breeding-projects.js). The tracker
// counters themselves are advanced when an egg hatches (reducer/battle/events.js).

import {
  MAX_BREEDING_PROJECTS,
  createBreedingProject,
  createBreedingTracker,
} from '../breeding-projects.js'

/**
 * Handle the `ADD_BREEDING_PROJECT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function addBreedingProject(state, action) {
  const breeding = state.breeding ?? createBreedingTracker(),
    projects = breeding.projects ?? []
  if (projects.length >= MAX_BREEDING_PROJECTS) return state
  const project = createBreedingProject(
    action.payload?.speciesKey,
    action.payload?.goal,
    action.payload?.nature
  )
  if (!project) return state
  return { ...state, breeding: { ...breeding, projects: [...projects, project] } }
}

/**
 * Handle the `REMOVE_BREEDING_PROJECT` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function removeBreedingProject(state, action) {
  const breeding = state.breeding ?? createBreedingTracker(),
    projectId = action.payload?.projectId,
    projects = breeding.projects ?? []
  if (!projectId || !projects.some((project) => project.id === projectId)) return state
  return {
    ...state,
    breeding: { ...breeding, projects: projects.filter((project) => project.id !== projectId) },
  }
}
