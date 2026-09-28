// Unova's Pokemon Musical, played as a full-stage scene while the reducer is in
// the `musical` phase. Notes fall down one of four lanes; tap the matching arrow
// on the beat to score, with a callout for each grade and a live score/combo.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  MUSICAL_LANES,
  MUSICAL_OK_MS,
  MUSICAL_VIEW_MS,
  generateMusicalPattern,
  judgeMusicalHit,
  musicalPrize,
  musicalTotalMs,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** Callout shown for each timing grade. @type {Record<string, string>} */
const MUSICAL_GRADE_LABELS = {
  perfect: 'PERFECT!',
  good: 'GREAT!',
  ok: 'GOOD!',
  miss: 'MISS',
}

/** Weight each grade contributes to the accuracy readout. @type {Record<string, number>} */
const MUSICAL_GRADE_WEIGHT = { perfect: 100, good: 66, ok: 33, miss: 0 }

/** Degrees to rotate the base up-arrow so it points the lane's direction. @type {Record<string, number>} */
const MUSICAL_ARROW_ROTATION = { up: 0, right: 90, down: 180, left: 270 }

/**
 * A lane's arrow, drawn as an inline SVG from a single path and rotated per
 * lane. Unicode arrows can't be used: the pixel font only ships some of them,
 * so the missing ones fall back to another font at a different size.
 * @param {{ lane: string, className?: string, style?: object }} props
 */
function MusicalArrow({ lane, className = '', style }) {
  return jsx('svg', {
    className: `musical-arrow${className ? ` ${className}` : ''}`,
    viewBox: '0 0 16 16',
    style,
    'aria-hidden': true,
    focusable: false,
    children: jsx('path', {
      d: 'M8 0.8 L15.2 8 L10.6 8 L10.6 15.2 L5.4 15.2 L5.4 8 L0.8 8 Z',
      transform: `rotate(${MUSICAL_ARROW_ROTATION[lane] ?? 0} 8 8)`,
    }),
  })
}

export function MusicalScene() {
  const { state, dispatch } = useGame(),
    [pattern] = React.useState(() => generateMusicalPattern()),
    [elapsed, setElapsed] = React.useState(0),
    [judged, setJudged] = React.useState(() => /** @type {Record<number, string>} */ ({})),
    [score, setScore] = React.useState(0),
    [combo, setCombo] = React.useState(0),
    [feedback, setFeedback] = React.useState(
      () =>
        /** @type {{ key: number, grade: string, points: number } | null} */ (null)
    ),
    [hitLane, setHitLane] = React.useState(
      () => /** @type {{ key: number, lane: number } | null} */ (null)
    ),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof musicalPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    totalMs = React.useMemo(() => musicalTotalMs(pattern), [pattern]),
    startRef = React.useRef(Date.now()),
    judgedRef = React.useRef(/** @type {Record<number, string>} */ ({})),
    scoreRef = React.useRef(0),
    comboRef = React.useRef(0),
    feedbackKeyRef = React.useRef(0),
    finishedRef = React.useRef(false)

  /**
   * Show the grade callout (and flash the lane) for the latest judgement.
   * @param {string} grade
   * @param {number} points
   * @param {number} [lane]
   */
  function showFeedback(grade, points, lane = -1) {
    feedbackKeyRef.current += 1
    setFeedback({ key: feedbackKeyRef.current, grade, points })
    if (lane >= 0) setHitLane({ key: feedbackKeyRef.current, lane })
  }

  React.useEffect(() => {
    startRef.current = Date.now()
    const tick = setInterval(() => {
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
        if (state.sfxEnabled) playSfx('miss')
        setJudged({ ...judgedRef.current })
        setCombo(comboRef.current)
        showFeedback('miss', 0)
      }
      if (Object.keys(judgedRef.current).length >= pattern.length || now >= totalMs) {
        finishedRef.current = true
        clearInterval(tick)
        setJudged({ ...judgedRef.current })
        setPrize(musicalPrize(scoreRef.current))
      }
    }, 40)
    return () => clearInterval(tick)
  }, [pattern, totalMs])

  // Fade the latest callout and lane flash back out.
  React.useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => {
      setFeedback(null)
      setHitLane(null)
    }, 600)
    return () => clearTimeout(timer)
  }, [feedback])

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
    if (state.sfxEnabled)
      playSfx(grade === 'perfect' ? 'great' : grade === 'miss' ? 'miss' : 'good')
    judgedRef.current[best.note.id] = grade
    scoreRef.current += points
    if (grade === 'miss') comboRef.current = 0
    else comboRef.current += 1
    setJudged({ ...judgedRef.current })
    setScore(scoreRef.current)
    setCombo(comboRef.current)
    showFeedback(grade, points, lane)
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME' },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const grades = Object.values(judged),
    accuracy =
      grades.length > 0
        ? Math.round(
            grades.reduce((sum, grade) => sum + (MUSICAL_GRADE_WEIGHT[grade] ?? 0), 0) /
              grades.length
          )
        : 100,
    progress = Math.max(0, Math.min(1, elapsed / totalMs))

  return jsxs('div', {
    className: 'minigame-scene musical-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Pok\u00e9mon Musical' }),
          jsxs('span', {
            className: 'musical-hud',
            children: [
              jsxs('span', {
                className: 'musical-hud-score',
                children: [
                  jsx('span', { className: 'musical-hud-label', children: 'SCORE' }),
                  jsx('span', {
                    key: score,
                    className: 'musical-score-value',
                    children: score,
                  }),
                ],
              }),
              jsx('span', {
                className: 'musical-hud-acc',
                children: `${accuracy}%`,
              }),
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
                children: `Final score ${score} \u00b7 ${accuracy}% accuracy`,
              }),
            })
          : jsxs('div', {
              className: 'musical-board',
              children: [
                jsx('div', {
                  className: 'musical-progress',
                  children: jsx('div', {
                    className: 'musical-progress-fill',
                    style: { width: `${progress * 100}%` },
                  }),
                }),
                combo >= 2 &&
                  jsx('div', {
                    key: combo,
                    className: `musical-combo${combo >= 5 ? ' hot' : ''}`,
                    children: `COMBO \u00d7${combo}`,
                  }),
                feedback &&
                  jsxs('div', {
                    key: feedback.key,
                    className: `musical-feedback grade-${feedback.grade}`,
                    children: [
                      jsx('span', {
                        className: 'musical-feedback-label',
                        children: MUSICAL_GRADE_LABELS[feedback.grade] ?? '',
                      }),
                      feedback.points > 0 &&
                        jsx('span', {
                          className: 'musical-feedback-points',
                          children: `+${feedback.points}`,
                        }),
                    ],
                  }),
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
                                MusicalArrow,
                                {
                                  lane: laneName,
                                  className: 'musical-note',
                                  style: { top: `${top * 100}%` },
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
                        className: `musical-btn lane-${laneName}${hitLane?.lane === lane ? ' hit' : ''}`,
                        onPointerDown: () => hit(lane),
                        disabled: !!prize,
                        'aria-label': `Tap ${laneName}`,
                        children: jsx(MusicalArrow, { lane: laneName }),
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
