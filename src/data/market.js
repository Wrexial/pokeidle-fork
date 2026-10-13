// Berry / commodity market: a small, renewable set of Berries and Apricorns
// whose buy and sell prices drift once per real calendar day. Like the daily
// events (`daily-events.js`) the swing is seeded from the date string, so it is
// the same for everyone, survives a reload and needs no stored state. The market
// is deliberately optional: nothing in progression reads a price, so ignoring it
// never blocks normal play.

import { hashString, todayKey } from './daily-events.js'
import { APRICORN_IDS } from './items.js'

/** How far a daily price can swing from its base (0.35 -> 65%-135%). */
export const MARKET_PRICE_SWING = 0.35

/** The cut the market takes when buying a commodity back (share of the price). */
export const MARKET_SELL_SPREAD = 0.9

/**
 * The traded commodities and their stable base price. Berries come from the
 * Berry Garden and Apricorns from route foraging, so both are renewable.
 * @type {{ itemId: string, basePrice: number }[]}
 */
export const MARKET_COMMODITIES = [
  { itemId: 'oranBerry', basePrice: 120 },
  { itemId: 'sitrusBerry', basePrice: 1000 },
  { itemId: 'lumBerry', basePrice: 1000 },
  ...APRICORN_IDS.map((itemId) => ({ itemId, basePrice: 250 })),
]

/** @type {Record<string, { itemId: string, basePrice: number }>} */
export const marketCommodityById = Object.fromEntries(
  MARKET_COMMODITIES.map((commodity) => [commodity.itemId, commodity])
)

/**
 * The date key `days` days after `dateKey` (negative days go back), used to
 * compare a price with the day before it.
 * @param {string} dateKey
 * @param {number} days
 * @returns {string}
 */
function shiftDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return todayKey(new Date(year, month - 1, day + days))
}

/**
 * A commodity's unrounded daily price for `dateKey`: a stable 65%-135% swing
 * seeded from the date and the item id together, so every commodity moves on
 * its own.
 * @param {string} itemId
 * @param {string} dateKey
 * @returns {number}
 */
function dailyPrice(itemId, dateKey) {
  const commodity = marketCommodityById[itemId],
    roll = (hashString(`${dateKey}:${itemId}`) % 1000) / 1000,
    factor = 1 + MARKET_PRICE_SWING * (roll * 2 - 1)
  return Math.max(5, Math.round((commodity.basePrice * factor) / 5) * 5)
}

/**
 * Build a quote for a known commodity. Assumes the id is in the table.
 * @param {string} itemId
 * @param {string} dateKey
 * @returns {{ itemId: string, basePrice: number, price: number, buyPrice: number, sellPrice: number, previousPrice: number, change: number }}
 */
function buildQuote(itemId, dateKey) {
  const price = dailyPrice(itemId, dateKey),
    previousPrice = dailyPrice(itemId, shiftDateKey(dateKey, -1))
  return {
    itemId,
    basePrice: marketCommodityById[itemId].basePrice,
    price,
    buyPrice: price,
    sellPrice: Math.max(1, Math.floor(price * MARKET_SELL_SPREAD)),
    previousPrice,
    change: previousPrice > 0 ? (price - previousPrice) / previousPrice : 0,
  }
}

/**
 * The full quote for one commodity on a date: the buy price (the market price),
 * the lower sell price and how it moved since yesterday. Returns null for an
 * item the market does not trade.
 * @param {string} itemId
 * @param {string} [dateKey]
 * @returns {{ itemId: string, basePrice: number, price: number, buyPrice: number, sellPrice: number, previousPrice: number, change: number } | null}
 */
export function marketQuoteFor(itemId, dateKey = todayKey()) {
  return marketCommodityById[itemId] ? buildQuote(itemId, dateKey) : null
}

/**
 * Every commodity's quote for a date, in table order.
 * @param {string} [dateKey]
 * @returns {{ itemId: string, basePrice: number, price: number, buyPrice: number, sellPrice: number, previousPrice: number, change: number }[]}
 */
export function marketQuotesFor(dateKey = todayKey()) {
  return MARKET_COMMODITIES.map((commodity) => buildQuote(commodity.itemId, dateKey))
}
