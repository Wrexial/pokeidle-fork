// The Rare Radar reveal chip shown in a wild route's location panel: which
// species the Pokewalker's Rare Radar is drawing out of hiding, and how many
// wild battles of the buff remain. The reveal heavily suppresses every other
// species on the route, so this is the player's confirmation it is working.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'

/** @param {{ routeKey: string }} props */
export function RevealChip({ routeKey }) {
  const { state } = useGame(),
    reveal = (state.activeEffects ?? []).find(
      (effect) =>
        effect.type === 'reveal' && effect.routeKey === routeKey && effect.speciesKey
    )
  if (!reveal?.speciesKey) return null
  const speciesKey = reveal.speciesKey,
    name = pokemonSpecies[speciesKey]?.name ?? speciesKey
  return jsxs('div', {
    className: 'reveal-chip',
    title: `The Rare Radar is drawing out ${name} on this route: it is far more common (and easier to catch) for ${reveal.battlesRemaining} more wild battles.`,
    children: [
      jsx('span', { className: 'reveal-chip-icon', children: '\u{1f4e1}' }),
      jsxs('span', {
        className: 'reveal-chip-text',
        children: [
          jsx('span', { className: 'reveal-chip-label', children: 'Rare Radar' }),
          jsx('span', { className: 'reveal-chip-species', children: name }),
          jsx('span', {
            className: 'reveal-chip-remaining',
            children: `${reveal.battlesRemaining} battle${reveal.battlesRemaining === 1 ? '' : 's'} left`,
          }),
        ],
      }),
    ],
  })
}
