// Sinnoh's Berry Blender, played as a full-stage scene while the reducer is in
// the `berryBlender` phase. Tap to rev the blender while the sweet spot sweeps
// back and forth; stay in the zone for a smooth blend.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  BERRY_BLENDER_BERRIES,
  BERRY_BLENDER_DECAY,
  BERRY_BLENDER_MS,
  BERRY_BLENDER_TAP,
  BERRY_BLENDER_TICK_MS,
  blenderInZone,
  blenderPrize,
  blenderScore,
  blenderSweetSpot,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function BerryBlenderScene() {
  const { state, dispatch } = useGame(),
    [speed, setSpeed] = React.useState(0),
    [zone, setZone] = React.useState(() => blenderSweetSpot(0)),
    [timeLeft, setTimeLeft] = React.useState(BERRY_BLENDER_MS),
    [inZone, setInZone] = React.useState(0),
    [taps, setTaps] = React.useState(0),
    [score, setScore] = React.useState(0),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof blenderPrize> | null} */ (null)
    ),
    [recipe] = React.useState(() =>
      [...BERRY_BLENDER_BERRIES].sort(() => Math.random() - 0.5).slice(0, 3)
    ),
    collect = useMinigameClaim(dispatch),
    speedRef = React.useRef(0),
    inZoneMsRef = React.useRef(0),
    startRef = React.useRef(Date.now()),
    finishedRef = React.useRef(false)

  React.useEffect(() => {
    startRef.current = Date.now()
    const id = setInterval(() => {
      if (finishedRef.current) return
      const elapsed = Date.now() - startRef.current,
        currentZone = blenderSweetSpot(elapsed)
      speedRef.current = Math.max(0, speedRef.current - BERRY_BLENDER_DECAY)
      if (blenderInZone(speedRef.current, currentZone)) inZoneMsRef.current += BERRY_BLENDER_TICK_MS
      setSpeed(speedRef.current)
      setZone(currentZone)
      setInZone(Math.min(1, inZoneMsRef.current / BERRY_BLENDER_MS))
      const remaining = Math.max(0, BERRY_BLENDER_MS - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        finishedRef.current = true
        const finalScore = blenderScore(inZoneMsRef.current / BERRY_BLENDER_MS)
        setScore(finalScore)
        if (state.sfxEnabled) playSfx(finalScore >= 65 ? 'win' : 'miss')
        setPrize(blenderPrize(finalScore))
      }
    }, BERRY_BLENDER_TICK_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tap() {
    if (finishedRef.current || prize) return
    speedRef.current = Math.min(1, speedRef.current + BERRY_BLENDER_TAP)
    setSpeed(speedRef.current)
    setTaps((value) => value + 1)
    if (state.sfxEnabled) playSfx('tap')
  }

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      if (event.code !== 'Space' && event.code !== 'Enter') return
      event.preventDefault()
      tap()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prize])

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'berryBlender', score, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const lowEdge = (zone.center - zone.halfWidth) * 100,
    highEdge = (zone.center + zone.halfWidth) * 100,
    inZoneNow = blenderInZone(speed, zone)

  return jsxs('div', {
    className: 'minigame-scene berry-blender-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Berry Blender' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: prize
              ? (prize.label ?? '')
              : `${(timeLeft / 1000).toFixed(1)}s \u00b7 ${Math.round(inZone * 100)}% in the zone`,
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
                className: 'blender-score-line',
                children: `Blend score ${score}/100 \u00b7 ${taps} taps`,
              }),
            })
          : jsxs('div', {
              className: 'blender-play',
              children: [
                jsx('div', {
                  className: 'blender-recipe',
                  children: recipe.map((berry) =>
                    jsx(
                      'span',
                      {
                        className: 'blender-berry',
                        style: { background: berry.color },
                        title: berry.name,
                      },
                      berry.id
                    )
                  ),
                }),
                jsxs('div', {
                  className: 'blender-bar',
                  children: [
                    jsx('div', {
                      className: 'blender-zone',
                      style: { left: `${lowEdge}%`, width: `${highEdge - lowEdge}%` },
                    }),
                    jsx('div', {
                      className: `blender-marker${inZoneNow ? ' hot' : ''}`,
                      style: { left: `${speed * 100}%` },
                    }),
                  ],
                }),
                jsx('button', {
                  className: 'move-panel-btn confirm blender-tap-btn',
                  onClick: tap,
                  children: 'TAP!',
                }),
                jsx('div', {
                  className: 'blender-hint',
                  children: 'Keep the needle in the sweet spot as it sweeps back and forth.',
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
