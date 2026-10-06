// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { tokenShopItems } from '../data/items.js'
import { useGame } from '../game/context.js'
import { getItemInfo } from '../game/progression.js'
import { ItemIcon } from './item-icon.js'

/** @param {{ onClose?: () => void, inline?: boolean }} props */
export function RewardShopModal({ onClose, inline = false }) {
  const { state, dispatch } = useGame(),
    [searchOpen, setSearchOpen] = React.useState(!1),
    [query, setQuery] = React.useState(''),
    needle = query.trim().toLowerCase(),
    visibleItems = needle
      ? tokenShopItems.filter((rewardItem) => {
          const info = getItemInfo(rewardItem.itemId)
          return (
            info.name.toLowerCase().includes(needle) ||
            info.description.toLowerCase().includes(needle) ||
            rewardItem.itemId.toLowerCase().includes(needle)
          )
        })
      : tokenShopItems
  const panel = jsxs('div', {
    className: inline ? 'reward-shop-inline' : 'battle-info-modal',
    ...(inline
      ? {}
      : { onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation() }),
    children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Kecleon Shop',
            }),
            jsxs('div', {
              className: 'reward-shop-header-buttons',
              children: [
                jsx('button', {
                  type: 'button',
                  className: `reward-shop-search-btn${searchOpen ? ' active' : ''}`,
                  onClick: () => {
                    if (searchOpen) setQuery('')
                    setSearchOpen(!searchOpen)
                  },
                  children: 'Search',
                }),
                onClose &&
                  jsx('button', {
                    className: 'battle-info-close',
                    onClick: onClose,
                    children: 'X',
                  }),
              ],
            }),
          ],
        }),
        searchOpen &&
          jsxs('div', {
            className: 'box-search',
            children: [
              jsx('input', {
                className: 'box-search-input',
                type: 'text',
                placeholder: 'Search the shop\u2026',
                value: query,
                onChange: /** @param {React.ChangeEvent<HTMLInputElement>} event */ (event) =>
                  setQuery(event.target.value),
              }),
              query
                ? jsx('button', {
                    className: 'box-filter-btn active',
                    onClick: () => setQuery(''),
                    children: 'Clear',
                  })
                : null,
            ],
          }),
        jsxs('div', {
          className: 'battle-info-content',
          children: [
            jsxs('div', {
              className: 'reward-shop-token-display',
              children: [
                'Victory Tokens: ',
                jsx('strong', {
                  children: state.victoryTokens,
                }),
              ],
            }),
            jsx('div', {
              className: 'reward-shop-list',
              children: visibleItems.map((rewardItem) => {
                const item = getItemInfo(rewardItem.itemId),
                  owned = state.inventory[rewardItem.itemId] ?? 0,
                  canAfford = state.victoryTokens >= rewardItem.tokenCost
                return jsxs(
                  'div',
                  {
                    className: 'reward-shop-row',
                    children: [
                      jsxs('div', {
                        className: 'reward-shop-left',
                        children: [
                          jsx(ItemIcon, {
                            itemId: rewardItem.itemId,
                            size: 22,
                          }),
                          jsxs('div', {
                            className: 'reward-shop-item-info',
                            children: [
                              jsx('span', {
                                className: 'reward-shop-item-name',
                                children: item.name,
                              }),
                              jsx('span', {
                                className: 'reward-shop-item-desc',
                                children: item.description,
                              }),
                            ],
                          }),
                        ],
                      }),
                      jsxs('div', {
                        className: 'reward-shop-item-right',
                        children: [
                          jsxs('span', {
                            className: 'reward-shop-item-owned',
                            children: ['Owned: ', owned],
                          }),
                          jsxs('button', {
                            className: `reward-shop-buy-btn${canAfford ? '' : ' disabled'}`,
                            disabled: !canAfford,
                            onClick: () =>
                              dispatch({
                                type: 'BUY_REWARD_ITEM',
                                payload: {
                                  itemId: rewardItem.itemId,
                                  cost: rewardItem.tokenCost,
                                },
                              }),
                            children: [
                              jsx('span', {
                                className: 'reward-shop-buy-label',
                                children: 'Buy',
                              }),
                              jsxs('span', {
                                className: 'reward-shop-buy-cost',
                                children: [
                                  rewardItem.tokenCost,
                                  ' Token',
                                  rewardItem.tokenCost > 1 ? 's' : '',
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  },
                  rewardItem.itemId
                )
              }),
            }),
            visibleItems.length === 0 &&
              jsx('div', {
                className: 'reward-shop-empty',
                children: 'No items match.',
              }),
          ],
        }),
      ],
    })
  return inline
    ? panel
    : jsx('div', {
        className: 'battle-info-overlay',
        onClick: onClose,
        children: panel,
      })
}
