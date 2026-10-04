// Galar's Curry Cooking, played as a full-stage scene while the reducer is in
// the `curry` phase. Match the customer's flavour, then hold the fan to keep the
// campfire in the sweet spot.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  CURRY_COOK_MS,
  CURRY_INGREDIENTS,
  CURRY_ZONE,
  curryPrize,
  curryScore,
  rollCurryRequest,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function CurryScene() {
  const { state, dispatch } = useGame(),
    [request] = React.useState(rollCurryRequest),
    [ingredient, setIngredient] = React.useState(
      /** @type {typeof CURRY_INGREDIENTS[number] | null} */ (null)
    ),
    [phase, setPhase] = React.useState(
      /** @type {'choose' | 'countdown' | 'cooking' | 'done'} */ ('choose')
    ),
    [flame, setFlame] = React.useState(0.5),
    [countdown, setCountdown] = React.useState(3),
    [timeLeft, setTimeLeft] = React.useState(CURRY_COOK_MS),
    [inBand, setInBand] = React.useState(0),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof curryPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    matchedRef = React.useRef(false),
    flameRef = React.useRef(0.5),
    inBandRef = React.useRef(0),
    holdingRef = React.useRef(false),
    startRef = React.useRef(0),
    scoreRef = React.useRef(0),
    finishedRef = React.useRef(false)

  React.useEffect(() => {
    if (phase !== 'countdown') return
    setCountdown(3)
    const started = Date.now(),
      id = setInterval(() => {
        const remaining = 3 - Math.floor((Date.now() - started) / 1000)
        if (remaining <= 0) {
          clearInterval(id)
          setCountdown(0)
          setPhase('cooking')
        } else setCountdown(remaining)
      }, 100)
    return () => clearInterval(id)
  }, [phase])

  React.useEffect(() => {
    if (phase !== 'cooking') return
    startRef.current = Date.now()
    inBandRef.current = 0
    flameRef.current = 0.5
    finishedRef.current = false
    const id = setInterval(() => {
      flameRef.current = Math.max(
        0,
        Math.min(1, flameRef.current + (holdingRef.current ? 0.05 : -0.045))
      )
      if (Math.abs(flameRef.current - 0.5) <= CURRY_ZONE) inBandRef.current += 50
      const elapsed = Date.now() - startRef.current
      setFlame(flameRef.current)
      setInBand(Math.min(1, inBandRef.current / Math.max(1, elapsed)))
      setTimeLeft(Math.max(0, CURRY_COOK_MS - elapsed))
      if (elapsed >= CURRY_COOK_MS && !finishedRef.current) {
        finishedRef.current = true
        clearInterval(id)
        const quality = Math.min(1, inBandRef.current / CURRY_COOK_MS),
          score = curryScore(matchedRef.current, quality)
        scoreRef.current = score
        if (state.sfxEnabled) playSfx(score >= 80 ? 'win' : score >= 50 ? 'good' : 'miss')
        setPrize(curryPrize(score))
        setPhase('done')
      }
    }, 50)
    return () => clearInterval(id)
  }, [phase])

  /** @param {typeof CURRY_INGREDIENTS[number]} entry */
  function chooseIngredient(entry) {
    if (phase !== 'choose') return
    if (state.sfxEnabled) playSfx('tap')
    setIngredient(entry)
    matchedRef.current = entry.flavor === request
    setCountdown(3)
    setPhase('countdown')
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { score: scoreRef.current, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  const lowEdge = (0.5 - CURRY_ZONE) * 100,
    highEdge = (0.5 + CURRY_ZONE) * 100

  return jsxs('div', {
    className: 'minigame-scene curry-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Curry Cooking' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children:
              phase === 'choose'
                ? `Wanted: ${request}`
                : phase === 'countdown'
                  ? 'Get ready to fan\u2026'
                  : phase === 'cooking'
                    ? `${(timeLeft / 1000).toFixed(1)}s \u00b7 ${Math.round(inBand * 100)}% in the zone`
                    : (prize?.label ?? ''),
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children:
          phase === 'done'
            ? jsx(MinigameRewardScreen, { prize, onCollect: leave })
            : phase === 'choose'
            ? jsxs('div', {
                className: 'curry-choose',
                children: [
                  jsxs('div', {
                    className: 'curry-request',
                    children: [
                      'The customer wants a ',
                      jsx('strong', { children: request }),
                      ' curry.',
                    ],
                  }),
                  jsx('div', {
                    className: 'curry-ingredients',
                    children: CURRY_INGREDIENTS.map((entry) =>
                      jsxs(
                        'button',
                        {
                          className: `curry-ingredient${entry.flavor === request ? ' match' : ''}`,
                          onClick: () => chooseIngredient(entry),
                          children: [
                            jsx('span', {
                              className: 'curry-ingredient-name',
                              children: entry.name,
                            }),
                            jsx('span', {
                              className: 'curry-ingredient-flavor',
                              children: entry.flavor ?? 'no flavour',
                            }),
                          ],
                        },
                        entry.id
                      )
                    ),
                  }),
                ],
              })
            : phase === 'countdown'
              ? jsxs('div', {
                  className: 'curry-countdown',
                  children: [
                    jsx('span', {
                      className: 'curry-countdown-number',
                      key: countdown,
                      children: countdown,
                    }),
                    jsx('span', {
                      className: 'curry-countdown-hint',
                      children: `Get ready to fan!${ingredient ? ` \u00b7 ${ingredient.name}` : ''}`,
                    }),
                  ],
                })
              : jsxs('div', {
                className: 'curry-cook',
                children: [
                  jsxs('div', {
                    className: 'curry-flame',
                    children: [
                      jsx('div', {
                        className: 'curry-flame-target',
                        style: { left: `${lowEdge}%`, width: `${highEdge - lowEdge}%` },
                      }),
                      jsx('div', {
                        className: `curry-flame-marker${inBand > 0 ? ' hot' : ''}`,
                        style: { left: `${flame * 100}%` },
                      }),
                    ],
                  }),
                  jsxs('button', {
                    className: 'curry-fan-btn',
                    onPointerDown: () => (holdingRef.current = true),
                    onPointerUp: () => (holdingRef.current = false),
                    onPointerLeave: () => (holdingRef.current = false),
                    onPointerCancel: () => (holdingRef.current = false),
                    disabled: phase !== 'cooking',
                    children: ['HOLD TO FAN', ingredient ? `\u00b7 ${ingredient.name}` : ''],
                  }),
                  jsx('div', {
                    className: 'curry-hint',
                    children: 'Keep the flame inside the band until the timer runs out.',
                  }),
                ],
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
        ],
      }),
    ],
  })
}
