// The SOS-chain chip shown in a wild route's location panel: how many wild
// wins in a row against the same species the player has on this route, the
// route's best chain, and the hidden-ability / shiny odds the current chain has
// earned. A different species starts a new chain, while the route keeps its
// best.

import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { SOS_REWARDS, sosHiddenAbilityChance, sosShinyMultiplier } from '../game/sos-chain.js'

/** @param {{ routeKey: string }} props */
export function SosChainChip({ routeKey }) {
  const { state } = useGame(),
    chain = state.sosChain ?? { routeKey: null, speciesKey: null, count: 0 },
    count = chain.routeKey === routeKey ? chain.count : 0,
    speciesName =
      count > 0 && chain.speciesKey
        ? pokemonSpecies[chain.speciesKey]?.name ?? chain.speciesKey
        : null,
    best = state.sosBestChains?.[routeKey] ?? 0,
    hiddenChance = Math.round(sosHiddenAbilityChance(count) * 100),
    shinyMultiplier = sosShinyMultiplier(count),
    nextReward = SOS_REWARDS.find((reward) => reward.chain > best)
  return jsxs('div', {
    className: `sos-chain-chip${count > 0 ? ' active' : ''}`,
    title:
      'SOS chaining: win wild battles in a row against the same species without leaving the route to raise the hidden-ability and shiny odds of the Pokemon you meet here. Defeating a different species starts a new chain, and the route keeps its best.',
    children: [
      jsx('span', { className: 'sos-chain-icon', children: '\u{1f517}' }),
      jsxs('span', {
        className: 'sos-chain-text',
        children: [
          jsxs('span', {
            className: 'sos-chain-count',
            children: ['SOS chain ', count],
          }),
          speciesName &&
            jsx('span', {
              className: 'sos-chain-species',
              children: speciesName,
            }),
          jsx('span', {
            className: 'sos-chain-best',
            children: `best ${best}`,
          }),
          count > 0 &&
            jsx('span', {
              className: 'sos-chain-odds',
              children: `hidden ${hiddenChance}% \u00b7 shiny ${shinyMultiplier.toFixed(1)}\u00d7`,
            }),
          nextReward &&
            jsx('span', {
              className: 'sos-chain-next',
              children: `next ${nextReward.label} at ${nextReward.chain}`,
            }),
        ],
      }),
    ],
  })
}
