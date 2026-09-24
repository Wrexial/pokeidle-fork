// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { DexBallBadge } from './dex-ball-badge.js'

export let PokedexTile = React.memo(
  /** @param {{ speciesKey: string, status: string, rarity: string, isSelected: boolean, onClick: () => void, isShinyCaught: boolean, isExclusive?: boolean, chainCount?: number, activeEffect: any, selectorMode: any }} props */
  function ({
    speciesKey,
    status,
    rarity,
    isSelected,
    onClick,
    isShinyCaught,
    isExclusive,
    chainCount,
    activeEffect,
    selectorMode,
  }) {
    const species = pokemonSpecies[speciesKey],
      ballStatus = isShinyCaught
        ? 'shiny'
        : status === 'caught'
          ? 'caught'
          : status === 'seen'
            ? 'seen'
            : null
    return species
      ? jsxs('div', {
          className: `pokedex-tile rarity-border-${rarity}${isSelected ? ' selected' : ''}${selectorMode && status !== 'unseen' ? ' selector-target' : ''}`,
          onClick,
          children: [
            jsx(DexBallBadge, {
              status: ballStatus,
              size: 12,
              className: 'pokedex-tile-ball',
            }),
            isExclusive &&
              jsx('span', {
                className: 'pokedex-exclusive-badge',
                title: 'Only found on this route',
                children: '◆',
              }),
            (chainCount ?? 0) > 0 &&
              jsx('span', {
                className: 'shiny-chain-badge',
                title: `${chainCount} in a row — better shiny odds`,
                children: `✦${chainCount}`,
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
