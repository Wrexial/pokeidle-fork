// The ribbon case: the per-Pokemon awards earned from milestones, Gym / League
// wins, the Battle Tower and the Contest / Gauntlet. Shown in the stats panel.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonRibbons } from '../game/pokemon.js'

/** @param {{ pokemon: Pokemon }} props */
export function RibbonCase({ pokemon }) {
  const ribbons = pokemonRibbons(pokemon)
  if (ribbons.length === 0) return null
  return jsxs('div', {
    className: 'stats-panel-ribbons',
    children: [
      jsx('span', {
        className: 'stats-panel-ribbons-title',
        children: `Ribbons \u00b7 ${ribbons.length}`,
      }),
      jsx('div', {
        className: 'ribbon-grid',
        children: ribbons.map((ribbon) =>
          jsx(
            'span',
            {
              className: 'ribbon-chip',
              title: ribbon.description,
              children: [ribbon.icon, ' ', ribbon.name],
            },
            ribbon.id
          )
        ),
      }),
    ],
  })
}
