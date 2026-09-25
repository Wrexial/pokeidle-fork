// Paldea's Picnic, played as a full-stage scene while the reducer is in the
// `picnic` phase. The next ingredient swings over the plate; drop it near the
// middle to score, but drop it too far off and the sandwich topples.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import {
  PICNIC_INGREDIENTS,
  PICNIC_PIECES,
  PICNIC_SWING_MS,
  picnicDropScore,
  picnicIngredientFor,
  picnicPrize,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** Colours cycled through the stacked ingredients. */
const PICNIC_COLORS = [
  '#e8c98a',
  '#7cc45a',
  '#e05a4a',
  '#f2d24a',
  '#d98aa0',
  '#f0e6c8',
  '#8ac46a',
  '#6aa84f',
  '#c46a3a',
  '#b07ac4',
]

export function PicnicScene() {
  const { state, dispatch } = useGame(),
    [position, setPosition] = React.useState(-0.5),
    [drops, setDrops] = React.useState(
      () => /** @type {{ ingredient: string, offset: number, points: number, grade: string }[]} */ ([])
    ),
    [score, setScore] = React.useState(0),
    [lastGrade, setLastGrade] = React.useState(''),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof picnicPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    startRef = React.useRef(Date.now()),
    startedRef = React.useRef(false),
    posRef = React.useRef(-0.5),
    scoreRef = React.useRef(0),
    dropsRef = React.useRef(
      /** @type {{ ingredient: string, offset: number, points: number, grade: string }[]} */ ([])
    ),
    finishedRef = React.useRef(false)

  React.useEffect(() => {
    startRef.current = Date.now()
    const tick = setInterval(() => {
      if (finishedRef.current) return
      const elapsed = Date.now() - startRef.current,
        phase = (elapsed / PICNIC_SWING_MS) % 2,
        next = phase <= 1 ? -0.5 + phase : 1.5 - phase
      startedRef.current = true
      posRef.current = next
      setPosition(next)
    }, 30)
    return () => clearInterval(tick)
  }, [])

  /** @param {boolean} toppled */
  function finish(toppled) {
    finishedRef.current = true
    setPrize(picnicPrize(scoreRef.current, toppled))
  }

  function drop() {
    if (finishedRef.current || prize || !startedRef.current) return
    const offset = posRef.current,
      result = picnicDropScore(offset),
      entry = {
        ingredient: picnicIngredientFor(dropsRef.current.length),
        offset,
        points: result.points,
        grade: result.grade,
      }
    dropsRef.current = [...dropsRef.current, entry]
    scoreRef.current += result.points
    setDrops(dropsRef.current)
    setScore(scoreRef.current)
    setLastGrade(result.grade)
    if (result.topple) finish(true)
    else if (dropsRef.current.length >= PICNIC_PIECES) finish(false)
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME' },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const nextIngredient = picnicIngredientFor(drops.length),
    nextColor = PICNIC_COLORS[drops.length % PICNIC_COLORS.length]

  return jsxs('div', {
    className: 'minigame-scene picnic-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Picnic' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Score ${score}`,
              ' \u00b7 ',
              drops.length >= PICNIC_PIECES
                ? 'Full sandwich'
                : lastGrade
                  ? `Last: ${lastGrade}`
                  : `Next: ${nextIngredient}`,
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
                className: 'picnic-summary',
                children: `Stacked ${drops.length}/${PICNIC_PIECES} · ${score} points`,
              }),
            })
          : jsxs('div', {
              className: 'picnic-board',
              children: [
                jsx('div', {
                  className: 'picnic-swing',
                  children: jsxs('span', {
                    className: 'picnic-piece',
                    style: {
                      left: `${(position + 0.5) * 100}%`,
                      background: nextColor,
                    },
                    children: nextIngredient,
                  }),
                }),
                jsxs('div', {
                  className: 'picnic-stack',
                  children: [
                    jsx('div', { className: 'picnic-plate' }),
                    ...drops.map((entry, index) =>
                      jsx(
                        'span',
                        {
                          className: `picnic-layer grade-${entry.grade}`,
                          style: {
                            left: `${50 + entry.offset * 100}%`,
                            bottom: `${8 + index * 15}px`,
                            background: PICNIC_COLORS[index % PICNIC_COLORS.length],
                          },
                          title: `${entry.ingredient} +${entry.points}`,
                        },
                        index
                      )
                    ),
                  ],
                }),
                jsx('button', {
                  className: 'picnic-drop-btn',
                  disabled: !!prize,
                  onPointerDown: drop,
                  children: 'DROP',
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
