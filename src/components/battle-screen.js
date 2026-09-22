// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { DESIGN_WIDTH } from '../data/ui.js'
import { useGame } from '../game/context.js'
import { useGameLoop } from '../game/use-game-loop.js'
import { useIsMobile } from '../hooks.js'
import { BattleLog } from './battle-log.js'
import { BattleScene } from './battle-scene.js'
import { LevelUpNotification } from './level-up-notification.js'

export function BattleScreen() {
  const { state } = useGame(),
    isMobile = useIsMobile(),
    containerRef = React.useRef(/** @type {HTMLDivElement | null} */ (null)),
    contentRef = React.useRef(/** @type {HTMLDivElement | null} */ (null)),
    [scale, setScale] = React.useState(1),
    [contentHeight, setContentHeight] = React.useState(480)
  useGameLoop()
  const recalcSize = React.useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth
    if ((setScale(Math.min(containerWidth / DESIGN_WIDTH, 1)), contentRef.current)) {
      const battleScene = contentRef.current.querySelector('.battle-scene'),
        scrollHeight = contentRef.current.scrollHeight,
        marginBottom = battleScene ? parseFloat(getComputedStyle(battleScene).marginBottom) : 0
      setContentHeight(scrollHeight + marginBottom)
    }
  }, [])
  if (
    (React.useEffect(() => {
      if (!isMobile || !containerRef.current) return
      const resizeObserver = new ResizeObserver(() => recalcSize())
      return (resizeObserver.observe(containerRef.current), recalcSize(), () => resizeObserver.disconnect())
    }, [isMobile, recalcSize]),
    React.useEffect(() => {
      if (isMobile && contentRef.current) {
        const battleScene = contentRef.current.querySelector('.battle-scene'),
          scrollHeight = contentRef.current.scrollHeight,
          marginBottom = battleScene ? parseFloat(getComputedStyle(battleScene).marginBottom) : 0
        setContentHeight(scrollHeight + marginBottom)
      }
    }),
    !state.playerPokemon)
  )
    return null
  if (isMobile) {
    const scaledHeight = contentHeight * scale
    return jsxs('div', {
      className: 'battle-screen',
      ref: containerRef,
      style: {
        height: scaledHeight,
        overflow: 'hidden',
      },
      children: [
        jsx('div', {
          ref: contentRef,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: DESIGN_WIDTH,
          },
          children: jsx(BattleScene, {}),
        }),
        jsx(LevelUpNotification, {}),
      ],
    })
  }
  return jsxs('div', {
    className: 'battle-screen',
    children: [jsx(BattleScene, {}), jsx(BattleLog, {}), jsx(LevelUpNotification, {})],
  })
}
