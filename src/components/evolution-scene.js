// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

export function EvolutionScene() {
  const { state, dispatch } = useGame(),
    evolutionState = state.evolutionState
  if (
    (React.useEffect(() => {
      if (!evolutionState) return
      const speed = state.speed || 1
      const swapTimeout = setTimeout(() => {
          dispatch({
            type: 'EVOLUTION_STEP',
            payload: {
              step: 'swap',
            },
          })
        }, 2500 / speed),
        doneTimeout = setTimeout(() => {
          dispatch({
            type: 'EVOLUTION_STEP',
            payload: {
              step: 'done',
            },
          })
        }, 3500 / speed),
        completeTimeout = setTimeout(() => {
          dispatch({
            type: 'COMPLETE_EVOLUTION',
          })
        }, 5500 / speed)
      return () => {
        ;(clearTimeout(swapTimeout), clearTimeout(doneTimeout), clearTimeout(completeTimeout))
      }
    }, [dispatch, state.speed]),
    !evolutionState)
  )
    return null
  const fromSpecies = pokemonSpecies[evolutionState.fromSpeciesKey],
    toSpecies = pokemonSpecies[evolutionState.toSpeciesKey],
    showNewSprite = evolutionState.step === 'swap' || evolutionState.step === 'done',
    spriteClass =
      evolutionState.step === 'flash'
        ? 'evo-sprite evo-flash'
        : evolutionState.step === 'swap'
          ? 'evo-sprite evo-burst'
          : 'evo-sprite evo-glow',
    message =
      evolutionState.step === 'done'
        ? `${fromSpecies.name} evolved into ${toSpecies.name}!`
        : `What? ${fromSpecies.name} is evolving!`
  return jsxs('div', {
    className: 'evolution-scene',
    children: [
      jsx('div', {
        className: 'evolution-bg',
      }),
      jsx('div', {
        className: 'evolution-sprite-container',
        children: jsx('img', {
          className: spriteClass,
          src: getPokemonSpriteUrl(showNewSprite ? toSpecies.id : fromSpecies.id, !1, evolutionState.isShiny),
          onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(showNewSprite ? toSpecies.id : fromSpecies.id, !1, evolutionState.isShiny)),
          alt: showNewSprite ? toSpecies.name : fromSpecies.name,
        }),
      }),
      jsx('div', {
        className: 'evolution-text',
        children: jsx('p', {
          children: message,
        }),
      }),
    ],
  })
}
