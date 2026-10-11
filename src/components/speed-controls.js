// Split from a grouped component file.

import { jsx, jsxs } from 'react/jsx-runtime'
import { SPEED_OPTIONS } from '../data/ui.js'
import { useGame } from '../game/context.js'
import { SegmentedControl } from './ui-controls.js'

export function SpeedControls() {
  const { state, dispatch } = useGame()
  return jsxs('div', {
    className: 'speed-controls',
    children: [
      jsx('button', {
        type: 'button',
        className: `ui-segmented-btn pause-btn${state.paused ? ' active' : ''}`,
        'aria-label': state.paused ? 'Resume' : 'Pause',
        'aria-pressed': state.paused,
        onClick: () => dispatch({ type: 'TOGGLE_PAUSE' }),
        children: state.paused ? '\u25b6' : '\u23f8',
      }),
      jsx(SegmentedControl, {
        options: SPEED_OPTIONS.map((speedOption) => ({
          value: speedOption,
          label: `${speedOption}x`,
        })),
        value: state.speed,
        onChange: /** @param {number} speed */ (speed) => {
          if (state.paused) dispatch({ type: 'TOGGLE_PAUSE' })
          dispatch({ type: 'SET_SPEED', payload: { speed } })
        },
        compact: true,
        'aria-label': 'Battle speed',
      }),
    ],
  })
}
