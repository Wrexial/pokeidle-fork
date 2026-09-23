import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  activeItems,
  consumableItems,
  evolutionItems,
  heldItems,
  pokeBalls,
  standardMartItems,
  martShopItems,
  tokenShopItems,
} = await import('../src/data/items.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { isActiveEffectItem } = await import('../src/game/progression.js')

/** @param {string} id */
const known = (id) =>
  activeItems[id] || consumableItems[id] || heldItems[id] || evolutionItems[id] || pokeBalls[id]

test('every shop entry resolves to a known item', () => {
  for (const entry of standardMartItems)
    assert.ok(known(entry.itemId), `standard mart ${entry.itemId}`)
  for (const [location, shop] of Object.entries(martShopItems))
    for (const entry of shop.items) assert.ok(known(entry.itemId), `${location} ${entry.itemId}`)
  for (const entry of tokenShopItems)
    assert.ok(known(entry.itemId ?? entry.id), `token shop ${entry.itemId ?? entry.id}`)
})

test('every standard-mart item has a row the shop panel can render', () => {
  // ShopPanel branches on these tables; a held item with no branch would be
  // listed in the mart but silently dropped (the bug this guards against).
  for (const entry of standardMartItems) {
    const id = entry.itemId
    assert.ok(
      isActiveEffectItem(id) || consumableItems[id] || heldItems[id] || pokeBalls[id],
      `${id} is sold but has no shop row`
    )
  }
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
