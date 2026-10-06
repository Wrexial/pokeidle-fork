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

test('the Galar DLC areas are post-game zones in Galar, gated on the Galar Champion', () => {
  for (const id of ['galar-isle-of-armor', 'galar-crown-tundra']) {
    const hub = mapData[id]
    assert.ok(hub, `${id} exists`)
    assert.equal(hub.type, 'zone')
    assert.equal(hub.region, 'galar', `${id} belongs to Galar`)
    assert.deepEqual(hub.unlock, { championDefeated: 'galar' })
    assert.ok(hub.subAreas.length >= 2, `${id} has sub-areas`)
    for (const subArea of hub.subAreas) {
      assert.equal(mapData[subArea.id].hidden, true)
      assert.equal(mapData[subArea.id].region, 'galar')
      assert.ok(encounterData[subArea.id]?.encounters?.length, `${subArea.id} has encounters`)
    }
    // The DLC is a zone now, not its own region, and has no Raid Island.
    assert.ok(!regions.some((region) => region.id === id.replace('galar-', '')))
    assert.ok(!mapData[`${id}-raid`], `${id} has no Raid Island`)
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
  // There are currently no `isDlc` subregions (the Galar/Paldea DLC and the
  // Sevii Islands are ordinary zones now); if one is ever added it must not be
  // counted among the regions an Unlock Token opens.
  const dlcIds = regions.filter((region) => region.isDlc).map((region) => region.id)
  assert.deepEqual(dlcIds, [])
  for (const id of dlcIds) assert.ok(!baseRegions.some((region) => region.id === id))
})

test('Alola\u2019s islands stand alone on the Town Map', () => {
  // The long roads from Poni Island out to the Alola League and the Raid
  // Island crossed the water between islands; the Town Map drops them so each
  // island reads as its own landmass (travel is direct either way).
  const poni = mapData['alola-poni-island']
  assert.ok(!poni.connections.includes('alola-league'), 'no Poni -> League road')
  assert.ok(!poni.connections.includes('alola-raid'), 'no Poni -> Raid Island road')
})

test('Kanto\u2019s Sevii Islands are a zone on the Kanto map', () => {
  const hub = mapData['sevii-islands']
  assert.ok(hub, 'the Sevii hub exists')
  assert.equal(hub.type, 'zone')
  assert.equal(hub.region, 'kanto')
  assert.deepEqual(hub.unlock, { championDefeated: 'kanto' })
  assert.ok(hub.subAreas.length >= 20, 'the hub groups every island area')
  assert.ok(!regions.some((region) => region.id === 'sevii-islands'), 'not a separate region')
  assert.ok(!mapData['sevii-islands-raid'], 'no Raid Island of its own')
  // The port enters the hub, and the hub the first island.
  assert.ok(mapData['vermilionCity'].connections.includes('sevii-islands'))
  assert.ok(hub.connections.includes('sevii-islands-one-island'))
  // Each island keeps its internal roads; the long inter-island links are gone
  // so the focused zone view reads as island shapes.
  assert.ok(
    mapData['sevii-islands-three-island'].connections.includes('sevii-islands-bond-bridge'),
    'an island road is kept'
  )
  assert.ok(
    !mapData['sevii-islands-one-island'].connections.includes('sevii-islands-two-island'),
    'the One Island -> Two Island link is removed'
  )
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

test('Paldea’s DLC areas are zones in Paldea, and Area Zero stays a zone', () => {
  for (const [id, raidId] of [
    ['paldea-kitakami', 'kitakami-raid'],
    ['paldea-terarium', 'terarium-raid'],
  ]) {
    const hub = mapData[id]
    assert.ok(hub, `${id} exists`)
    assert.equal(hub.type, 'zone')
    assert.equal(hub.region, 'paldea')
    assert.deepEqual(hub.unlock, { championDefeated: 'paldea' })
    assert.ok(hub.subAreas.length >= 2, `${id} has sub-areas`)
    assert.ok(!regions.some((region) => region.id === id.replace('paldea-', '')), `${id} is not a region`)
    assert.ok(!mapData[raidId], `${id} has no Raid Island`)
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
