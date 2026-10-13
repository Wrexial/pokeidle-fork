import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  DOWSING_ITEMS,
  DOWSING_PROBES,
  DOWSING_TILES,
  DOWSING_TUTORIAL,
  ROUTE_ACTIVITY_SPOTS,
  dowsingAvailable,
  dowsingDistance,
  dowsingFinds,
  dowsingHeat,
  dowsingReading,
  dowsingRewardName,
  dowsingRouteForRegion,
  dowsingRoutesForRegion,
} = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { mapData } = await import('../src/data/gameData.js')
const { consumableItems, evolutionItems, heldItems, pokeBalls } = await import('../src/data/items.js')

/** The map location id of a region's route, for standing the player on it.
 * @param {string} region
 * @param {string} routeKey
 * @returns {string | undefined}
 */
function locationForRoute(region, routeKey) {
  return Object.values(mapData).find(
    (location) => location.routeKey === routeKey && (location.region ?? 'kanto') === region
  )?.id
}

/** Every wild route key in a region, in map order.
 * @param {string} region
 * @returns {string[]}
 */
function regionRouteKeys(region) {
  return Object.values(mapData)
    .filter(
      (location) =>
        location.type === 'route' &&
        (location.region ?? 'kanto') === region &&
        location.routeKey
    )
    .map((location) => /** @type {string} */ (location.routeKey))
}

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

test('distance and aura readings run from surging to still', () => {
  assert.equal(dowsingDistance(0, 0), 0)
  assert.equal(dowsingDistance(0, 1), 1)
  // Same column, one row down on a 6-wide grid.
  assert.equal(dowsingDistance(0, 6), 1)
  assert.equal(dowsingHeat(0).key, 'surging')
  assert.equal(dowsingHeat(1).key, 'surging')
  assert.equal(dowsingHeat(2).key, 'radiating')
  assert.equal(dowsingHeat(3).key, 'humming')
  assert.equal(dowsingHeat(4).key, 'faint')
  assert.equal(dowsingHeat(9).key, 'still')
})

test('a probe on a find reads null, an empty tile reads aura', () => {
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

test('a region rotates a couple of dowsing routes a day', () => {
  for (const region of ['kanto', 'johto', 'hoenn']) {
    const routes = dowsingRoutesForRegion(region, '2024-05-05')
    assert.equal(routes.length, ROUTE_ACTIVITY_SPOTS, `${region} thinned to a couple of spots`)
    assert.equal(new Set(routes).size, routes.length, `${region} spots are distinct routes`)
    assert.deepEqual(
      routes,
      dowsingRoutesForRegion(region, '2024-05-05'),
      `${region} picks the same routes for the same day`
    )
    for (const routeKey of routes)
      assert.equal(dowsingRouteForRegion(region, routeKey, '2024-05-05'), true)
  }
})

test('a route outside the day\u2019s rotation cannot sweep', () => {
  const chosen = new Set(dowsingRoutesForRegion('kanto', '2024-05-05')),
    otherRoute = regionRouteKeys('kanto').find((routeKey) => !chosen.has(routeKey))
  assert.ok(otherRoute, 'a non-chosen route exists')
  assert.equal(dowsingRouteForRegion('kanto', otherRoute, '2024-05-05'), false)
})

test('START_DOWSING marks the route and enters the scene once', () => {
  const routeKey = dowsingRoutesForRegion('kanto')[0],
    locationId = locationForRoute('kanto', routeKey)
  assert.ok(locationId, 'the chosen route has a map location')
  const start = gameReducer(
    { ...initialGameState, currentLocation: locationId, dowsingSearches: {} },
    { type: 'START_DOWSING' }
  )
  assert.equal(start.phase, 'dowsing')
  assert.equal(typeof start.dowsingSearches[routeKey], 'string')
  const again = gameReducer(start, { type: 'START_DOWSING' })
  assert.equal(again, start, 'a swept route cannot start again the same day')
})

test('FIND_DOWSING banks the found items and END_DOWSING closes the scene', () => {
  const locationId = locationForRoute('kanto', dowsingRoutesForRegion('kanto')[0])
  const started = gameReducer(
    { ...initialGameState, currentLocation: locationId, inventory: {} },
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

test('START_DOWSING refuses a route the region is not sweeping today', () => {
  const chosen = new Set(dowsingRoutesForRegion('kanto')),
    otherRoute = regionRouteKeys('kanto').find((routeKey) => !chosen.has(routeKey)),
    locationId = locationForRoute('kanto', otherRoute)
  const skipped = gameReducer(
    { ...initialGameState, currentLocation: locationId, dowsingSearches: {} },
    { type: 'START_DOWSING' }
  )
  assert.equal(skipped.phase, initialGameState.phase)
  assert.deepEqual(skipped.dowsingSearches, {})
})
