import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  HIDE_AND_SEEK_SIZE,
  HIDE_AND_SEEK_TRACKS,
  HIDE_AND_SEEK_TUTORIAL,
  ROUTE_ACTIVITY_SPOTS,
  hideAndSeekAvailable,
  hideAndSeekPool,
  hideAndSeekPuzzle,
  hideAndSeekRouteForRegion,
  hideAndSeekRoutesForRegion,
  hideAndSeekSpot,
  picrossMatches,
} = await import('../src/game/minigames.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { encounterData, mapData, pokemonSpecies } = await import('../src/data/gameData.js')

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

test('the hide-and-seek spot has a tutorial and a real shape', () => {
  assert.ok(Array.isArray(HIDE_AND_SEEK_TUTORIAL) && HIDE_AND_SEEK_TUTORIAL.length > 0)
  const spot = hideAndSeekSpot('route1', '2024-05-05')
  assert.ok(spot && pokemonSpecies[spot.speciesKey], 'the spot names a real species')
  assert.ok(spot.level >= 1)
})

test('the spot is deterministic per route and day', () => {
  const first = hideAndSeekSpot('route1', '2024-05-05'),
    again = hideAndSeekSpot('route1', '2024-05-05')
  assert.deepEqual(first, again, 'same route + day must give the same spot')
})

test('the spot always comes from the route\u2019s rarest weight tier', () => {
  for (const routeKey of ['route1', 'route2', 'route22']) {
    const pool = hideAndSeekPool(routeKey)
    if (pool.length === 0) continue
    const rarest = Math.min(...pool.map((entry) => entry.weight)),
      spot = hideAndSeekSpot(routeKey, '2024-06-01'),
      entry = encounterData[routeKey].encounters.find(
        (candidate) => candidate.speciesKey === spot.speciesKey
      )
    assert.ok(entry, `${routeKey} spot is on the route`)
    assert.equal(entry.weight, rarest, `${routeKey} spot is a rare spawn`)
    assert.ok(pool.some((candidate) => candidate.speciesKey === spot.speciesKey))
  }
})

test('different days can roll a different spot', () => {
  const spots = new Set(
    ['2024-05-05', '2024-05-06', '2024-05-07', '2024-05-08'].map(
      (date) => JSON.stringify(hideAndSeekSpot('route1', date))
    )
  )
  assert.ok(spots.size > 1, 'the spot changes over days')
})

test('the trail puzzle is a deterministic solvable tracking grid', () => {
  const puzzle = hideAndSeekPuzzle('route1', '2024-05-05'),
    again = hideAndSeekPuzzle('route1', '2024-05-05')
  assert.deepEqual(puzzle, again)
  assert.equal(picrossMatches(puzzle.solution, puzzle.solution), true)
  assert.equal(puzzle.rowClues.length, puzzle.solution.length)
  assert.equal(puzzle.colClues.length, puzzle.solution.length)
  assert.equal(puzzle.solution.length, HIDE_AND_SEEK_SIZE)
  assert.ok(
    HIDE_AND_SEEK_TRACKS.some(
      (track) => JSON.stringify(track) === JSON.stringify(puzzle.solution)
    ),
    'the solution is one of the hide-and-seek trail patterns, not a Unown glyph'
  )
})

test('hideAndSeekAvailable ignores routes searched today', () => {
  assert.equal(hideAndSeekAvailable({}, 'route1', '2024-05-05'), true)
  assert.equal(hideAndSeekAvailable({ route1: '2024-05-05' }, 'route1', '2024-05-05'), false)
  assert.equal(hideAndSeekAvailable({ route1: '2024-05-04' }, 'route1', '2024-05-05'), true)
})

test('a region rotates a couple of hide-and-seek routes a day', () => {
  for (const region of ['kanto', 'johto', 'hoenn']) {
    const routes = hideAndSeekRoutesForRegion(region, '2024-05-05')
    assert.equal(routes.length, ROUTE_ACTIVITY_SPOTS, `${region} thinned to a couple of spots`)
    assert.equal(new Set(routes).size, routes.length, `${region} spots are distinct routes`)
    assert.deepEqual(
      routes,
      hideAndSeekRoutesForRegion(region, '2024-05-05'),
      `${region} picks the same routes for the same day`
    )
    for (const routeKey of routes)
      assert.equal(hideAndSeekRouteForRegion(region, routeKey, '2024-05-05'), true)
  }
})

test('a route outside the day\u2019s rotation hides no spot', () => {
  const chosen = new Set(hideAndSeekRoutesForRegion('kanto', '2024-05-05')),
    otherRoute = regionRouteKeys('kanto').find((routeKey) => !chosen.has(routeKey))
  assert.ok(otherRoute, 'a non-chosen route exists')
  assert.equal(hideAndSeekRouteForRegion('kanto', otherRoute, '2024-05-05'), false)
})

test('START_HIDE_AND_SEEK marks the route and enters the scene once', () => {
  const routeKey = hideAndSeekRoutesForRegion('kanto')[0],
    locationId = locationForRoute('kanto', routeKey)
  assert.ok(locationId, 'the chosen route has a map location')
  const start = gameReducer(
    { ...initialGameState, currentLocation: locationId, hideAndSeekSearches: {} },
    { type: 'START_HIDE_AND_SEEK' }
  )
  assert.equal(start.phase, 'hideAndSeek')
  assert.equal(typeof start.hideAndSeekSearches[routeKey], 'string')
  const again = gameReducer(start, { type: 'START_HIDE_AND_SEEK' })
  assert.equal(again, start, 'a searched route cannot start again the same day')
})

test('END_HIDE_AND_SEEK closes the scene', () => {
  const locationId = locationForRoute('kanto', hideAndSeekRoutesForRegion('kanto')[0])
  const started = gameReducer(
    { ...initialGameState, currentLocation: locationId, hideAndSeekSearches: {} },
    { type: 'START_HIDE_AND_SEEK' }
  )
  const ended = gameReducer(started, { type: 'END_HIDE_AND_SEEK' })
  assert.equal(ended.phase, 'idle')
})

test('START_HIDE_AND_SEEK refuses a non-route location', () => {
  const skipped = gameReducer(
    { ...initialGameState, currentLocation: 'palletTown', hideAndSeekSearches: {} },
    { type: 'START_HIDE_AND_SEEK' }
  )
  assert.equal(skipped.phase, initialGameState.phase)
  assert.deepEqual(skipped.hideAndSeekSearches, {})
})

test('START_HIDE_AND_SEEK refuses a route the region is not hiding on today', () => {
  const chosen = new Set(hideAndSeekRoutesForRegion('kanto')),
    otherRoute = regionRouteKeys('kanto').find((routeKey) => !chosen.has(routeKey)),
    locationId = locationForRoute('kanto', otherRoute)
  const skipped = gameReducer(
    { ...initialGameState, currentLocation: locationId, hideAndSeekSearches: {} },
    { type: 'START_HIDE_AND_SEEK' }
  )
  assert.equal(skipped.phase, initialGameState.phase)
  assert.deepEqual(skipped.hideAndSeekSearches, {})
})
