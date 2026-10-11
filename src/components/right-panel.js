// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { encounterData, raidPoolFor, mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { LocationPanel } from './location-panel.js'
import { BackpackPanel } from './backpack-panel.js'
import { CatchSettingsModal } from './catch-settings-modal.js'
import { HuntModal } from './hunt-panel.js'

export function RightPanel() {
  const { state } = useGame(),
    [showCatchSettings, setShowCatchSettings] = React.useState(!1),
    [showHunt, setShowHunt] = React.useState(!1),
    openCatchSettings = React.useCallback(() => setShowCatchSettings(!0), []),
    closeCatchSettings = React.useCallback(() => setShowCatchSettings(!1), []),
    openHunt = React.useCallback(() => setShowHunt(!0), []),
    closeHunt = React.useCallback(() => setShowHunt(!1), []),
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
        className: 'panel-content',
        children: jsx(LocationPanel, {
          onOpenCatchSettings: openCatchSettings,
          onOpenHunt: openHunt,
        }),
      }),
      jsx(BackpackPanel, {}),
      showHunt && jsx(HuntModal, { onClose: closeHunt }),
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
