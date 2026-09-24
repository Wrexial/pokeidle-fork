// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { statusLabel } from '../data/ui.js'
import { DexBallBadge } from './dex-ball-badge.js'
import { HpBar } from './hp-bar.js'

/** @param {{ pokemon: BattlePokemon, dexStatus?: 'seen' | 'caught' | 'shiny' | null }} props */
export function EnemyInfoBox({ pokemon, dexStatus }) {
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
          jsx(DexBallBadge, {
            status: dexStatus,
            size: 11,
          }),
          // Rendered even with no status so the name row never changes width
          // when a status wears off or is applied mid-battle.
          jsx('span', {
            className: `status-badge${
              pokemon.status ? ` status-${pokemon.status}` : ' status-empty'
            }`,
            children: pokemon.status ? statusLabel(pokemon.status) : '\u00a0',
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
