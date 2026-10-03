import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { SERVICE_POIS, servicePoisFor } = await import('../src/game/services.js')
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
