// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { SPEED_OPTIONS } from '../data/ui.js'
import { useGame } from '../game/context.js'

export function SpeedControls() {
  const { state, dispatch } = useGame()
  return jsxs('div', {
    className: 'speed-controls',
    children: [
      jsx('button', {
        className: `speed-btn pause-btn ${state.paused ? 'active' : ''}`,
        onClick: () =>
          dispatch({
            type: 'TOGGLE_PAUSE',
          }),
        children: state.paused ? '▶' : '⏸',
      }),
      SPEED_OPTIONS.map((speedOption) =>
        jsxs(
          'button',
          {
            className: `speed-btn ${!state.paused && state.speed === speedOption ? 'active' : ''}`,
            onClick: () => {
              ;(state.paused &&
                dispatch({
                  type: 'TOGGLE_PAUSE',
                }),
                dispatch({
                  type: 'SET_SPEED',
                  payload: {
                    speed: speedOption,
                  },
                }))
            },
            children: [speedOption, 'x'],
          },
          speedOption
        )
      ),
    ],
  })
}
