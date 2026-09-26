// The Backpack: the player's own data, as sub-tabs in the right panel. The
// Pokédex, Kecleon Wares (Kecleon Shop), Items (bag) and Records views are the
// same components used elsewhere, rendered inline instead of as modals.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { BagPanel } from './bag-panel.js'
import { GymPanel } from './gym-panel.js'
import { PokedexModal } from './pokedex-modal.js'
import { RecordsModal } from './records-modal.js'
import { RewardShopModal } from './reward-shop-modal.js'

const BACKPACK_TABS = [
  { id: 'league', label: 'League' },
  { id: 'dex', label: 'Dex' },
  { id: 'wares', label: 'Kecleon Wares' },
  { id: 'items', label: 'Items' },
  { id: 'records', label: 'Records' },
]

export function BackpackPanel() {
  const [tab, setTab] = React.useState('league')
  return jsxs('div', {
    className: 'backpack-panel',
    children: [
      jsx('div', {
        className: 'backpack-header',
        children: jsx('span', {
          className: 'backpack-title',
          children: 'Backpack',
        }),
      }),
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
          tab === 'league' &&
            jsx('div', {
              className: 'panel-content',
              children: jsx(GymPanel, { onOpenShop: () => setTab('wares') }),
            }),
          tab === 'dex' && jsx(PokedexModal, { inline: !0 }),
          tab === 'records' && jsx(RecordsModal, { inline: !0 }),
          tab === 'items' && jsx(BagPanel, {}),
          tab === 'wares' && jsx(RewardShopModal, { inline: !0 }),
        ],
      }),
    ],
  })
}
