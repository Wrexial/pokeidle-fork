// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { SIDE_PANEL_TABS } from '../data/ui.js'
import { encounterData, raidPoolFor, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { GymPanel } from './gym-panel.js'
import { LocationPanel } from './location-panel.js'
import { BackpackPanel } from './backpack-panel.js'
import { CatchSettingsModal } from './catch-settings-modal.js'
import { RewardShopModal } from './reward-shop-modal.js'

const LOCATION_TABS = [
  { id: 'area', label: 'Area' },
  { id: 'league', label: 'League' },
]

export function RightPanel() {
  const { state } = useGame(),
    [tab, setTab] = React.useState('location'),
    [locationTab, setLocationTab] = React.useState('area'),
    [showCatchSettings, setShowCatchSettings] = React.useState(!1),
    [showRewardShop, setShowRewardShop] = React.useState(!1),
    openCatchSettings = React.useCallback(() => setShowCatchSettings(!0), []),
    closeCatchSettings = React.useCallback(() => setShowCatchSettings(!1), []),
    openRewardShop = React.useCallback(() => setShowRewardShop(!0), []),
    closeRewardShop = React.useCallback(() => setShowRewardShop(!1), []),
    location = mapData[state.currentLocation],
    isRaid = location?.type === 'raid',
    routeKey = isRaid ? location?.id : location?.routeKey,
    raidEncounters = isRaid
      ? raidPoolFor(location?.region ?? 'kanto').map((encounter) => ({
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
      tab === 'location'
        ? jsxs('div', {
            className: 'right-subpanel',
            children: [
              jsx('div', {
                className: 'tab-bar right-subtab-bar',
                children: LOCATION_TABS.map((tabDef) =>
                  jsx(
                    'button',
                    {
                      className: `tab-btn${locationTab === tabDef.id ? ' active' : ''}`,
                      onClick: () => setLocationTab(tabDef.id),
                      children: tabDef.label,
                    },
                    tabDef.id
                  )
                ),
              }),
              jsx('div', {
                className: 'panel-content',
                children:
                  locationTab === 'area'
                    ? jsx(LocationPanel, {
                        onOpenCatchSettings: openCatchSettings,
                      })
                    : jsx(GymPanel, {
                        onOpenShop: openRewardShop,
                      }),
              }),
            ],
          })
        : jsx(BackpackPanel, {}),
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
