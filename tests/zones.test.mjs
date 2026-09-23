import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { encounterData, mapData, pokemonSpecies, regions } = await import('../src/data/gameData.js')
const { computeUnlockedLocations } = await import('../src/game/progression.js')

/** Minimal GameState for computeUnlockedLocations. */
function stateWith(unlockedLocations) {
  return {
    unlockedLocations,
    defeatedGyms: [],
    pokedexCaught: [],
    party: [],
    battlesWonByLocation: {},
    startRegion: 'galar',
    unlockedRegions: ['galar'],
    defeatedChampions: [],
  }
}

test('the Galar Wild Area zone groups its sub-areas', () => {
  const hub = mapData['galar-wild-area']
  assert.ok(hub, 'the zone hub exists')
  assert.equal(hub.type, 'zone')
  assert.ok(Array.isArray(hub.subAreas) && hub.subAreas.length >= 2, 'it lists sub-areas')
  assert.equal(hub.routeKey, hub.subAreas[0].id, 'the hub defaults to its first sub-area')

  for (const subArea of hub.subAreas) {
    const location = mapData[subArea.id]
    assert.ok(location, `${subArea.id} exists`)
    assert.equal(location.type, 'route')
    assert.equal(location.hidden, true, `${subArea.id} is hidden from the map`)
    assert.equal(location.zone, hub.id, `${subArea.id} points back at the hub`)
    assert.deepEqual(location.unlock.requires, [hub.id])
    assert.ok(location.connections.includes(hub.id), `${subArea.id} connects to the hub`)
    assert.ok(encounterData[subArea.id]?.encounters?.length, `${subArea.id} has wild encounters`)
  }
  assert.ok(hub.connections.includes(hub.subAreas[0].id), 'the hub connects to its sub-areas')
})

test('sub-areas unlock once the zone hub is unlocked', () => {
  const hub = mapData['galar-wild-area']
  const locked = computeUnlockedLocations(stateWith(['galar-route-5']))
  assert.ok(!locked.includes(hub.subAreas[0].id), 'locked while the hub is locked')

  const unlocked = computeUnlockedLocations(stateWith(['galar-route-5', hub.id]))
  for (const subArea of hub.subAreas)
    assert.ok(unlocked.includes(subArea.id), `${subArea.id} unlocks with the hub`)
})

test('the extra Galar wild areas exist with their own encounters', () => {
  for (const id of ['galar-slumbering-weald', 'galar-mine', 'galar-glimwood-tangle']) {
    const location = mapData[id]
    assert.ok(location, `${id} exists`)
    assert.equal(location.type, 'route')
    assert.ok(encounterData[id]?.encounters?.length, `${id} has wild encounters`)
    assert.ok(location.connections.length > 0, `${id} connects to the map`)
  }
})

test('the DLC zones are post-game and gated on the Galar Champion', () => {  for (const id of ['galar-isle-of-armor', 'galar-crown-tundra']) {
    const hub = mapData[id]
    assert.ok(hub, `${id} exists`)
    assert.equal(hub.type, 'zone')
    assert.deepEqual(hub.unlock, { championDefeated: 'galar' })
    assert.ok(hub.subAreas.length >= 2, `${id} has sub-areas`)
    for (const subArea of hub.subAreas) {
      assert.equal(mapData[subArea.id].hidden, true)
      assert.ok(encounterData[subArea.id]?.encounters?.length, `${subArea.id} has encounters`)
    }
  }

  const locked = computeUnlockedLocations(stateWith(['galar-hulbury', 'galar-wyndon']))
  assert.ok(!locked.includes('galar-isle-of-armor'), 'locked before the Champion')
  const unlocked = computeUnlockedLocations({
    ...stateWith(['galar-hulbury', 'galar-wyndon']),
    defeatedChampions: ['galar'],
  })
  assert.ok(unlocked.includes('galar-isle-of-armor'), 'opens after the Champion')
  assert.ok(unlocked.includes('galar-crown-tundra'), 'opens after the Champion')
})

test('the Alolan forms are wild in Alola and its raid pool is legendaries only', () => {
  const wild = new Set()
  for (const [key, bucket] of Object.entries(encounterData)) {
    const location = mapData[key]
    if (!location || location.type === 'raid' || location.region !== 'alola') continue
    for (const encounter of bucket.encounters) wild.add(encounter.speciesKey)
  }
  for (const form of ['a-rattata', 'a-meowth', 'a-diglett', 'a-grimer', 'a-geodude', 'a-sandshrew', 'a-vulpix'])
    assert.ok(wild.has(form), `${form} is wild in Alola`)

  const alola = regions.find((region) => region.id === 'alola'),
    ordinary = alola.raidPool.filter((entry) => !pokemonSpecies[entry.speciesKey]?.legendary)
  assert.deepEqual(ordinary, [], 'Alola raid pool holds only legendaries')
})

test('Paldea has its DLC and Area Zero zones, and a legendary-only pool', () => {
  for (const id of ['paldea-kitakami', 'paldea-terarium', 'paldea-area-zero']) {
    const hub = mapData[id]
    assert.ok(hub, `${id} exists`)
    assert.equal(hub.type, 'zone')
    assert.deepEqual(hub.unlock, { championDefeated: 'paldea' })
    assert.ok(hub.subAreas.length >= 2, `${id} has sub-areas`)
  }
  const paldea = regions.find((region) => region.id === 'paldea'),
    ordinary = paldea.raidPool.filter((entry) => !pokemonSpecies[entry.speciesKey]?.legendary)
  assert.deepEqual(ordinary, [], 'Paldea raid pool holds only legendaries')
})
