// Hoenn's Lights Out, played as a full-stage scene while the reducer is in the
// `lightsOut` phase. Every tap toggles a tile and its neighbours; turn all the
// lights back on.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import {
  LIGHTS_OUT_SIZE,
  createLightsOut,
  lightsOutPrize,
  lightsSolved,
  toggleLights,
} from '../game/minigames.js'

export function LightsOutScene() {
  const { state, dispatch } = useGame(),
    [grid, setGrid] = React.useState(() => createLightsOut()),
    [moves, setMoves] = React.useState(0),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof lightsOutPrize> | null} */ (null)
    )

  const done = prize !== null

  /** @param {number} index */
  function tap(index) {
    if (done) return
    const next = toggleLights(grid, index),
      nextMoves = moves + 1
    setGrid(next)
    setMoves(nextMoves)
    if (lightsSolved(next)) setPrize(lightsOutPrize(nextMoves, true))
  }

  function giveUp() {
    if (!done) setPrize(lightsOutPrize(moves, false))
  }

  function leave() {
    if (prize) dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: prize })
    dispatch({ type: 'END_MINIGAME' })
  }

  return jsxs('div', {
    className: 'minigame-scene lights-out-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Lights Out' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [`Taps ${moves}`, ' \u00b7 ', done ? (prize?.label ?? '') : 'All lights on to solve'],
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children: jsx('div', {
          className: 'lights-grid',
          style: { gridTemplateColumns: `repeat(${LIGHTS_OUT_SIZE}, 1fr)` },
          children: grid.map((lit, index) =>
            jsx(
              'button',
              {
                className: `light-tile${lit ? ' lit' : ''}`,
                disabled: done,
                onClick: () => tap(index),
                'aria-label': `Light ${index + 1} ${lit ? 'on' : 'off'}`,
              },
              index
            )
          ),
        }),
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          jsx('button', {
            className: 'move-panel-btn cancel',
            onClick: done ? leave : giveUp,
            children: done ? 'COLLECT & LEAVE' : 'GIVE UP',
          }),
        ],
      }),
    ],
  })
}
