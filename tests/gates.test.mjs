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

test('roadless actionable areas stay on the frontier', () => {
  // Alola's league and Raid Island have no road connections: they open on
  // Poni Island plus a battle count / badges. The frontier used to require a
  // road to an already-open area, so they were invisible and a region with
  // everything else open looked finished (the panel fell back to "beat the
  // Champion") even though both were one step away.
  const allAlola = Object.keys(mapData).filter(
    (id) => (mapData[id].region ?? 'kanto') === 'alola'
  )
  const state = {
    startRegion: 'alola',
    unlockedRegions: ['alola'],
    unlockedLocations: allAlola.filter((id) => id !== 'alola-league' && id !== 'alola-raid'),
    currentLocation: 'alola-route-17',
    pokedexCaught: ['rowlet'],
    party: [{ level: 80 }],
    defeatedGyms: [
      'alola-gym-1',
      'alola-grand-hala',
      'alola-gym-2',
      'alola-gym-3',
      'alola-gym-4',
      'alola-grand-olivia',
      'alola-gym-5',
      'alola-gym-6',
      'alola-grand-nanu',
      'alola-gym-7',
      'alola-gym-8',
    ],
    defeatedChampions: [],
    battlesWonByLocation: {},
  }
  const unlocked = computeUnlockedLocations(state)
  const unlockedSet = new Set(unlocked)
  const frontier = frontierUnlocks(unlocked, 'alola')
  for (const id of ['alola-league', 'alola-raid']) {
    const area = frontier.find((location) => location.id === id)
    assert.ok(area, `${id} is on the frontier despite having no road`)
    assert.deepEqual(unlockBlockers(area, unlockedSet), [], `${id} is actionable`)
  }
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

test('Paldea wild levels ramp with its unlock order', () => {
  // Paldea is reordered into one linear Victory Road path by
  // tools/apply-paldea-progression.cjs, so the wild level never drops back down
  // after a high-level area (the standalone landmarks used to sit at Lv. 5).
  const paldeaRoutes = Object.values(mapData)
    .filter((location) => (location.region ?? 'kanto') === 'paldea')
    .filter((location) => location.type === 'route' && location.routeKey)
    // The DLC and Area Zero are post-game, gated on the Champion; they reuse
    // their own high bands and aren't part of the base curve.
    .filter((location) => !/kitakami|area-zero|terarium/.test(location.id))
    .sort((left, right) => left.unlockOrder - right.unlockOrder)
  assert.ok(paldeaRoutes.length > 10, 'Paldea has a base wild route')
  const levels = paldeaRoutes.map((location) =>
    Math.min(...(encounterData[location.routeKey]?.encounters ?? []).map((entry) => entry.minLevel))
  )
  for (let i = 1; i < levels.length; i++) {
    const drop = levels[i - 1] - levels[i],
      jump = levels[i] - levels[i - 1]
    assert.ok(
      drop <= 0,
      `${paldeaRoutes[i].id} (Lv.${levels[i]}) drops below ${paldeaRoutes[i - 1].id} (Lv.${levels[i - 1]})`
    )
    assert.ok(
      jump <= 12,
      `${paldeaRoutes[i].id} (Lv.${levels[i]}) jumps from ${paldeaRoutes[i - 1].id} (Lv.${levels[i - 1]})`
    )
  }
})
