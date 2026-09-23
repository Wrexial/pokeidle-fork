// Poké Pelago: the island hub that hosts companion care and the Berry Garden,
// opened from the top bar. (Future islands — training, caves, bean farm — can
// be added as extra tabs.)

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { CompanionCarePanel } from './companion-panel.js'
import { GardenPanel } from './garden-panel.js'
import { PelagoIslandsPanel } from './pelago-panel.js'

const PELAGO_TABS = [
  { id: 'companion', label: 'Companion', icon: '\u{1f43e}' },
  { id: 'garden', label: 'Berry Fields', icon: '\u{1f331}' },
  { id: 'islands', label: 'Islands', icon: '\u{1f3d6}\ufe0f' },
]

/** @param {{ onClose: () => void }} props */
export function PokePelagoModal({ onClose }) {
  const { state } = useGame(),
    [tab, setTab] = React.useState('companion'),
    canCare = !!state.companion?.id && state.wildBattlesWon > state.companion.careBattle,
    gardenReady = !!state.garden?.plots?.some((plot) => plot && plot.battlesRemaining <= 0),
    islandReady = Object.values(state.pelago ?? {}).some((island) => island.ready > 0)
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal pelago-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', { className: 'battle-info-title', children: '\u{1f3dd}\ufe0f Pok\u00e9 Pelago' }),
            jsx('button', { className: 'battle-info-close', onClick: onClose, children: 'X' }),
          ],
        }),
        jsx('div', {
          className: 'pelago-tabs',
          children: PELAGO_TABS.map((entry) => {
            const alert =
              (entry.id === 'companion' && canCare) ||
              (entry.id === 'garden' && gardenReady) ||
              (entry.id === 'islands' && islandReady)
            return jsxs(
              'button',
              {
                className: `pelago-tab${tab === entry.id ? ' active' : ''}`,
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
          className: 'battle-info-content',
          children:
            tab === 'companion'
              ? jsx(CompanionCarePanel, {})
              : tab === 'garden'
                ? jsx(GardenPanel, {})
                : jsx(PelagoIslandsPanel, {}),
        }),
      ],
    }),
  })
}
