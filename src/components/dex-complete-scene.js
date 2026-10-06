// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { dexRewardVictoryTokens } from '../data/config.js'
import { baseRegions } from '../data/gameData.js'
import { useGame } from '../game/context.js'

const SPARKS = Array.from({ length: 16 }, (_, index) => index)

/**
 * Celebratory overlay shown when a region/generation's national dex is
 * completed. It pauses the idle loop (the `dexComplete` phase has no tick case)
 * and grants the reward once the animation finishes.
 */
export function DexCompleteScene() {
  const { state, dispatch } = useGame(),
    celebration = state.dexCelebration
  React.useEffect(() => {
    if (!celebration) return
    const speed = state.speed || 1,
      timer = setTimeout(() => {
        dispatch({
          type: 'CLAIM_DEX_REWARDS',
          payload: {
            generations: [celebration.generation],
          },
        })
        dispatch({ type: 'COMPLETE_DEX_CELEBRATION' })
      }, 4200 / speed)
    return () => clearTimeout(timer)
  }, [dispatch, state.speed, celebration])
  if (!celebration) return null
  const orderedRegions = [...baseRegions].sort((left, right) => left.order - right.order),
    region = orderedRegions[celebration.generation],
    generation = celebration.generation + 1
  return jsxs('div', {
    className: 'dex-complete-scene',
    children: [
      jsx('div', {
        className: 'dex-complete-bg',
      }),
      jsx('div', {
        className: 'dex-complete-sparks',
        children: SPARKS.map((index) =>
          jsx(
            'span',
            {
              className: `dex-spark dex-spark-${index % 8}`,
              style: {
                animationDelay: `${(index * 0.12).toFixed(2)}s`,
              },
            },
            index
          )
        ),
      }),
      jsx('div', {
        className: 'dex-complete-badge',
        children: jsx('span', {
          className: 'dex-complete-badge-icon',
          children: '🏅',
        }),
      }),
      jsxs('div', {
        className: 'dex-complete-content',
        children: [
          jsx('span', {
            className: 'dex-complete-kicker',
            children: `Generation ${generation}`,
          }),
          jsx('span', {
            className: 'dex-complete-region',
            children: region?.name ?? 'Region',
          }),
          jsx('span', {
            className: 'dex-complete-title',
            children: 'National Pokédex Complete!',
          }),
          jsx('span', {
            className: 'dex-complete-sub',
            children: 'Shiny Charm unlocked',
          }),
          jsx('span', {
            className: 'dex-complete-reward',
            children: `+${dexRewardVictoryTokens} Victory Tokens · Master Ball`,
          }),
        ],
      }),
    ],
  })
}
