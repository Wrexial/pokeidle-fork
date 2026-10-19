// Split from a grouped component file.

import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { UiProvider } from '../game/ui-context.js'
import { useIsMobile, useKonamiCode, useHotkeys, useDailyEvent, useQuests, useBrowserNotifications, useAwayAlert, useAccessibilitySettings, useGameAudio, useDayPhase, useScreenWakeLock, useOnlineStatus } from '../hooks.js'
import { BattleScreen } from './battle-screen.js'
import { TownMap } from './town-map.js'
import { PartyBoxPanel } from './party-box-panel.js'
import { MobileTabs } from './mobile-tabs.js'
import { RightPanel } from './right-panel.js'
import { HatchPopup } from './hatch-popup.js'
import { FeatureUnlockModal } from './feature-unlock-modal.js'
import { OfflineProgressModal } from './offline-progress-modal.js'
import { NotificationStack } from './notification-stack.js'
import { GlobalTooltip } from './global-tooltip.js'

export function GameLayout() {
  const { dispatch } = useGame(),
    dayPhase = useDayPhase()
  // Re-render when the connection changes: offline play uses the static sprites.
  useOnlineStatus()
  // Debug cheat: enter the Konami code to max the active Pokemon to level 100.
  useKonamiCode(() => dispatch({ type: 'DEBUG_MAX_LEVEL' }))
  // Rebindable global hotkeys (pause, speed, manual/auto, auto-catch).
  useHotkeys()
  // Rolls today's daily event and refreshes it at local midnight.
  useDailyEvent()
  // Rolls today's daily quests and refreshes them at local midnight.
  useQuests()
  // Browser notifications for key events while hidden + a "welcome back" alert.
  useBrowserNotifications()
  useAwayAlert()
  // Reduced-motion / colourblind display preferences.
  useAccessibilitySettings()
  // Keep phones/tablets from sleeping mid-battle.
  useScreenWakeLock()
  // Synthesized region music + event sound effects (opt-in).
  useGameAudio()
  return jsx(UiProvider, {
    children: useIsMobile()
      ? jsxs('div', {
          className: 'game-layout mobile',
          'data-day-phase': dayPhase.id,
          children: [
            jsx(BattleScreen, {}),
            jsx(MobileTabs, {}),
            jsx(HatchPopup, {}),
            jsx(FeatureUnlockModal, {}),
            jsx(OfflineProgressModal, {}),
            jsx(NotificationStack, {}),
            jsx(GlobalTooltip, {}),
          ],
        })
      : jsxs('div', {
          className: 'game-layout',
          'data-day-phase': dayPhase.id,
          children: [
            jsx(PartyBoxPanel, {}),
            jsxs('div', {
              className: 'center-column',
              children: [jsx(BattleScreen, {}), jsx(TownMap, {})],
            }),
            jsx(RightPanel, {}),
            jsx(HatchPopup, {}),
            jsx(FeatureUnlockModal, {}),
            jsx(OfflineProgressModal, {}),
            jsx(NotificationStack, {}),
            jsx(GlobalTooltip, {}),
          ],
        }),
  })
}
