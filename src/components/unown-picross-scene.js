// Sinnoh's Solaceon Ruins, played as a full-stage scene while the reducer is in
// the `unownPicross` phase. A 5x5 nonogram: read the clues, fill the glyph, and
// check your work.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  UNOWN_PICROSS_SIZE,
  createPicrossPuzzle,
  picrossMatches,
  picrossPrize,
  picrossScore,
  picrossWrongFills,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function UnownPicrossScene() {
  const { state, dispatch } = useGame(),
    [puzzle] = React.useState(createPicrossPuzzle),
    [cells, setCells] = React.useState(() =>
      Array.from({ length: UNOWN_PICROSS_SIZE }, () => Array(UNOWN_PICROSS_SIZE).fill(0))
    ),
    [mistakes, setMistakes] = React.useState(0),
    [wrongFills, setWrongFills] = React.useState(0),
    [score, setScore] = React.useState(0),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof picrossPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    startRef = React.useRef(Date.now()),
    finishedRef = React.useRef(false)

  /** @param {number} row @param {number} column */
  function toggle(row, column) {
    if (prize) return
    if (state.sfxEnabled) playSfx('tap')
    setCells((previous) =>
      previous.map((line, rowIndex) =>
        rowIndex === row ? line.map((value, columnIndex) => (columnIndex === column ? (value ? 0 : 1) : value)) : line
      )
    )
    setWrongFills(0)
  }

  function check() {
    if (finishedRef.current || prize) return
    if (picrossMatches(cells, puzzle.solution)) {
      finishedRef.current = true
      const finalScore = picrossScore(mistakes, Date.now() - startRef.current)
      setScore(finalScore)
      if (state.sfxEnabled) playSfx(finalScore >= 65 ? 'win' : 'good')
      setPrize(picrossPrize(finalScore))
      return
    }
    const wrong = picrossWrongFills(cells, puzzle.solution)
    setMistakes(mistakes + Math.max(1, wrong))
    setWrongFills(wrong)
    if (state.sfxEnabled) playSfx('miss')
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'unownPicross', score, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene unown-picross-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Unown Picross' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: prize
              ? (prize.label ?? '')
              : `Mistakes ${mistakes}${wrongFills > 0 ? ` \u00b7 ${wrongFills} wrong` : ''}`,
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
                className: 'picross-score-line',
                children: `Glyph score ${score}/100 \u00b7 ${mistakes} mistake${mistakes === 1 ? '' : 's'}`,
              }),
            })
          : jsxs('div', {
              className: 'picross-play',
              children: [
                jsxs('div', {
                  className: 'picross-grid',
                  children: [
                    jsx('div', { className: 'picross-corner' }),
                    ...puzzle.colClues.map((clue, column) =>
                      jsx(
                        'div',
                        { className: 'picross-clue col', children: clue.join(' ') },
                        `col-${column}`
                      )
                    ),
                    ...puzzle.rowClues.flatMap((clue, row) => [
                      jsx('div', { className: 'picross-clue row', children: clue.join(' ') }, `row-${row}`),
                      ...Array.from({ length: UNOWN_PICROSS_SIZE }, (_, column) =>
                        jsx(
                          'button',
                          {
                            className: `picross-cell${cells[row][column] ? ' on' : ''}`,
                            onClick: () => toggle(row, column),
                            'aria-label': `Row ${row + 1} column ${column + 1}`,
                          },
                          `${row}-${column}`
                        )
                      ),
                    ]),
                  ],
                }),
                jsx('button', {
                  className: 'move-panel-btn confirm picross-check-btn',
                  onClick: check,
                  children: 'CHECK',
                }),
                jsx('div', {
                  className: 'picross-hint',
                  children: 'Numbers give the runs of filled cells in each row and column.',
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
