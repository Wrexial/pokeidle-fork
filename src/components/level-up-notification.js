// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'

export function LevelUpNotification() {
  const { state, dispatch } = useGame()
  return (
    React.useEffect(() => {
      if (state.levelUpNotification) {
        const timeoutId = setTimeout(() => {
          dispatch({
            type: 'CLEAR_LEVEL_UP',
          })
        }, 2e3)
        return () => clearTimeout(timeoutId)
      }
    }, [state.levelUpNotification, dispatch]),
    state.levelUpNotification
      ? jsx('div', {
          className: 'level-up-notification',
          children: jsx('span', {
            children: state.levelUpNotification,
          }),
        })
      : null
  )
}
