import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { SERVICE_POIS, CAFE_MENUS, cafeFor, servicePoiKinds, servicePoisFor } = await import('../src/game/services.js')
const { DAYCARE_LOCATIONS } = await import('../src/data/config.js')
const { mapData, regions } = await import('../src/data/gameData.js')

test('every Day-Care route carries a service POI marker', () => {
  for (const region of regions) {
    // DLC expansions reuse their parent region's Day-Care.
    if (region.isDlc) continue
    const locationId = DAYCARE_LOCATIONS[region.id]
    assert.ok(locationId, `${region.id} has a Day-Care route`)
    assert.ok(mapData[locationId], `${locationId} exists on the map`)
    assert.ok(
      servicePoisFor(locationId).some((poi) => poi.kind === 'daycare'),
      `${locationId} is marked as a Day-Care`
    )
  }
})

test('service POIs only sit on real map locations and carry a label', () => {
  for (const [locationId, pois] of Object.entries(SERVICE_POIS)) {
    assert.ok(mapData[locationId], `POI location ${locationId} exists on the map`)
    assert.ok(pois.length > 0, `${locationId} has at least one marker`)
    for (const poi of pois) {
      assert.ok(poi.kind && poi.icon && poi.label, `${locationId}'s markers are complete`)
    }
  }
})

test('servicePoisFor tolerates an unknown or missing location', () => {
  assert.deepEqual(servicePoisFor('not-a-place'), [])
  assert.deepEqual(servicePoisFor(undefined), [])
})

test('the facilities beyond the Day-Care carry markers too', () => {
  assert.ok(
    servicePoisFor('alola-poke-pelago').some((poi) => poi.kind === 'berryGarden'),
    'the Poke Pelago is marked as the Berry Garden'
  )
  assert.ok(
    servicePoisFor('hoenn-route-111').some((poi) => poi.kind === 'battleTower'),
    'the Battle Tower is marked on its route'
  )
  assert.ok(
    servicePoisFor('raidIsland').some((poi) => poi.kind === 'raidDen'),
    'Kanto\u2019s Raid Island is marked as a Raid Den'
  )
  assert.ok(
    servicePoisFor('johto-ruins-of-alph').some((poi) => poi.kind === 'shrine'),
    'the Ruins of Alph are a legendary shrine'
  )
})

test('servicePoiKinds lists each marker kind once', () => {
  const kinds = servicePoiKinds(),
    ids = kinds.map((entry) => entry.kind)
  assert.equal(ids.length, new Set(ids).size, 'no duplicate kinds')
  for (const kind of ['daycare', 'berryGarden', 'battleTower', 'raidDen', 'shrine', 'cafe'])
    assert.ok(ids.includes(kind), `${kind} is listed`)
})

test('every cafe sits on a real location with a menu', () => {
  for (const [locationId, menu] of Object.entries(CAFE_MENUS)) {
    assert.ok(mapData[locationId], `${locationId} exists on the map`)
    assert.ok(menu.name && menu.items.length > 0, `${locationId} has a menu`)
    for (const entry of menu.items)
      assert.ok(entry.itemId && entry.price > 0, `${locationId} prices its items`)
    assert.ok(
      servicePoisFor(locationId).some((poi) => poi.kind === 'cafe'),
      `${locationId} carries a cafe marker`
    )
  }
  assert.equal(cafeFor('kalos-lumiose-city')?.items.length, 2)
  assert.equal(cafeFor('not-a-place'), null)
  assert.equal(cafeFor(undefined), null)
})
