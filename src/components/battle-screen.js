// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { BATTLE_LOG_RESERVE, DESIGN_HEIGHT, DESIGN_WIDTH } from '../data/ui.js'
import { useGame } from '../game/context.js'
import { useGameLoop } from '../game/use-game-loop.js'
import { useIsMobile } from '../hooks.js'
import { BattleLog } from './battle-log.js'
import { BattleMenuModals } from './battle-menu-modals.js'
import { BattleScene } from './battle-scene.js'
import { LevelUpNotification } from './level-up-notification.js'

// Never shrink the battle scene past this — on an extremely short viewport the
// bottom of the scene clips rather than the whole scene becoming unreadable.
const MIN_SCENE_SCALE = 0.5

// On a large monitor the scene can grow to use the space instead of sitting at
// its design size in a sea of background.
const MAX_SCENE_SCALE = 1.6

export function BattleScreen() {
  const { state } = useGame(),
    isMobile = useIsMobile(),
    [menu, setMenu] = React.useState(
      /** @type {import('./battle-menu-modals.js').BattleMenuKey | null} */ (null)
    ),
    containerRef = React.useRef(/** @type {HTMLDivElement | null} */ (null)),
    [scale, setScale] = React.useState(1)
  useGameLoop()
  const recalcSize = React.useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth
    // In the stacked (tabbed) layout this element is sized *by* the scene, so
    // cap the scene against the viewport instead, leaving room for the tabs.
    // In the three-column layout the element is a flex child with a fixed
    // height, so reserve only the battle log's minimum.
    const availableHeight = isMobile
      ? window.innerHeight * 0.6
      : containerRef.current.clientHeight - BATTLE_LOG_RESERVE
    const nextScale = Math.min(
      containerWidth / DESIGN_WIDTH,
      availableHeight / DESIGN_HEIGHT,
      MAX_SCENE_SCALE
    )
    setScale(Math.max(nextScale, MIN_SCENE_SCALE))
  }, [isMobile])
  React.useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver(() => recalcSize())
    return (
      resizeObserver.observe(containerRef.current),
      recalcSize(),
      () => resizeObserver.disconnect()
    )
  }, [recalcSize])
  // The tabbed layout's cap comes from `window.innerHeight`, which a
  // ResizeObserver on the container does not track (e.g. mobile browser chrome
  // collapsing), so listen for window resizes too.
  React.useEffect(() => {
    window.addEventListener('resize', recalcSize)
    return () => window.removeEventListener('resize', recalcSize)
  }, [recalcSize])
  if (!state.playerPokemon) return null
  const scene = jsx('div', {
    className: 'battle-scene-scaler',
    style: {
      height: DESIGN_HEIGHT * scale,
    },
    children: jsx('div', {
      className: 'battle-scene-scaler-inner',
      style: {
        transform: `scale(${scale})`,
      },
      children: jsx(BattleScene, { onOpenMenu: setMenu }),
    }),
  })
  // The menus live here, not inside BattleScene, so swapping in a phase scene
  // (healing, evolution, a minigame) no longer closes one that is already open.
  const menus = jsx(BattleMenuModals, { menu, onClose: () => setMenu(null) })
  if (isMobile)
    return jsxs('div', {
      className: 'battle-screen',
      ref: containerRef,
      children: [scene, menus, jsx(LevelUpNotification, {})],
    })
  return jsxs('div', {
    className: 'battle-screen',
    ref: containerRef,
    children: [scene, jsx(BattleLog, {}), menus, jsx(LevelUpNotification, {})],
  })
}
