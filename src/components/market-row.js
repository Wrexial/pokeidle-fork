// One row of the Berry / commodity market. Every commodity offers a buy and a
// sell action at the day's price, plus how far that price moved since
// yesterday, so the player can buy low and sell high across days.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { ItemIcon } from './item-icon.js'

/**
 * The arrow + severity class for a price move.
 * @param {number} change
 * @returns {{ glyph: string, className: 'up' | 'down' | 'flat', label: string }}
 */
function trendFor(change) {
  const percent = Math.round(Math.abs(change) * 100)
  if (percent <= 0)
    return { glyph: '\u2013', className: 'flat', label: 'unchanged from yesterday' }
  return change > 0
    ? { glyph: '\u25b2', className: 'up', label: `up ${percent}% from yesterday` }
    : { glyph: '\u25bc', className: 'down', label: `down ${percent}% from yesterday` }
}

/** @param {{ itemId: string, name: string, owned: number, buyPrice: number, sellPrice: number, change: number, money: number, qtyMode: number | 'max', dateKey: string, dispatch: (action: GameAction) => void }} props */
export function MarketRow({
  itemId,
  name,
  owned,
  buyPrice,
  sellPrice,
  change,
  money,
  qtyMode,
  dateKey,
  dispatch,
}) {
  const canAfford = money >= buyPrice,
    buyQuantity = qtyMode === 'max' ? Math.max(1, Math.floor(money / buyPrice)) : qtyMode,
    buyTotal = buyPrice * buyQuantity,
    sellQuantity = qtyMode === 'max' ? owned : Math.min(qtyMode, owned),
    sellTotal = sellPrice * sellQuantity,
    trend = trendFor(change),
    buy = React.useCallback(() => {
      money >= buyTotal &&
        dispatch({
          type: 'BUY_MARKET_ITEM',
          payload: { itemId, quantity: buyQuantity, dateKey },
        })
    }, [money, buyTotal, buyQuantity, dispatch, itemId, dateKey]),
    sell = React.useCallback(() => {
      sellQuantity > 0 &&
        dispatch({
          type: 'SELL_MARKET_ITEM',
          payload: { itemId, quantity: sellQuantity, dateKey },
        })
    }, [sellQuantity, dispatch, itemId, dateKey])
  return jsxs('div', {
    className: 'shop-item-row market-item-row',
    children: [
      jsx(ItemIcon, { itemId }),
      jsxs('div', {
        className: 'shop-item-info',
        children: [
          jsx('span', {
            className: 'shop-item-name',
            children: name,
          }),
          jsxs('span', {
            className: 'shop-item-desc',
            children: [
              `Buy $${buyPrice.toLocaleString()} \u00b7 Sell $${sellPrice.toLocaleString()} `,
              jsxs('span', {
                className: `market-trend ${trend.className}`,
                title: `Price is ${trend.label}.`,
                children: [trend.glyph, ` ${Math.round(Math.abs(change) * 100)}%`],
              }),
            ],
          }),
        ],
      }),
      jsxs('span', {
        className: 'shop-owned',
        children: ['x', owned],
      }),
      jsxs('div', {
        className: 'market-item-actions',
        children: [
          jsx('button', {
            className: `shop-buy-btn${canAfford ? '' : ' disabled'}`,
            disabled: !canAfford,
            onClick: buy,
            children: `BUY $${buyTotal.toLocaleString()}`,
          }),
          jsx('button', {
            className: `shop-sell-btn${sellQuantity > 0 ? '' : ' disabled'}`,
            disabled: sellQuantity <= 0,
            onClick: sell,
            children: `SELL +$${sellTotal.toLocaleString()}`,
          }),
        ],
      }),
    ],
  })
}
