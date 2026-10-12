// The SOS-chain chip shown in a wild route's location panel: how many wild
// wins in a row the player has on this route, the route's best chain, and the
// hidden-ability / shiny odds the current chain has earned.

import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { SOS_REWARDS, sosHiddenAbilityChance, sosShinyMultiplier } from '../game/sos-chain.js'

/** @param {{ routeKey: string }} props */
export function SosChainChip({ routeKey }) {
  const { state } = useGame(),
    chain = state.sosChain ?? { routeKey: null, count: 0 },
    count = chain.routeKey === routeKey ? chain.count : 0,
    best = state.sosBestChains?.[routeKey] ?? 0,
    hiddenChance = Math.round(sosHiddenAbilityChance(count) * 100),
    shinyMultiplier = sosShinyMultiplier(count),
    nextReward = SOS_REWARDS.find((reward) => reward.chain > best)
  return jsxs('div', {
    className: `sos-chain-chip${count > 0 ? ' active' : ''}`,
    title:
      'SOS chaining: win wild battles in a row without leaving the route to raise the hidden-ability and shiny odds of the Pokemon you meet here.',
    children: [
      jsx('span', { className: 'sos-chain-icon', children: '\u{1f517}' }),
      jsxs('span', {
        className: 'sos-chain-text',
        children: [
          jsxs('span', {
            className: 'sos-chain-count',
            children: ['SOS chain ', count],
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
