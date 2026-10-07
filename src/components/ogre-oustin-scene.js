// Paldea's Ogre Oustin', played as a full-stage scene while the reducer is in
// the `ogreOustin` phase. Berries fall down the field; move the basket under
// them before they land, and mind the rocks.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  OGRE_OUSTIN_LANES,
  OGRE_OUSTIN_TICK_MS,
  OGRE_OUSTIN_TIME_MS,
  ogreFallMs,
  ogreOustinPrize,
  ogreSpawnMs,
  rollOgreDrop,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** What each drop kind looks like on the field. @type {Record<string, string>} */
const DROP_ICONS = { berry: '\u{1f347}', gold: '\u2b50', rock: '\u{1faa8}' }

export function OgreOustinScene() {
  const { state, dispatch } = useGame(),
    [drops, setDrops] = React.useState(
      () => /** @type {{ id: number, lane: number, kind: string, points: number, y: number, fallMs: number }[]} */ ([])
    ),
    [basket, setBasket] = React.useState(Math.floor(OGRE_OUSTIN_LANES / 2)),
    [score, setScore] = React.useState(0),
    [timeLeft, setTimeLeft] = React.useState(OGRE_OUSTIN_TIME_MS),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof ogreOustinPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    dropsRef = React.useRef(
      /** @type {{ id: number, lane: number, kind: string, points: number, y: number, fallMs: number }[]} */ ([])
    ),
    nextIdRef = React.useRef(0),
    spawnAccRef = React.useRef(0),
    basketRef = React.useRef(Math.floor(OGRE_OUSTIN_LANES / 2)),
    scoreRef = React.useRef(0),
    finishedRef = React.useRef(false)

  React.useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      if (finishedRef.current) return
      const elapsed = Date.now() - start

      spawnAccRef.current += OGRE_OUSTIN_TICK_MS
      const spawn = ogreSpawnMs(elapsed)
      while (spawnAccRef.current >= spawn) {
        spawnAccRef.current -= spawn
        const target = rollOgreDrop()
        dropsRef.current.push({
          id: nextIdRef.current++,
          lane: Math.floor(Math.random() * OGRE_OUSTIN_LANES),
          kind: target.kind,
          points: target.points,
          y: 0,
          fallMs: ogreFallMs(elapsed),
        })
      }

      const kept = []
      for (const drop of dropsRef.current) {
        const y = drop.y + OGRE_OUSTIN_TICK_MS / drop.fallMs
        if (y >= 1) {
          if (drop.lane === basketRef.current) {
            scoreRef.current += drop.points
            if (state.sfxEnabled) playSfx(drop.kind === 'rock' ? 'miss' : 'good')
          }
        } else kept.push({ ...drop, y })
      }
      dropsRef.current = kept
      setDrops(kept)
      setScore(scoreRef.current)

      const remaining = Math.max(0, OGRE_OUSTIN_TIME_MS - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        finishedRef.current = true
        const finalScore = Math.max(0, scoreRef.current)
        if (state.sfxEnabled) playSfx(finalScore >= 12 ? 'win' : 'miss')
        setPrize(ogreOustinPrize(finalScore))
      }
    }, OGRE_OUSTIN_TICK_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** @param {number} delta */
  function moveBasket(delta) {
    if (prize) return
    const next = Math.max(0, Math.min(OGRE_OUSTIN_LANES - 1, basketRef.current + delta))
    if (next === basketRef.current) return
    basketRef.current = next
    setBasket(next)
    if (state.sfxEnabled) playSfx('tap')
  }

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault()
        moveBasket(-1)
      } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault()
        moveBasket(1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prize])

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'ogreOustin', score: Math.max(0, score), completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene ogre-oustin-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: "Ogre Oustin'" }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: prize
              ? (prize.label ?? '')
              : `Basket ${score} \u00b7 ${(timeLeft / 1000).toFixed(1)}s`,
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
                className: 'ogre-score-line',
                children: `Basket total ${Math.max(0, score)}`,
              }),
            })
          : jsxs('div', {
              className: 'ogre-field-wrap',
              children: [
                jsx('div', {
                  className: 'ogre-field',
                  children: drops.map((drop) =>
                    jsx(
                      'span',
                      {
                        className: `ogre-drop${drop.kind === 'rock' ? ' rock' : drop.kind === 'gold' ? ' gold' : ''}`,
                        style: {
                          left: `${((drop.lane + 0.5) / OGRE_OUSTIN_LANES) * 100}%`,
                          top: `${drop.y * 100}%`,
                        },
                        children: DROP_ICONS[drop.kind] ?? DROP_ICONS.berry,
                      },
                      drop.id
                    )
                  ),
                }),
                jsx('div', {
                  className: 'ogre-basket-row',
                  children: Array.from({ length: OGRE_OUSTIN_LANES }, (_, lane) =>
                    jsx(
                      'div',
                      {
                        className: `ogre-basket-cell${lane === basket ? ' active' : ''}`,
                        children: lane === basket ? '\u{1f9fa}' : '',
                      },
                      lane
                    )
                  ),
                }),
                jsxs('div', {
                  className: 'ogre-controls',
                  children: [
                    jsx('button', {
                      className: 'move-panel-btn',
                      onClick: () => moveBasket(-1),
                      children: '\u25c0',
                    }),
                    jsx('button', {
                      className: 'move-panel-btn',
                      onClick: () => moveBasket(1),
                      children: '\u25b6',
                    }),
                  ],
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
