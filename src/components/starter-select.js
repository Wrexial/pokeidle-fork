// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { starterSpecies } from '../data/config.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { calculatePokemonStats, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { checkShinyOdds } from '../game/progression.js'

export function StarterSelect() {
  const { dispatch } = useGame()
  return jsxs('div', {
    className: 'starter-select',
    children: [
      jsx('h2', {
        className: 'starter-title',
        children: 'Choose Your Starter!',
      }),
      jsx('div', {
        className: 'starter-cards',
        children: starterSpecies.map((speciesKey) => {
          const species = pokemonSpecies[speciesKey],
            stats = calculatePokemonStats(species, 5, {
              hp: 15,
              attack: 15,
              defense: 15,
              spAttack: 15,
              spDefense: 15,
              speed: 15,
            })
          return jsxs(
            'div',
            {
              className: 'starter-card',
              onClick: () =>
                dispatch({
                  type: 'SELECT_STARTER',
                  payload: {
                    speciesKey,
                    isShiny: checkShinyOdds(),
                  },
                }),
              children: [
                jsx('img', {
                  src: getPokemonSpriteUrl(species.id),
                  onError: /** @param {React.SyntheticEvent} event */ (event) => ((/** @type {HTMLImageElement} */ (event.target)).src = getPokemonSpriteFallbackUrl(species.id)),
                  alt: species.name,
                  className: 'starter-sprite',
                }),
                jsx('h3', {
                  children: species.name,
                }),
                jsx('div', {
                  className: 'starter-types',
                  children: species.types.map((type) =>
                    jsx(
                      'span',
                      {
                        className: `type-badge type-${type.toLowerCase()}`,
                        children: type,
                      },
                      type
                    )
                  ),
                }),
                jsxs('div', {
                  className: 'starter-stats',
                  children: [
                    jsxs('div', {
                      children: ['HP: ', stats.hp],
                    }),
                    jsxs('div', {
                      children: ['ATK: ', stats.attack],
                    }),
                    jsxs('div', {
                      children: ['DEF: ', stats.defense],
                    }),
                    jsxs('div', {
                      children: ['SP.A: ', stats.spAttack],
                    }),
                    jsxs('div', {
                      children: ['SP.D: ', stats.spDefense],
                    }),
                    jsxs('div', {
                      children: ['SPD: ', stats.speed],
                    }),
                  ],
                }),
                jsx('button', {
                  className: 'choose-btn',
                  children: 'Choose!',
                }),
              ],
            },
            speciesKey
          )
        }),
      }),
    ],
  })
}
