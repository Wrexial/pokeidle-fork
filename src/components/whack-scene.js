// Kanto's Whack-a-Diglett, played as a full-stage scene while the reducer is in
// the `whack` phase. Tap each Diglett before it ducks back; leave the Zubat.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  WHACK_CELLS,
  WHACK_DURATION_MS,
  WHACK_POP_MS,
  WHACK_POP_MIN_MS,
  rollWhackTarget,
  whackPopupMs,
  whackPrize,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** Which Pokemon each target kind shows. @type {Record<string, string>} */
const WHACK_SPECIES = { diglett: 'diglett', dugtrio: 'dugtrio', zubat: 'zubat' }

export function WhackScene() {
  const { state, dispatch } = useGame(),
    [active, setActive] = React.useState(
      /** @type {{ index: number, kind: string, points: number } | null} */ (null)
    ),
    [score, setScore] = React.useState(0),
    [timeLeft, setTimeLeft] = React.useState(WHACK_DURATION_MS),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof whackPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    activeRef = React.useRef(/** @type {any} */ (null)),
    scoreRef = React.useRef(0),
    startRef = React.useRef(Date.now()),
    finishedRef = React.useRef(false)

  React.useEffect(() => {
    startRef.current = Date.now()
    const tick = setInterval(() => {
      if (finishedRef.current) return
      const remaining = Math.max(0, WHACK_DURATION_MS - (Date.now() - startRef.current))
      setTimeLeft(remaining)
      if (activeRef.current && Date.now() >= activeRef.current.until) {
        activeRef.current = null
        setActive(null)
      }
      if (!activeRef.current && remaining > 0) {
        const target = rollWhackTarget(),
          elapsed = Date.now() - startRef.current,
          spawn = {
            ...target,
            index: Math.floor(Math.random() * WHACK_CELLS),
            // Targets speed up as the round runs; the rare Dugtrio stays up longer.
            until: Date.now() + Math.round(whackPopupMs(elapsed) * (target.popMultiplier ?? 1)),
          }
        activeRef.current = spawn
        setActive(spawn)
      }
      if (remaining <= 0) {
        finishedRef.current = true
        clearInterval(tick)
        setPrize(whackPrize(scoreRef.current))
      }
    }, 60)
    return () => clearInterval(tick)
  }, [])

  /** @param {number} index */
  function whack(index) {
    if (prize) return
    const current = activeRef.current
    if (!current || current.index !== index) return
    if (state.sfxEnabled) playSfx(current.kind === 'zubat' ? 'miss' : 'good')
    scoreRef.current = Math.max(0, scoreRef.current + current.points)
    setScore(scoreRef.current)
    activeRef.current = null
    setActive(null)
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { minigame: 'whack', score } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const speciesKey = active ? WHACK_SPECIES[active.kind] : null,
    species = speciesKey ? pokemonSpecies[speciesKey] : null,
    // The round is "rushing" once targets are much quicker than at the start.
    rushing = whackPopupMs(WHACK_DURATION_MS - timeLeft) <= (WHACK_POP_MS + WHACK_POP_MIN_MS) / 2

  return jsxs('div', {
    className: 'minigame-scene whack-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Whack-a-Diglett' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Score ${score}`,
              rushing && !prize ? ' \u00b7 SPEEDING UP!' : '',
              ' \u00b7 ',
              prize ? (prize.label ?? '') : `${(timeLeft / 1000).toFixed(1)}s`,
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
                className: 'whack-solved',
                children: `Final score ${score}`,
              }),
            })
          : jsx('div', {
          className: `whack-grid${rushing ? ' whack-rush' : ''}`,
          children: Array.from({ length: WHACK_CELLS }, (_, index) => {
            const showTarget = active?.index === index
            return jsx(
              'button',
              {
                className: `whack-hole${showTarget ? ` ${active.kind}` : ''}`,
                disabled: prize !== null,
                onClick: () => whack(index),
                'aria-label': showTarget ? `Whack ${active.kind}` : 'Empty hole',
                children:
                  showTarget && species
                    ? jsx('img', {
                        className: 'whack-sprite',
                        src: getPokemonSpriteUrl(species.id),
                        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                          (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                        alt: species.name,
                      })
                    : jsx('span', { className: 'whack-hole-dot' }),
              },
              index
            )
          }),
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
