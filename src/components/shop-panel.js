// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { activeItems, pokeBalls } from '../data/items.js'
import { useGame } from '../game/context.js'
import { isActiveEffectItem } from '../game/progression.js'
import { BallShopRow } from './ball-shop-row.js'
import { ItemShopRow } from './item-shop-row.js'

/** @param {{ shopDef: { name: string, items: { itemId: string, unlockWildBattlesWon?: number }[] } }} props */
export function ShopPanel({ shopDef }) {
  const { state, dispatch } = useGame(),
    [qtyMode, setQtyMode] = React.useState(/** @type {number | 'max'} */ (1))
  return jsxs('div', {
    className: 'shop-panel',
    children: [
      jsxs('div', {
        className: 'shop-header',
        children: [
          jsx('span', {
            className: 'shop-name',
            children: shopDef.name,
          }),
          jsx('div', {
            className: 'shop-qty-selector',
            children: /** @type {(number | 'max')[]} */ ([1, 10, 100, 'max']).map((qtyOption) =>
              jsx(
                'button',
                {
                  className: `shop-qty-btn${qtyMode === qtyOption ? ' active' : ''}`,
                  onClick: () => setQtyMode(qtyOption),
                  children: qtyOption === 'max' ? 'Max' : qtyOption,
                },
                String(qtyOption)
              )
            ),
          }),
        ],
      }),
      jsx('div', {
        className: 'shop-items',
        children: shopDef.items.map((shopItem) => {
          if (
            shopItem.unlockWildBattlesWon &&
            state.wildBattlesWon < shopItem.unlockWildBattlesWon
          )
            return null
          if (isActiveEffectItem(shopItem.itemId)) {
            const item = activeItems[shopItem.itemId]
            return item.buyPrice
              ? jsx(
                  ItemShopRow,
                  {
                    itemId: shopItem.itemId,
                    name: item.name,
                    description: item.description,
                    price: item.buyPrice,
                    owned: state.inventory[shopItem.itemId] ?? 0,
                    money: state.money,
                    qtyMode,
                    dispatch,
                  },
                  shopItem.itemId
                )
              : null
          }
          const ball = pokeBalls[shopItem.itemId]
          return !ball || !ball.buyPrice
            ? null
            : jsx(
                BallShopRow,
                {
                  itemId: shopItem.itemId,
                  ballId: shopItem.itemId,
                  name: ball.name,
                  description: ball.description,
                  price: ball.buyPrice,
                  owned: state.inventory[shopItem.itemId] ?? 0,
                  money: state.money,
                  qtyMode,
                  dispatch,
                },
                shopItem.itemId
              )
        }),
      }),
    ],
  })
}
