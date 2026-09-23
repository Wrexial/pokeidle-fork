import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

const gameData = installGameData()

const {
  ACTIVITY_ATTEMPTS,
  FISHING_LOCATIONS,
  ROUTE_ACTIVITIES,
  activityRewardName,
  rollActivityEncounter,
  rollActivityLoot,
  routeActivityIds,
} = await import('../src/game/minigames.js')
const { isWaterLocation } = await import('../src/game/catching.js')
const { consumableItems, evolutionItems, heldItems } = await import('../src/data/items.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')

const { mapData, pokemonSpecies, mapEncounterData: encounterData } = gameData,
  locations = Object.values(mapData),
  waterRoute = locations.find((location) => routeActivityIds(location).includes('fishing')),
  forageRoute = locations.find((location) => routeActivityIds(location).includes('forage')),
  town = locations.find((location) => location.type === 'town')

test('route activities are offered by terrain', () => {
  assert.ok(waterRoute, 'some route supports fishing')
  assert.ok(forageRoute, 'some route supports foraging')
  assert.ok(routeActivityIds(waterRoute).includes('fishing'))
  assert.ok(routeActivityIds(forageRoute).includes('forage'))
  assert.deepEqual(routeActivityIds(town), [], 'towns offer nothing to fish for or forage')
  assert.deepEqual(routeActivityIds(undefined), [])
})

test('fishing is only offered on the curated water-rich routes', () => {
  assert.ok(FISHING_LOCATIONS.size > 0)
  for (const locationId of FISHING_LOCATIONS) {
    const location = mapData[locationId]
    assert.ok(location, `${locationId} should be a real location`)
    const water = (encounterData[location.routeKey]?.encounters ?? []).filter((entry) =>
      pokemonSpecies[entry.speciesKey].types.includes('Water')
    )
    assert.ok(water.length >= 2, `${locationId} should be water-rich`)
    assert.ok(routeActivityIds(location).includes('fishing'))
  }
  // A water route outside the curated list does not offer fishing.
  const otherWater = locations.find(
    (location) =>
      isWaterLocation(location) &&
      !FISHING_LOCATIONS.has(location.id) &&
      encounterData[location.routeKey]?.encounters
  )
  assert.ok(otherWater, 'there is a water route outside the list')
  assert.ok(!routeActivityIds(otherWater).includes('fishing'))
})

test('a cast never falls back to non-Water species', () => {
  const landRoute = locations.find(
    (location) =>
      encounterData[location.routeKey]?.encounters?.length &&
      !encounterData[location.routeKey].encounters.some((entry) =>
        pokemonSpecies[entry.speciesKey].types.includes('Water')
      )
  )
  assert.ok(landRoute, 'a route with no Water species exists')
  for (let roll = 0; roll < 20; roll++)
    assert.equal(
      rollActivityEncounter('fishing', landRoute.routeKey, roll % 2 === 0),
      null,
      'nothing to catch on a dry route'
    )
})

test('each activity is configured with an outcome and copy', () => {
  assert.equal(ROUTE_ACTIVITIES.fishing.mode, 'encounter')
  assert.equal(ROUTE_ACTIVITIES.forage.mode, 'loot')
  assert.equal(ACTIVITY_ATTEMPTS, 3)
  for (const activity of Object.values(ROUTE_ACTIVITIES)) {
    assert.ok(activity.title && activity.action && activity.hint && activity.icon)
  }
})

test('fishing rolls a species from the route table, preferring Water', () => {
  const table = encounterData[waterRoute.routeKey].encounters,
    keys = new Set(table.map((entry) => entry.speciesKey)),
    waterSpecies = table.filter((entry) =>
      pokemonSpecies[entry.speciesKey].types.includes('Water')
    )
  for (let roll = 0; roll < 40; roll++) {
    const encounter = rollActivityEncounter('fishing', waterRoute.routeKey, roll % 2 === 0)
    assert.ok(keys.has(encounter.speciesKey), 'the species comes from the route')
    assert.ok(encounter.level >= 1)
    if (waterSpecies.length > 0)
      assert.ok(
        pokemonSpecies[encounter.speciesKey].types.includes('Water'),
        'Water species win when the route has any'
      )
  }
})

test('forage loot is always a real item', () => {
  for (let roll = 0; roll < 80; roll++) {
    const reward = rollActivityLoot(roll % 2 === 0)
    assert.ok(
      consumableItems[reward.itemId] || evolutionItems[reward.itemId] || heldItems[reward.itemId],
      `${reward.itemId} should be a real item`
    )
    assert.ok(reward.quantity >= 1)
    assert.equal(typeof activityRewardName(reward.itemId), 'string')
  }
})

test('START_ROUTE_ACTIVITY only starts an activity available here', () => {
  const base = {
      ...initialGameState,
      phase: 'idle',
      currentLocation: waterRoute.id,
      unlockedLocations: [waterRoute.id],
    },
    started = gameReducer(base, {
      type: 'START_ROUTE_ACTIVITY',
      payload: { activityId: 'fishing' },
    })
  assert.equal(started.phase, 'routeActivity')
  assert.equal(started.routeActivity, 'fishing')

  const wrongPlace = gameReducer(
      { ...base, currentLocation: town.id, unlockedLocations: [town.id] },
      { type: 'START_ROUTE_ACTIVITY', payload: { activityId: 'fishing' } }
    ),
    bogus = gameReducer(base, {
      type: 'START_ROUTE_ACTIVITY',
      payload: { activityId: 'nonsense' },
    })
  assert.equal(wrongPlace.phase, 'idle')
  assert.equal(bogus.phase, 'idle')
})

test('END_ROUTE_ACTIVITY returns to idle', () => {
  const next = gameReducer(
    { ...initialGameState, phase: 'routeActivity', routeActivity: 'fishing' },
    { type: 'END_ROUTE_ACTIVITY' }
  )
  assert.equal(next.phase, 'idle')
  assert.equal(next.routeActivity, null)
})
