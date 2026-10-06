// Split from a grouped component file.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonDisplayName } from '../game/pokemon.js'
import { statusLabel } from '../data/ui.js'
import { ExpBar } from './exp-bar.js'
import { HpBar } from './hp-bar.js'

/** @param {{ pokemon: Pokemon, status?: string | null }} props */
export function PlayerInfoBox({ pokemon, status }) {
  return jsxs('div', {
    className: 'info-box',
    children: [
      jsxs('div', {
        className: 'info-name-row',
        children: [
          pokemon.isShiny &&
            jsx('span', {
              className: 'shiny-star',
              children: '★',
            }),
          jsx('span', {
            className: 'info-pokemon-name',
            children: pokemonDisplayName(pokemon).toUpperCase(),
          }),
          // Rendered even with no status so the name row never changes width
          // when a status wears off or is applied mid-battle.
          jsx('span', {
            className: `status-badge${status ? ` status-${status}` : ' status-empty'}`,
            children: status ? statusLabel(status) : '\u00a0',
          }),
          jsxs('span', {
            className: 'info-pokemon-level',
            children: ['Lv.', pokemon.level],
          }),
        ],
      }),
      jsx(HpBar, {
        current: pokemon.currentHp,
        max: pokemon.maxHp,
      }),
      jsxs('div', {
        className: 'info-hp-numbers',
        children: [pokemon.currentHp, '/ ', pokemon.maxHp],
      }),
      jsx(ExpBar, {
        speciesKey: pokemon.speciesKey,
        level: pokemon.level,
        totalExp: pokemon.totalExp,
      }),
    ],
  })
}
