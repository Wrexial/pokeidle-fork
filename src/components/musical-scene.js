// Unova's Pokemon Musical, played as a full-stage scene while the reducer is in
// the `musical` phase. Notes fall down one of four lanes; tap the matching arrow
// on the beat to score.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import {
  MUSICAL_ARROWS,
  MUSICAL_LANES,
  MUSICAL_OK_MS,
  MUSICAL_VIEW_MS,
  generateMusicalPattern,
  judgeMusicalHit,
  musicalPrize,
  musicalTotalMs,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function MusicalScene() {
  const { state, dispatch } = useGame(),
    [pattern] = React.useState(() => generateMusicalPattern()),
    [elapsed, setElapsed] = React.useState(0),
    [judged, setJudged] = React.useState(() => /** @type {Record<number, string>} */ ({})),
    [score, setScore] = React.useState(0),
    [combo, setCombo] = React.useState(0),
    [lastGrade, setLastGrade] = React.useState(''),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof musicalPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    startRef = React.useRef(Date.now()),
    judgedRef = React.useRef(/** @type {Record<number, string>} */ ({})),
    scoreRef = React.useRef(0),
    comboRef = React.useRef(0),
    finishedRef = React.useRef(false)

  React.useEffect(() => {
    startRef.current = Date.now()
    const total = musicalTotalMs(pattern),
      tick = setInterval(() => {
        if (finishedRef.current) return
        const now = Date.now() - startRef.current
        let missed = false
        for (const note of pattern) {
          if (!judgedRef.current[note.id] && now - note.time > MUSICAL_OK_MS) {
            judgedRef.current[note.id] = 'miss'
            comboRef.current = 0
            missed = true
          }
        }
        setElapsed(now)
        if (missed) {
          setJudged({ ...judgedRef.current })
          setCombo(comboRef.current)
          setLastGrade('miss')
        }
        if (Object.keys(judgedRef.current).length >= pattern.length || now >= total) {
          finishedRef.current = true
          clearInterval(tick)
          setJudged({ ...judgedRef.current })
          setPrize(musicalPrize(scoreRef.current))
        }
      }, 40)
    return () => clearInterval(tick)
  }, [pattern])

  /** @param {number} lane */
  function hit(lane) {
    if (finishedRef.current || prize) return
    const now = Date.now() - startRef.current
    let best = /** @type {{ note: { id: number, time: number }, delta: number } | null} */ (null)
    for (const note of pattern) {
      if (note.lane !== lane || judgedRef.current[note.id]) continue
      const delta = Math.abs(note.time - now)
      if (delta <= MUSICAL_OK_MS && (!best || delta < best.delta)) best = { note, delta }
    }
    if (!best) return
    const { grade, points } = judgeMusicalHit(best.delta)
    judgedRef.current[best.note.id] = grade
    scoreRef.current += points
    if (grade === 'miss') comboRef.current = 0
    else comboRef.current += 1
    setJudged({ ...judgedRef.current })
    setScore(scoreRef.current)
    setCombo(comboRef.current)
    setLastGrade(grade)
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME' },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene musical-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Pok\u00e9mon Musical' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Score ${score}`,
              ' \u00b7 ',
              combo > 1 ? `Combo ${combo}` : lastGrade ? lastGrade.toUpperCase() : 'On the beat!',
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
                className: 'musical-summary',
                children: `Final score ${score}`,
              }),
            })
          : jsxs('div', {
              className: 'musical-board',
              children: [
                jsx('div', {
                  className: 'musical-track',
                  children: MUSICAL_LANES.map((laneName, lane) => {
                    const laneNotes = pattern.filter(
                      (note) => note.lane === lane && !judged[note.id]
                    )
                    return jsxs(
                      'div',
                      {
                        className: `musical-lane lane-${laneName}`,
                        children: [
                          jsx('div', {
                            className: 'musical-lane-notes',
                            children: laneNotes.map((note) => {
                              const remaining = note.time - elapsed
                              if (remaining > MUSICAL_VIEW_MS || remaining < -MUSICAL_OK_MS)
                                return null
                              const top = Math.max(
                                0,
                                Math.min(1.06, 1 - remaining / MUSICAL_VIEW_MS)
                              )
                              return jsx(
                                'span',
                                {
                                  className: 'musical-note',
                                  style: { top: `${top * 100}%` },
                                  children: MUSICAL_ARROWS[laneName],
                                },
                                note.id
                              )
                            }),
                          }),
                          jsx('div', { className: 'musical-hitline' }),
                        ],
                      },
                      laneName
                    )
                  }),
                }),
                jsx('div', {
                  className: 'musical-buttons',
                  children: MUSICAL_LANES.map((laneName, lane) =>
                    jsx(
                      'button',
                      {
                        className: `musical-btn lane-${laneName}`,
                        onPointerDown: () => hit(lane),
                        disabled: !!prize,
                        'aria-label': `Tap ${laneName}`,
                        children: MUSICAL_ARROWS[laneName],
                      },
                      laneName
                    )
                  ),
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
