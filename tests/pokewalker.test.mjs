import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { encounterData, pokemonSpecies } = await import('../src/data/gameData.js')
const { pokewalkerDailyCap, pokewalkerEggCost, pokewalkerEggSteps, pokewalkerItemCost, pokewalkerRevealCost, pokewalkerStepsPerHour } = await import('../src/data/config.js')
const {
  POKEWALKER_OPTIONS,
  accruePokewalker,
  createPokewalker,
  rarestRouteSpecies,
  stepsForElapsed,
} = await import('../src/game/pokewalker.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { createEgg } = await import('../src/game/pokemon.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')

const HOUR = 3_600_000
const started = gameReducer(initialGameState, {
  type: 'SELECT_STARTER',
  payload: { region: 'kanto', speciesKey: 'bulbasaur' },
})
const walkerAt = (steps) => ({ steps, dailySteps: 0, dailyDate: '', totalSteps: steps })

test('createPokewalker starts empty', () => {
  assert.deepEqual(createPokewalker(), {
    steps: 0,
    dailySteps: 0,
    dailyDate: '',
    totalSteps: 0,
  })
})

test('stepsForElapsed scales with the walk rate', () => {
  assert.equal(stepsForElapsed(0), 0)
  assert.equal(stepsForElapsed(HOUR), pokewalkerStepsPerHour)
  assert.equal(stepsForElapsed(-1000), 0)
})

test('accruePokewalker banks steps and resets the daily total at midnight', () => {
  const dayOne = new Date('2024-01-01T12:00:00')
  const first = accruePokewalker(createPokewalker(), 2 * HOUR, dayOne.getTime())
  assert.equal(first.gained, 2 * pokewalkerStepsPerHour)
  assert.equal(first.pokewalker.steps, 2 * pokewalkerStepsPerHour)
  assert.equal(first.pokewalker.dailyDate, '2024-01-01')
  // A second walk on the same day keeps stacking.
  const second = accruePokewalker(first.pokewalker, HOUR, dayOne.getTime())
  assert.equal(second.pokewalker.steps, 3 * pokewalkerStepsPerHour)
  assert.equal(second.pokewalker.dailySteps, 3 * pokewalkerStepsPerHour)
  // The next day starts the daily counter over.
  const nextDay = new Date('2024-01-02T12:00:00')
  const third = accruePokewalker(second.pokewalker, HOUR, nextDay.getTime())
  assert.equal(third.gained, pokewalkerStepsPerHour)
  assert.equal(third.pokewalker.dailyDate, '2024-01-02')
  assert.equal(third.pokewalker.dailySteps, pokewalkerStepsPerHour)
  assert.equal(third.pokewalker.steps, 4 * pokewalkerStepsPerHour)
})

test('accruePokewalker respects the daily cap', () => {
  const now = new Date('2024-01-01T12:00:00').getTime(),
    first = accruePokewalker(createPokewalker(), 100 * HOUR, now)
  assert.equal(first.gained, pokewalkerDailyCap)
  const second = accruePokewalker(first.pokewalker, HOUR, now)
  assert.equal(second.gained, 0)
  assert.equal(second.pokewalker.steps, pokewalkerDailyCap)
})

test('rarestRouteSpecies picks the least common ordinary wild', () => {
  const routeKey = Object.keys(encounterData).find(
      (key) => encounterData[key]?.encounters?.length
    ),
    speciesKey = rarestRouteSpecies(routeKey),
    entries = encounterData[routeKey].encounters,
    ordinary = entries.filter((entry) => !pokemonSpecies[entry.speciesKey]?.legendary),
    pool = ordinary.length > 0 ? ordinary : entries,
    rarest = pool.reduce((min, entry) => Math.min(min, entry.weight ?? 1), Infinity)
  assert.ok(speciesKey && pool.some((entry) => entry.speciesKey === speciesKey))
  assert.equal(pool.find((entry) => entry.speciesKey === speciesKey).weight, rarest)
  assert.equal(rarestRouteSpecies('not-a-route'), null)
})

test('SPEND_POKEWALKER with the Item Finder deducts steps and adds the item', () => {
  const original = Math.random
  try {
    Math.random = () => 0
    const state = { ...started, pokewalker: walkerAt(1000) },
      next = gameReducer(state, { type: 'SPEND_POKEWALKER', payload: { optionId: 'item' } })
    assert.equal(next.pokewalker.steps, 1000 - pokewalkerItemCost)
    // The first weighted find is a Potion.
    assert.equal(next.inventory.potion, (state.inventory.potion ?? 0) + 1)
    assert.notEqual(next, state)
  } finally {
    Math.random = original
  }
})

test('SPEND_POKEWALKER with the Egg Warmer advances the Day-Care and party eggs', () => {
  const egg = createEgg('pichu', 99, !1, 3000),
    state = {
      ...started,
      party: [...started.party, egg],
      daycare: { parents: [{ id: 'a' }, { id: 'b' }], progress: 5 },
      pokewalker: walkerAt(1000),
    },
    next = gameReducer(state, { type: 'SPEND_POKEWALKER', payload: { optionId: 'egg' } })
  assert.equal(next.pokewalker.steps, 1000 - pokewalkerEggCost)
  assert.equal(next.daycare.progress, 15)
  assert.equal(next.party.find((member) => member.isEgg).eggStepsRemaining, 3000 - pokewalkerEggSteps)
})

test('SPEND_POKEWALKER with the Rare Radar draws out the rarest wild', () => {
  const routeKey = Object.keys(encounterData).find(
      (key) => encounterData[key]?.encounters?.length
    ),
    state = { ...started, currentRoute: routeKey, activeEffects: [], pokewalker: walkerAt(1000) },
    next = gameReducer(state, { type: 'SPEND_POKEWALKER', payload: { optionId: 'reveal' } }),
    effect = next.activeEffects.find((entry) => entry.type === 'honey')
  assert.equal(next.pokewalker.steps, 1000 - pokewalkerRevealCost)
  assert.ok(effect, 'a Honey boost is applied')
  assert.equal(effect.routeKey, routeKey)
  assert.equal(effect.speciesKey, rarestRouteSpecies(routeKey))
  assert.ok(encounterData[routeKey].encounters.some((entry) => entry.speciesKey === effect.speciesKey))
})

test('spending without enough steps is a no-op', () => {
  const state = { ...started, pokewalker: walkerAt(POKEWALKER_OPTIONS[0].cost - 1) }
  assert.equal(
    gameReducer(state, { type: 'SPEND_POKEWALKER', payload: { optionId: POKEWALKER_OPTIONS[0].id } }),
    state
  )
})

test('ACCRUE_POKEWALKER banks from the live tick', () => {
  const state = { ...started, pokewalker: createPokewalker() },
    next = gameReducer(state, { type: 'ACCRUE_POKEWALKER', payload: { elapsedMs: HOUR } })
  assert.equal(next.pokewalker.steps, pokewalkerStepsPerHour)
  // A zero window leaves the same state reference.
  assert.equal(gameReducer(next, { type: 'ACCRUE_POKEWALKER', payload: { elapsedMs: 0 } }), next)
})

test('save repair keeps a sane Pokewalker and clamps a corrupt one', () => {
  const state = {
      ...started,
      pokewalker: { steps: 1234, dailySteps: 50, dailyDate: '2024-01-01', totalSteps: 9999 },
    },
    repaired = repairSave(serializeSave(state))
  assert.deepEqual(repaired.pokewalker, state.pokewalker)
  const corrupted = repairSave(
    serializeSave({ ...state, pokewalker: { steps: -5, dailySteps: 'x', dailyDate: 7, totalSteps: null } })
  )
  assert.deepEqual(corrupted.pokewalker, {
    steps: 0,
    dailySteps: 0,
    dailyDate: '',
    totalSteps: 0,
  })
})
