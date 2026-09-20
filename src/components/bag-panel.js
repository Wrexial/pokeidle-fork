// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { bagCategories } from '../data/items.js'
import { useGame } from '../game/context.js'
import { getItemCategory, getItemInfo, isActiveEffectItem } from '../game/progression.js'

export function BagPanel() {
  const { state, dispatch } = useGame(),
    [tabIndex, setTabIndex] = React.useState(0),
    [selectedItem, setSelectedItem] = React.useState(/** @type {string | null} */ (null)),
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
