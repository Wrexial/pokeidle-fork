import { test } from 'node:test'
import assert from 'node:assert/strict'

import { installGameData } from './helpers/game-data.mjs'

installGameData()

const {
  MARKET_COMMODITIES,
  MARKET_PRICE_SWING,
  marketCommodityById,
  marketQuoteFor,
  marketQuotesFor,
} = await import('../src/data/market.js')
const { gameReducer, initialGameState } = await import('../src/game/reducer.js')
const { marketStockFor } = await import('../src/game/shop.js')
const { APRICORN_IDS, consumableItems, heldItems } = await import('../src/data/items.js')

/** The `YYYY-MM-DD` key `days` after `dateKey`. @param {string} dateKey @param {number} days */
function shift(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

test('the market trades only real, renewable commodities', () => {
  assert.ok(MARKET_COMMODITIES.length >= 10, 'a market full of commodities')
  for (const commodity of MARKET_COMMODITIES) {
    assert.ok(
      consumableItems[commodity.itemId] || heldItems[commodity.itemId],
      `${commodity.itemId} should be a real item`
    )
    assert.ok(commodity.basePrice > 0, `${commodity.itemId} needs a base price`)
    assert.equal(
      marketCommodityById[commodity.itemId].basePrice,
      commodity.basePrice,
      `${commodity.itemId} should be indexed`
    )
  }
  // Every Apricorn is tradeable.
  for (const apricornId of APRICORN_IDS)
    assert.ok(marketCommodityById[apricornId], `${apricornId} should be on the market`)
})

test('marketQuoteFor is deterministic and swings within its band', () => {
  const quote = marketQuoteFor('oranBerry', '2024-06-15')
  assert.deepEqual(quote, marketQuoteFor('oranBerry', '2024-06-15'))
  assert.equal(marketQuoteFor('nonsense', '2024-06-15'), null)
  const seen = new Set()
  for (let day = 1; day <= 28; day++) {
    const dateKey = `2024-06-${String(day).padStart(2, '0')}`,
      current = marketQuoteFor('oranBerry', dateKey)
    seen.add(current.price)
    assert.equal(current.price % 5, 0, 'prices round to clean 5-coin figures')
    assert.ok(current.buyPrice > 0 && current.sellPrice > 0)
    assert.ok(current.sellPrice <= current.buyPrice, 'the market buys back below its price')
    const ratio = current.price / current.basePrice
    assert.ok(
      ratio >= 1 - MARKET_PRICE_SWING - 1e-9 && ratio <= 1 + MARKET_PRICE_SWING + 1e-9,
      `${dateKey} swung outside the band (${current.price})`
    )
  }
  assert.ok(seen.size > 5, 'the price actually moves across a month')
})

test('marketQuotesFor covers every commodity in table order', () => {
  const quotes = marketQuotesFor('2024-06-15')
  assert.deepEqual(
    quotes.map((quote) => quote.itemId),
    MARKET_COMMODITIES.map((commodity) => commodity.itemId)
  )
})

test('BUY_MARKET_ITEM charges the daily price and SELL_MARKET_ITEM pays the sell price', () => {
  const dateKey = '2024-06-15',
    quote = marketQuoteFor('oranBerry', dateKey),
    base = { ...initialGameState, money: 1e6, inventory: {} },
    bought = gameReducer(base, {
      type: 'BUY_MARKET_ITEM',
      payload: { itemId: 'oranBerry', quantity: 3, dateKey },
    })
  assert.equal(bought.money, 1e6 - quote.buyPrice * 3)
  assert.equal(bought.inventory.oranBerry, 3)

  const sold = gameReducer(bought, {
    type: 'SELL_MARKET_ITEM',
    payload: { itemId: 'oranBerry', quantity: 2, dateKey },
  })
  assert.equal(sold.money, bought.money + quote.sellPrice * 2)
  assert.equal(sold.inventory.oranBerry, 1)

  // Overselling is clamped to what is held, and overspending is refused.
  const oversold = gameReducer(sold, {
    type: 'SELL_MARKET_ITEM',
    payload: { itemId: 'oranBerry', quantity: 99, dateKey },
  })
  assert.equal(oversold.inventory.oranBerry ?? 0, 0)
  assert.equal(oversold.money, sold.money + quote.sellPrice)

  const broke = { ...base, money: quote.buyPrice - 1 }
  assert.equal(
    gameReducer(broke, {
      type: 'BUY_MARKET_ITEM',
      payload: { itemId: 'oranBerry', quantity: 1, dateKey },
    }),
    broke,
    'a purchase you cannot afford is a no-op'
  )
  // An item the market does not trade is a no-op on both sides.
  assert.equal(
    gameReducer(base, {
      type: 'BUY_MARKET_ITEM',
      payload: { itemId: 'potion', quantity: 1, dateKey },
    }),
    base
  )
  assert.equal(
    gameReducer(
      { ...base, inventory: { potion: 1 } },
      { type: 'SELL_MARKET_ITEM', payload: { itemId: 'potion', quantity: 1, dateKey } }
    ).inventory.potion,
    1
  )
})

test('marketStockFor joins prices with names and holdings', () => {
  const rows = marketStockFor({ ...initialGameState, inventory: { oranBerry: 4 } }, '2024-06-15')
  assert.deepEqual(
    rows.map((row) => row.itemId),
    MARKET_COMMODITIES.map((commodity) => commodity.itemId)
  )
  const oran = rows.find((row) => row.itemId === 'oranBerry')
  assert.equal(oran.name, 'Oran Berry')
  assert.equal(oran.owned, 4)
  assert.equal(oran.buyPrice, marketQuoteFor('oranBerry', '2024-06-15').buyPrice)
})

test('buying on a low day and selling on a high day turns a profit', () => {
  let found = null
  for (let start = 0; start < 60 && !found; start++) {
    const buyKey = shift('2024-01-01', start),
      buy = marketQuoteFor('sitrusBerry', buyKey)
    for (let ahead = 1; ahead <= 14; ahead++) {
      const sellKey = shift(buyKey, ahead),
        sell = marketQuoteFor('sitrusBerry', sellKey)
      if (sell.sellPrice > buy.buyPrice) {
        found = { buy, sell, buyKey, sellKey }
        break
      }
    }
  }
  assert.ok(found, 'some window should let you buy low and sell high')
  const startMoney = found.buy.buyPrice * 5,
    bought = gameReducer(
      { ...initialGameState, money: startMoney, inventory: {} },
      {
        type: 'BUY_MARKET_ITEM',
        payload: { itemId: 'sitrusBerry', quantity: 5, dateKey: found.buyKey },
      }
    ),
    sold = gameReducer(bought, {
      type: 'SELL_MARKET_ITEM',
      payload: { itemId: 'sitrusBerry', quantity: 5, dateKey: found.sellKey },
    })
  assert.equal(sold.inventory.sitrusBerry ?? 0, 0)
  assert.ok(sold.money > startMoney, 'selling high beats the buy price')
})
