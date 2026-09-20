// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

export function ItemShopRow({
  itemId,
  name,
  description,
  price,
  owned,
  money,
  qtyMode,
  dispatch,
}) {
  const quantity = qtyMode === 'max' ? Math.max(1, Math.floor(money / price)) : qtyMode,
    totalCost = price * quantity,
    canAfford = money >= totalCost,
    buy = React.useCallback(() => {
      canAfford &&
        dispatch({
          type: 'BUY_ITEM',
          payload: {
            itemId,
            quantity,
          },
        })
    }, [canAfford, dispatch, itemId, quantity])
  return jsxs('div', {
    className: 'shop-item-row',
    children: [
      jsx('div', {
        className: 'shop-item-icon-placeholder',
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
            children: description,
          }),
        ],
      }),
      jsxs('span', {
        className: 'shop-owned',
        children: ['x', owned],
      }),
      jsxs('button', {
        className: `shop-buy-btn${canAfford ? '' : ' disabled'}`,
        onClick: buy,
        disabled: !canAfford,
        children: ['Buy ', quantity, ' - $', totalCost.toLocaleString()],
      }),
    ],
  })
}
