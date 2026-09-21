// Popup shown when a Daycare egg hatches, so a (possibly shiny) hatch isn't
// missed in the battle log. Gives Keep / quick-release actions.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { genderForPokemon, genderSymbol } from '../game/breeding.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

export function HatchPopup() {
  const { state, dispatch } = useGame(),
    hatch = state.hatchResult
  if (!hatch) return null
  const species = pokemonSpecies[hatch.speciesKey]
  if (!species) return null
  const gender = genderForPokemon(hatch),
    genderClass =
      gender === 'male' ? 'gender-male' : gender === 'female' ? 'gender-female' : 'gender-none'
  return jsx('div', {
    className: 'hatch-popup-overlay',
    children: jsxs('div', {
      className: `hatch-popup${hatch.isShiny ? ' shiny' : ''}`,
      children: [
        jsx('div', {
          className: 'hatch-popup-title',
          children: 'The Egg hatched!',
        }),
        jsx('img', {
          className: 'hatch-popup-sprite',
          src: getPokemonSpriteUrl(species.id, !1, hatch.isShiny),
          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
            (event.target.src = getPokemonSpriteFallbackUrl(species.id, !1, hatch.isShiny)),
          alt: hatch.name,
        }),
        jsxs('div', {
          className: 'hatch-popup-name',
          children: [
            hatch.isShiny &&
              jsx('span', {
                className: 'shiny-star',
                children: '★',
              }),
            hatch.name,
            jsx('span', {
              className: `pokemon-gender ${genderClass}`,
              children: genderSymbol(gender),
            }),
          ],
        }),
        jsxs('div', {
          className: 'hatch-popup-meta',
          children: [`Lv.${hatch.level}`, hatch.isShiny ? ' · Shiny!' : ''],
        }),
        jsxs('div', {
          className: 'hatch-popup-buttons',
          children: [
            jsx('button', {
              className: 'hatch-popup-btn keep',
              onClick: () =>
                dispatch({
                  type: 'CLEAR_HATCH_RESULT',
                }),
              children: 'Keep',
            }),
            jsx('button', {
              className: 'hatch-popup-btn release',
              onClick: () =>
                dispatch({
                  type: 'RELEASE_HATCHLING',
                  payload: {
                    pokemonId: hatch.id,
                  },
                }),
              children: 'Quick Release',
            }),
          ],
        }),
      ],
    }),
  })
}
