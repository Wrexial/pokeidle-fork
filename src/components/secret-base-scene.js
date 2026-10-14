// The Secret Base scene: a placement grid for furniture, plushies and milestone
// trophies, a shop for buying more, and the once-a-day yield. Opened from the
// base's route in the location panel.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { rewardItemName } from '../game/minigames.js'
import {
  SECRET_BASE_BONUS_KEYS,
  SECRET_BASE_DECORATIONS,
  SECRET_BASE_GRID,
  SECRET_BASE_RELOCATE_COST,
  decorationUnlocked,
  isSecretBaseYieldReady,
  ownedDecorationCount,
  secretBaseBonuses,
  secretBaseDailyYield,
} from '../game/secret-base.js'
import { mapData } from '../data/gameData.js'
import { ItemIcon, hasItemIcon } from './item-icon.js'

const BONUS_LABELS = { exp: 'EXP', money: 'Money', catch: 'Catch', shiny: 'Shiny' }

/** Render a bonus as `+n%`. @param {number} value */
function formatBonus(value) {
  return `+${Math.round(value * 100)}%`
}

export function SecretBaseScene() {
  const { state, dispatch } = useGame(),
    base = state.secretBase,
    [tab, setTab] = React.useState(/** @type {'base' | 'shop'} */ ('base')),
    [selected, setSelected] = React.useState(/** @type {string | null} */ (null)),
    location = base?.locationId ? mapData[base.locationId] : null,
    bonuses = secretBaseBonuses(base),
    yieldReady = isSecretBaseYieldReady(base),
    daily = secretBaseDailyYield(base),
    collect = state.secretBaseCollect ?? null,
    inventoryEntries = Object.entries(base?.inventory ?? {}).filter(([, count]) => count > 0)

  /** @param {string} decorationId */
  function ownedCount(decorationId) {
    return base ? ownedDecorationCount(base, decorationId) : 0
  }

  /** @param {SecretBaseDecoration} decoration */
  function decorationRow(decoration) {
    const unlocked = decorationUnlocked(decoration, state),
      owned = ownedCount(decoration.id),
      unique = !!decoration.milestone,
      maxed = unique && owned > 0,
      affordable = state.money >= decoration.cost,
      disabled = !unlocked || maxed || !affordable
    return jsxs(
      'div',
      {
        className: `secret-base-shop-row${unlocked ? '' : ' locked'}${maxed ? ' owned' : ''}`,
        children: [
          jsx('span', { className: 'secret-base-shop-icon', children: decoration.icon }),
          jsxs('div', {
            className: 'secret-base-shop-info',
            children: [
              jsx('span', { className: 'secret-base-shop-name', children: decoration.name }),
              jsx('span', {
                className: 'secret-base-shop-bonus',
                children: Object.entries(decoration.bonus)
                  .map(
                    ([key, value]) =>
                      `${formatBonus(value ?? 0)} ${
                        BONUS_LABELS[/** @type {keyof typeof BONUS_LABELS} */ (key)] ?? key
                      }`
                  )
                  .join(' \u00b7 '),
              }),
              decoration.milestone &&
                jsx('span', {
                  className: 'secret-base-shop-milestone',
                  children: unlocked
                    ? 'Milestone earned \u2014 free reward'
                    : `Locked: reach ${decoration.milestone.value} ${
                        { badges: 'badges', champions: 'Champion wins', dex: 'Pokedex caught', shinies: 'shinies', tower: 'Tower floors', legendaries: 'legendaries', prestige: 'prestiges', regions: 'regions' }[
                          decoration.milestone.type
                        ] ?? decoration.milestone.type
                      }`,
                }),
            ],
          }),
          jsx('button', {
            className: 'secret-base-buy-btn',
            disabled,
            onClick: () =>
              dispatch({ type: 'BUY_DECORATION', payload: { decorationId: decoration.id } }),
            children: maxed
              ? 'OWNED'
              : !unlocked
                ? 'LOCKED'
                : decoration.cost > 0
                  ? `$${decoration.cost.toLocaleString()}`
                  : 'CLAIM',
          }),
        ],
      },
      decoration.id
    )
  }

  return jsxs('div', {
    className: 'minigame-scene secret-base-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg secret-base-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', {
            className: 'minigame-scene-title',
            children: `\u{1F3D5}\uFE0F Secret Base${location ? ` \u2014 ${location.name}` : ''}`,
          }),
          jsx('button', {
            className: 'battle-info-close',
            onClick: () => dispatch({ type: 'END_SECRET_BASE' }),
            children: 'X',
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body secret-base-body',
        children: [
          jsx('div', {
            className: 'bag-tabs pelago-tabs',
            children: [
              { id: 'base', label: 'Base', icon: '\u{1F6CB}\uFE0F' },
              { id: 'shop', label: 'Shop', icon: '\u{1F6D2}' },
            ].map((entry) =>
              jsxs(
                'button',
                {
                  className: `bag-tab parchment${tab === entry.id ? ' active' : ''}`,
                  onClick: () => setTab(/** @type {any} */ (entry.id)),
                  children: [entry.icon, ' ', entry.label],
                },
                entry.id
              )
            ),
          }),
          jsxs('div', {
            className: 'secret-base-scroll',
            children: [
              tab === 'base'
                ? jsxs(React.Fragment, {
                    children: [
                      jsxs('div', {
                        className: 'secret-base-stats',
                        children: [
                          ...SECRET_BASE_BONUS_KEYS.map((key) =>
                            jsxs(
                              'span',
                              {
                                className: `secret-base-stat${bonuses[key] > 0 ? ' active' : ''}`,
                                children: [
                                  jsx('span', { className: 'secret-base-stat-label', children: BONUS_LABELS[key] }),
                                  jsx('span', { className: 'secret-base-stat-value', children: formatBonus(bonuses[key]) }),
                                ],
                              },
                              key
                            )
                          ),
                          jsx('span', {
                            className: 'secret-base-stat total',
                            children: `Lifetime $${(base?.totalYield ?? 0).toLocaleString()}`,
                          }),
                        ],
                      }),
                      jsxs('div', {
                        className: `secret-base-yield${yieldReady ? ' ready' : ''}`,
                        children: [
                          jsxs('div', {
                            className: 'secret-base-yield-info',
                            children: [
                              jsx('span', {
                                className: 'secret-base-yield-title',
                                children: yieldReady ? 'Daily yield ready!' : "Today's yield collected",
                              }),
                              jsx('span', {
                                className: 'secret-base-yield-desc',
                                children: yieldReady
                                  ? `$${daily.money.toLocaleString()}${daily.items.length > 0 ? ` + ${daily.items.map((item) => `${rewardItemName(item.itemId)} x${item.quantity}`).join(', ')}` : ''} \u2014 banked from ${Math.min(base?.yieldProgress ?? 0, 400)} wild wins.`
                                  : 'Win wild battles to bank more for tomorrow.',
                              }),
                            ],
                          }),
                          jsx('button', {
                            className: 'secret-base-collect-btn',
                            disabled: !yieldReady,
                            onClick: () => dispatch({ type: 'COLLECT_SECRET_BASE_YIELD' }),
                            children: 'COLLECT',
                          }),
                        ],
                      }),
                      jsx('div', {
                        className: 'secret-base-subtitle',
                        children: selected
                          ? `Placing: ${SECRET_BASE_DECORATIONS.find((entry) => entry.id === selected)?.name ?? selected}. Tap an empty floor tile.`
                          : 'Select a decoration below, then tap a floor tile to place it.',
                      }),
                      jsx('div', {
                        className: 'secret-base-grid',
                        style: { gridTemplateColumns: `repeat(${SECRET_BASE_GRID.width}, 1fr)` },
                        children: Array.from(
                          { length: SECRET_BASE_GRID.width * SECRET_BASE_GRID.height },
                          (_, index) => {
                            const x = index % SECRET_BASE_GRID.width,
                              y = Math.floor(index / SECRET_BASE_GRID.width),
                              placement = base?.placements.find(
                                (entry) => entry.x === x && entry.y === y
                              ),
                              decoration = placement
                                ? SECRET_BASE_DECORATIONS.find(
                                    (entry) => entry.id === placement.decorationId
                                  )
                                : null
                            return jsx(
                              'button',
                              {
                                className: `secret-base-cell${placement ? ' filled' : ''}${selected && !placement ? ' placeable' : ''}`,
                                title: decoration
                                  ? `${decoration.name} \u2014 tap to remove`
                                  : undefined,
                                onClick: () => {
                                  if (placement)
                                    dispatch({
                                      type: 'REMOVE_DECORATION',
                                      payload: { x, y },
                                    })
                                  else if (selected)
                                    dispatch({
                                      type: 'PLACE_DECORATION',
                                      payload: { decorationId: selected, x, y },
                                    })
                                },
                                children: decoration
                                  ? jsx('span', {
                                      className: 'secret-base-cell-icon',
                                      children: decoration.icon,
                                    })
                                  : null,
                              },
                              `${x}:${y}`
                            )
                          }
                        ),
                      }),
                      jsx('div', {
                        className: 'secret-base-subtitle',
                        children: 'Your decorations',
                      }),
                      inventoryEntries.length === 0
                        ? jsx('p', {
                            className: 'daycare-hint',
                            children: 'Nothing in storage yet \u2014 buy furniture or plushies in the Shop tab.',
                          })
                        : jsx('div', {
                            className: 'secret-base-inventory',
                            children: inventoryEntries.map(([decorationId, count]) => {
                              const decoration = SECRET_BASE_DECORATIONS.find(
                                (entry) => entry.id === decorationId
                              )
                              if (!decoration) return null
                              return jsxs(
                                'button',
                                {
                                  className: `secret-base-selection${selected === decorationId ? ' active' : ''}`,
                                  onClick: () =>
                                    setSelected(selected === decorationId ? null : decorationId),
                                  children: [
                                    jsx('span', { children: decoration.icon }),
                                    jsx('span', {
                                      className: 'secret-base-selection-name',
                                      children: decoration.name,
                                    }),
                                    jsx('span', {
                                      className: 'secret-base-selection-count',
                                      children: `x${count}`,
                                    }),
                                  ],
                                },
                                decorationId
                              )
                            }),
                          }),
                      jsx('p', {
                        className: 'daycare-hint',
                        children: `Moving your base to another route costs $${SECRET_BASE_RELOCATE_COST.toLocaleString()} \u2014 set it up from any route's location panel.`,
                      }),
                    ],
                  })
                : jsxs(React.Fragment, {
                    children: [
                      jsx('p', {
                        className: 'daycare-hint',
                        children:
                          'Furniture and plushies grant passive bonuses. Trophies are one-off milestone rewards that also add to the daily yield.',
                      }),
                      ...[
                        ['furniture', 'Furniture'],
                        ['plushie', 'Plushies'],
                        ['trophy', 'Trophies'],
                      ].map(([category, label]) =>
                        jsxs(
                          'div',
                          {
                            className: 'secret-base-shop-group',
                            children: [
                              jsx('div', {
                                className: 'location-section-title',
                                children: label,
                              }),
                              ...SECRET_BASE_DECORATIONS.filter(
                                (decoration) => decoration.category === category
                              ).map(decorationRow),
                            ],
                          },
                          category
                        )
                      ),
                    ],
                  }),
            ],
          }),
        ],
      }),
      collect &&
        jsx('div', {
          className: 'pelago-collect',
          children: jsxs('div', {
            className: 'pelago-collect-card',
            children: [
              jsx('div', {
                className: 'pelago-collect-title',
                children: '\u{1F3D5}\uFE0F Secret Base yield',
              }),
              jsxs('div', {
                className: 'pelago-collect-row',
                children: [
                  jsx('span', { className: 'pelago-collect-icon', children: '\u{1F4B0}' }),
                  jsx('span', { className: 'pelago-collect-name', children: 'Money' }),
                  jsx('span', {
                    className: 'pelago-collect-qty',
                    children: `$${collect.money.toLocaleString()}`,
                  }),
                ],
              }),
              collect.items.length > 0 &&
                jsx('div', {
                  className: 'pelago-collect-list',
                  children: collect.items.map((item) =>
                    jsxs(
                      'div',
                      {
                        className: 'pelago-collect-row',
                        children: [
                          jsx('span', {
                            className: 'pelago-collect-icon',
                            children: hasItemIcon(item.itemId)
                              ? jsx(ItemIcon, { itemId: item.itemId, size: 20 })
                              : '\u{1F381}',
                          }),
                          jsx('span', {
                            className: 'pelago-collect-name',
                            children: rewardItemName(item.itemId),
                          }),
                          item.quantity > 1 &&
                            jsx('span', {
                              className: 'pelago-collect-qty',
                              children: `\u00d7${item.quantity}`,
                            }),
                        ],
                      },
                      item.itemId
                    )
                  ),
                }),
              jsx('button', {
                className: 'move-panel-btn confirm',
                onClick: () => dispatch({ type: 'DISMISS_SECRET_BASE_COLLECT' }),
                children: 'OK',
              }),
            ],
          }),
        }),
    ],
  })
}
