import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { computeOfflineReward, formatAwayDuration, offlineWildWinEstimate, simulateOfflineWildWins } = await import('../src/game/progression.js')
const { summarizeJobAccrual } = await import('../src/game/jobs.js')
const { createGarden } = await import('../src/game/garden.js')
const { createPelago } = await import('../src/game/pelago.js')
const { createPokemon } = await import('../src/game/pokemon.js')
const { offlineBattlesPerHour } = await import('../src/data/config.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

const stateAt = (/** @type {number} */ level) => ({ party: [{ level }] })
const HOUR = 3_600_000

test('computeOfflineReward ignores short absences', () => {
  assert.equal(computeOfflineReward(stateAt(50), 30_000), null)
  assert.equal(computeOfflineReward(stateAt(50), 0), null)
})

test('computeOfflineReward scales with time and party level', () => {
  const reward = computeOfflineReward(stateAt(50), 2 * HOUR)
  assert.equal(reward.awayMs, 2 * HOUR)
  assert.equal(reward.money, 2 * 50 * 40)
  assert.deepEqual(reward.items, { expCandyL: 2 })
  assert.deepEqual(computeOfflineReward(stateAt(10), HOUR).items, { expCandyS: 1 })
  assert.deepEqual(computeOfflineReward(stateAt(80), HOUR).items, { expCandyXL: 1 })
})

test('computeOfflineReward caps at eight hours', () => {
  const reward = computeOfflineReward(stateAt(50), 100 * HOUR)
  assert.equal(reward.awayMs, 8 * HOUR)
  assert.equal(reward.money, 8 * 50 * 40)
  assert.deepEqual(reward.items, { expCandyL: 8 })
})

test('summarizeJobAccrual reports the jobs that banked while away', () => {
  const key = 'route1:forage',
    before = {
      [key]: {
        locationId: 'route1',
        activityId: 'forage',
        level: 20,
        ability: null,
        progressMs: 0,
        money: 0,
        items: {},
        encounters: [],
        cycles: 0,
        cycleMs: 100000,
      },
    },
    after = {
      [key]: {
        ...before[key],
        progressMs: 5000,
        money: 300,
        items: { oranBerry: 2 },
        encounters: [{ speciesKey: 'pidgey', level: 5 }],
        cycles: 3,
      },
    },
    summary = summarizeJobAccrual(before, after)
  assert.equal(summary.length, 1)
  assert.equal(summary[0].cycles, 3)
  assert.equal(summary[0].money, 300)
  assert.deepEqual(summary[0].items, { oranBerry: 2 })
  assert.equal(summary[0].encounters, 1)
  assert.equal(typeof summary[0].title, 'string')
  assert.equal(typeof summary[0].location, 'string')
  // Nothing changed -> nothing to report.
  assert.deepEqual(summarizeJobAccrual(before, before), [])
})

test('formatAwayDuration renders hours and minutes', () => {
  assert.equal(formatAwayDuration(2 * HOUR + 15 * 60_000), '2h 15m')
  assert.equal(formatAwayDuration(45 * 60_000), '45m')
})

test('offlineWildWinEstimate scales with the away window', () => {
  assert.equal(offlineWildWinEstimate(0), 0)
  assert.equal(offlineWildWinEstimate(HOUR), offlineBattlesPerHour)
  assert.equal(offlineWildWinEstimate(2 * HOUR), offlineBattlesPerHour * 2)
})

test('simulateOfflineWildWins advances the per-win systems', () => {
  const father = { ...createPokemon('pikachu', 20, 'father'), gender: 'male' },
    mother = { ...createPokemon('pikachu', 20, 'mother'), gender: 'female' },
    state = {
      ...initialGameState,
      pelago: { ...createPelago(), beans: { assigned: ['a'], progress: 23, ready: 0 } },
      garden: {
        ...createGarden(),
        plots: [{ berryId: 'oranBerry', battlesRemaining: 2 }, null, null, null],
      },
      kurtCrafts: [{ apricornId: 'redApricorn', ballId: 'levelball', battlesRemaining: 2 }],
      daycare: { parents: [father, mother], progress: 0 },
    },
    result = simulateOfflineWildWins(state, HOUR)
  assert.ok(result, 'an away hour has systems to advance')
  // 240 wins is well past the Bean Farm's 25-win goal.
  assert.ok(result.pelago.beans.ready >= 1, 'the Bean Farm banked a cycle')
  assert.equal(result.pelago.beans.assigned.length, 1, 'the assignment is kept')
  assert.equal(result.garden.plots[0].battlesRemaining, 0, 'the plot ripened')
  assert.equal(result.kurtCrafts[0].battlesRemaining, 0, 'Kurt finished the craft')
  assert.ok(result.daycare.progress > 0, 'the Day-Care advanced')
  assert.deepEqual(
    result.summary.map((entry) => entry.id).sort(),
    ['daycare', 'garden', 'kurt', 'pelago']
  )
  // A window with nothing to advance reports nothing.
  assert.equal(simulateOfflineWildWins({ ...initialGameState }, 0), null)
  assert.equal(simulateOfflineWildWins({ ...initialGameState }, HOUR), null)
})

test('CLEAR_OFFLINE_REPORT dismisses the report', () => {
  const state = {
    ...initialGameState,
    offlineReport: { awayMs: HOUR, money: 100, items: {} },
  }
  assert.equal(gameReducer(state, { type: 'CLEAR_OFFLINE_REPORT' }).offlineReport, null)
})
