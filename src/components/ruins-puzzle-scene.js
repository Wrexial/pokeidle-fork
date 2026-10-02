// Johto's Ruins of Alph, played as a full-stage scene while the reducer is in
// the `ruinsPuzzle` phase. Slide the stone tiles back into order against the
// single empty slot; tap a tile beside the gap or use the arrow keys.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  canSlide,
  createSlidingPuzzle,
  isSlidingSolved,
  randomUnownForm,
  slideTile,
  slidingPrize,
  slidingTileForDirection,
  UNOWN_FORMS,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** Arrow key -> slide direction. @type {Record<string, string>} */
const ARROW_DIRECTIONS = { ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E' }

export function RuinsPuzzleScene() {
  const { state, dispatch } = useGame(),
    [board, setBoard] = React.useState(() => createSlidingPuzzle()),
    [moves, setMoves] = React.useState(0),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof slidingPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    size = Math.round(Math.sqrt(board.length)),
    caughtUnown = UNOWN_FORMS.filter((key) => state.pokedexCaught.includes(key)).length

  /** @param {number} index */
  function slideAt(index) {
    if (prize) return
    const next = slideTile(board, index, size)
    if (next === board) return
    if (state.sfxEnabled) playSfx('tap')
    setBoard(next)
    setMoves(moves + 1)
  }

  React.useEffect(() => {
    if (!prize && isSlidingSolved(board)) {
      if (state.sfxEnabled) playSfx('win')
      setPrize({
        ...slidingPrize(moves, true),
        // Every solve hands over a random Unown form the player is missing.
        pokemon: { speciesKey: randomUnownForm(state.pokedexCaught), level: 5 },
      })
    }
  }, [board, prize, moves])

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      const direction = ARROW_DIRECTIONS[event.key]
      if (!direction || prize) return
      const index = slidingTileForDirection(board, direction, size)
      if (index === null) return
      event.preventDefault()
      slideAt(index)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function leave() {
    collect(
      { type: 'END_MINIGAME' },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene ruins-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Ruins of Alph' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Moves ${moves}`,
              ' \u00b7 ',
              prize ? (prize.label ?? '') : 'Restore the picture',
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children: prize
          ? jsx(MinigameRewardScreen, {
              prize,
              onCollect: leave,
              summary: jsx('span', {
                className: 'ruins-summary',
                children: `Picture restored in ${moves} moves \u00b7 Unown ${Math.min(
                  caughtUnown + 1,
                  UNOWN_FORMS.length
                )}/${UNOWN_FORMS.length}`,
              }),
            })
          : jsxs('div', {
              className: 'ruins-wrap',
              children: [
                jsx('div', {
                  className: 'ruins-grid',
                  style: { gridTemplateColumns: `repeat(${size}, 1fr)` },
                  children: board.map((value, index) =>
                    value === 0
                      ? jsx('div', { className: 'ruins-tile blank', 'aria-hidden': 'true' })
                      : jsx(
                          'button',
                          {
                            className: `ruins-tile${canSlide(board, index, size) ? ' slidable' : ''}`,
                            onClick: () => slideAt(index),
                            disabled: !!prize,
                            'aria-label': `Slide tile ${value}`,
                            children: value,
                          },
                          index
                        )
                  ),
                }),
                jsx('span', {
                  className: 'ruins-hint',
                  children: 'Tap a tile beside the gap, or use the arrow keys',
                }),
              ],
            }),
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          !prize &&
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: leave,
              children: 'LEAVE',
            }),
        ],
      }),
    ],
  })
}
