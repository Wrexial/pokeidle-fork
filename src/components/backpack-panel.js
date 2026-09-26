// The Backpack: the player's own data, as sub-tabs in the right panel. The
// Pokédex, Bank (money + Reward Shop), Items (bag) and Records views are the
// same components used elsewhere, rendered inline instead of as modals.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { BagPanel } from './bag-panel.js'
import { PokedexModal } from './pokedex-modal.js'
import { RecordsModal } from './records-modal.js'
import { RewardShopModal } from './reward-shop-modal.js'

const BACKPACK_TABS = [
  { id: 'dex', label: 'Dex' },
  { id: 'bank', label: 'Bank' },
  { id: 'items', label: 'Items' },
  { id: 'records', label: 'Records' },
]

export function BackpackPanel() {
  const { state } = useGame(),
    [tab, setTab] = React.useState('dex')
  return jsxs('div', {
    className: 'backpack-panel',
    children: [
      jsx('div', {
        className: 'tab-bar backpack-tab-bar',
        children: BACKPACK_TABS.map((tabDef) =>
          jsx(
            'button',
            {
              className: `tab-btn${tab === tabDef.id ? ' active' : ''}`,
              onClick: () => setTab(tabDef.id),
              children: tabDef.label,
            },
            tabDef.id
          )
        ),
      }),
      jsxs('div', {
        className: 'backpack-content',
        children: [
          tab === 'dex' && jsx(PokedexModal, { inline: !0 }),
          tab === 'records' && jsx(RecordsModal, { inline: !0 }),
          tab === 'items' && jsx(BagPanel, {}),
          tab === 'bank' &&
            jsxs('div', {
              className: 'backpack-bank',
              children: [
                jsxs('div', {
                  className: 'backpack-bank-balance',
                  children: [
                    jsx('span', {
                      className: 'backpack-bank-label',
                      children: 'Bank',
                    }),
                    jsxs('span', {
                      className: 'backpack-bank-amount',
                      children: ['\u20bd', state.money.toLocaleString()],
                    }),
                  ],
                }),
                jsx(RewardShopModal, { inline: !0 }),
              ],
            }),
        ],
      }),
    ],
  })
}
