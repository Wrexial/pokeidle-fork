import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  DOWSING_ITEMS,
  DOWSING_PROBES,
  DOWSING_TILES,
  DOWSING_TUTORIAL,
  dowsingAvailable,
  dowsingDistance,
  dowsingFinds,
  dowsingHeat,
  dowsingReading,
  dowsingRewardName,
} = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { consumableItems, evolutionItems, heldItems, pokeBalls } = await import('../src/data/items.js')

test('the dowsing grid has a sane shape and a tutorial', () => {
  assert.equal(DOWSING_TILES, 30)
  assert.ok(DOWSING_ITEMS > 0 && DOWSING_ITEMS < DOWSING_TILES)
  assert.ok(DOWSING_PROBES > DOWSING_ITEMS)
  assert.ok(Array.isArray(DOWSING_TUTORIAL) && DOWSING_TUTORIAL.length > 0)
})

test('the hidden set is deterministic per route and day', () => {
  const first = dowsingFinds('route1', '2024-05-05'),
    again = dowsingFinds('route1', '2024-05-05')
  assert.deepEqual(first, again, 'same route + day must give the same set')
  assert.equal(first.length, DOWSING_ITEMS)
  const indices = new Set(first.map((entry) => entry.index))
  assert.equal(indices.size, DOWSING_ITEMS, 'every item hides on its own tile')
  for (const entry of first) {
    assert.ok(entry.index >= 0 && entry.index < DOWSING_TILES)
    assert.ok(entry.quantity >= 1)
    assert.ok(
      pokeBalls[entry.itemId] ||
        consumableItems[entry.itemId] ||
        evolutionItems[entry.itemId] ||
        heldItems[entry.itemId],
      `${entry.itemId} should be a real item`
    )
    assert.equal(typeof dowsingRewardName(entry.itemId), 'string')
  }
})

test('different days and routes can roll different sets', () => {
  const dayOne = JSON.stringify(dowsingFinds('route1', '2024-05-05')),
    dayTwo = JSON.stringify(dowsingFinds('route1', '2024-05-06')),
    otherRoute = JSON.stringify(dowsingFinds('route2', '2024-05-05'))
  assert.notEqual(dayOne, dayTwo)
  assert.notEqual(dayOne, otherRoute)
})

test('distance and heat read as hot and cold', () => {
  assert.equal(dowsingDistance(0, 0), 0)
  assert.equal(dowsingDistance(0, 1), 1)
  // Same column, one row down on a 6-wide grid.
  assert.equal(dowsingDistance(0, 6), 1)
  assert.equal(dowsingHeat(0).key, 'blazing')
  assert.equal(dowsingHeat(1).key, 'blazing')
  assert.equal(dowsingHeat(2).key, 'hot')
  assert.equal(dowsingHeat(3).key, 'warm')
  assert.equal(dowsingHeat(4).key, 'cool')
  assert.equal(dowsingHeat(9).key, 'cold')
})

test('a probe on an item reads null, an empty tile reads heat', () => {
  const finds = dowsingFinds('route1', '2024-06-01'),
    itemTile = finds[0].index
  assert.equal(dowsingReading(finds, itemTile), null)
  const empty = [...Array(DOWSING_TILES).keys()].find(
    (index) => !finds.some((entry) => entry.index === index)
  )
  const reading = dowsingReading(finds, empty)
  assert.ok(reading && typeof reading.key === 'string' && reading.icon)
})

test('dowsingAvailable ignores routes already swept today', () => {
  assert.equal(dowsingAvailable({}, 'route1', '2024-05-05'), true)
  assert.equal(dowsingAvailable({ route1: '2024-05-05' }, 'route1', '2024-05-05'), false)
  assert.equal(dowsingAvailable({ route1: '2024-05-04' }, 'route1', '2024-05-05'), true)
})

test('START_DOWSING marks the route and enters the scene once', () => {
  const start = gameReducer(
    { ...initialGameState, currentLocation: 'route1', dowsingSearches: {} },
    { type: 'START_DOWSING' }
  )
  assert.equal(start.phase, 'dowsing')
  assert.equal(typeof start.dowsingSearches.route1, 'string')
  const again = gameReducer(start, { type: 'START_DOWSING' })
  assert.equal(again, start, 'a swept route cannot start again the same day')
})

test('FIND_DOWSING banks the found items and END_DOWSING closes the scene', () => {
  const started = gameReducer(
    { ...initialGameState, currentLocation: 'route1', inventory: {} },
    { type: 'START_DOWSING' }
  )
  const found = gameReducer(started, {
    type: 'FIND_DOWSING',
    payload: { rewards: [{ itemId: 'nugget', quantity: 2 }] },
  })
  assert.equal(found.inventory.nugget, 2)
  assert.equal(found.phase, 'dowsing')
  const ended = gameReducer(found, { type: 'END_DOWSING' })
  assert.equal(ended.phase, 'idle')
})

test('START_DOWSING refuses a non-route location', () => {
  const skipped = gameReducer(
    { ...initialGameState, currentLocation: 'palletTown', dowsingSearches: {} },
    { type: 'START_DOWSING' }
  )
  assert.equal(skipped.phase, initialGameState.phase)
  assert.deepEqual(skipped.dowsingSearches, {})
})
