// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { PokeballIcon } from './pokeball-icon.js'

/**
 * Cinematic, guaranteed Master Ball throw. Played while the reducer is in the
 * `catching` phase; when the animation finishes it resolves the catch with
 * COMPLETE_MASTER_BALL. No randomness here — the ball always succeeds.
 */
export function MasterBallScene() {
  const { state, dispatch } = useGame(),
    [step, setStep] = React.useState('throw'),
    target = state.enemyPokemon
  React.useEffect(() => {
    const speed = state.speed || 1
    const timers = [
      setTimeout(() => setStep('flash'), 650 / speed),
      setTimeout(() => setStep('wobble'), 950 / speed),
      setTimeout(() => setStep('click'), 2300 / speed),
      setTimeout(() => dispatch({ type: 'COMPLETE_MASTER_BALL' }), 3200 / speed),
    ]
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [dispatch, state.speed])
  if (!target) return null
  const speciesName =
    pokemonSpecies[target.speciesKey]?.name ?? target.name ?? target.speciesKey
  const message =
    step === 'click'
      ? `Gotcha! ${speciesName} was caught!`
      : step === 'wobble'
        ? 'The Master Ball wobbles...'
        : 'Master Ball, go!'
  return jsxs('div', {
    className: `masterball-scene step-${step}`,
    children: [
      jsx('div', {
        className: 'masterball-bg',
      }),
      step !== 'throw' &&
        jsx('div', {
          className: 'masterball-flash',
        }),
      jsxs('div', {
        className: 'masterball-stage',
        children: [
          jsx('div', {
            className: 'masterball-ball',
            children: jsx(PokeballIcon, {
              ballId: 'masterball',
              size: 96,
            }),
          }),
          step === 'click' &&
            jsx('div', {
              className: 'masterball-burst',
              children: Array.from({ length: 8 }, (_, index) =>
                jsx(
                  'span',
                  {
                    className: `masterball-spark spark-${index}`,
                  },
                  index
                )
              ),
            }),
        ],
      }),
      jsx('div', {
        className: 'masterball-text',
        children: jsx('p', {
          children: message,
        }),
      }),
    ],
  })
}
