// Hoenn's Pokemon Contest, played as a full-stage scene while the reducer is in
// the `contest` phase. Pick a move per round to appeal to the theme; rank
// against the rivals at the end.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { moveData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  CONTEST_ROUNDS,
  CONTEST_RIVALS,
  contestAppeal,
  contestPlacement,
  contestPrize,
  contestRank,
  rollContestRivalRound,
  rollContestTheme,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** The three rivals' per-round difficulty tiers. */
const RIVAL_SKILL = [0, 1, 2]

export function ContestScene() {
  const { state, dispatch } = useGame(),
    [theme] = React.useState(rollContestTheme),
    [rivals, setRivals] = React.useState(() =>
      CONTEST_RIVALS.slice(0, 3).map((name, index) => ({ name, score: 0, skill: RIVAL_SKILL[index] }))
    ),
    [round, setRound] = React.useState(0),
    [score, setScore] = React.useState(0),
    [lastMove, setLastMove] = React.useState(
      /** @type {{ moveId: string, type: string | null } | null} */ (null)
    ),
    [phase, setPhase] = React.useState(
      /** @type {'choosing' | 'reveal' | 'done'} */ ('choosing')
    ),
    [log, setLog] = React.useState(
      'Pick a move. On-theme moves score best; chain the same type for a combo.'
    ),
    [board, setBoard] = React.useState(
      /** @type {{ owner: string, isPlayer: boolean, score: number }[] | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch)

  const moves = state.playerPokemon?.moves?.length ? state.playerPokemon.moves : ['tackle']

  /** @param {string} moveId */
  function choose(moveId) {
    if (phase !== 'choosing') return
    const result = contestAppeal(moveId, theme.id, lastMove),
      move = moveData[moveId],
      name = move?.name ?? moveId
    if (state.sfxEnabled)
      playSfx(result.repeated ? 'miss' : result.onTheme && result.combo ? 'great' : 'good')
    setScore((value) => value + result.appeal)
    setLastMove({ moveId, type: result.type })
    setRivals((current) =>
      current.map((rival) => ({
        ...rival,
        score: rival.score + rollContestRivalRound(rival.skill),
      }))
    )
    setLog(
      `${name} appealed for ${result.appeal}${
        result.repeated
          ? ' (repeat \u2014 only 1)'
          : result.onTheme && result.combo
            ? ' (theme + combo)'
            : result.onTheme
              ? ' (theme bonus)'
              : result.combo
                ? ' (combo)'
                : ''
      }.`
    )
    setPhase('reveal')
  }

  function next() {
    const isLast = round + 1 >= CONTEST_ROUNDS
    if (isLast) {
      const finalRivals = rivals,
        results = contestPlacement(
          score,
          finalRivals.map((rival) => ({ name: rival.name, score: rival.score }))
        )
      setBoard(results)
      setPhase('done')
      return
    }
    setRound((value) => value + 1)
    setPhase('choosing')
    setLog('Pick your next move.')
  }

  const prize = board ? contestPrize(contestRank(board)) : null

  function leave() {
    collect(
      { type: 'END_MINIGAME' },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene contest-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Pok\u00e9mon Contest' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Round ${Math.min(round + 1, CONTEST_ROUNDS)}/${CONTEST_ROUNDS}`,
              ' \u00b7 ',
              `Score ${score}`,
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsxs('div', {
            className: `contest-theme contest-theme-${theme.id}`,
            children: [
              jsxs('span', {
                className: 'contest-theme-label',
                children: [theme.label, ' Contest'],
              }),
              jsx('span', {
                className: 'contest-theme-types',
                children: theme.types.join(' \u00b7 '),
              }),
            ],
          }),
          phase === 'done' && board
            ? jsx(MinigameRewardScreen, {
                prize,
                onCollect: leave,
                summary: jsxs('div', {
                  className: 'contest-board',
                  children: board.map((entry, index) =>
                    jsxs(
                      'div',
                      {
                        className: `contest-rank${entry.isPlayer ? ' player' : ''}`,
                        children: [
                          jsx('span', {
                            className: 'contest-rank-place',
                            children: `${index + 1}.`,
                          }),
                          jsx('span', { className: 'contest-rank-name', children: entry.owner }),
                          jsx('span', { className: 'contest-rank-score', children: entry.score }),
                        ],
                      },
                      entry.owner
                    )
                  ),
                }),
              })
            : jsx('div', {
                className: 'contest-moves',
                children: moves.map((moveId) => {
                  const move = moveData[moveId],
                    preview = contestAppeal(moveId, theme.id, lastMove)
                  return jsxs(
                    'button',
                    {
                      className: 'contest-move',
                      disabled: phase !== 'choosing',
                      onClick: () => choose(moveId),
                      children: [
                        jsx('span', {
                          className: 'contest-move-name',
                          children: move?.name ?? moveId,
                        }),
                        jsx('span', {
                          className: `type-badge type-${(move?.type ?? 'normal').toLowerCase()}`,
                          children: move?.type ?? 'Normal',
                        }),
                        jsx('span', {
                          className: 'contest-move-appeal',
                          children: `+${preview.appeal}`,
                        }),
                      ],
                    },
                    moveId
                  )
                }),
              }),
          jsx('div', { className: 'minigame-scene-log', children: log }),
          jsxs('div', {
            className: 'contest-rivals',
            children: rivals.map((rival) =>
              jsxs(
                'span',
                {
                  className: 'contest-rival',
                  children: [rival.name, ' ', jsx('strong', { children: rival.score })],
                },
                rival.name
              )
            ),
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          phase !== 'done' &&
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: leave,
              children: 'LEAVE',
            }),
          phase === 'reveal' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: next,
              children: round + 1 >= CONTEST_ROUNDS ? 'SEE RESULTS' : 'NEXT ROUND',
            }),
        ],
      }),
    ],
  })
}
