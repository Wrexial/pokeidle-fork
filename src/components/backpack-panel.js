// The Backpack: the player's own data, as sub-tabs in the right panel. The
// Pokédex, Kecleon Wares (Kecleon Shop), Items (bag) and Trainer views are the
// same components used elsewhere, rendered inline instead of as modals. The
// Trainer tab is a hub that hosts the Trainer Card, League, Records and Run
// Summary views.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { BagPanel } from './bag-panel.js'
import { PokedexModal } from './pokedex-modal.js'
import { RewardShopModal } from './reward-shop-modal.js'
import { TrainerCardPanel } from './trainer-card-panel.js'

const BACKPACK_TABS = [
  { id: 'trainer', label: 'Trainer' },
  { id: 'dex', label: 'Dex' },
  { id: 'wares', label: 'Kecleon Wares' },
  { id: 'items', label: 'Items' },
]

export function BackpackPanel() {
  const [tab, setTab] = React.useState('trainer')
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
          tab === 'dex' && jsx(PokedexModal, { inline: !0 }),
          tab === 'items' && jsx(BagPanel, {}),
          tab === 'trainer' &&
            jsx(TrainerCardPanel, {
              inline: true,
              onOpenShop: () => setTab('wares'),
            }),
          tab === 'wares' && jsx(RewardShopModal, { inline: !0 }),
        ],
      }),
    ],
  })
}
