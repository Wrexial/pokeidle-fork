import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  MAX_BREEDING_PROJECTS,
  advanceBreeding,
  breedingGoalLabel,
  createBreedingProject,
  createBreedingTracker,
  hatchProjectMatches,
} = await import('../src/game/breeding-projects.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')

/** A hatched Pokemon of the given species with overrides. */
function hatch(speciesKey, overrides = {}) {
  return { ...createPokemon(speciesKey, 5, '1'), ...overrides }
}

test('a fresh tracker starts empty', () => {
  assert.deepEqual(createBreedingTracker(), {
    eggsHatched: 0,
    shinyEggsHatched: 0,
    eggsSinceShiny: 0,
    projects: [],
  })
})

test('createBreedingProject validates its goal', () => {
  const project = createBreedingProject('magikarp', 'shiny')
  assert.equal(project.speciesKey, 'magikarp')
  assert.equal(project.goal, 'shiny')
  assert.ok(project.id)
  // An unknown goal falls back to 'any'.
  assert.equal(createBreedingProject('magikarp', 'nonsense').goal, 'any')
  // A nature goal needs a nature.
  assert.equal(createBreedingProject('magikarp', 'nature'), null)
  assert.equal(createBreedingProject('magikarp', 'nature', 'jolly').nature, 'jolly')
  assert.equal(createBreedingProject('', 'any'), null)
  assert.equal(breedingGoalLabel({ goal: 'perfectIvs' }), 'perfect IVs')
})

test('hatchProjectMatches reads the hatch', () => {
  assert.ok(hatchProjectMatches({ speciesKey: 'magikarp', goal: 'any' }, hatch('magikarp')))
  assert.ok(!hatchProjectMatches({ speciesKey: 'magikarp', goal: 'any' }, hatch('gyarados')))
  assert.ok(
    hatchProjectMatches({ speciesKey: 'magikarp', goal: 'shiny' }, hatch('magikarp', { isShiny: true }))
  )
  assert.ok(
    !hatchProjectMatches({ speciesKey: 'magikarp', goal: 'shiny' }, hatch('magikarp', { isShiny: false }))
  )
  const perfect = {
    hp: 31,
    attack: 31,
    defense: 31,
    spAttack: 31,
    spDefense: 31,
    speed: 31,
  }
  assert.ok(
    hatchProjectMatches(
      { speciesKey: 'magikarp', goal: 'perfectIvs' },
      hatch('magikarp', { ivs: perfect })
    )
  )
  assert.ok(
    !hatchProjectMatches(
      { speciesKey: 'magikarp', goal: 'perfectIvs' },
      hatch('magikarp', { ivs: { ...perfect, speed: 30 } })
    )
  )
  assert.ok(
    hatchProjectMatches(
      { speciesKey: 'magikarp', goal: 'nature', nature: 'jolly' },
      hatch('magikarp', { nature: 'jolly' })
    )
  )
})

test('advanceBreeding counts hatches and completes the front project', () => {
  const tracker = createBreedingTracker(),
    shinyProject = createBreedingProject('magikarp', 'shiny'),
    next = { ...tracker, projects: [shinyProject, createBreedingProject('magikarp', 'any')] }
  // A plain hatch counts but doesn't complete the shiny project.
  const plain = advanceBreeding(next, hatch('magikarp'))
  assert.equal(plain.breeding.eggsHatched, 1)
  assert.equal(plain.breeding.eggsSinceShiny, 1)
  assert.equal(plain.breeding.projects.length, 2)
  assert.equal(plain.breeding.projects[0].hatches, 1, 'the egg counts toward the front project')
  assert.equal(plain.breeding.projects[1].hatches, 0, 'a queued project is untouched')
  assert.equal(plain.completed, null)
  // A shiny hatch completes the front project and resets the shiny counter.
  const shiny = advanceBreeding(plain.breeding, hatch('magikarp', { isShiny: true }))
  assert.equal(shiny.breeding.eggsHatched, 2)
  assert.equal(shiny.breeding.shinyEggsHatched, 1)
  assert.equal(shiny.breeding.eggsSinceShiny, 0)
  assert.equal(shiny.breeding.projects.length, 1, 'the finished project leaves the queue')
  assert.equal(shiny.breeding.projects[0].hatches, 0, 'the next project starts its own count')
  assert.equal(shiny.completed.id, shinyProject.id)
})

test('the reducer queues and removes projects', () => {
  const base = { ...initialGameState, breeding: createBreedingTracker(), phase: 'idle' },
    queued = gameReducer(base, {
      type: 'ADD_BREEDING_PROJECT',
      payload: { speciesKey: 'magikarp', goal: 'shiny' },
    })
  assert.equal(queued.breeding.projects.length, 1)
  const projectId = queued.breeding.projects[0].id,
    removed = gameReducer(queued, {
      type: 'REMOVE_BREEDING_PROJECT',
      payload: { projectId },
    })
  assert.equal(removed.breeding.projects.length, 0)
  // An invalid goal is a no-op.
  assert.equal(
    gameReducer(base, {
      type: 'ADD_BREEDING_PROJECT',
      payload: { speciesKey: '', goal: 'shiny' },
    }),
    base
  )
})

test('the project queue is capped', () => {
  let state = { ...initialGameState, breeding: createBreedingTracker(), phase: 'idle' }
  for (let index = 0; index < MAX_BREEDING_PROJECTS + 2; index++)
    state = gameReducer(state, {
      type: 'ADD_BREEDING_PROJECT',
      payload: { speciesKey: 'magikarp', goal: 'any' },
    })
  assert.equal(state.breeding.projects.length, MAX_BREEDING_PROJECTS)
})

test('repairSave sanitises the breeding tracker', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    repaired = repairSave(
      serializeSave({
        ...base,
        breeding: {
          eggsHatched: 12.9,
          shinyEggsHatched: -3,
          eggsSinceShiny: 'nope',
          projects: [
            { id: 'a', speciesKey: 'magikarp', goal: 'shiny' },
            { id: 'b', speciesKey: 'notAPokemon', goal: 'any' },
            { id: 'c', speciesKey: 'magikarp', goal: 'nonsense' },
            { id: 'd', speciesKey: 'magikarp', goal: 'nature', nature: 'jolly' },
          ],
        },
      })
    )
  assert.equal(repaired.breeding.eggsHatched, 12)
  assert.equal(repaired.breeding.shinyEggsHatched, 0)
  assert.equal(repaired.breeding.eggsSinceShiny, 0)
  assert.deepEqual(
    repaired.breeding.projects.map((project) => project.id),
    ['a', 'd'],
    'unknown species / goals drop, valid ones stay'
  )
  assert.equal(repaired.breeding.projects[1].nature, 'jolly')
  // A project's hatch counter is preserved (and defaults to 0).
  assert.equal(repaired.breeding.projects[0].hatches, 0)
  const withHatches = repairSave(
    serializeSave({
      ...base,
      breeding: {
        ...createBreedingTracker(),
        projects: [{ id: 'a', speciesKey: 'magikarp', goal: 'shiny', hatches: 7.9 }],
      },
    })
  )
  assert.equal(withHatches.breeding.projects[0].hatches, 7)
})
