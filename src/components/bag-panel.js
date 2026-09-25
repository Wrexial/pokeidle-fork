// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { bagCategories, consumableItems, heldItems } from '../data/items.js'
import { MAX_FRIENDSHIP } from '../game/pokemon.js'
import { useGame } from '../game/context.js'
import { ItemIcon } from './item-icon.js'
import {
  getItemCategory,
  getItemInfo,
  getItemSellPrice,
  isActiveEffectItem,
  isHeldItem,
  isUsableConsumable,
} from '../game/progression.js'

/**
 * Whether a medicine/candy can be applied to `member` right now.
 * @param {ConsumableItem} item
 * @param {Pokemon} member
 * @returns {boolean}
 */
function canUseOn(item, member) {
  if (heldItems[item.id]) return member.heldItem !== item.id
  if (item.friendship) return (member.friendship ?? 0) < MAX_FRIENDSHIP
  if (item.natureMint) return true
  if (item.category === 'medicine')
    return item.revive
      ? member.currentHp <= 0
      : member.currentHp > 0 && member.currentHp < member.maxHp
  if (item.category === 'candy') return member.level < 100
  return false
}

/**
 * @param {Pokemon} member
 * @returns {string}
 */
function memberLabel(member) {
  return `${member.name} · Lv.${member.level} · ${member.currentHp}/${member.maxHp} HP`
}

export function BagPanel() {
  const { state, dispatch } = useGame(),
    [tabIndex, setTabIndex] = React.useState(0),
    [selectedItem, setSelectedItem] = React.useState(/** @type {string | null} */ (null)),
    [targetItemId, setTargetItemId] = React.useState(/** @type {string | null} */ (null)),
    [useQty, setUseQty] = React.useState(/** @type {number | 'all'} */ (1)),
    tab = bagCategories[tabIndex],
    items = Object.entries(state.inventory).filter(
      ([itemId, quantity]) => quantity > 0 && getItemCategory(itemId) === tab.id
    ),
    prevTab = () => {
      ;(setTabIndex((tabIndex - 1 + bagCategories.length) % bagCategories.length),
        setSelectedItem(null),
        setTargetItemId(null))
    },
    nextTab = () => {
      ;(setTabIndex((tabIndex + 1) % bagCategories.length),
        setSelectedItem(null),
        setTargetItemId(null))
    },
    toggleItem = /** @param {string} itemId */ (itemId) => {
      ;(setSelectedItem((current) => (current === itemId ? null : itemId)), setTargetItemId(null))
    },
    useItem = /** @param {string} itemId */ (itemId) => {
      isActiveEffectItem(itemId) && itemId === 'expShare'
        ? dispatch({
            type: 'USE_EFFECT_ITEM',
            payload: {
              itemId,
            },
          })
        : (isUsableConsumable(itemId) || isHeldItem(itemId)) &&
          (setTargetItemId(itemId), setUseQty(1))
    },
    sellItem = /** @param {string} itemId @param {number | 'all'} quantity */ (
      itemId,
      quantity
    ) => {
      const owned = state.inventory[itemId] ?? 0
      dispatch({
        type: 'SELL_ITEM',
        payload: {
          itemId,
          quantity: quantity === 'all' ? owned : quantity,
        },
      })
    },
    itemInfo = selectedItem ? getItemInfo(selectedItem) : null,
    selectedQty = selectedItem ? state.inventory[selectedItem] ?? 0 : 0,
    sellPrice = selectedItem ? getItemSellPrice(selectedItem) : null,
    canUse =
      selectedItem !== null &&
      selectedQty > 0 &&
      (selectedItem === 'expShare' || isUsableConsumable(selectedItem) || isHeldItem(selectedItem)),
    targetItem = targetItemId
      ? (consumableItems[targetItemId] ?? heldItems[targetItemId])
      : null,
    activeEffects =
      selectedItem && isActiveEffectItem(selectedItem)
        ? state.activeEffects.filter((effect) => effect.type === selectedItem)
        : []
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
                    isActive =
                      isActiveEffectItem(itemId) &&
                      state.activeEffects.some((effect) => effect.type === itemId)
                  return jsxs(
                    'div',
                    {
                      className: `bag-item${selectedItem === itemId ? ' selected' : ''}${isActive ? ' effect-active' : ''}`,
                      onClick: () => toggleItem(itemId),
                      children: [
                        jsxs('span', {
                          className: 'bag-item-left',
                          children: [
                            jsx(ItemIcon, {
                              itemId,
                              size: 16,
                            }),
                            jsx('span', {
                              className: 'bag-item-name',
                              children: item.name,
                            }),
                          ],
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
                onClick: () => selectedItem && useItem(selectedItem),
                children: 'Use',
              }),
            sellPrice && selectedQty > 0
              ? jsxs('div', {
                  className: 'bag-sell-actions',
                  children: [
                    jsx('button', {
                      className: 'bag-sell-btn',
                      onClick: () => selectedItem && sellItem(selectedItem, 1),
                      children: ['Sell 1 (+$', sellPrice.toLocaleString(), ')'],
                    }),
                    jsx('button', {
                      className: 'bag-sell-btn',
                      onClick: () => selectedItem && sellItem(selectedItem, 'all'),
                      children: [
                        'Sell All (+$',
                        (sellPrice * selectedQty).toLocaleString(),
                        ')',
                      ],
                    }),
                  ],
                })
              : null,
            targetItem &&
              jsxs('div', {
                className: 'bag-target-picker',
                children: [
                  jsx('div', {
                    className: 'bag-target-title',
                    children: [
                      jsx(ItemIcon, {
                        itemId: targetItemId,
                        size: 14,
                      }),
                      'Use ',
                      targetItem.name,
                      ' on:',
                    ],
                  }),
                  // Candies can be applied in bulk; medicine and held items are
                  // one at a time.
                  targetItem.category === 'candy' &&
                    jsxs('div', {
                      className: 'bag-use-qty',
                      children: [
                        jsx('span', {
                          className: 'bag-use-qty-label',
                          children: 'Amount:',
                        }),
                        /** @type {(number | 'all')[]} */ ([1, 10, 'all']).map((option) =>
                          jsx(
                            'button',
                            {
                              className: `bag-use-qty-btn${useQty === option ? ' active' : ''}`,
                              onClick: () => setUseQty(option),
                              children: option === 'all' ? 'All' : option,
                            },
                            String(option)
                          )
                        ),
                      ],
                    }),
                  state.party.length > 0
                    ? state.party.map((member) => {
                        const usable = canUseOn(targetItem, member)
                        return jsx(
                          'button',
                          {
                            className: `bag-target-btn${usable ? '' : ' disabled'}`,
                            disabled: !usable,
                            onClick: () => {
                              dispatch({
                                type: 'USE_ITEM_ON_POKEMON',
                                payload: {
                                  itemId: targetItemId,
                                  pokemonId: member.id,
                                  quantity:
                                    targetItem.category !== 'candy'
                                      ? 1
                                      : useQty === 'all'
                                        ? (targetItemId ? state.inventory[targetItemId] : 1) ?? 1
                                        : useQty,
                                },
                              })
                              setTargetItemId(null)
                            },
                            children: memberLabel(member),
                          },
                          member.id
                        )
                      })
                    : jsx('div', {
                        className: 'bag-empty',
                        children: 'No party Pokemon.',
                      }),
                ],
              }),
            activeEffects.length > 0 &&
              jsx('div', {
                className: 'bag-active-effects',
                children: activeEffects.map((effect, index) =>
                  jsxs(
                    'span',
                    {
                      className: 'bag-effect-status',
                      children: ['Active: ', effect.battlesRemaining, ' battles left'],
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
