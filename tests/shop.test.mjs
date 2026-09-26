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
const { getItemSellPrice, isActiveEffectItem, itemTooltip } = await import('../src/game/progression.js')
const { regionMartIds, regionalStockForMart } = await import('../src/game/shop.js')

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

test('marts split the region advanced stock instead of all selling it', () => {
  for (const [region, entries] of Object.entries(regionalMartItems)) {
    const marts = regionMartIds(region)
    if (entries.length <= 1 || marts.length <= 1) continue
    const stocks = marts.map((id) => regionalStockForMart(region, id).map((entry) => entry.itemId)),
      full = entries.length
    for (const stock of stocks)
      assert.ok(stock.length < full, `${region} mart sells the whole regional list`)
    assert.ok(
      stocks.some(
        (stock, index) => stock.join(',') !== stocks[(index + 1) % stocks.length].join(',')
      ),
      `${region} marts all sell the same shelves`
    )
    const covered = new Set(stocks.flat())
    for (const { itemId } of entries)
      assert.ok(covered.has(itemId), `${itemId} is sold by no ${region} mart`)
  }
})

test('buying balls awards a free Premier Ball per 10', () => {
  const state = { ...initialGameState, money: 1e6, inventory: {} },
    nine = gameReducer(state, { type: 'BUY_ITEM', payload: { itemId: 'pokeball', quantity: 9 } }),
    ten = gameReducer(state, { type: 'BUY_ITEM', payload: { itemId: 'pokeball', quantity: 10 } }),
    hundred = gameReducer(state, {
      type: 'BUY_ITEM',
      payload: { itemId: 'ultraball', quantity: 100 },
    })
  assert.equal(nine.inventory.premierball ?? 0, 0)
  assert.equal(ten.inventory.pokeball, 10)
  assert.equal(ten.inventory.premierball, 1)
  assert.equal(hundred.inventory.ultraball, 100)
  assert.equal(hundred.inventory.premierball, 10)
})

test('the Premier Ball cannot be bought', () => {
  assert.equal(pokeBalls.premierball.buyPrice, null)
  assert.ok(!coreMartItems.some((entry) => entry.itemId === 'premierball'))
  const state = { ...initialGameState, money: 1e6, inventory: {} },
    bought = gameReducer(state, {
      type: 'BUY_ITEM',
      payload: { itemId: 'premierball', quantity: 1 },
    })
  assert.equal(bought, state, 'a Premier Ball purchase is a no-op')
})

test('the situational balls are factory-only, not sold or buyable', () => {
  const sold = new Set([
      ...coreMartItems.map((entry) => entry.itemId),
      ...Object.values(regionalMartItems)
        .flat()
        .map((entry) => entry.itemId),
      ...Object.values(martShopItems).flatMap((shop) => shop.items.map((entry) => entry.itemId)),
    ]),
    specialBalls = [
      'quickball',
      'timerball',
      'repeatball',
      'netball',
      'diveball',
      'duskball',
      'nestball',
    ]
  for (const ballId of specialBalls) {
    assert.equal(pokeBalls[ballId].buyPrice, null, `${ballId} is not for sale`)
    assert.ok(!sold.has(ballId), `${ballId} should not appear in any mart`)
    const state = { ...initialGameState, money: 1e6, inventory: {} },
      bought = gameReducer(state, {
        type: 'BUY_ITEM',
        payload: { itemId: ballId, quantity: 1 },
      })
    assert.equal(bought, state, `${ballId} purchase is a no-op`)
  }
})

test('TOGGLE_MART_COLLAPSED persists the mart collapse state', () => {
  const collapsed = gameReducer(initialGameState, { type: 'TOGGLE_MART_COLLAPSED' })
  assert.equal(collapsed.martCollapsed, true)
  assert.equal(gameReducer(collapsed, { type: 'TOGGLE_MART_COLLAPSED' }).martCollapsed, false)
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

test('item tooltips name the item and describe its effect', () => {
  const tip = itemTooltip('leftovers')
  assert.match(tip, /^Leftovers\n/)
  assert.match(tip, /Restores 1\/16/)
  assert.equal(itemTooltip('silkScarf'), 'Silk Scarf\nPowers up Normal-type moves.')
})

test('only valuables can be sold back to a mart', () => {
  const valuables = Object.values(consumableItems).filter(
    (item) => item.category === 'valuables'
  )
  assert.ok(valuables.length > 0, 'expected some valuables to sell')
  for (const item of valuables)
    assert.equal(getItemSellPrice(item.id), item.sellPrice, `${item.id} should be sellable`)

  for (const item of Object.values(consumableItems).filter(
    (candidate) => candidate.category !== 'valuables'
  ))
    assert.equal(getItemSellPrice(item.id), null, `${item.id} should not be sellable`)
  for (const itemId of Object.keys(heldItems))
    assert.equal(getItemSellPrice(itemId), null, `${itemId} should not be sellable`)

  const valuable = valuables[0],
    state = { ...initialGameState, money: 0, inventory: { [valuable.id]: 2, potion: 3 } },
    soldValuable = gameReducer(state, {
      type: 'SELL_ITEM',
      payload: { itemId: valuable.id, quantity: 1 },
    })
  assert.equal(soldValuable.money, valuable.sellPrice)
  assert.equal(soldValuable.inventory[valuable.id], 1)
  assert.equal(soldValuable.inventory.potion, 3)

  const soldPotion = gameReducer(state, {
    type: 'SELL_ITEM',
    payload: { itemId: 'potion', quantity: 1 },
  })
  assert.equal(soldPotion, state, 'selling a potion is a no-op')

  const soldHeldItem = gameReducer(state, {
    type: 'SELL_ITEM',
    payload: { itemId: 'leftovers', quantity: 1 },
  })
  assert.equal(soldHeldItem, state, 'selling a held item is a no-op')
})
