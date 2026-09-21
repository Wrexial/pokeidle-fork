// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { HpBar } from './hp-bar.js'

/** Short labels for the battle status badge. */
/** @type {Record<string, string>} */
const STATUS_LABELS = {
  poison: 'PSN',
  burn: 'BRN',
  freeze: 'FRZ',
  sleep: 'SLP',
  flinching: 'FLN',
}

/** @param {{ pokemon: BattlePokemon }} props */
export function EnemyInfoBox({ pokemon }) {
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
          pokemon.status &&
            jsx('span', {
              className: `status-badge status-${pokemon.status}`,
              children: STATUS_LABELS[pokemon.status] ?? pokemon.status,
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
    ],
  })
}
