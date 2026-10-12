import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const { POSTGAME_HUBS, postgameHubFor } = await import('../src/data/postgame-hubs.js')
const { mapData } = await import('../src/data/gameData.js')
const { consumableItems, evolutionItems, heldItems, pokeBalls, coreMartItems } =
  await import('../src/data/items.js')

/** @param {string} itemId */
function isKnownItem(itemId) {
  return Boolean(
    consumableItems[itemId] || evolutionItems[itemId] || heldItems[itemId] || pokeBalls[itemId]
  )
}

test('each post-game hub sits on a real zone with sub-areas', () => {
  const ids = Object.keys(POSTGAME_HUBS)
  assert.ok(ids.includes('hisui'), 'Hisui has a hub')
  assert.ok(ids.includes('lumiose-wild-zones'), 'the Lumiose Wild Zones have a hub')
  for (const [locationId, hub] of Object.entries(POSTGAME_HUBS)) {
    const location = mapData[locationId]
    assert.ok(location, `${locationId} is a real location`)
    assert.equal(location.type, 'zone', `${locationId} is a zone`)
    assert.ok((location.subAreas ?? []).length > 0, `${locationId} has areas to travel to`)
    assert.equal(postgameHubFor(locationId), hub, 'the lookup resolves the hub')
    assert.equal(hub.id, locationId)
    // Themed presentation fields the modal renders.
    for (const field of ['name', 'subtitle', 'icon', 'background', 'greeting', 'description'])
      assert.equal(typeof hub[field], 'string', `${locationId}.${field} is a string`)
    assert.ok(hub.background.startsWith('/backgrounds/'), 'the hub names a backdrop')
  }
  // A non-hub location has no hub.
  assert.equal(postgameHubFor('route22'), null)
  assert.equal(postgameHubFor(undefined), null)
})

test('every hub shop item is real and buyable', () => {
  for (const [locationId, hub] of Object.entries(POSTGAME_HUBS)) {
    assert.ok(hub.shop.items.length > 0, `${locationId} sells something`)
    assert.equal(typeof hub.shop.name, 'string')
    for (const entry of hub.shop.items) {
      assert.ok(isKnownItem(entry.itemId), `${locationId} sells a real item (${entry.itemId})`)
      const price =
        consumableItems[entry.itemId]?.buyPrice ??
        heldItems[entry.itemId]?.buyPrice ??
        pokeBalls[entry.itemId]?.buyPrice
      assert.ok(
        typeof price === 'number' && price > 0,
        `${locationId}'s ${entry.itemId} is buyable`
      )
    }
  }
})

test('the hub shops add something beyond the shared core mart', () => {
  const core = new Set(coreMartItems.map((entry) => entry.itemId))
  for (const [locationId, hub] of Object.entries(POSTGAME_HUBS)) {
    assert.ok(
      hub.shop.items.some((entry) => !core.has(entry.itemId)),
      `${locationId}'s shop is not just the core stock`
    )
  }
})
