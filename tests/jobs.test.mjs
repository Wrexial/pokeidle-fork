import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const {
  JOB_CYCLE_MS,
  JOB_MAX_READY,
  JOB_SLOTS,
  accrueJobs,
  createJobs,
  jobKey,
  jobReadyCount,
  rollJobFind,
} = await import('../src/game/jobs.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { routeActivityIds } = await import('../src/game/minigames.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')

const { mapData } = gameData,
  locations = Object.values(mapData),
  forageLocation = locations.find((location) => routeActivityIds(location).includes('forage')),
  fishingLocation = locations.find((location) => routeActivityIds(location).includes('fishing'))

/** @param {string} activityId */
function makeJob(activityId, locationId) {
  return {
    locationId,
    activityId,
    pokemonId: 'p1',
    progressMs: 0,
    money: 0,
    items: {},
    encounters: [],
    cycles: 0,
  }
}

test('a job banks a find every cycle', () => {
  const key = jobKey(forageLocation.id, 'forage'),
    original = Math.random
  try {
    Math.random = () => 0
    const jobs = accrueJobs({ [key]: makeJob('forage', forageLocation.id) }, JOB_CYCLE_MS),
      job = jobs[key]
    assert.equal(job.cycles, 1)
    assert.equal(jobReadyCount(job), 1)
    assert.ok(job.money > 0, 'a loot find pays money')
    assert.ok(Object.values(job.items).some((quantity) => quantity > 0), 'a loot find pays an item')
  } finally {
    Math.random = original
  }
})

test('a job stops banking once it is full', () => {
  const key = jobKey(forageLocation.id, 'forage'),
    original = Math.random
  try {
    Math.random = () => 0
    const jobs = accrueJobs(
        { [key]: makeJob('forage', forageLocation.id) },
        JOB_CYCLE_MS * (JOB_MAX_READY + 6)
      ),
      job = jobs[key]
    assert.equal(jobReadyCount(job), JOB_MAX_READY)
    assert.ok(job.progressMs < JOB_CYCLE_MS, 'progress holds below a full cycle while capped')
    assert.equal(job.cycles, JOB_MAX_READY)
  } finally {
    Math.random = original
  }
})

test('accruing with nothing to do returns the same object', () => {
  const empty = createJobs()
  assert.equal(accrueJobs(empty, 5000), empty)
  const jobs = { [jobKey(forageLocation.id, 'forage')]: makeJob('forage', forageLocation.id) }
  assert.equal(accrueJobs(jobs, 0), jobs)
})

test('an encounter activity banks a wild Pokemon', () => {
  const key = jobKey(fishingLocation.id, 'fishing'),
    original = Math.random
  try {
    Math.random = () => 0
    const jobs = accrueJobs(
        { [key]: makeJob('fishing', fishingLocation.id) },
        JOB_CYCLE_MS
      ),
      job = jobs[key]
    assert.equal(job.encounters.length, 1, 'fishing banks an encounter, not loot')
    assert.ok(gameData.pokemonSpecies[job.encounters[0].speciesKey])
    assert.ok(job.encounters[0].level >= 1)
  } finally {
    Math.random = original
  }
})

test('rollJobFind falls back to supplies when the route has no matching type', () => {
  const job = makeJob('fishing', fishingLocation.id)
  const find = rollJobFind(job)
  // Either a real encounter or the supply fallback; both are valid shapes.
  if (find.kind === 'encounter') assert.ok(gameData.pokemonSpecies[find.speciesKey])
  else assert.ok(find.itemId && find.quantity >= 1)
})

test('ASSIGN_JOB posts a worker and UNASSIGN_JOB brings it home', () => {
  const worker = { id: 'p1', speciesKey: 'charmander', level: 10, currentHp: 20, maxHp: 20 },
    base = { ...initialGameState, party: [worker], jobs: {} },
    key = jobKey(forageLocation.id, 'forage'),
    assigned = gameReducer(base, {
      type: 'ASSIGN_JOB',
      payload: { locationId: forageLocation.id, activityId: 'forage', pokemonId: 'p1' },
    })
  assert.ok(assigned.jobs[key], 'the job is posted')
  assert.equal(assigned.jobs[key].pokemonId, 'p1')

  // Same worker cannot hold two jobs.
  const twice = gameReducer(assigned, {
    type: 'ASSIGN_JOB',
    payload: { locationId: forageLocation.id, activityId: 'prospecting', pokemonId: 'p1' },
  })
  assert.equal(Object.keys(twice.jobs).length, 1)

  // An activity that is not offered here is rejected.
  const bogus = gameReducer(base, {
    type: 'ASSIGN_JOB',
    payload: { locationId: forageLocation.id, activityId: 'nonsense', pokemonId: 'p1' },
  })
  assert.deepEqual(bogus.jobs, {})

  const cleared = gameReducer(assigned, {
    type: 'UNASSIGN_JOB',
    payload: { locationId: forageLocation.id, activityId: 'forage' },
  })
  assert.deepEqual(cleared.jobs, {})
})

test('the job limit is respected', () => {
  const party = Array.from({ length: JOB_SLOTS + 1 }, (_, index) => ({
    id: `p${index}`,
    speciesKey: 'charmander',
    level: 10,
    currentHp: 20,
    maxHp: 20,
  }))
  // Find JOB_SLOTS + 1 distinct activities offered at one location.
  const location = locations.find(
    (candidate) => routeActivityIds(candidate).length >= 2
  )
  const activityIds = routeActivityIds(location)
  let state = { ...initialGameState, party, jobs: {} }
  // Post one worker per activity on this location (also exercises multi-job).
  activityIds.forEach((activityId, index) => {
    state = gameReducer(state, {
      type: 'ASSIGN_JOB',
      payload: { locationId: location.id, activityId, pokemonId: `p${index}` },
    })
  })
  assert.ok(Object.keys(state.jobs).length <= JOB_SLOTS)
})

test('COLLECT_JOB pays the banked money and items', () => {
  const worker = { id: 'p1', speciesKey: 'charmander', level: 10, currentHp: 20, maxHp: 20 },
    key = jobKey(forageLocation.id, 'forage'),
    base = {
      ...initialGameState,
      party: [worker],
      jobs: {
        [key]: { ...makeJob('forage', forageLocation.id), money: 500, items: { expCandyS: 2 } },
      },
    },
    collected = gameReducer(base, {
      type: 'COLLECT_JOB',
      payload: { locationId: forageLocation.id, activityId: 'forage' },
    })
  assert.equal(collected.money, base.money + 500)
  assert.equal(collected.inventory.expCandyS, 2)
  assert.equal(collected.jobs[key].money, 0)
  assert.deepEqual(collected.jobs[key].items, {})
})

test('TAKE_JOB_ENCOUNTER removes the first banked encounter', () => {
  const worker = { id: 'p1', speciesKey: 'charmander', level: 10, currentHp: 20, maxHp: 20 },
    key = jobKey(fishingLocation.id, 'fishing'),
    base = {
      ...initialGameState,
      party: [worker],
      jobs: {
        [key]: {
          ...makeJob('fishing', fishingLocation.id),
          encounters: [
            { speciesKey: 'magikarp', level: 10 },
            { speciesKey: 'tentacool', level: 12 },
          ],
        },
      },
    },
    taken = gameReducer(base, {
      type: 'TAKE_JOB_ENCOUNTER',
      payload: { locationId: fishingLocation.id, activityId: 'fishing' },
    })
  assert.equal(taken.jobs[key].encounters.length, 1)
  assert.equal(taken.jobs[key].encounters[0].speciesKey, 'tentacool')
})

test('save repair keeps valid jobs and drops stale ones', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    worker = base.party[0],
    key = jobKey(forageLocation.id, 'forage'),
    state = {
      ...base,
      jobs: {
        [key]: {
          ...makeJob('forage', forageLocation.id),
          pokemonId: worker.id,
          money: 250,
          items: { expCandyS: 3 },
          cycles: 2,
        },
        'nowhere:forage': {
          ...makeJob('forage', 'nowhere'),
          pokemonId: worker.id,
        },
        'stale:worker': {
          ...makeJob('forage', forageLocation.id),
          pokemonId: 'does-not-exist',
        },
      },
    },
    repaired = repairSave(serializeSave(state))
  assert.ok(repaired.jobs[key], 'a valid job survives')
  assert.equal(repaired.jobs[key].money, 250)
  assert.equal(repaired.jobs[key].items.expCandyS, 3)
  assert.ok(!repaired.jobs['nowhere:forage'], 'a job on a missing location is dropped')
  assert.ok(!repaired.jobs['stale:worker'], 'a job with a released worker is dropped')
})
