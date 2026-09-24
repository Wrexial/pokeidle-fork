// Kanto's Whack-a-Diglett, played as a full-stage scene while the reducer is in
// the `whack` phase. Tap each Diglett before it ducks back; leave the Zubat.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import {
  WHACK_CELLS,
  WHACK_DURATION_MS,
  WHACK_POP_MS,
  rollWhackTarget,
  whackPrize,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

/** Which Pokemon each target kind shows. @type {Record<string, string>} */
const WHACK_SPECIES = { diglett: 'diglett', zubat: 'zubat' }

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
        const spawn = { ...rollWhackTarget(), index: Math.floor(Math.random() * WHACK_CELLS), until: Date.now() + WHACK_POP_MS }
        activeRef.current = spawn
        setActive(spawn)
      }
      if (remaining <= 0) {
        finishedRef.current = true
        clearInterval(tick)
        const reward = whackPrize(scoreRef.current)
        setPrize(reward)
        dispatch({ type: 'CLAIM_MINIGAME_REWARD', payload: reward })
      }
    }, 60)
    return () => clearInterval(tick)
  }, [dispatch])

  /** @param {number} index */
  function whack(index) {
    if (prize) return
    const current = activeRef.current
    if (!current || current.index !== index) return
    scoreRef.current = Math.max(0, scoreRef.current + current.points)
    setScore(scoreRef.current)
    activeRef.current = null
    setActive(null)
  }

  function leave() {
    dispatch({ type: 'END_MINIGAME' })
  }

  const speciesKey = active ? WHACK_SPECIES[active.kind] : null,
    species = speciesKey ? pokemonSpecies[speciesKey] : null

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
              ' \u00b7 ',
              prize ? (prize.label ?? '') : `${(timeLeft / 1000).toFixed(1)}s`,
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children: jsx('div', {
          className: 'whack-grid',
          children: Array.from({ length: WHACK_CELLS }, (_, index) => {
            const showTarget = active?.index === index
            return jsx(
              'button',
              {
                className: `whack-hole${showTarget ? (active.kind === 'zubat' ? ' zubat' : ' diglett') : ''}`,
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
          jsx('button', {
            className: 'move-panel-btn cancel',
            onClick: leave,
            children: prize ? 'COLLECT & LEAVE' : 'LEAVE',
          }),
        ],
      }),
    ],
  })
}
