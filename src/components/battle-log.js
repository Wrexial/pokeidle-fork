// Split from a grouped component file.

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { BATTLE_LOG_MIN_HEIGHT } from '../data/ui.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'

export function BattleLog() {
  const { state } = useGame(),
    containerRef = React.useRef(/** @type {HTMLDivElement | null} */ (null)),
    endRef = React.useRef(/** @type {HTMLDivElement | null} */ (null)),
    [isCollapsed, setIsCollapsed] = React.useState(!1)
  ;(React.useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [state.battleLog.length]),
    React.useEffect(() => {
      const containerEl = containerRef.current
      if (!containerEl) return
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) setIsCollapsed(entry.contentRect.height < BATTLE_LOG_MIN_HEIGHT)
      })
      return (resizeObserver.observe(containerEl), () => resizeObserver.disconnect())
    }, []))
  const activeEffects = state.activeEffects
  return jsx('div', {
    ref: containerRef,
    className: 'battle-log',
    style: isCollapsed
      ? {
          padding: 0,
          borderTop: 'none',
        }
      : void 0,
    children:
      !isCollapsed &&
      jsxs(Fragment, {
        children: [
          jsx('h3', {
            className: 'log-title',
            children: 'Battle Log',
          }),
          activeEffects.length > 0 &&
            jsx('div', {
              className: 'active-effects-bar',
              children: activeEffects.map((effect, index) => {
                let label = ''
                return (
                  effect.type === 'expShare'
                    ? (label = `Exp Share (${effect.battlesRemaining})`)
                    : (label = `${effect.speciesKey ? (pokemonSpecies[effect.speciesKey]?.name ?? effect.speciesKey) : ''} (${effect.battlesRemaining})`),
                  jsx(
                    'span',
                    {
                      className: `active-effect-tag effect-${effect.type}`,
                      children: label,
                    },
                    index
                  )
                )
              }),
            }),
          jsxs('div', {
            className: 'log-entries',
            children: [
              state.battleLog.map((entry, index) =>
                jsx(
                  'div',
                  {
                    className: 'log-entry',
                    children: entry,
                  },
                  index
                )
              ),
              jsx('div', {
                ref: endRef,
              }),
            ],
          }),
        ],
      }),
  })
}
