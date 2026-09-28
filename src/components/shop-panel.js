// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { activeItems, consumableItems, coreMartItems, heldItems, pokeBalls } from '../data/items.js'
import { mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getItemInfo, getItemSellPrice, isActiveEffectItem } from '../game/progression.js'
import { regionalStockForMart } from '../game/shop.js'
import { BallShopRow } from './ball-shop-row.js'
import { ItemShopRow } from './item-shop-row.js'
import { SellShopRow } from './sell-shop-row.js'

/** @param {{ shopDef: { name: string, items: { itemId: string, unlockWildBattlesWon?: number }[] } }} props */
export function ShopPanel({ shopDef }) {
  const { state, dispatch } = useGame(),
    [qtyMode, setQtyMode] = React.useState(/** @type {number | 'max'} */ (1)),
    [mode, setMode] = React.useState(/** @type {'buy' | 'sell'} */ ('buy')),
    open = !state.martCollapsed,
    regionId = mapData[state.currentLocation]?.region ?? 'kanto',
    // Retired: the region's advanced held-item stock now lives in the Grand
    // Auction House, so this is normally empty (kept for future flavour).
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
    }, [shopDef, regionalStock]),
    // Everything the player owns that a mart will buy back.
    sellableItems = React.useMemo(
      () =>
        Object.entries(state.inventory)
          .filter(([itemId, quantity]) => quantity > 0 && getItemSellPrice(itemId) != null)
          .map(([itemId, quantity]) => ({
            itemId,
            quantity,
            name: getItemInfo(itemId).name,
            sellPrice: getItemSellPrice(itemId) ?? 0,
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      [state.inventory]
    )
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
            jsxs('div', {
              className: 'shop-controls',
              children: [
                jsx('div', {
                  className: 'shop-mode-toggle',
                  children: /** @type {('buy' | 'sell')[]} */ (['buy', 'sell']).map((option) =>
                    jsx(
                      'button',
                      {
                        className: `shop-mode-btn${mode === option ? ' active' : ''}`,
                        onClick: () => setMode(option),
                        children: option === 'buy' ? 'BUY' : 'SELL',
                      },
                      option
                    )
                  ),
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
        ],
      }),
      open &&
        jsx('div', {
          className: 'shop-items',
          children:
            mode === 'sell'
              ? sellableItems.length > 0
                ? sellableItems.map((entry) =>
                    jsx(
                      SellShopRow,
                      {
                        itemId: entry.itemId,
                        name: entry.name,
                        sellPrice: entry.sellPrice,
                        owned: entry.quantity,
                        qtyMode,
                        dispatch,
                      },
                      entry.itemId
                    )
                  )
                : jsx('div', {
                    className: 'shop-empty',
                    children: 'Nothing to sell.',
                  })
              : stock.map((shopItem) => {
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
