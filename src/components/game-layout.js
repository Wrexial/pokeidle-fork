// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { useIsMobile, useKonamiCode, useDailyEvent, useQuests, useBrowserNotifications, useAwayAlert, useAccessibilitySettings, useGameAudio } from '../hooks.js'
import { BattleScreen } from './battle-screen.js'
import { TownMap } from './town-map.js'
import { PartyBoxPanel } from './party-box-panel.js'
import { MobileTabs } from './mobile-tabs.js'
import { RightPanel } from './right-panel.js'
import { HatchPopup } from './hatch-popup.js'
import { OfflineProgressModal } from './offline-progress-modal.js'
import { NotificationStack } from './notification-stack.js'
import { GlobalTooltip } from './global-tooltip.js'

export function GameLayout() {
  const { dispatch } = useGame()
  // Debug cheat: enter the Konami code to max the active Pokemon to level 100.
  useKonamiCode(() => dispatch({ type: 'DEBUG_MAX_LEVEL' }))
  // Rolls today's daily event and refreshes it at local midnight.
  useDailyEvent()
  // Rolls today's daily quests and refreshes them at local midnight.
  useQuests()
  // Browser notifications for key events while hidden + a "welcome back" alert.
  useBrowserNotifications()
  useAwayAlert()
  // Reduced-motion / colourblind display preferences.
  useAccessibilitySettings()
  // Synthesized region music + event sound effects (opt-in).
  useGameAudio()
  return useIsMobile()
    ? jsxs('div', {
        className: 'game-layout mobile',
        children: [
          jsx(BattleScreen, {}),
          jsx(MobileTabs, {}),
          jsx(HatchPopup, {}),
          jsx(OfflineProgressModal, {}),
          jsx(NotificationStack, {}),
          jsx(GlobalTooltip, {}),
        ],
      })
    : jsxs('div', {
        className: 'game-layout',
        children: [
          jsx(PartyBoxPanel, {}),
          jsxs('div', {
            className: 'center-column',
            children: [jsx(BattleScreen, {}), jsx(TownMap, {})],
          }),
          jsx(RightPanel, {}),
          jsx(HatchPopup, {}),
          jsx(OfflineProgressModal, {}),
          jsx(NotificationStack, {}),
          jsx(GlobalTooltip, {}),
        ],
      })
}
