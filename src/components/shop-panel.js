// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { activeItems, consumableItems, coreMartItems, heldItems, pokeBalls } from '../data/items.js'
import { mapData } from '../data/gameData.js'
import { todayKey } from '../data/daily-events.js'
import { useGame } from '../game/context.js'
import { getItemInfo, getItemSellPrice, isActiveEffectItem } from '../game/progression.js'
import { marketStockFor, regionalStockForMart } from '../game/shop.js'
import { BallShopRow } from './ball-shop-row.js'
import { NumberControl, SegmentedControl } from './ui-controls.js'
import { ItemShopRow } from './item-shop-row.js'
import { MarketRow } from './market-row.js'
import { SellShopRow } from './sell-shop-row.js'

/** @param {{ shopDef: { name: string, items: { itemId: string, unlockWildBattlesWon?: number }[] } }} props */
export function ShopPanel({ shopDef }) {
  const { state, dispatch } = useGame(),
    [qtyMode, setQtyMode] = React.useState(/** @type {number | 'max'} */ (1)),
    [mode, setMode] = React.useState(/** @type {'buy' | 'sell' | 'market'} */ ('buy')),
    open = !state.martCollapsed,
    regionId = mapData[state.currentLocation]?.region ?? 'kanto',
    // The market rolls with the real calendar day, the same as the daily event.
    marketDate = todayKey(),
    marketRows = React.useMemo(
      () => marketStockFor(state, marketDate),
      [state.inventory, marketDate]
    ),
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
                jsx(SegmentedControl, {
                  options: [
                    { value: 'buy', label: 'BUY' },
                    { value: 'sell', label: 'SELL' },
                    { value: 'market', label: 'MARKET', title: 'Trace Berries and Apricorns' },
                  ],
                  value: mode,
                  onChange: /** @param {'buy' | 'sell' | 'market'} next */ (next) => setMode(next),
                  compact: true,
                  'aria-label': 'Buy, sell or trade commodities',
                }),
                jsxs('div', {
                  className: 'shop-qty-selector',
                  children: [
                    jsx(NumberControl, {
                      value: qtyMode === 'max' ? 1 : qtyMode,
                      min: 1,
                      max: 100,
                      onChange: setQtyMode,
                      disabled: qtyMode === 'max',
                      compact: true,
                      'aria-label': 'Quantity',
                    }),
                    jsx('button', {
                      type: 'button',
                      className: `ui-segmented-btn${qtyMode === 'max' ? ' active' : ''}`,
                      onClick: () => setQtyMode('max'),
                      children: 'MAX',
                    }),
                  ],
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
              : mode === 'market'
                ? jsxs('div', {
                    className: 'market-panel',
                    children: [
                      jsx('div', {
                        className: 'market-hint',
                        children:
                          'Berry and Apricorn prices drift every day. Buy low, sell high.',
                      }),
                      ...marketRows.map((entry) =>
                        jsx(
                          MarketRow,
                          {
                            ...entry,
                            money: state.money,
                            qtyMode,
                            dateKey: marketDate,
                            dispatch,
                          },
                          entry.itemId
                        )
                      ),
                    ],
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
