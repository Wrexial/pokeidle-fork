// Unova's Voltorb Flip, played as a full-stage scene while the reducer is in
// the `voltorbFlip` phase. Each row and column advertises its Voltorb count and
// point total; flipping 2s and 3s banks coins, and a Voltorb ends the run. When
// the run ends every hidden Voltorb is revealed so the board can be read back.

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
import { playSfx } from '../game/audio.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** The face value shown on a flipped tile. */
const TILE_LABEL = { one: '1', two: '2', three: '3', voltorb: '\u26a1' }

export function VoltorbFlipScene() {
  const { state, dispatch } = useGame(),
    [board, setBoard] = React.useState(() => createVoltorbBoard(1)),
    [banked, setBanked] = React.useState(0),
    [maxLevel, setMaxLevel] = React.useState(1),
    [phase, setPhase] = React.useState(
      /** @type {'playing' | 'exploded' | 'cleared' | 'done'} */ ('playing')
    ),
    [showReward, setShowReward] = React.useState(false),
    // Which tile just went off, so it can show the explosion.
    [explodedIndex, setExplodedIndex] = React.useState(-1),
    [exploding, setExploding] = React.useState(false),
    collect = useMinigameClaim(dispatch)

  const hints = boardHints(board),
    boardCoins = voltorbBoardCoins(board),
    prize = voltorbFlipPrize(banked, maxLevel),
    // Once the run is over, lay every hidden Voltorb face up so the board can
    // be read back.
    revealed = phase === 'done' || (phase === 'exploded' && !exploding),
    finished = phase === 'exploded' || phase === 'done',
    hasPrize = banked > 0 || prize.items.length > 0,
    rewardVisible = showReward

  /** @param {number} index */
  function flip(index) {
    if (phase !== 'playing') return
    const next = flipVoltorbCell(board, index)
    if (next === board) return
    setBoard(next)
    if (boardExploded(next)) {
      setExplodedIndex(index)
      setExploding(true)
      if (state.sfxEnabled) playSfx('explosion')
      setPhase('exploded')
    } else if (boardCleared(next)) {
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

  // Hold the board on screen for the blast, then leave every bomb revealed.
  React.useEffect(() => {
    if (!exploding) return
    const timer = setTimeout(() => setExploding(false), 800)
    return () => clearTimeout(timer)
  }, [exploding])

  function nextLevel() {
    if (board.level >= VOLTORB_MAX_LEVEL) {
      setPhase('done')
      return
    }
    setBoard(createVoltorbBoard(board.level + 1))
    setExplodedIndex(-1)
    setPhase('playing')
  }

  /** End the run (revealing the board) so the player can cash out. */
  function endRun() {
    if (phase === 'playing' || phase === 'cleared') setPhase('done')
  }

  function collectReward() {
    collect(
      { type: 'END_MINIGAME' },
      hasPrize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  /** Show the reward screen (or leave outright when there is nothing to pay). */
  function finishRun() {
    if (hasPrize) setShowReward(true)
    else collectReward()
  }

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
        children: rewardVisible
          ? jsx(MinigameRewardScreen, {
              prize,
              onCollect: collectReward,
              summary: jsx('span', {
                className: 'voltorb-summary-score',
                children: `Banked $${banked.toLocaleString()}`,
              }),
            })
          : [
          jsx('div', {
            className: `voltorb-board${exploding ? ' exploded' : ''}${revealed ? ' revealed' : ''}`,
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
                    cell = board.cells[index],
                    showBomb = cell.kind === 'voltorb' && (cell.flipped || revealed)
                  return jsx(
                    'button',
                    {
                      className: `voltorb-tile${cell.flipped ? ` flipped ${cell.kind}` : ''}${
                        showBomb && !cell.flipped ? ' revealed voltorb' : ''
                      }${cell.marked && !cell.flipped && !revealed ? ' marked' : ''}${
                        index === explodedIndex && exploding ? ' exploding' : ''
                      }`,
                      disabled: phase !== 'playing' || cell.flipped,
                      onClick: () => flip(index),
                      onContextMenu: (/** @type {React.MouseEvent} */ event) =>
                        mark(event, index),
                      children: [
                        cell.flipped
                          ? TILE_LABEL[cell.kind]
                          : showBomb
                            ? jsx('span', { className: 'voltorb-revealed', children: '\u26a1' })
                            : cell.marked
                              ? jsx('span', { className: 'voltorb-mark', children: '\u26a1' })
                              : '',
                        index === explodedIndex &&
                          exploding &&
                          jsx('span', { className: 'voltorb-boom', children: '\u{1f4a5}' }),
                      ],
                    },
                    `tile-${index}`
                  )
                }),
              ]),
            ],
          }),
          jsx('div', {
            className: 'minigame-scene-log',
            children: rewardVisible
              ? ''
              : revealed
                ? 'The run is over \u2014 every Voltorb is revealed. Collect your coins.'
                : phase === 'cleared'
                  ? `Level ${board.level} cleared! $${voltorbBoardCoins(board).toLocaleString()} banked.`
                  : 'Left-click a tile to flip it, right-click to mark a suspected Voltorb.',
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: rewardVisible
          ? []
          : finished
            ? [
                jsx('button', {
                  className: 'move-panel-btn confirm',
                  onClick: finishRun,
                  children: hasPrize ? 'COLLECT' : 'LEAVE',
                }),
              ]
            : [
                jsx('button', {
                  className: 'move-panel-btn cancel',
                  onClick: endRun,
                  children: hasPrize ? 'CASH OUT' : 'LEAVE',
                }),
                jsx('button', {
                  className: 'move-panel-btn confirm',
                  disabled: phase !== 'cleared',
                  onClick: nextLevel,
                  children: board.level >= VOLTORB_MAX_LEVEL ? 'FINISH RUN' : 'NEXT LEVEL',
                }),
              ],
      }),
    ],
  })
}
