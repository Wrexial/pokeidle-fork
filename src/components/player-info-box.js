// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { ExpBar } from './exp-bar.js'
import { HpBar } from './hp-bar.js'

export function PlayerInfoBox({ pokemon }) {
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
            children: pokemon.name.toUpperCase(),
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
