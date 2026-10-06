import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { quickplayAll } = await import('../tools/lib/quickplay.mjs')
const { buildRouteExclusives } = await import('../tools/lib/gate-exclusives.mjs')
const { computeUnlockedLocations, frontierUnlocks, unlockBlockers } = await import('../src/game/progression.js')
const { encounterData, evolutionData, mapData, pokemonSpecies } = await import('../src/data/gameData.js')
const { regionalStarters } = await import('../src/data/config.js')

test('every region is completable from a fresh save', () => {
  for (const result of quickplayAll()) {
    assert.equal(
      result.loop,
      undefined,
      `${result.regionId} quickplay did not reach a fixpoint`
    )
    assert.deepEqual(
      result.stuck.map((entry) => `${entry.id}: ${entry.reasons.join('; ')}`),
      [],
      `${result.regionId} has unreachable locations`
    )
  }
})

test('caughtOnRoute gates only ask for species still exclusive to their route', () => {
  const starterBaseKeys = [...new Set(Object.values(regionalStarters).flat())]
  const exclusiveByRoute = buildRouteExclusives({
    mapData,
    encounterData,
    species: pokemonSpecies,
    evolutionData,
    starterBaseKeys,
  })
  let checked = 0
  for (const [locationId, location] of Object.entries(mapData)) {
    const gate = location.unlock?.caughtOnRoute
    if (!gate) continue
    checked++
    const exclusives = (exclusiveByRoute[gate.routeKey] ?? []).map((entry) => entry.key)
    assert.ok(
      exclusives.length > 0,
      `${locationId} gates on ${gate.routeKey}, which has no exclusive species left`
    )
    assert.deepEqual(
      gate.species,
      exclusives,
      `${locationId} should list exactly ${gate.routeKey}'s current exclusives`
    )
    // The ask must be satisfiable from the common (not rare, not starter, not
    // day/night-gated) exclusives, so the player is never forced to hunt a 1%
    // spawn or wait for nightfall.
    const common = (exclusiveByRoute[gate.routeKey] ?? []).filter((entry) => entry.common)
    assert.ok(
      gate.count >= 1 && gate.count <= Math.min(3, common.length),
      `${locationId} asks for ${gate.count} of ${common.length} common exclusives`
    )
  }
  assert.ok(checked > 0, 'there are caughtOnRoute gates to check')
})

test('the Next Unlocks frontier stays inside the region the player is in', () => {
  // A player who started in Kanto, progressed it, then opened Alola with an
  // Unlock Token. `unlockOrder` is generation-prefixed, so a map-wide frontier
  // let Kanto's routes crowd Alola's own gates out of the panel entirely.
  const state = {
    startRegion: 'kanto',
    unlockedRegions: ['kanto', 'alola'],
    unlockedLocations: [
      'palletTown',
      'route1',
      'viridianCity',
      'route2',
      'viridianForest',
      'pewterCity',
      'alola-iki-town',
      'alola-melemele-island',
      'alola-route-1',
    ],
    currentLocation: 'alola-route-1',
    pokedexCaught: ['bulbasaur'],
    party: [{ level: 20 }],
    defeatedGyms: [],
    defeatedChampions: [],
    battlesWonByLocation: {},
  }
  const unlocked = computeUnlockedLocations(state)
  const frontier = frontierUnlocks(unlocked, 'alola')
  assert.ok(frontier.length > 0, 'Alola has a frontier')
  for (const location of frontier)
    assert.equal(location.region ?? 'kanto', 'alola', `${location.id} is in Alola`)
  // The region's next step is visible (the old five-item cap hid it behind
  // Kanto's lower-numbered unlocks).
  assert.ok(
    frontier.some((location) => location.id === 'alola-route-1--hauoli-outskirts'),
    'the next Alola area is listed'
  )
  assert.ok(
    !frontier.some((location) => (location.region ?? 'kanto') === 'kanto'),
    'no Kanto gates leak into the Alola panel'
  )
})

test('blocked frontier areas report the locked area they wait on', () => {
  const state = {
    startRegion: 'alola',
    unlockedRegions: ['alola'],
    unlockedLocations: ['alola-iki-town', 'alola-melemele-island', 'alola-route-1'],
    currentLocation: 'alola-route-1',
    pokedexCaught: ['rowlet'],
    party: [{ level: 5 }],
    defeatedGyms: [],
    defeatedChampions: [],
    battlesWonByLocation: {},
  }
  const unlocked = computeUnlockedLocations(state)
  const unlockedSet = new Set(unlocked)
  const frontier = frontierUnlocks(unlocked, 'alola')
  const nextArea = frontier.find((location) => location.id === 'alola-route-1--hauoli-outskirts')
  assert.ok(nextArea, 'the next area is on the frontier')
  assert.deepEqual(unlockBlockers(nextArea, unlockedSet), [], 'the next area is actionable')
  // Route 2 is adjacent to the zone hub, so it is on the frontier, but it waits
  // on the outskirts opening first.
  const chained = frontier.find((location) => location.id === 'alola-route-2')
  assert.ok(chained, 'Route 2 is on the frontier')
  assert.deepEqual(unlockBlockers(chained, unlockedSet), [
    'alola-route-1--hauoli-outskirts',
  ], 'Route 2 waits on the outskirts')
})
