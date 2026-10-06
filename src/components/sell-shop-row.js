// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { ItemIcon } from './item-icon.js'

/** @param {{ itemId: string, name: string, sellPrice: number, owned: number, qtyMode: number | 'max', dispatch: (action: GameAction) => void }} props */
export function SellShopRow({ itemId, name, sellPrice, owned, qtyMode, dispatch }) {
  const quantity = qtyMode === 'max' ? owned : Math.min(qtyMode, owned),
    total = sellPrice * quantity,
    sell = React.useCallback(() => {
      quantity > 0 &&
        dispatch({
          type: 'SELL_ITEM',
          payload: {
            itemId,
            quantity,
          },
        })
    }, [quantity, dispatch, itemId])
  return jsxs('div', {
    className: 'shop-item-row',
    children: [
      jsx(ItemIcon, {
        itemId,
      }),
      jsxs('div', {
        className: 'shop-item-info',
        children: [
          jsx('span', {
            className: 'shop-item-name',
            children: name,
          }),
          jsx('span', {
            className: 'shop-item-desc',
            children: `Sells for $${sellPrice.toLocaleString()} each`,
          }),
        ],
      }),
      jsxs('span', {
        className: 'shop-owned',
        children: ['x', owned],
      }),
      jsx('button', {
        className: `shop-sell-btn${quantity > 0 ? '' : ' disabled'}`,
        onClick: sell,
        disabled: quantity <= 0,
        children: ['Sell ', quantity, ' +$', total.toLocaleString()],
      }),
    ],
  })
}
