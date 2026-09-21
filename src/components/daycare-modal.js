// Daycare modal — deposit two Pokemon to breed eggs.

import { jsx, jsxs } from 'react/jsx-runtime'
import { breedShinyOdds, breedShinyParentOdds, daycareEggBattles } from '../data/config.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { breedingCompatibility, eggSpeciesKey, genderForPokemon, genderSymbol } from '../game/breeding.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

const genderClass = (/** @type {'male' | 'female' | 'genderless'} */ gender) =>
  gender === 'male' ? 'gender-male' : gender === 'female' ? 'gender-female' : 'gender-none'

/** @param {{ pokemon: Pokemon }} props */
function ParentSlot({ pokemon }) {
  const species = pokemonSpecies[pokemon.speciesKey],
    gender = genderForPokemon(pokemon)
  return jsxs('div', {
    className: 'daycare-slot filled',
    children: [
      jsx('img', {
        className: 'daycare-slot-sprite',
        src: getPokemonSpriteUrl(species.id, !1, pokemon.isShiny),
        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
          (event.target.src = getPokemonSpriteFallbackUrl(species.id, !1, pokemon.isShiny)),
        alt: pokemon.name,
      }),
      jsxs('span', {
        className: 'daycare-slot-name',
        children: [
          pokemon.isShiny && jsx('span', { className: 'shiny-star', children: '★' }),
          pokemon.name,
          jsx('span', {
            className: `pokemon-gender ${genderClass(gender)}`,
            children: genderSymbol(gender),
          }),
        ],
      }),
      jsx('span', {
        className: 'daycare-slot-level',
        children: ['Lv', pokemon.level],
      }),
    ],
  })
}

/** @param {{ onClose: () => void }} props */
export function DaycareModal({ onClose }) {
  const { state, dispatch } = useGame(),
    { parents, progress } = state.daycare,
    compatibility = breedingCompatibility(parents),
    breedable = compatibility.ok,
    ready = breedable && progress >= daycareEggBattles,
    hasShinyParent = parents.some((parent) => parent.isShiny),
    shinyOdds = hasShinyParent ? breedShinyParentOdds : breedShinyOdds,
    eggKey = breedable ? eggSpeciesKey(parents) : null,
    eggSpecies = eggKey ? pokemonSpecies[eggKey] : null
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Daycare',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content',
          children: [
            jsx('div', {
              className: 'daycare-slots',
              children: [0, 1].map((slotIndex) => {
                const parent = parents[slotIndex]
                return parent
                  ? jsxs(
                      'div',
                      {
                        className: 'daycare-slot-button',
                        children: [
                          jsx(ParentSlot, {
                            pokemon: parent,
                          }),
                          jsx('button', {
                            className: 'daycare-withdraw-btn',
                            onClick: () =>
                              dispatch({
                                type: 'WITHDRAW_DAYCARE',
                                payload: {
                                  pokemonId: parent.id,
                                },
                              }),
                            children: 'Withdraw',
                          }),
                        ],
                      },
                      parent.id
                    )
                  : jsx(
                      'div',
                      {
                        className: 'daycare-slot empty',
                        children: 'Empty',
                      },
                      `empty-${slotIndex}`
                    )
              }),
            }),
            jsx('p', {
              className: 'daycare-hint',
              children:
                parents.length < 2
                  ? 'Deposit two Pokemon from their stats panel (open a boxed Pokemon and press Daycare).'
                  : !breedable
                    ? compatibility.reason
                    : `${
                        compatibility.reason
                      } Eggs hatch into ${eggSpecies?.name ?? 'a base form'} after ${daycareEggBattles} battles, with 1 in ${shinyOdds} shiny odds${
                        hasShinyParent ? ' (boosted by a shiny parent)' : ''
                      }.`,
            }),
            breedable &&
              jsxs('div', {
                className: 'daycare-progress',
                children: [
                  jsx('div', {
                    className: 'daycare-progress-bar',
                    children: jsx('div', {
                      className: 'daycare-progress-fill',
                      style: {
                        width: `${Math.min(100, (progress / daycareEggBattles) * 100)}%`,
                      },
                    }),
                  }),
                  jsx('span', {
                    className: 'daycare-progress-label',
                    children: ready ? 'Egg ready!' : `${progress} / ${daycareEggBattles} battles`,
                  }),
                ],
              }),
            jsx('button', {
              className: `stats-panel-trade-btn${ready ? '' : ' disabled'}`,
              disabled: !ready,
              onClick: () =>
                dispatch({
                  type: 'HATCH_DAYCARE_EGG',
                }),
              children: ready ? 'HATCH EGG' : 'Not ready yet',
            }),
          ],
        }),
      ],
    }),
  })
}
