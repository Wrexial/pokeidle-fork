// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

export let PokedexTile = React.memo(
  /** @param {{ speciesKey: string, status: string, rarity: string, isSelected: boolean, onClick: () => void, isShinyCaught: boolean, isExclusive?: boolean, activeEffect: any, selectorMode: any }} props */
  function ({
    speciesKey,
    status,
    rarity,
    isSelected,
    onClick,
    isShinyCaught,
    isExclusive,
    activeEffect,
    selectorMode,
  }) {
    const species = pokemonSpecies[speciesKey]
    return species
      ? jsxs('div', {
          className: `pokedex-tile rarity-border-${rarity}${isSelected ? ' selected' : ''}${selectorMode && status !== 'unseen' ? ' selector-target' : ''}`,
          onClick,
          children: [
            isShinyCaught &&
              jsx('span', {
                className: 'pokedex-shiny-star',
                children: '★',
              }),
            isExclusive &&
              jsx('span', {
                className: 'pokedex-exclusive-badge',
                title: 'Only found on this route',
                children: '◆',
              }),
            activeEffect?.repel &&
              jsx('span', {
                className: 'pokedex-effect-indicator repel-indicator',
                children: 'R',
              }),
            activeEffect?.honey &&
              jsx('span', {
                className: 'pokedex-effect-indicator honey-indicator',
                children: 'H',
              }),
            jsx('img', {
              className: `pokedex-tile-sprite ${status}`,
              src: getPokemonSpriteUrl(species.id),
              onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
              alt: status === 'unseen' ? '???' : species.name,
              loading: 'lazy',
            }),
            jsx('div', {
              className: 'pokedex-tile-name',
              children: status === 'unseen' ? '???' : species.name,
            }),
          ],
        })
      : null
  })
