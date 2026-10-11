// Alola's Ultra Warp Ride, played as a full-stage scene while the reducer is in
// the `ultraWarp` phase. Steer a legendary through a scrolling wormhole,
// collecting rings and dodging debris; the run's score decides how deep a
// wormhole it reaches, then the player picks one door and keeps what is inside.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import {
  ULTRA_WARP_CATCH_X,
  ULTRA_WARP_RIDER_Y,
  ULTRA_WARP_TICK_MS,
  ULTRA_WARP_TIME_MS,
  ultraWarpDestinations,
  ultraWarpPrize,
  rollWarpObject,
  warpFallMs,
  warpSpawnMs,
  warpTierForScore,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** What each tunnel object looks like. @type {Record<string, string>} */
const OBJECT_ICONS = { ring: '\u25ef', gold: '\u2b50', debris: '\u{1faa8}' }

/** The rider sprite: the Solgaleo line is the canonical Ultra Warp mount. */
const RIDER_SPECIES = 'solgaleo'

export function UltraWarpScene() {
  const { state, dispatch } = useGame(),
    [objects, setObjects] = React.useState(
      () => /** @type {{ id: number, x: number, kind: string, points: number, y: number }[]} */ ([])
    ),
    [riderX, setRiderX] = React.useState(0.5),
    [score, setScore] = React.useState(0),
    [timeLeft, setTimeLeft] = React.useState(ULTRA_WARP_TIME_MS),
    [phase, setPhase] = React.useState(/** @type {'riding' | 'choosing' | 'reward'} */ ('riding')),
    [destinations, setDestinations] = React.useState(
      () => /** @type {ReturnType<typeof ultraWarpDestinations>} */ ([])
    ),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof ultraWarpPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    objectsRef = React.useRef(
      /** @type {{ id: number, x: number, kind: string, points: number, y: number, fallMs: number, resolved: boolean }[]} */ ([])
    ),
    nextIdRef = React.useRef(0),
    spawnAccRef = React.useRef(0),
    riderRef = React.useRef(0.5),
    scoreRef = React.useRef(0),
    finishedRef = React.useRef(false),
    finishRef = React.useRef(/** @type {() => void} */ (() => {}))

  const rider = pokemonSpecies[RIDER_SPECIES]

  // The run's end: lock in the score, work out the wormhole tier it reached
  // and roll one destination per tier up to it.
  finishRef.current = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (state.sfxEnabled) playSfx('win')
    const reached = warpTierForScore(scoreRef.current),
      doors = ultraWarpDestinations(state, reached)
    setDestinations(doors)
    setPhase(doors.length > 0 ? 'choosing' : 'reward')
    if (doors.length === 0) setPrize(ultraWarpPrize(scoreRef.current, null))
  }

  React.useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      if (finishedRef.current) return
      const elapsed = Date.now() - start
      // Spawn objects. The tunnel fills up and speeds up as it goes.
      spawnAccRef.current += ULTRA_WARP_TICK_MS
      const spawn = warpSpawnMs(elapsed)
      while (spawnAccRef.current >= spawn) {
        spawnAccRef.current -= spawn
        const object = rollWarpObject()
        objectsRef.current.push({
          id: nextIdRef.current++,
          x: 0.08 + Math.random() * 0.84,
          kind: object.kind,
          points: object.points,
          y: 0,
          fallMs: warpFallMs(elapsed),
          resolved: false,
        })
      }
      // Move everything down; collect or clip the objects as they pass the
      // rider's line.
      const kept = []
      for (const object of objectsRef.current) {
        const y = object.y + ULTRA_WARP_TICK_MS / object.fallMs
        let resolved = object.resolved
        if (!resolved && y >= ULTRA_WARP_RIDER_Y) {
          resolved = true
          if (Math.abs(object.x - riderRef.current) <= ULTRA_WARP_CATCH_X) {
            scoreRef.current += object.points
            if (state.sfxEnabled)
              playSfx(object.kind === 'debris' ? 'miss' : object.kind === 'gold' ? 'great' : 'good')
          }
        }
        if (y < 1.06) kept.push({ ...object, y, resolved })
      }
      objectsRef.current = kept
      setObjects(kept)
      setScore(Math.max(0, scoreRef.current))
      const remaining = Math.max(0, ULTRA_WARP_TIME_MS - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) finishRef.current()
    }, ULTRA_WARP_TICK_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** @param {number} nextX */
  function moveTo(nextX) {
    const clamped = Math.max(0.05, Math.min(0.95, nextX))
    riderRef.current = clamped
    setRiderX(clamped)
  }

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      if (phase !== 'riding') return
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault()
        moveTo(riderRef.current - 0.06)
      } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault()
        moveTo(riderRef.current + 0.06)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  /** @param {React.PointerEvent<HTMLDivElement>} event */
  function steerByPointer(event) {
    if (phase !== 'riding') return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0) return
    moveTo((event.clientX - rect.left) / rect.width)
  }

  /** @param {{ speciesKey: string, name: string, tier: number, tierLabel: string, level: number }} door */
  function enterWormhole(door) {
    if (state.sfxEnabled) playSfx('great')
    setPrize(ultraWarpPrize(scoreRef.current, door))
    setPhase('reward')
  }

  function leave() {
    const finalPrize = prize ?? ultraWarpPrize(scoreRef.current, destinations[0] ?? null)
    collect(
      {
        type: 'END_MINIGAME',
        payload: { minigame: 'ultraWarp', score: Math.max(0, score), completed: true },
      },
      { type: 'CLAIM_MINIGAME_REWARD', payload: finalPrize }
    )
  }

  return jsxs('div', {
    className: 'minigame-scene ultra-warp-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Ultra Warp Ride' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children:
              phase === 'riding'
                ? `Warp ${Math.max(0, score)} \u00b7 ${(timeLeft / 1000).toFixed(1)}s`
                : phase === 'choosing'
                  ? 'Choose a wormhole'
                  : (prize?.label ?? ''),
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children:
          phase === 'reward' && prize
            ? jsx(MinigameRewardScreen, {
                prize,
                onCollect: leave,
                summary: jsx('span', {
                  className: 'ultra-warp-score-line',
                  children: `Warp score ${Math.max(0, score)}`,
                }),
              })
            : phase === 'choosing'
              ? jsx(UltraWarpDoors, { destinations, onEnter: enterWormhole })
              : jsxs('div', {
                  className: 'ultra-warp-field-wrap',
                  children: [
                    jsx('div', {
                      className: 'ultra-warp-field',
                      onPointerDown: steerByPointer,
                      onPointerMove: steerByPointer,
                      children: [
                        objects.map((object) =>
                          jsx(
                            'span',
                            {
                              className: `ultra-warp-object ${object.kind}`,
                              style: {
                                left: `${object.x * 100}%`,
                                top: `${object.y * 100}%`,
                              },
                              children: OBJECT_ICONS[object.kind] ?? OBJECT_ICONS.ring,
                            },
                            object.id
                          )
                        ),
                        rider &&
                          jsx('img', {
                            className: 'ultra-warp-rider',
                            src: getPokemonSpriteUrl(rider.id),
                            onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                              (event.target.src = getPokemonSpriteFallbackUrl(rider.id)),
                            alt: rider.name,
                            style: {
                              left: `${riderX * 100}%`,
                              top: `${ULTRA_WARP_RIDER_Y * 100}%`,
                            },
                          }),
                      ],
                    }),
                    jsxs('div', {
                      className: 'ultra-warp-controls',
                      children: [
                        jsx('button', {
                          className: 'move-panel-btn',
                          onClick: () => moveTo(riderRef.current - 0.08),
                          children: '\u25c0',
                        }),
                        jsx('button', {
                          className: 'move-panel-btn',
                          onClick: () => moveTo(riderRef.current + 0.08),
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
          phase === 'riding' &&
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: () => finishRef.current(),
              children: 'END RIDE',
            }),
        ],
      }),
    ],
  })
}

/**
 * The wormhole picker shown once the ride ends. One door per tier reached, so a
 * stronger run offers a rarer choice.
 * @param {{ destinations: ReturnType<typeof ultraWarpDestinations>, onEnter: (door: any) => void }} props
 */
function UltraWarpDoors({ destinations, onEnter }) {
  return jsxs('div', {
    className: 'ultra-warp-doors',
    children: [
      jsx('p', {
        className: 'ultra-warp-doors-hint',
        children: 'Steer for the rarest wormhole you reached.',
      }),
      jsx('div', {
        className: 'ultra-warp-door-list',
        children: destinations.map((door) => {
          const species = pokemonSpecies[door.speciesKey]
          return jsxs(
            'button',
            {
              className: `ultra-warp-door tier-${door.tier}`,
              onClick: () => onEnter(door),
              children: [
                jsx('span', { className: 'ultra-warp-door-tier', children: door.tierLabel }),
                jsx('img', {
                  className: 'ultra-warp-door-sprite',
                  src: getPokemonSpriteUrl(species.id),
                  onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                    (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                  alt: species.name,
                }),
                jsx('span', { className: 'ultra-warp-door-name', children: species.name }),
              ],
            },
            door.speciesKey
          )
        }),
      }),
    ],
  })
}
