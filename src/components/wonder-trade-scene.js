// Cinematic Wonder Trade. The reducer applies the swap and hands the phase to
// `wonderTrade`; this scene shows the sent Pokemon leave, a link pulse, and the
// received Pokemon arrive, then dispatches COMPLETE_WONDER_TRADE. It pauses the
// game while it plays.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { genderForPokemon, genderSymbol } from '../game/breeding.js'
import {
  getPokemonSpriteFallbackUrl,
  getPokemonSpriteUrl,
  pokemonDisplayName,
} from '../game/pokemon.js'

/**
 * @param {{ pokemon: Pokemon, side: 'sent' | 'received', gone?: boolean }} props
 */
function TradePokemon({ pokemon, side, gone }) {
  const species = pokemonSpecies[pokemon.speciesKey],
    gender = genderForPokemon(pokemon),
    genderClass =
      gender === 'male' ? 'gender-male' : gender === 'female' ? 'gender-female' : 'gender-none'
  if (!species) return null
  return jsxs('div', {
    className: `wonder-trade-side ${side}${gone ? ' gone' : ''}`,
    children: [
      jsx('span', {
        className: 'wonder-trade-label',
        children: side === 'sent' ? 'You sent' : 'You received',
      }),
      jsx('img', {
        className: `wonder-trade-sprite${pokemon.isShiny ? ' shiny' : ''}`,
        src: getPokemonSpriteUrl(species.id, !1, pokemon.isShiny),
        onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
          (event.target.src = getPokemonSpriteFallbackUrl(species.id, !1, pokemon.isShiny)),
        alt: species.name,
      }),
      jsxs('span', {
        className: 'wonder-trade-name',
        children: [
          pokemon.isShiny && jsx('span', { className: 'shiny-star', children: '\u2726' }),
          pokemonDisplayName(pokemon),
          jsx('span', { className: `pokemon-gender ${genderClass}`, children: genderSymbol(gender) }),
        ],
      }),
      jsx('span', {
        className: 'wonder-trade-level',
        children: `Lv.${pokemon.level}`,
      }),
    ],
  })
}

export function WonderTradeScene() {
  const { state, dispatch } = useGame(),
    trade = state.wonderTradeState,
    [step, setStep] = React.useState('send')

  React.useEffect(() => {
    if (!trade) return
    const speed = state.speed || 1
    const receiveTimer = setTimeout(() => setStep('receive'), 1500 / speed),
      doneTimer = setTimeout(() => dispatch({ type: 'COMPLETE_WONDER_TRADE' }), 3400 / speed)
    return () => {
      clearTimeout(receiveTimer)
      clearTimeout(doneTimer)
    }
  }, [trade, dispatch, state.speed])

  if (!trade) return null
  const sentName = pokemonDisplayName(trade.sentPokemon),
    receivedName = pokemonDisplayName(trade.receivedPokemon),
    received = step === 'receive'
  return jsxs('div', {
    className: `wonder-trade-scene step-${step}`,
    children: [
      jsx('div', { className: 'wonder-trade-bg' }),
      jsx('div', {
        className: 'wonder-trade-title',
        children: 'Wonder Trade',
      }),
      jsxs('div', {
        className: 'wonder-trade-stage',
        children: [
          jsx(TradePokemon, {
            pokemon: trade.sentPokemon,
            side: 'sent',
            gone: received,
          }),
          jsxs('div', {
            className: 'wonder-trade-link',
            children: [
              jsx('span', { className: 'wonder-trade-link-ring' }),
              jsx('span', { className: 'wonder-trade-link-icon', children: '\u21c4' }),
            ],
          }),
          received
            ? jsx(TradePokemon, {
                pokemon: trade.receivedPokemon,
                side: 'received',
              })
            : jsxs('div', {
                className: 'wonder-trade-side received waiting',
                children: [
                  jsx('span', {
                    className: 'wonder-trade-label',
                    children: 'You received',
                  }),
                  jsx('span', {
                    className: 'wonder-trade-mystery',
                    children: '?',
                  }),
                ],
              }),
        ],
      }),
      jsx('div', {
        className: 'wonder-trade-text',
        children: received
          ? `You received ${receivedName}!${
              trade.receivedIsShiny ? ' It sparkles with a shiny glow!' : ''
            }`
          : `Trading ${sentName} away\u2026`,
      }),
      jsx('div', {
        className: 'wonder-trade-actions',
        children:
          received &&
          jsx('button', {
            className: 'move-panel-btn confirm',
            onClick: () => dispatch({ type: 'COMPLETE_WONDER_TRADE' }),
            children: 'CONTINUE',
          }),
      }),
    ],
  })
}
