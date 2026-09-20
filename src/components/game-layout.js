// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { useIsMobile } from '../hooks.js'
import { BattleScreen } from './battle-screen.js'
import { TownMap } from './town-map.js'
import { PartyBoxPanel } from './party-box-panel.js'
import { MobileTabs } from './mobile-tabs.js'
import { RightPanel } from './right-panel.js'

export function GameLayout() {
  return useIsMobile()
    ? jsxs('div', {
        className: 'game-layout mobile',
        children: [jsx(BattleScreen, {}), jsx(MobileTabs, {})],
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
        ],
      })
}
