// A café counter: a small menu of friendship / heal drinks. Split out so the
// location panel stays a thin dispatcher. The buy rows reuse the mart's
// `ItemShopRow`, but route their BUY_ITEM through `BUY_CAFE_ITEM` with the
// café's own price (the items are not sold for their default price anywhere).
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { getItemInfo } from '../game/progression.js'
import { ItemShopRow } from './item-shop-row.js'

export const CafePanel = React.memo(
  /** @param {{ cafe: { name: string, items: { itemId: string, price: number }[] } }} props */
  function ({ cafe }) {
    const { state, dispatch } = useGame()
    return jsxs('div', {
      className: 'cafe-panel',
      children: [
        jsx('div', {
          className: 'section-title inverse',
          children: cafe.name,
        }),
        ...cafe.items.map((entry) => {
          const info = getItemInfo(entry.itemId)
          return jsx(
            ItemShopRow,
            {
              itemId: entry.itemId,
              name: info.name,
              description: info.description,
              price: entry.price,
              owned: state.inventory[entry.itemId] ?? 0,
              money: state.money,
              qtyMode: 1,
              dispatch:
                /** @param {GameAction} action */ (action) =>
                  action.type === 'BUY_ITEM'
                    ? dispatch({
                        type: 'BUY_CAFE_ITEM',
                        payload: {
                          itemId: entry.itemId,
                          quantity: 1,
                          price: entry.price,
                        },
                      })
                    : dispatch(action),
            },
            entry.itemId
          )
        }),
      ],
    })
  }
)
