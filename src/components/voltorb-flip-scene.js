// Unova's Voltorb Flip, played as a full-stage scene while the reducer is in
// the `voltorbFlip` phase. Each row and column advertises its Voltorb count and
// point total; flipping 2s and 3s banks coins, and a Voltorb ends the run.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import {
  VOLTORB_MAX_LEVEL,
  VOLTORB_SIZE,
  boardCleared,
  boardExploded,
  boardHints,
  createVoltorbBoard,
  flipVoltorbCell,
  toggleVoltorbMark,
  voltorbBoardCoins,
  voltorbFlipPrize,
} from '../game/minigames.js'

/** The face value shown on a flipped tile. */
const TILE_LABEL = { one: '1', two: '2', three: '3', voltorb: '\u26a1' }

export function VoltorbFlipScene() {
  const { state, dispatch } = useGame(),
    [board, setBoard] = React.useState(() => createVoltorbBoard(1)),
    [banked, setBanked] = React.useState(0),
    [maxLevel, setMaxLevel] = React.useState(1),
    [phase, setPhase] = React.useState(
      /** @type {'playing' | 'exploded' | 'cleared' | 'done'} */ ('playing')
    )

  const exploded = boardExploded(board),
    cleared = boardCleared(board),
    hints = boardHints(board),
    boardCoins = voltorbBoardCoins(board),
    prize = voltorbFlipPrize(banked, maxLevel)

  /** @param {number} index */
  function flip(index) {
    if (phase !== 'playing') return
    const next = flipVoltorbCell(board, index)
    if (next === board) return
    setBoard(next)
    if (boardExploded(next)) setPhase('exploded')
    else if (boardCleared(next)) {
      setBanked((value) => value + voltorbBoardCoins(next))
      setMaxLevel((value) => Math.max(value, next.level))
      setPhase('cleared')
    }
  }

  /** @param {React.MouseEvent} event @param {number} index */
  function mark(event, index) {
    event.preventDefault()
    if (phase !== 'playing') return
    setBoard((current) => toggleVoltorbMark(current, index))
  }

  function nextLevel() {
    if (board.level >= VOLTORB_MAX_LEVEL) {
      setPhase('done')
      return
    }
    setBoard(createVoltorbBoard(board.level + 1))
    setPhase('playing')
  }

  function leave() {
    if (banked > 0 || prize.items.length > 0)
      dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: prize })
    dispatch({ type: 'END_MINIGAME' })
  }

  const finished = phase === 'exploded' || phase === 'done'

  return jsxs('div', {
    className: 'minigame-scene voltorb-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Voltorb Flip' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Lv.${board.level}`,
              ' \u00b7 ',
              `Banked $${banked.toLocaleString()}`,
              ' \u00b7 ',
              `Board $${boardCoins.toLocaleString()}`,
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsx('div', {
            className: 'voltorb-board',
            children: [
              jsx('div', { className: 'voltorb-corner' }),
              ...hints.cols.map((hint, col) =>
                jsxs(
                  'div',
                  {
                    className: 'voltorb-hint',
                    children: [
                      jsxs('span', {
                        className: 'voltorb-hint-bombs',
                        children: [jsx('span', { children: '\u26a1' }), hint.voltorbs],
                      }),
                      jsx('span', { className: 'voltorb-hint-sum', children: hint.sum }),
                    ],
                  },
                  `col-${col}`
                )
              ),
              ...Array.from({ length: VOLTORB_SIZE }, (_, row) => [
                jsxs(
                  'div',
                  {
                    className: 'voltorb-hint',
                    children: [
                      jsxs('span', {
                        className: 'voltorb-hint-bombs',
                        children: [jsx('span', { children: '\u26a1' }), hints.rows[row].voltorbs],
                      }),
                      jsx('span', {
                        className: 'voltorb-hint-sum',
                        children: hints.rows[row].sum,
                      }),
                    ],
                  },
                  `row-${row}`
                ),
                ...Array.from({ length: VOLTORB_SIZE }, (_, col) => {
                  const index = row * VOLTORB_SIZE + col,
                    cell = board.cells[index]
                  return jsx(
                    'button',
                    {
                      className: `voltorb-tile${cell.flipped ? ` flipped ${cell.kind}` : ''}${
                        cell.marked && !cell.flipped ? ' marked' : ''
                      }`,
                      disabled: phase !== 'playing' || cell.flipped,
                      onClick: () => flip(index),
                      onContextMenu: (/** @type {React.MouseEvent} */ event) =>
                        mark(event, index),
                      children: cell.flipped
                        ? TILE_LABEL[cell.kind]
                        : cell.marked
                          ? jsx('span', { className: 'voltorb-mark', children: '\u26a1' })
                          : '',
                    },
                    `tile-${index}`
                  )
                }),
              ]),
            ],
          }),
          finished
            ? jsxs('div', {
                className: 'voltorb-summary',
                children: [
                  jsx('span', {
                    className: 'voltorb-summary-title',
                    children: phase === 'exploded' ? 'Voltorb!' : 'Table cleared',
                  }),
                  jsx('span', {
                    className: 'voltorb-summary-score',
                    children: `${prize.label} \u00b7 $${prize.money.toLocaleString()}${
                      prize.items.length > 0 ? ' + a candy' : ''
                    }`,
                  }),
                ],
              })
            : jsx('div', {
                className: 'minigame-scene-log',
                children:
                  phase === 'cleared'
                    ? `Level ${board.level} cleared! $${voltorbBoardCoins(board).toLocaleString()} banked.`
                    : 'Left-click a tile to flip it, right-click to mark a suspected Voltorb.',
              }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          jsx('button', {
            className: 'move-panel-btn cancel',
            onClick: leave,
            children: finished || banked > 0 ? 'COLLECT & LEAVE' : 'LEAVE',
          }),
          !finished &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              disabled: phase !== 'cleared',
              onClick: nextLevel,
              children:
                board.level >= VOLTORB_MAX_LEVEL ? 'FINISH RUN' : 'NEXT LEVEL',
            }),
        ],
      }),
    ],
  })
}
