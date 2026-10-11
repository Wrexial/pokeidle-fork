import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  RESEARCH_MAX_POINTS,
  RESEARCH_SHOP,
  applyResearchEarnings,
  creditResearchDefeat,
  speciesResearch,
} = await import('../src/game/research.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')

test('a fresh species has no research', () => {
  const research = speciesResearch(initialGameState, 'pikachu')
  assert.equal(research.earned, 0)
  assert.equal(research.max, RESEARCH_MAX_POINTS)
  assert.equal(research.level, 0)
  assert.ok(!research.complete)
  assert.ok(research.tasks.every((task) => !task.done && task.progress === 0))
})

test('catching and defeating credit the matching tasks once', () => {
  const caught = { ...initialGameState, pokedexCaught: ['pikachu'] },
    credited = applyResearchEarnings(caught, 'pikachu')
  assert.equal(credited.researchPoints, 1, 'catching is worth its points')
  assert.equal(
    applyResearchEarnings(credited, 'pikachu'),
    credited,
    'earnings are credited only once'
  )

  const three = applyResearchEarnings(
    { ...credited, researchDefeated: { pikachu: 3 } },
    'pikachu'
  )
  assert.equal(three.researchPoints, 1 + 2, 'defeat 3 adds its points on top')
})

test('creditResearchDefeat counts defeats and unlocks tiers', () => {
  let state = {
    ...initialGameState,
    pokedexCaught: ['pikachu'],
    researchClaimed: { pikachu: 1 },
    researchPoints: 1,
  }
  state = creditResearchDefeat(state, 'pikachu')
  assert.equal(state.researchDefeated.pikachu, 1)
  assert.equal(state.researchPoints, 1, 'no new points before the first defeat tier')
  state = creditResearchDefeat(state, 'pikachu')
  state = creditResearchDefeat(state, 'pikachu')
  assert.equal(state.researchDefeated.pikachu, 3)
  assert.equal(state.researchPoints, 1 + 2, 'defeat 3 is credited at the threshold')

  // Unknown species are ignored, and never create counters.
  assert.equal(creditResearchDefeat(state, 'nope'), state)
  assert.equal(creditResearchDefeat(state, undefined), state)
})

test('a shiny catch completes the shiny task', () => {
  const research = speciesResearch(
    { ...initialGameState, pokedexCaught: ['pikachu'], shinyCaught: ['pikachu'] },
    'pikachu'
  )
  assert.ok(research.tasks.find((task) => task.id === 'shiny').done)
  assert.equal(research.earned, 1 + 5)
})

test('a fully researched species reaches level 10', () => {
  const research = speciesResearch(
    {
      ...initialGameState,
      pokedexCaught: ['pikachu'],
      shinyCaught: ['pikachu'],
      researchDefeated: { pikachu: 25 },
    },
    'pikachu'
  )
  assert.equal(research.earned, RESEARCH_MAX_POINTS)
  assert.equal(research.level, 10)
  assert.ok(research.complete)
})

test('the Research Shop spends points and refuses when short', () => {
  const item = RESEARCH_SHOP[0],
    base = { ...initialGameState, researchPoints: item.cost },
    bought = gameReducer(base, {
      type: 'BUY_RESEARCH_ITEM',
      payload: { itemId: item.itemId },
    })
  assert.equal(bought.researchPoints, 0)
  assert.equal(bought.inventory[item.itemId], 1)

  const broke = gameReducer(
    { ...initialGameState, researchPoints: 0 },
    { type: 'BUY_RESEARCH_ITEM', payload: { itemId: item.itemId } }
  )
  assert.equal(broke.researchPoints, 0)
  assert.ok(!broke.inventory[item.itemId], 'nothing is granted without the points')

  const bogus = gameReducer(base, { type: 'BUY_RESEARCH_ITEM', payload: { itemId: 'nope' } })
  assert.equal(bogus.researchPoints, item.cost)
})

test('save repair sanitises research counters', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    state = {
      ...base,
      researchDefeated: { bulbasaur: 5, notAPokemon: 99, negative: -1 },
      researchClaimed: { bulbasaur: 999 },
      researchPoints: 12.7,
    },
    repaired = repairSave(serializeSave(state))
  assert.equal(repaired.researchDefeated.bulbasaur, 5)
  assert.ok(!('notAPokemon' in repaired.researchDefeated), 'an unknown species is dropped')
  assert.ok(!('negative' in repaired.researchDefeated), 'a bad count is dropped')
  assert.equal(repaired.researchClaimed.bulbasaur, RESEARCH_MAX_POINTS, 'claimed is clamped')
  assert.equal(repaired.researchPoints, 12, 'points are floored')
})
