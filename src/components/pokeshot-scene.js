// Kalos's Parfum Palace, played as a full-stage scene while the reducer is in
// the `pokeshot` phase. Pokemon flit across the gardens; snap one while it is
// inside the frame for points, with rarer and shiny Pokemon worth more.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { pokemonSpecies } from '../data/gameData.js'
import {
  POKESHOT_FRAME,
  POKESHOT_TIME_MS,
  pokeshotPrize,
  pokeshotShotPoints,
  rollPokeshotTarget,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

const DRIFT = 0.012

export function PokeshotScene() {
  const { state, dispatch } = useGame(),
    [target, setTarget] = React.useState(rollPokeshotTarget),
    [position, setPosition] = React.useState({ x: 0.5, y: 0.5 }),
    [score, setScore] = React.useState(0),
    [timeLeft, setTimeLeft] = React.useState(POKESHOT_TIME_MS),
    [flash, setFlash] = React.useState(
      () => /** @type {{ points: number, isShiny: boolean } | null} */ (null)
    ),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof pokeshotPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    targetRef = React.useRef(target),
    xRef = React.useRef(0.5),
    yRef = React.useRef(0.5),
    vxRef = React.useRef((Math.random() - 0.5) * DRIFT * 2),
    vyRef = React.useRef((Math.random() - 0.5) * DRIFT * 2),
    scoreRef = React.useRef(0),
    finishedRef = React.useRef(false)

  React.useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      if (finishedRef.current) return
      xRef.current += vxRef.current
      yRef.current += vyRef.current
      if (xRef.current < 0.14) {
        xRef.current = 0.14
        vxRef.current = Math.abs(vxRef.current)
      } else if (xRef.current > 0.86) {
        xRef.current = 0.86
        vxRef.current = -Math.abs(vxRef.current)
      }
      if (yRef.current < 0.14) {
        yRef.current = 0.14
        vyRef.current = Math.abs(vyRef.current)
      } else if (yRef.current > 0.86) {
        yRef.current = 0.86
        vyRef.current = -Math.abs(vyRef.current)
      }
      setPosition({ x: xRef.current, y: yRef.current })
      const remaining = Math.max(0, POKESHOT_TIME_MS - (Date.now() - start))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        finishedRef.current = true
        if (state.sfxEnabled) playSfx(scoreRef.current >= 45 ? 'win' : 'miss')
        setPrize(pokeshotPrize(scoreRef.current))
      }
    }, 50)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function snap() {
    if (finishedRef.current || prize) return
    const distance = Math.hypot(xRef.current - 0.5, yRef.current - 0.5),
      current = targetRef.current,
      points = pokeshotShotPoints(distance, current.stars, current.isShiny)
    scoreRef.current += points
    setScore(scoreRef.current)
    setFlash({ points, isShiny: current.isShiny })
    if (state.sfxEnabled) playSfx(points > 0 ? 'good' : 'miss')
    const next = rollPokeshotTarget()
    targetRef.current = next
    setTarget(next)
    xRef.current = 0.2 + Math.random() * 0.6
    yRef.current = 0.2 + Math.random() * 0.6
    vxRef.current = (Math.random() - 0.5) * DRIFT * 2
    vyRef.current = (Math.random() - 0.5) * DRIFT * 2
    setPosition({ x: xRef.current, y: yRef.current })
  }

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      if (event.code !== 'Space' && event.code !== 'Enter') return
      event.preventDefault()
      snap()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prize])

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'pokeshot', score, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const species = pokemonSpecies[target.speciesKey],
    frameSize = POKESHOT_FRAME * 200

  return jsxs('div', {
    className: 'minigame-scene pokeshot-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Pok\u00e9shot' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: prize
              ? (prize.label ?? '')
              : `Score ${score} \u00b7 ${(timeLeft / 1000).toFixed(1)}s`,
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
                className: 'pokeshot-score-line',
                children: `Portfolio score ${score}`,
              }),
            })
          : jsxs('div', {
              className: 'pokeshot-play',
              children: [
                jsxs('div', {
                  className: 'pokeshot-stage',
                  children: [
                    jsx('div', {
                      className: 'pokeshot-frame',
                      style: { width: `${frameSize}%`, height: `${frameSize}%` },
                    }),
                    species &&
                      jsx('img', {
                        className: `pokeshot-sprite${target.isShiny ? ' shiny' : ''}`,
                        style: { left: `${position.x * 100}%`, top: `${position.y * 100}%` },
                        src: getPokemonSpriteUrl(species.id, false, target.isShiny),
                        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                          (event.target.src = getPokemonSpriteFallbackUrl(species.id, false, target.isShiny)),
                        alt: species.name,
                      }),
                    flash &&
                      jsx('div', {
                        className: `pokeshot-flash${flash.isShiny ? ' shiny' : ''}`,
                        children: flash.points > 0 ? `+${flash.points}` : 'MISS',
                      }),
                  ],
                }),
                jsx('button', {
                  className: 'move-panel-btn confirm pokeshot-snap-btn',
                  onClick: snap,
                  children: 'SNAP!',
                }),
                jsx('div', {
                  className: 'pokeshot-hint',
                  children:
                    'Centre the frame on the Pokemon before you snap \u2014 shinies are worth quadruple.',
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
