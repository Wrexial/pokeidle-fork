// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { PokeballIcon } from './common.js'
import { activeItems, bagCategories, pokeBalls, tokenShopItems } from '../data/constants.js'
import { useGame } from '../game/context.js'
import { getItemCategory, getItemInfo, isActiveEffectItem } from '../game/progression.js'

export function ShopPanel({ shopDef }) {
  const { state, dispatch } = useGame(),
    [qtyMode, setQtyMode] = React.useState(1)
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
            children: [1, 10, 100, 'max'].map((qtyOption) =>
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

function BallShopRow({
  itemId,
  ballId,
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
      jsx(PokeballIcon, {
        ballId,
        size: 14,
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

function ItemShopRow({
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

export function BagPanel() {
  const { state, dispatch } = useGame(),
    [tabIndex, setTabIndex] = React.useState(0),
    [selectedItem, setSelectedItem] = React.useState(null),
    tab = bagCategories[tabIndex],
    items = Object.entries(state.inventory).filter(([itemId, quantity]) => quantity > 0 && getItemCategory(itemId) === tab.id),
    prevTab = () => {
      ;(setTabIndex((tabIndex - 1 + bagCategories.length) % bagCategories.length), setSelectedItem(null))
    },
    nextTab = () => {
      ;(setTabIndex((tabIndex + 1) % bagCategories.length), setSelectedItem(null))
    },
    toggleItem = (itemId) => {
      setSelectedItem((quantity) => (quantity === itemId ? null : itemId))
    },
    useItem = (itemId) => {
      isActiveEffectItem(itemId) &&
        itemId === 'expShare' &&
        dispatch({
          type: 'USE_EFFECT_ITEM',
          payload: {
            itemId,
          },
        })
    },
    itemInfo = selectedItem ? getItemInfo(selectedItem) : null,
    canUse = selectedItem === 'expShare' && (state.inventory[selectedItem] ?? 0) > 0,
    activeEffects = selectedItem && isActiveEffectItem(selectedItem) ? state.activeEffects.filter((itemId) => itemId.type === selectedItem) : []
  return jsxs('div', {
    className: 'bag-container',
    children: [
      jsxs('div', {
        className: 'bag-header',
        children: [
          jsx('span', {
            className: 'bag-header-spacer',
          }),
          jsx('button', {
            className: 'bag-header-arrow',
            onClick: prevTab,
            children: '<',
          }),
          jsx('span', {
            className: 'bag-header-name',
            children: tab.label,
          }),
          jsx('button', {
            className: 'bag-header-arrow',
            onClick: nextTab,
            children: '>',
          }),
          jsxs('span', {
            className: 'bag-header-money',
            children: ['₽', state.money.toLocaleString()],
          }),
        ],
      }),
      jsx('div', {
        className: 'bag-content',
        children:
          items.length > 0
            ? jsx('div', {
                className: 'bag-item-list',
                children: items.map(([itemId, quantity]) => {
                  const item = getItemInfo(itemId),
                    isActive = isActiveEffectItem(itemId) && state.activeEffects.some((effect) => effect.type === itemId)
                  return jsxs(
                    'div',
                    {
                      className: `bag-item${selectedItem === itemId ? ' selected' : ''}${isActive ? ' effect-active' : ''}`,
                      onClick: () => toggleItem(itemId),
                      children: [
                        jsx('span', {
                          className: 'bag-item-name',
                          children: item.name,
                        }),
                        jsxs('span', {
                          className: 'bag-item-qty',
                          children: ['x', quantity],
                        }),
                      ],
                    },
                    itemId
                  )
                }),
              })
            : jsx('div', {
                className: 'bag-empty',
                children: 'No items.',
              }),
      }),
      itemInfo &&
        jsxs('div', {
          className: 'bag-description',
          children: [
            itemInfo.description,
            canUse &&
              jsx('button', {
                className: 'bag-use-btn',
                onClick: () => useItem(selectedItem),
                children: 'Use',
              }),
            activeEffects.length > 0 &&
              jsx('div', {
                className: 'bag-active-effects',
                children: activeEffects.map((effect, index) =>
                  jsxs(
                    'span',
                    {
                      className: 'bag-effect-status',
                      children: [
                        'Active: ',
                        effect.battlesRemaining,
                        ' battles left',
                      ],
                    },
                    index
                  )
                ),
              }),
          ],
        }),
    ],
  })
}

export function RewardShopModal({ onClose }) {
  const { state, dispatch } = useGame()
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal',
      onClick: (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Reward Shop',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
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
              children: tokenShopItems.map((rewardItem) => {
                const item = getItemInfo(rewardItem.itemId),
                  owned = state.inventory[rewardItem.itemId] ?? 0,
                  canAfford = state.victoryTokens >= rewardItem.tokenCost
                return jsxs(
                  'div',
                  {
                    className: 'reward-shop-row',
                    children: [
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
          ],
        }),
      ],
    }),
  })
}
