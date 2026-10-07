// Galar's Rotom Rally, played as a full-stage scene while the reducer is in the
// `rotomRally` phase. Hold the throttle to build speed while keeping the motor
// off the redline; stall and the clock keeps running.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  ROTOM_RALLY_COOL_RATE,
  ROTOM_RALLY_DISTANCE,
  ROTOM_RALLY_HEAT_RATE,
  ROTOM_RALLY_MAX_SPEED,
  ROTOM_RALLY_SPEED_DECAY,
  ROTOM_RALLY_SPEED_STEP,
  ROTOM_RALLY_STALL_MS,
  ROTOM_RALLY_TICK_DISTANCE,
  ROTOM_RALLY_TICK_MS,
  ROTOM_RALLY_TIME_MS,
  rotomRallyPrize,
  rotomRallyScore,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { pokemonSpecies } from '../data/gameData.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** The sprite on the bike. */
const ROTOM_SPECIES = 'rotom'

export function RotomRallyScene() {
  const { state, dispatch } = useGame(),
    [speed, setSpeed] = React.useState(0),
    [heat, setHeat] = React.useState(0),
    [distance, setDistance] = React.useState(0),
    [stalls, setStalls] = React.useState(0),
    [timeLeft, setTimeLeft] = React.useState(ROTOM_RALLY_TIME_MS),
    [stalled, setStalled] = React.useState(false),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof rotomRallyPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    holdingRef = React.useRef(false),
    speedRef = React.useRef(0),
    heatRef = React.useRef(0),
    distanceRef = React.useRef(0),
    stallsRef = React.useRef(0),
    stallUntilRef = React.useRef(0),
    finishedRef = React.useRef(false)

  React.useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      if (finishedRef.current) return
      const now = Date.now(),
        elapsed = now - start,
        remaining = Math.max(0, ROTOM_RALLY_TIME_MS - elapsed),
        isStalled = now < stallUntilRef.current
      if (!isStalled && holdingRef.current)
        speedRef.current = Math.min(ROTOM_RALLY_MAX_SPEED, speedRef.current + ROTOM_RALLY_SPEED_STEP)
      else speedRef.current = Math.max(0, speedRef.current - ROTOM_RALLY_SPEED_DECAY * (isStalled ? 2 : 1))
      if (!isStalled && holdingRef.current)
        heatRef.current = Math.min(1, heatRef.current + ROTOM_RALLY_HEAT_RATE * (0.35 + speedRef.current))
      else heatRef.current = Math.max(0, heatRef.current - ROTOM_RALLY_COOL_RATE)
      if (heatRef.current >= 1) {
        stallsRef.current += 1
        heatRef.current = 0
        speedRef.current = 0
        stallUntilRef.current = now + ROTOM_RALLY_STALL_MS
        if (state.sfxEnabled) playSfx('explosion')
      }
      distanceRef.current = Math.min(
        ROTOM_RALLY_DISTANCE,
        distanceRef.current + speedRef.current * ROTOM_RALLY_TICK_DISTANCE
      )
      setSpeed(speedRef.current)
      setHeat(heatRef.current)
      setDistance(distanceRef.current)
      setStalls(stallsRef.current)
      setStalled(now < stallUntilRef.current)
      setTimeLeft(remaining)
      if (distanceRef.current >= ROTOM_RALLY_DISTANCE || remaining <= 0) {
        finishedRef.current = true
        const score = rotomRallyScore(distanceRef.current, elapsed, stallsRef.current)
        if (state.sfxEnabled) playSfx(distanceRef.current >= ROTOM_RALLY_DISTANCE ? 'win' : 'miss')
        setPrize(rotomRallyPrize(score))
      }
    }, ROTOM_RALLY_TICK_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      if (event.code !== 'Space' && event.code !== 'ArrowUp') return
      event.preventDefault()
      holdingRef.current = true
    }
    /** @param {KeyboardEvent} event */
    function onKeyUp(event) {
      if (event.code !== 'Space' && event.code !== 'ArrowUp') return
      holdingRef.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'rotomRally', score: Math.round(distance), completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const rotom = pokemonSpecies[ROTOM_SPECIES],
    finished = distance >= ROTOM_RALLY_DISTANCE

  return jsxs('div', {
    className: 'minigame-scene rotom-rally-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Rotom Rally' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: prize
              ? (prize.label ?? '')
              : `${(timeLeft / 1000).toFixed(1)}s \u00b7 ${Math.round(speed * 100)} km/h${
                  stalls > 0 ? ` \u00b7 ${stalls} stall${stalls > 1 ? 's' : ''}` : ''
                }`,
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
                className: 'rally-score-line',
                children: `${finished ? 'Finished' : 'Ran out of time'} \u00b7 ${Math.round(
                  Math.min(distance, ROTOM_RALLY_DISTANCE)
                )}/${ROTOM_RALLY_DISTANCE} units`,
              }),
            })
          : jsxs('div', {
              className: 'rally-play',
              children: [
                jsxs('div', {
                  className: 'rally-track',
                  children: [
                    jsx('div', {
                      className: 'rally-track-fill',
                      style: { width: `${(distance / ROTOM_RALLY_DISTANCE) * 100}%` },
                    }),
                    jsx('div', {
                      className: 'rally-checkpoint',
                      style: { left: '50%' },
                      children: '\u{1f3c1}',
                    }),
                  ],
                }),
                rotom &&
                  jsx('img', {
                    className: 'rally-bike',
                    style: { left: `${(distance / ROTOM_RALLY_DISTANCE) * 100}%` },
                    src: getPokemonSpriteUrl(rotom.id),
                    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                      (event.target.src = getPokemonSpriteFallbackUrl(rotom.id)),
                    alt: 'Rotom bike',
                  }),
                jsxs('div', {
                  className: `rally-heat${heat >= 0.8 ? ' hot' : ''}${stalled ? ' stalled' : ''}`,
                  children: [
                    jsx('span', { className: 'rally-heat-label', children: 'MOTOR' }),
                    jsxs('div', {
                      className: 'rally-heat-track',
                      children: [
                        jsx('div', {
                          className: 'rally-heat-fill',
                          style: { width: `${heat * 100}%` },
                        }),
                        jsx('div', { className: 'rally-heat-redline', style: { left: '80%' } }),
                      ],
                    }),
                    jsx('span', {
                      className: 'rally-heat-state',
                      children: stalled ? 'STALLED!' : heat >= 0.8 ? 'HOT!' : 'OK',
                    }),
                  ],
                }),
                jsx('button', {
                  className: 'move-panel-btn confirm rally-throttle-btn',
                  onPointerDown: () => (holdingRef.current = true),
                  onPointerUp: () => (holdingRef.current = false),
                  onPointerLeave: () => (holdingRef.current = false),
                  onPointerCancel: () => (holdingRef.current = false),
                  children: stalled ? 'COOLING\u2026' : 'HOLD TO REV',
                }),
                jsx('div', {
                  className: 'rally-hint',
                  children:
                    'Cover 100 units before the clock runs out. Let off the throttle before the motor hits the redline.',
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
