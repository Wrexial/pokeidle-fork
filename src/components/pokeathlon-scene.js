// Johto's Pokeathlon, played as a full-stage scene while the reducer is in the
// `pokeathlon` phase. Three micro-events, each scored 0-100: a button-mash
// Sprint, a timing Hurdle and a moving-target Throw.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import {
  POKEATHLON_ATTEMPTS,
  POKEATHLON_EVENT_MAX,
  POKEATHLON_SPRINT_MS,
  accuracyScore,
  pokeathlonPrize,
  sprintScore,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

const EVENT_NAMES = ['Sprint', 'Hurdle', 'Target Throw']

/** A one-off "latest onFinish" ref so the child timers don't reset each render.
 * @template T
 * @param {T} value
 * @returns {{ current: T }}
 */
function useLatestRef(value) {
  const ref = React.useRef(value)
  React.useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

/** @param {{ onFinish: (score: number) => void }} props */
function SprintEvent({ onFinish }) {
  const [presses, setPresses] = React.useState(0),
    [timeLeft, setTimeLeft] = React.useState(POKEATHLON_SPRINT_MS),
    finishRef = useLatestRef(onFinish),
    pressesRef = React.useRef(0),
    doneRef = React.useRef(false),
    startRef = React.useRef(Date.now())
  React.useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, POKEATHLON_SPRINT_MS - (Date.now() - startRef.current))
      setTimeLeft(remaining)
      if (remaining <= 0 && !doneRef.current) {
        doneRef.current = true
        clearInterval(id)
        finishRef.current(sprintScore(pressesRef.current))
      }
    }, 50)
    return () => clearInterval(id)
  }, [finishRef])
  function mash() {
    if (doneRef.current) return
    pressesRef.current++
    setPresses(pressesRef.current)
  }
  return jsxs('div', {
    className: 'athlon-event athlon-sprint',
    children: [
      jsx('div', {
        className: 'athlon-timer',
        children: jsx('div', {
          className: 'athlon-timer-fill',
          style: { width: `${(timeLeft / POKEATHLON_SPRINT_MS) * 100}%` },
        }),
      }),
      jsx('div', {
        className: 'athlon-big-readout',
        children: `${presses} presses`,
      }),
      jsx('button', {
        className: 'athlon-mash-btn',
        onClick: mash,
        disabled: doneRef.current,
        children: 'MASH!',
      }),
    ],
  })
}

/** @param {{ onFinish: (score: number) => void, speed: number, label: string }} props */
function TimingEvent({ onFinish, speed, label }) {
  const [marker, setMarker] = React.useState(0),
    [attempt, setAttempt] = React.useState(0),
    [offsets, setOffsets] = React.useState(/** @type {number[]} */ ([])),
    finishRef = useLatestRef(onFinish),
    posRef = React.useRef(0),
    dirRef = React.useRef(1),
    lockedRef = React.useRef(false)
  React.useEffect(() => {
    const id = setInterval(() => {
      posRef.current += dirRef.current * speed
      if (posRef.current >= 1) {
        posRef.current = 1
        dirRef.current = -1
      } else if (posRef.current <= 0) {
        posRef.current = 0
        dirRef.current = 1
      }
      setMarker(posRef.current)
    }, 40)
    return () => clearInterval(id)
  }, [speed])
  function lock() {
    if (lockedRef.current || offsets.length >= POKEATHLON_ATTEMPTS) return
    const offset = Math.abs(posRef.current - 0.5) * 2,
      next = [...offsets, offset]
    setOffsets(next)
    setAttempt(next.length)
    if (next.length >= POKEATHLON_ATTEMPTS) {
      lockedRef.current = true
      const average = next.reduce((sum, value) => sum + accuracyScore(value), 0) / next.length
      finishRef.current(Math.round(average))
    }
  }
  return jsxs('div', {
    className: 'athlon-event athlon-timing',
    children: [
      jsx('div', { className: 'athlon-event-label', children: label }),
      jsxs('div', {
        className: 'athlon-track',
        children: [
          jsx('div', { className: 'athlon-sweet-spot' }),
          jsx('div', {
            className: 'athlon-marker',
            style: { left: `${marker * 100}%` },
          }),
        ],
      }),
      jsx('div', {
        className: 'athlon-big-readout',
        children: `Attempt ${Math.min(attempt + 1, POKEATHLON_ATTEMPTS)}/${POKEATHLON_ATTEMPTS}`,
      }),
      jsx('button', {
        className: 'athlon-mash-btn',
        onClick: lock,
        disabled: lockedRef.current,
        children: 'NOW!',
      }),
    ],
  })
}

export function PokeathlonScene() {
  const { state, dispatch } = useGame(),
    [eventIndex, setEventIndex] = React.useState(0),
    [scores, setScores] = React.useState(() => /** @type {number[]} */ ([])),
    [phase, setPhase] = React.useState(
      /** @type {'play' | 'between' | 'done'} */ ('play')
    ),
    collect = useMinigameClaim(dispatch)

  const total = scores.reduce((sum, value) => sum + value, 0),
    prize = pokeathlonPrize(total),
    finished = scores.length >= EVENT_NAMES.length

  /** @param {number} score */
  function finishEvent(score) {
    setScores((current) => [...current, score])
    setPhase('between')
  }

  function nextEvent() {
    if (finished) {
      setPhase('done')
      return
    }
    setEventIndex((value) => value + 1)
    setPhase('play')
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME' },
      phase === 'done' ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const lastScore = scores.length > 0 ? scores[scores.length - 1] : 0

  return jsxs('div', {
    className: 'minigame-scene pokeathlon-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Pok\u00e9athlon' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Event ${Math.min(eventIndex + 1, EVENT_NAMES.length)}/${EVENT_NAMES.length}`,
              ' \u00b7 ',
              `${EVENT_NAMES[eventIndex] ?? ''}`,
              ' \u00b7 ',
              `Total ${total}`,
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children:
          phase === 'done'
            ? jsx(MinigameRewardScreen, {
                prize,
                onCollect: leave,
                summary: jsxs('div', {
                  className: 'athlon-summary-events',
                  children: [
                    jsx('span', {
                      className: 'athlon-summary-score',
                      children: `${total} / ${EVENT_NAMES.length * POKEATHLON_EVENT_MAX}`,
                    }),
                    ...EVENT_NAMES.map((name, index) =>
                      jsx(
                        'span',
                        {
                          className: 'athlon-summary-event',
                          children: `${name}: ${scores[index] ?? 0}`,
                        },
                        name
                      )
                    ),
                  ],
                }),
              })
            : phase === 'between'
              ? jsxs('div', {
                  className: 'athlon-summary',
                  children: [
                    jsx('span', {
                      className: 'athlon-summary-title',
                      children: `${EVENT_NAMES[scores.length - 1]} complete`,
                    }),
                    jsx('span', {
                      className: 'athlon-summary-score',
                      children: `${lastScore} / ${POKEATHLON_EVENT_MAX}`,
                    }),
                  ],
                })
              : eventIndex === 0
                ? jsx(SprintEvent, { onFinish: finishEvent })
                : eventIndex === 1
                  ? jsx(TimingEvent, {
                      onFinish: finishEvent,
                      speed: 0.035,
                      label: 'Clear the hurdle on the sweet spot',
                    })
                  : jsx(TimingEvent, {
                      onFinish: finishEvent,
                      speed: 0.05,
                      label: 'Throw at the target as it crosses the centre',
                    }),
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
          phase === 'between' &&
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: nextEvent,
              children: scores.length >= EVENT_NAMES.length ? 'SEE RESULTS' : 'NEXT EVENT',
            }),
        ],
      }),
    ],
  })
}
