// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { SIDE_PANEL_TABS } from '../data/ui.js'
import { encounterData, raidPoolFor, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { LocationPanel } from './location-panel.js'
import { BackpackPanel } from './backpack-panel.js'
import { CatchSettingsModal } from './catch-settings-modal.js'

export function RightPanel() {
  const { state } = useGame(),
    [tab, setTab] = React.useState('location'),
    [showCatchSettings, setShowCatchSettings] = React.useState(!1),
    openCatchSettings = React.useCallback(() => setShowCatchSettings(!0), []),
    closeCatchSettings = React.useCallback(() => setShowCatchSettings(!1), []),
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
        ? jsx('div', {
            className: 'panel-content',
            children: jsx(LocationPanel, {
              onOpenCatchSettings: openCatchSettings,
            }),
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
    ],
  })
}
