import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { DAY_NIGHT_CYCLE_MS, DAY_PHASES, dayPhaseAt, isNightTime, msUntilPhaseChange } = await import(
  '../src/game/day-night.js'
)
// catching.js re-exports isNightTime for the Dusk Ball / game loop.
const { isNightTime: isNightFromCatching } = await import('../src/game/catching.js')

test('the day/night cycle runs one day every 60 minutes', () => {
  assert.equal(DAY_NIGHT_CYCLE_MS, 3_600_000)
  assert.equal(dayPhaseAt(0).id, 'dawn')
  assert.equal(dayPhaseAt(DAY_NIGHT_CYCLE_MS * 0.2).id, 'day')
  assert.equal(dayPhaseAt(DAY_NIGHT_CYCLE_MS * 0.65).id, 'dusk')
  assert.equal(dayPhaseAt(DAY_NIGHT_CYCLE_MS * 0.8).id, 'night')
  // The cycle wraps …
  assert.equal(dayPhaseAt(DAY_NIGHT_CYCLE_MS).id, dayPhaseAt(0).id)
  // … and every phase is reachable across one loop.
  const ids = new Set()
  for (let step = 0; step < 60; step++) ids.add(dayPhaseAt((DAY_NIGHT_CYCLE_MS * step) / 60).id)
  assert.equal(ids.size, DAY_PHASES.length)
})

test('isNightTime follows the cycle, not the wall clock', () => {
  assert.equal(isNightTime(DAY_NIGHT_CYCLE_MS * 0.2), false)
  assert.equal(isNightTime(DAY_NIGHT_CYCLE_MS * 0.65), true, 'dusk counts as night')
  assert.equal(isNightTime(DAY_NIGHT_CYCLE_MS * 0.8), true)
  // The Dusk Ball's night flag comes through catching.js unchanged.
  assert.equal(isNightFromCatching(DAY_NIGHT_CYCLE_MS * 0.2), false)
  assert.equal(isNightFromCatching(DAY_NIGHT_CYCLE_MS * 0.8), true)
})

test('msUntilPhaseChange lands on the next boundary', () => {
  const now = DAY_NIGHT_CYCLE_MS * 0.1,
    wait = msUntilPhaseChange(now)
  assert.ok(wait > 0 && wait <= DAY_NIGHT_CYCLE_MS)
  assert.notEqual(dayPhaseAt(now + wait + 1).id, dayPhaseAt(now).id)
})
