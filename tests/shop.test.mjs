import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  activeItems,
  consumableItems,
  coreMartItems,
  evolutionItems,
  heldItems,
  pokeBalls,
  martShopItems,
  regionalMartItems,
  tokenShopItems,
} = await import('../src/data/items.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { isActiveEffectItem } = await import('../src/game/progression.js')

const allStandardItems = [
    ...coreMartItems,
    ...Object.values(regionalMartItems).flat(),
  ],
  /** @param {string} id */
  known = (id) =>
    activeItems[id] || consumableItems[id] || heldItems[id] || evolutionItems[id] || pokeBalls[id]

test('every shop entry resolves to a known item', () => {
  for (const entry of allStandardItems) assert.ok(known(entry.itemId), `mart ${entry.itemId}`)
  for (const [location, shop] of Object.entries(martShopItems))
    for (const entry of shop.items) assert.ok(known(entry.itemId), `${location} ${entry.itemId}`)
  for (const entry of tokenShopItems)
    assert.ok(known(entry.itemId ?? entry.id), `token shop ${entry.itemId ?? entry.id}`)
})

test('every mart item has a row the shop panel can render', () => {
  // ShopPanel branches on these tables; a held item with no branch would be
  // listed in the mart but silently dropped (the bug this guards against).
  for (const entry of allStandardItems) {
    const id = entry.itemId
    assert.ok(
      isActiveEffectItem(id) || consumableItems[id] || heldItems[id] || pokeBalls[id],
      `${id} is sold but has no shop row`
    )
  }
})

test('regions sell distinct advanced stock', () => {
  const seen = new Map()
  for (const [region, entries] of Object.entries(regionalMartItems)) {
    assert.ok(entries.length > 0, `${region} should have some advanced stock`)
    for (const { itemId } of entries) {
      assert.ok(!seen.has(itemId), `${itemId} is sold in both ${seen.get(itemId)} and ${region}`)
      seen.set(itemId, region)
      assert.ok(
        !coreMartItems.some((entry) => entry.itemId === itemId),
        `${itemId} is in both the core and ${region}`
      )
    }
  }
})

test('every held battle item is sold by exactly one region', () => {
  const sold = Object.values(regionalMartItems)
    .flat()
    .map((entry) => entry.itemId)
    .filter((itemId) => heldItems[itemId])
  for (const itemId of Object.keys(heldItems))
    assert.ok(sold.includes(itemId), `${itemId} is sold by no region`)
  assert.equal(new Set(sold).size, sold.length, 'a held item is sold by two regions')
})

test('BUY_ITEM buys a held battle item into the bag', () => {
  const price = heldItems.leftovers.buyPrice,
    state = { ...initialGameState, money: price + 50, inventory: {} },
    bought = gameReducer(state, {
      type: 'BUY_ITEM',
      payload: { itemId: 'leftovers', quantity: 1 },
    })
  assert.equal(bought.money, 50)
  assert.equal(bought.inventory.leftovers, 1)
})
