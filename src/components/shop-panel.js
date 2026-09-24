// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { activeItems, consumableItems, coreMartItems, heldItems, pokeBalls } from '../data/items.js'
import { mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { isActiveEffectItem } from '../game/progression.js'
import { regionalStockForMart } from '../game/shop.js'
import { BallShopRow } from './ball-shop-row.js'
import { ItemShopRow } from './item-shop-row.js'

/** @param {{ shopDef: { name: string, items: { itemId: string, unlockWildBattlesWon?: number }[] } }} props */
export function ShopPanel({ shopDef }) {
  const { state, dispatch } = useGame(),
    [qtyMode, setQtyMode] = React.useState(/** @type {number | 'max'} */ (1)),
    open = !state.martCollapsed,
    regionId = mapData[state.currentLocation]?.region ?? 'kanto',
    // This mart's slice of the region's advanced stock, so every town's shelves
    // differ instead of all selling the whole regional list.
    regionalStock = React.useMemo(
      () => regionalStockForMart(regionId, state.currentLocation),
      [regionId, state.currentLocation]
    ),
    // Location stock wins over the shared core/region stock, and a duplicate
    // item id is only shown once so a mart never repeats a shelf.
    stock = React.useMemo(() => {
      const seen = new Set()
      return [...shopDef.items, ...coreMartItems, ...regionalStock].filter((entry) => {
        if (seen.has(entry.itemId)) return false
        seen.add(entry.itemId)
        return true
      })
    }, [shopDef, regionalStock])
  return jsxs('div', {
    className: 'shop-panel',
    children: [
      jsxs('div', {
        className: `shop-header${open ? '' : ' collapsed'}`,
        children: [
          jsxs('button', {
            className: 'shop-toggle',
            onClick: () => dispatch({ type: 'TOGGLE_MART_COLLAPSED' }),
            'aria-expanded': open,
            title: open ? 'Hide shop' : 'Show shop',
            children: [
              jsx('span', {
                className: 'shop-toggle-arrow',
                children: open ? '\u25be' : '\u25b8',
              }),
              jsx('span', {
                className: 'shop-name',
                children: shopDef.name,
              }),
            ],
          }),
          open &&
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
      open &&
        jsx('div', {
          className: 'shop-items',
          children: stock.map((shopItem) => {
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
          if (consumableItems[shopItem.itemId]) {
            const item = consumableItems[shopItem.itemId]
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
          if (heldItems[shopItem.itemId]) {
            const item = heldItems[shopItem.itemId]
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
