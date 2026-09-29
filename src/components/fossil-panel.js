// The Cinnabar Island lab: revive the fossils you have collected (see
// fossilItems in src/data/items.js) into their Pokemon. Shown in the location
// panel while standing on Cinnabar Island.

import { jsx, jsxs } from 'react/jsx-runtime'
import { fossilItems } from '../data/items.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { rewardItemName } from '../game/minigames.js'

/** @param {{ speciesKey: string, alt: string }} props */
function FossilSprite({ speciesKey, alt }) {
  const id = pokemonSpecies[speciesKey]?.id ?? 0
  return jsx('img', {
    className: 'location-gift-sprite',
    src: getPokemonSpriteUrl(id),
    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
      (event.target.src = getPokemonSpriteFallbackUrl(id)),
    alt,
  })
}

export function FossilPanel() {
  const { state, dispatch } = useGame(),
    owned = Object.values(fossilItems).filter((fossil) => (state.inventory[fossil.id] ?? 0) > 0)
  return jsxs('div', {
    className: 'location-gifts',
    children: [
      jsx('div', { className: 'location-section-title', children: 'Cinnabar Lab' }),
      jsx('p', {
        className: 'fossil-lab-hint',
        children:
          owned.length > 0
            ? 'The lab crew can bring a fossil back to life. Reviving a fossil consumes it.'
            : 'Bring fossils here to revive them. The Sinnoh Underground is a good place to dig for more.',
      }),
      owned.map((fossil) => {
        const species = pokemonSpecies[fossil.speciesKey]
        return jsxs(
          'div',
          {
            className: 'location-gift-card',
            children: [
              jsxs('div', {
                className: 'location-gift-main',
                children: [
                  jsx(FossilSprite, {
                    speciesKey: fossil.speciesKey,
                    alt: species?.name ?? fossil.speciesKey,
                  }),
                  jsxs('div', {
                    className: 'location-gift-text',
                    children: [
                      jsx('div', { className: 'location-gift-name', children: fossil.name }),
                      jsx('div', {
                        className: 'location-gift-description',
                        children: `Revives ${species?.name ?? fossil.speciesKey} at Lv.${fossil.level}.`,
                      }),
                    ],
                  }),
                ],
              }),
              jsxs('button', {
                className: 'location-gift-action',
                onClick: () =>
                  dispatch({ type: 'REVIVE_FOSSIL', payload: { itemId: fossil.id } }),
                children: ['REVIVE \u00b7 ', rewardItemName(fossil.id)],
              }),
            ],
          },
          fossil.id
        )
      }),
    ],
  })
}
