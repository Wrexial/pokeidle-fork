// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { legendaryPool } from '../data/config.js'
import { SIDE_PANEL_TABS } from '../data/ui.js'
import { encounterData, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { GymPanel } from './gym-panel.js'
import { LocationPanel } from './location-panel.js'
import { CatchSettingsModal } from './catch-settings-modal.js'
import { BagPanel } from './bag-panel.js'
import { RewardShopModal } from './reward-shop-modal.js'

export function RightPanel() {
  const { state } = useGame(),
    [tab, setTab] = React.useState('location'),
    [showCatchSettings, setShowCatchSettings] = React.useState(!1),
    [showRewardShop, setShowRewardShop] = React.useState(!1),
    openCatchSettings = React.useCallback(() => setShowCatchSettings(!0), []),
    closeCatchSettings = React.useCallback(() => setShowCatchSettings(!1), []),
    openRewardShop = React.useCallback(() => setShowRewardShop(!0), []),
    closeRewardShop = React.useCallback(() => setShowRewardShop(!1), []),
    location = mapData[state.currentLocation],
    isRaid = location?.type === 'raid',
    routeKey = isRaid ? 'raidIsland' : location?.routeKey,
    raidEncounters = isRaid
      ? legendaryPool.map((encounter) => ({
          speciesKey: encounter.speciesKey,
          weight: 1,
          minLevel: encounter.level,
          maxLevel: encounter.level,
        }))
      : null,
    routeEncounters = routeKey && !isRaid ? encounterData[routeKey] : null,
    encounters = isRaid ? raidEncounters : routeEncounters?.encounters
  return jsxs('div', {
    className: 'side-panel right-panel',
    children: [
      jsx('div', {
        className: 'tab-bar',
        children: SIDE_PANEL_TABS.map((tabDef) =>
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
      jsx('div', {
        className: 'panel-content',
        children:
          tab === 'location'
            ? jsx(LocationPanel, {
                onOpenCatchSettings: openCatchSettings,
              })
            : tab === 'gym'
              ? jsx(GymPanel, {
                  onOpenShop: openRewardShop,
                })
              : null,
      }),
      jsx(BagPanel, {}),
      showCatchSettings &&
        encounters &&
        routeKey &&
        jsx(CatchSettingsModal, {
          routeKey,
          encounters,
          onClose: closeCatchSettings,
        }),
      showRewardShop &&
        jsx(RewardShopModal, {
          onClose: closeRewardShop,
        }),
    ],
  })
}
