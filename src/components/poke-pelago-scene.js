// Poké Pelago, played as a full-stage scene while the reducer is in the
// `pelago` phase. It hosts companion care, the Berry Garden and the passive
// islands, with a result card for whatever the islands brought back.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { PELAGO_ISLANDS } from '../game/pelago.js'
import { rewardItemName } from '../game/minigames.js'
import { CompanionCarePanel } from './companion-panel.js'
import { GardenPanel } from './garden-panel.js'
import { PelagoIslandsPanel } from './pelago-panel.js'
import { ItemIcon, hasItemIcon } from './item-icon.js'

/** @type {{ id: 'companion' | 'garden' | 'islands', label: string, icon: string }[]} */
const PELAGO_TABS = [
  { id: 'companion', label: 'Companion', icon: '\u{1f43e}' },
  { id: 'garden', label: 'Berry Fields', icon: '\u{1f331}' },
  { id: 'islands', label: 'Islands', icon: '\u{1f3d6}\ufe0f' },
]

export function PokePelagoScene() {
  const { state, dispatch } = useGame(),
    [tab, setTab] = React.useState(
      /** @type {'companion' | 'garden' | 'islands'} */ (
        state.pelagoCollect ? 'islands' : 'companion'
      )
    ),
    canCare = !!state.companion?.id && state.wildBattlesWon > state.companion.careBattle,
    gardenReady = !!state.garden?.plots?.some((plot) => plot && plot.battlesRemaining <= 0),
    islandReady = Object.values(state.pelago ?? {}).some((island) => island.ready > 0),
    haul = state.pelagoCollect ?? null

  function leave() {
    dispatch({ type: 'END_MINIGAME' })
  }

  return jsxs('div', {
    className: 'minigame-scene pelago-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', {
            className: 'minigame-scene-title',
            children: '\u{1f3dd}\ufe0f Pok\u00e9 Pelago',
          }),
          jsx('button', {
            className: 'modal-close',
            onClick: leave,
            children: 'X',
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body pelago-scene-body',
        children: [
          jsx('div', {
            className: 'bag-tabs pelago-tabs',
            children: PELAGO_TABS.map((entry) => {
              const alert =
                (entry.id === 'companion' && canCare) ||
                (entry.id === 'garden' && gardenReady) ||
                (entry.id === 'islands' && islandReady)
              return jsxs(
                'button',
                {
                  className: `bag-tab parchment${tab === entry.id ? ' active' : ''}`,
                  onClick: () => setTab(entry.id),
                  children: [
                    `${entry.icon} ${entry.label}`,
                    alert ? jsx('span', { className: 'pelago-tab-dot' }) : null,
                  ],
                },
                entry.id
              )
            }),
          }),
          jsx('div', {
            className: 'pelago-scene-content',
            children:
              tab === 'companion'
                ? jsx(CompanionCarePanel, {})
                : tab === 'garden'
                  ? jsx(GardenPanel, {})
                  : jsx(PelagoIslandsPanel, {}),
          }),
        ],
      }),
      haul &&
        jsxs('div', {
          className: 'pelago-collect',
          children: [
            jsxs('div', {
              className: 'pelago-collect-card',
              children: [
                jsxs('div', {
                  className: 'pelago-collect-title',
                  children: [
                    PELAGO_ISLANDS[haul.islandId]?.icon ?? '',
                    ' ',
                    PELAGO_ISLANDS[haul.islandId]?.name ?? haul.islandId,
                  ],
                }),
                haul.items.length > 0 &&
                  jsx('div', {
                    className: 'pelago-collect-list',
                    children: haul.items.map((item) =>
                      jsxs(
                        'div',
                        {
                          className: 'pelago-collect-row',
                          children: [
                            jsx('span', {
                              className: 'pelago-collect-icon',
                              children: hasItemIcon(item.itemId)
                                ? jsx(ItemIcon, { itemId: item.itemId, size: 20 })
                                : '\u{1f381}',
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
                haul.exp > 0 &&
                  jsx('div', {
                    className: 'pelago-collect-exp',
                    children: `+${haul.exp.toLocaleString()} EXP to each worker`,
                  }),
                jsx('button', {
                  className: 'move-panel-btn confirm',
                  onClick: () => dispatch({ type: 'DISMISS_PELAGO_COLLECT' }),
                  children: 'OK',
                }),
              ],
            }),
          ],
        }),
    ],
  })
}
