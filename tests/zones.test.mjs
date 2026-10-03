import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { encounterData, mapData, pokemonSpecies, regions, baseRegions } = await import('../src/data/gameData.js')
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
    assert.ok(location.unlock.requires.includes(hub.id), `${subArea.id} requires the hub`)
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

test('the Galar DLC areas are post-game regions gated on the Galar Champion', () => {
  for (const [id, regionId] of [
    ['galar-isle-of-armor', 'isle-of-armor'],
    ['galar-crown-tundra', 'crown-tundra'],
  ]) {
    const hub = mapData[id]
    assert.ok(hub, `${id} exists`)
    assert.equal(hub.type, 'zone')
    assert.equal(hub.region, regionId, `${id} belongs to its DLC region`)
    assert.deepEqual(hub.unlock, { championDefeated: 'galar' })
    assert.ok(hub.subAreas.length >= 2, `${id} has sub-areas`)
    for (const subArea of hub.subAreas) {
      assert.equal(mapData[subArea.id].hidden, true)
      assert.equal(mapData[subArea.id].region, regionId)
      assert.ok(encounterData[subArea.id]?.encounters?.length, `${subArea.id} has encounters`)
    }
    const region = regions.find((candidate) => candidate.id === regionId)
    assert.ok(region?.isDlc, `${regionId} is a DLC region`)
    assert.equal(region.parentRegion, 'galar')
    assert.ok(!region.league, `${regionId} has no gym league`)
    assert.ok(region.raidPool.length > 0, `${regionId} keeps a legendary raid island`)
    assert.ok(mapData[`${regionId}-raid`], `${regionId} has a Raid Island location`)
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

test('DLC regions never cost an Unlock Token', () => {
  const dlcIds = regions.filter((region) => region.isDlc).map((region) => region.id)
  assert.deepEqual(dlcIds, ['isle-of-armor', 'crown-tundra', 'kitakami', 'terarium'])
  for (const id of dlcIds) assert.ok(!baseRegions.some((region) => region.id === id))
})

test('DLC subregions group under their parent and link onto its map', () => {
  for (const region of regions.filter((candidate) => candidate.isDlc)) {
    assert.ok(
      baseRegions.some((candidate) => candidate.id === region.parentRegion),
      `${region.id} names a base-region parent`
    )
    const hub = mapData[region.entry]
    assert.ok(hub, `${region.id} has an entry hub`)
    assert.equal(hub.region, region.id)
    // The hub links back to a location in the parent region, so the Town Map
    // draws it on the parent map (and travel works) instead of its own tab.
    assert.ok(
      hub.connections.some((id) => (mapData[id]?.region ?? 'kanto') === region.parentRegion),
      `${region.id}'s hub links onto the ${region.parentRegion} map`
    )
  }
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

test('Paldea’s DLC areas are regions, and Area Zero stays a zone', () => {
  for (const [id, regionId] of [
    ['paldea-kitakami', 'kitakami'],
    ['paldea-terarium', 'terarium'],
  ]) {
    const hub = mapData[id]
    assert.ok(hub, `${id} exists`)
    assert.equal(hub.type, 'zone')
    assert.equal(hub.region, regionId)
    assert.deepEqual(hub.unlock, { championDefeated: 'paldea' })
    assert.ok(hub.subAreas.length >= 2, `${id} has sub-areas`)
    const region = regions.find((candidate) => candidate.id === regionId)
    assert.ok(region?.isDlc, `${regionId} is a DLC region`)
    assert.equal(region.parentRegion, 'paldea')
    assert.ok(region.raidPool.length > 0, `${regionId} keeps a legendary raid island`)
  }
  const areaZero = mapData['paldea-area-zero']
  assert.ok(areaZero, 'Area Zero still exists')
  assert.equal(areaZero.region, 'paldea', 'Area Zero is base-game Paldea')

  const paldea = regions.find((region) => region.id === 'paldea'),
    ordinary = paldea.raidPool.filter((entry) => !pokemonSpecies[entry.speciesKey]?.legendary)
  assert.deepEqual(ordinary, [], 'Paldea raid pool holds only legendaries')
})

test('Alola towns and facilities sit behind their island hub', () => {
  for (const location of Object.values(mapData)) {
    if ((location.region ?? 'kanto') !== 'alola') continue
    if (location.type !== 'town' && location.type !== 'facility') continue
    if (location.unlock?.entry) continue
    const requires = location.unlock?.requires ?? []
    assert.ok(
      requires.some((id) => mapData[id]?.type === 'zone'),
      `${location.id} should require an island hub`
    )
  }
})

test('Alola sub-areas have their own gates, not copies of the island', () => {
  const withoutRequires = (/** @type {any} */ unlock) => {
    const copy = { ...(unlock ?? {}) }
    delete copy.requires
    return JSON.stringify(copy)
  }
  for (const hub of Object.values(mapData)) {
    if (hub.type !== 'zone' || (hub.region ?? 'kanto') !== 'alola' || !hub.subAreas) continue
    for (const subArea of hub.subAreas) {
      const sub = mapData[subArea.id]
      if (!sub) continue
      assert.notEqual(
        withoutRequires(sub.unlock),
        withoutRequires(hub.unlock),
        `${subArea.id} should not just repeat ${hub.id}'s gate`
      )
    }
  }
})

test('zone sub-areas unlock in order behind their hub', () => {
  for (const hub of Object.values(mapData)) {
    if (hub.type !== 'zone' || !Array.isArray(hub.subAreas)) continue
    let previous = null
    for (const subArea of hub.subAreas) {
      const unlock = mapData[subArea.id]?.unlock
      assert.ok(unlock?.requires?.includes(hub.id), `${subArea.id} requires its hub ${hub.id}`)
      if (previous)
        assert.ok(
          unlock.requires.includes(previous),
          `${subArea.id} requires the previous sub-area ${previous}`
        )
      previous = subArea.id
    }
  }
})

test('zone sub-areas are chained by unlockOrder, not list position', () => {
  // The sub-area list must follow `unlockOrder`, the progress key the level
  // curve is built from. Paldea's provinces were listed in plain numeric order,
  // so chaining the list put Area Three before Area Two and made West Province
  // (Area Three) look like the next goal while it was actually gated far ahead.
  for (const hub of Object.values(mapData)) {
    if (hub.type !== 'zone' || !Array.isArray(hub.subAreas)) continue
    const orders = hub.subAreas.map((subArea) => mapData[subArea.id]?.unlockOrder ?? 0)
    for (let index = 1; index < orders.length; index++)
      assert.ok(
        orders[index] >= orders[index - 1],
        `${hub.id} sub-areas should ascend in unlockOrder (${orders.join(', ')})`
      )
  }
})

test('no unlock gate waits on a location that waits on it', () => {
  // A `battlesAtLocation` gate closes an implicit edge in the unlock graph: if
  // South Province (Area Five) asks for wins in (Area Six) while (Area Six)
  // needs (Area Five), neither can ever unlock.
  const requiresClosure = (/** @type {string} */ start) => {
    const seen = new Set()
    const stack = [...(mapData[start]?.unlock?.requires ?? [])]
    while (stack.length > 0) {
      const id = stack.pop()
      if (seen.has(id) || !mapData[id]) continue
      seen.add(id)
      for (const next of mapData[id].unlock?.requires ?? []) stack.push(next)
    }
    return seen
  }
  for (const [id, location] of Object.entries(mapData))
    for (const gate of location.unlock?.battlesAtLocation ?? [])
      assert.ok(
        !requiresClosure(gate.locationId).has(id),
        `${id} asks for wins at ${gate.locationId}, which is gated behind it`
      )
})

test('every hidden sub-area has a visible zone hub to focus the map on', () => {
  // The Town Map cannot draw a hidden sub-area, so when the player stands on
  // one (starting in Alola/Paldea) it focuses the parent zone hub instead. A
  // missing or hidden hub would leave the camera on empty space and the map
  // looking blank.
  for (const [id, location] of Object.entries(mapData)) {
    if (!location.hidden) continue
    const hub = location.zone ? mapData[location.zone] : null
    assert.ok(hub, `${id} names a zone hub`)
    assert.equal(hub.type, 'zone', `${id}'s hub is a zone node`)
    assert.ok(!hub.hidden, `${id}'s hub is not hidden from the map`)
  }
})

test('Alola routes and Paldea provinces are grouped into zones', () => {
  for (const id of [
    'alola-melemele-island',
    'alola-akala-island',
    'alola-ulaula-island',
    'alola-poni-island',
    'paldea-south-province',
    'paldea-west-province',
    'paldea-east-province',
    'paldea-north-province',
  ]) {
    const hub = mapData[id]
    assert.ok(hub, `${id} exists`)
    assert.equal(hub.type, 'zone')
    assert.ok(hub.subAreas.length >= 2, `${id} groups several areas`)
    for (const subArea of hub.subAreas) {
      assert.equal(mapData[subArea.id].hidden, true, `${subArea.id} is hidden`)
      assert.equal(mapData[subArea.id].zone, id)
      assert.ok(encounterData[subArea.id]?.encounters?.length, `${subArea.id} has encounters`)
    }
  }
})
