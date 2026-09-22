import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { computeOfflineReward, formatAwayDuration } = await import('../src/game/progression.js')
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

test('formatAwayDuration renders hours and minutes', () => {
  assert.equal(formatAwayDuration(2 * HOUR + 15 * 60_000), '2h 15m')
  assert.equal(formatAwayDuration(45 * 60_000), '45m')
})

test('CLEAR_OFFLINE_REPORT dismisses the report', () => {
  const state = {
    ...initialGameState,
    offlineReport: { awayMs: HOUR, money: 100, items: {} },
  }
  assert.equal(gameReducer(state, { type: 'CLEAR_OFFLINE_REPORT' }).offlineReport, null)
})
