import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  MASTERY_RANK,
  MASTERY_REWARD,
  activityQualityRank,
  masteryActivities,
  masteryProgress,
  recordMastery,
} = await import('../src/game/route-mastery.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { repairSave, serializeSave } = await import('../src/game/save.js')

test('activity qualities map to ranks', () => {
  assert.equal(activityQualityRank(null), 0)
  assert.equal(activityQualityRank(undefined), 0)
  assert.equal(activityQualityRank('hit'), 1)
  assert.equal(activityQualityRank('perfect'), 2)
  assert.equal(activityQualityRank('ultra'), 3)
  assert.equal(MASTERY_RANK, 2)
})

test('recordMastery keeps the best rank and returns the same map otherwise', () => {
  const first = recordMastery(undefined, 'route23', 'diving', 'hit')
  assert.equal(first.route23.diving, 1)
  assert.equal(recordMastery(first, 'route23', 'diving', 'hit'), first, 'same rank, same ref')
  assert.equal(recordMastery(first, 'route23', 'diving', null), first, 'a miss is ignored')
  const better = recordMastery(first, 'route23', 'diving', 'ultra')
  assert.equal(better.route23.diving, 3)
  assert.notEqual(better, first)
})

test('masteryProgress counts activities at a perfect hit or better', () => {
  // Route 23 is a one-activity route (Diving).
  assert.deepEqual(masteryActivities('route23'), ['diving'])
  assert.deepEqual(masteryProgress({ routeMastery: {} }, 'route23'), {
    done: 0,
    total: 1,
    mastered: false,
  })
  assert.deepEqual(masteryProgress({ routeMastery: { route23: { diving: 1 } } }, 'route23'), {
    done: 0,
    total: 1,
    mastered: false,
  })
  assert.deepEqual(masteryProgress({ routeMastery: { route23: { diving: 2 } } }, 'route23'), {
    done: 1,
    total: 1,
    mastered: true,
  })
})

test('mastering a route pays the one-time bonus', () => {
  const base = {
      ...initialGameState,
      phase: 'idle',
      money: 0,
      inventory: {},
      routeMastery: {},
      masteredRoutes: [],
    },
    mastered = gameReducer(base, {
      type: 'RECORD_ROUTE_MASTERY',
      payload: { locationId: 'route23', activityId: 'diving', quality: 'perfect' },
    })
  assert.equal(mastered.routeMastery.route23.diving, 2)
  assert.ok(mastered.masteredRoutes.includes('route23'))
  assert.equal(mastered.money, MASTERY_REWARD.money)
  assert.equal(mastered.inventory.rareCandy, 1)
  // Improving to ultra does not pay twice.
  const improved = gameReducer(mastered, {
    type: 'RECORD_ROUTE_MASTERY',
    payload: { locationId: 'route23', activityId: 'diving', quality: 'ultra' },
  })
  assert.equal(improved.routeMastery.route23.diving, 3)
  assert.equal(improved.money, MASTERY_REWARD.money, 'the bonus is paid once')
  assert.equal(improved.inventory.rareCandy, 1)
})

test('a non-improvement is a no-op at the reducer', () => {
  const base = { ...initialGameState, routeMastery: { route23: { diving: 3 } } }
  assert.equal(
    gameReducer(base, {
      type: 'RECORD_ROUTE_MASTERY',
      payload: { locationId: 'route23', activityId: 'diving', quality: 'hit' },
    }),
    base
  )
})

test('repairSave sanitises route mastery and mastered routes', () => {
  const base = gameReducer(initialGameState, {
      type: 'SELECT_STARTER',
      payload: { region: 'kanto', speciesKey: 'bulbasaur' },
    }),
    repaired = repairSave(
      serializeSave({
        ...base,
        routeMastery: {
          route23: { diving: 2, bogus: 5, bad: -1 },
          notALocation: { diving: 3 },
        },
        masteredRoutes: ['route23', 'notALocation'],
      })
    )
  assert.deepEqual(repaired.routeMastery.route23, { diving: 2 }, 'bad ranks and ids drop')
  assert.ok(!('notALocation' in repaired.routeMastery), 'an unknown location drops')
  assert.deepEqual(repaired.masteredRoutes, ['route23'])
})
