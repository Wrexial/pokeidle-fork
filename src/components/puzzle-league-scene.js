// Johto's Pokemon Puzzle League, played as a full-stage scene while the reducer
// is in the `puzzleLeague` phase. Swap adjacent tiles to line up three or more;
// cleared tiles cascade for a bigger score.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import {
  MATCH3_MOVES,
  MATCH3_SIZE,
  createMatch3Board,
  match3Prize,
  tryMatch3Swap,
} from '../game/minigames.js'

export function PuzzleLeagueScene() {
  const { state, dispatch } = useGame(),
    [board, setBoard] = React.useState(() => createMatch3Board()),
    [score, setScore] = React.useState(0),
    [moves, setMoves] = React.useState(MATCH3_MOVES),
    [selected, setSelected] = React.useState(-1),
    [message, setMessage] = React.useState('Swap two adjacent tiles to line up three.'),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof match3Prize> | null} */ (null)
    )

  const done = prize !== null

  /** @param {number} index */
  function click(index) {
    if (done) return
    if (selected === -1) {
      setSelected(index)
      return
    }
    if (selected === index) {
      setSelected(-1)
      return
    }
    const rowA = Math.floor(selected / MATCH3_SIZE),
      colA = selected % MATCH3_SIZE,
      rowB = Math.floor(index / MATCH3_SIZE),
      colB = index % MATCH3_SIZE
    if (Math.abs(rowA - rowB) + Math.abs(colA - colB) !== 1) {
      setSelected(index)
      return
    }
    const result = tryMatch3Swap(board, selected, index)
    setSelected(-1)
    if (!result.valid) {
      setMessage('No match there \u2014 try another swap.')
      return
    }
    setBoard(result.board)
    const nextScore = score + result.score
    setScore(nextScore)
    const nextMoves = moves - 1
    setMoves(nextMoves)
    setMessage(
      `+${result.score}${result.cascade > 1 ? ` \u00b7 ${result.cascade}x cascade!` : ''}`
    )
    if (nextMoves <= 0) setPrize(match3Prize(nextScore))
  }

  function leave() {
    if (prize) dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: prize })
    dispatch({ type: 'END_MINIGAME' })
  }

  return jsxs('div', {
    className: 'minigame-scene puzzle-league-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Puzzle League' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [`Score ${score}`, ' \u00b7 ', `Moves ${moves}`],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsx('div', {
            className: 'match3-grid',
            style: { gridTemplateColumns: `repeat(${MATCH3_SIZE}, 1fr)` },
            children: board.map((type, index) =>
              jsx(
                'button',
                {
                  className: `match3-tile match3-${(type ?? 'normal').toLowerCase()}${
                    selected === index ? ' selected' : ''
                  }`,
                  disabled: done,
                  onClick: () => click(index),
                  'aria-label': `${type} tile`,
                },
                index
              )
            ),
          }),
          jsx('div', { className: 'minigame-scene-log', children: message }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          jsx('button', {
            className: 'move-panel-btn cancel',
            onClick: leave,
            children: done ? 'COLLECT & LEAVE' : 'LEAVE',
          }),
        ],
      }),
    ],
  })
}
