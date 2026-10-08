// Unova's Type Fusion, played as a full-stage scene while the reducer is in the
// `typeFusion` phase. A 2048-style slide puzzle on a 4x4 grid of type tiles.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  TYPE_FUSION_MOVES,
  createTypeFusionBoard,
  slideTypeFusion,
  spawnTypeFusionTile,
  typeFusionCanMove,
  typeFusionLabel,
  typeFusionPrize,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** One colour per type ladder level (index 0 is level 1). */
const TYPE_COLORS = [
  '#a8a878',
  '#f08030',
  '#6890f0',
  '#78c850',
  '#f8d030',
  '#98d8d8',
  '#c03028',
  '#a040a0',
  '#e0c068',
  '#a890f0',
  '#f85888',
  '#7038f8',
]

export function TypeFusionScene() {
  const { state, dispatch } = useGame(),
    [board, setBoard] = React.useState(() => createTypeFusionBoard()),
    [score, setScore] = React.useState(0),
    [movesLeft, setMovesLeft] = React.useState(TYPE_FUSION_MOVES),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof typeFusionPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    boardRef = React.useRef(board),
    scoreRef = React.useRef(0),
    movesRef = React.useRef(TYPE_FUSION_MOVES),
    finishedRef = React.useRef(false)

  /**
   * Slide the board and drop a fresh tile if anything moved.
   * @param {'left' | 'right' | 'up' | 'down'} direction
   */
  function move(direction) {
    if (finishedRef.current || prize) return
    const result = slideTypeFusion(boardRef.current, direction)
    if (!result.moved) {
      if (state.sfxEnabled) playSfx('miss')
      return
    }
    const nextBoard = spawnTypeFusionTile(result.board),
      nextScore = scoreRef.current + result.gained,
      nextMoves = movesRef.current - 1
    boardRef.current = nextBoard
    scoreRef.current = nextScore
    movesRef.current = nextMoves
    setBoard(nextBoard)
    setScore(nextScore)
    setMovesLeft(nextMoves)
    if (state.sfxEnabled) playSfx(result.gained > 0 ? 'good' : 'tap')
    if (nextMoves <= 0 || !typeFusionCanMove(nextBoard)) {
      finishedRef.current = true
      if (state.sfxEnabled) playSfx('win')
      setPrize(typeFusionPrize(nextScore))
    }
  }

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      const moves = /** @type {Record<string, 'left' | 'right' | 'up' | 'down'>} */ ({
        ArrowLeft: 'left',
        KeyA: 'left',
        ArrowRight: 'right',
        KeyD: 'right',
        ArrowUp: 'up',
        KeyW: 'up',
        ArrowDown: 'down',
        KeyS: 'down',
      })
      const direction = moves[event.code]
      if (!direction) return
      event.preventDefault()
      move(direction)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prize])

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'typeFusion', score, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene type-fusion-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Type Fusion' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: prize ? (prize.label ?? '') : `Score ${score} \u00b7 ${movesLeft} moves left`,
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
                className: 'fusion-score-line',
                children: `Scored ${score}`,
              }),
            })
          : jsxs('div', {
              className: 'fusion-play',
              children: [
                jsxs('div', {
                  className: 'fusion-main',
                  children: [
                    jsx('div', {
                      className: 'fusion-grid',
                      children: board.flatMap((row, rowIndex) =>
                        row.map((level, columnIndex) =>
                          jsx(
                            'div',
                            {
                              className: `fusion-tile${level > 0 ? ' filled' : ''}`,
                              style: level > 0 ? { background: TYPE_COLORS[level - 1] } : undefined,
                              children: level > 0 ? typeFusionLabel(level) : '',
                            },
                            `${rowIndex}-${columnIndex}`
                          )
                        )
                      ),
                    }),
                    jsxs('div', {
                      className: 'fusion-pad',
                      children: [
                        jsx('button', {
                          className: 'move-panel-btn',
                          onClick: () => move('up'),
                          children: '\u25b2',
                        }),
                        jsxs('div', {
                          className: 'fusion-pad-row',
                          children: [
                            jsx('button', {
                              className: 'move-panel-btn',
                              onClick: () => move('left'),
                              children: '\u25c0',
                            }),
                            jsx('button', {
                              className: 'move-panel-btn',
                              onClick: () => move('down'),
                              children: '\u25bc',
                            }),
                            jsx('button', {
                              className: 'move-panel-btn',
                              onClick: () => move('right'),
                              children: '\u25b6',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                jsx('div', {
                  className: 'fusion-hint',
                  children: 'Slide with the arrow keys or the pad. Equal types fuse one step up.',
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
