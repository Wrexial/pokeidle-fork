// Alola's Mantine Surf, played as a full-stage scene while the reducer is in
// the `mantineSurf` phase. A rider sweeps across the wave face and the player
// jumps on the swell; the swell narrows with every wave.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  MANTINE_SURF_MAX_SCORE,
  MANTINE_SURF_WAVES,
  MANTINE_SURF_WAVE_MS,
  mantineSurfPrize,
  surfMarkerPosition,
  surfWaveScore,
  surfWaveZone,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function MantineSurfScene() {
  const { state, dispatch } = useGame(),
    // One swell per wave, fixed for the run so the zones never shift mid-wave.
    [zones] = React.useState(() =>
      Array.from({ length: MANTINE_SURF_WAVES }, (_, index) => surfWaveZone(index))
    ),
    [waveIndex, setWaveIndex] = React.useState(0),
    [marker, setMarker] = React.useState(0),
    [results, setResults] = React.useState(/** @type {number[]} */ ([])),
    [lastCall, setLastCall] = React.useState(''),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof mantineSurfPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    waveStartRef = React.useRef(0),
    finishedRef = React.useRef(false)

  const score = results.reduce((sum, points) => sum + points, 0),
    zone = zones[Math.min(waveIndex, MANTINE_SURF_WAVES - 1)]

  /**
   * Score a jump (or a wash-out) at `position` and move to the next wave.
   * @param {number} position
   */
  function resolveWave(position) {
    if (finishedRef.current || prize) return
    const points = surfWaveScore(position, zone),
      next = [...results, points]
    if (state.sfxEnabled)
      playSfx(points === 3 ? 'great' : points === 2 ? 'good' : 'miss')
    setResults(next)
    setLastCall(points === 3 ? 'PERFECT!' : points === 2 ? 'NICE!' : 'MISS')
    if (waveIndex + 1 >= MANTINE_SURF_WAVES) {
      finishedRef.current = true
      setPrize(mantineSurfPrize(next.reduce((sum, value) => sum + value, 0)))
    } else {
      setWaveIndex(waveIndex + 1)
    }
  }

  React.useEffect(() => {
    if (prize) return
    waveStartRef.current = Date.now()
    setMarker(0)
    const id = setInterval(() => {
      const elapsed = Date.now() - waveStartRef.current
      setMarker(surfMarkerPosition(elapsed))
      // Two full sweeps to jump before the wave leaves you behind.
      if (elapsed >= MANTINE_SURF_WAVE_MS) resolveWave(surfMarkerPosition(elapsed))
    }, 30)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveIndex, prize])

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      if (event.code !== 'Space' && event.code !== 'Enter') return
      event.preventDefault()
      if (prize) return
      resolveWave(surfMarkerPosition(Date.now() - waveStartRef.current))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveIndex, results, prize])

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'mantineSurf', score, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const lowEdge = (zone.center - zone.halfWidth) * 100,
    highEdge = (zone.center + zone.halfWidth) * 100,
    coreEdge = zone.halfWidth * 80

  return jsxs('div', {
    className: 'minigame-scene mantine-surf-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Mantine Surf' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: prize
              ? (prize.label ?? '')
              : `Wave ${waveIndex + 1}/${MANTINE_SURF_WAVES} \u00b7 Score ${score}/${MANTINE_SURF_MAX_SCORE}${
                  lastCall ? ` \u00b7 ${lastCall}` : ''
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
                className: 'surf-score-line',
                children: `Scored ${score} / ${MANTINE_SURF_MAX_SCORE}`,
              }),
            })
          : jsxs('div', {
              className: 'surf-play',
              children: [
                jsx('div', { className: 'surf-ocean' }),
                jsxs('div', {
                  className: 'surf-bar',
                  children: [
                    jsx('div', {
                      className: 'surf-zone',
                      style: { left: `${lowEdge}%`, width: `${highEdge - lowEdge}%` },
                    }),
                    jsx('div', {
                      className: 'surf-zone-core',
                      style: { left: `${zone.center * 100 - coreEdge}%`, width: `${coreEdge * 2}%` },
                    }),
                    jsx('div', {
                      className: 'surf-marker',
                      style: { left: `${marker * 100}%` },
                    }),
                  ],
                }),
                jsx('div', { className: 'surf-rider', children: '\u{1f3c4}' }),
                jsx('button', {
                  className: 'move-panel-btn confirm surf-jump-btn',
                  onClick: () => resolveWave(surfMarkerPosition(Date.now() - waveStartRef.current)),
                  children: 'JUMP!',
                }),
                jsx('div', {
                  className: 'surf-hint',
                  children: 'Jump when the rider crosses the swell \u2014 dead centre scores 3.',
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
