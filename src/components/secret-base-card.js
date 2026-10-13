// The Secret Base card shown on a route's location panel: set one up, enter it,
// or move an existing one here.

import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { SECRET_BASE_RELOCATE_COST } from '../game/secret-base.js'

/** @param {{ locationId: string }} props */
export function SecretBaseCard({ locationId }) {
  const { state, dispatch } = useGame(),
    base = state.secretBase,
    established = !!base?.locationId,
    isHere = base?.locationId === locationId,
    moveCost = established && !isHere ? SECRET_BASE_RELOCATE_COST : 0,
    canAfford = state.money >= moveCost
  return jsxs('div', {
    className: 'location-minigames secret-base-card',
    children: [
      jsx('div', {
        className: 'location-section-title',
        children: 'Secret Base',
      }),
      jsx('p', {
        className: 'location-minigame-hint',
        children: established
          ? `Your base is set up on ${isHere ? 'this route' : 'another route'}. Decorate it with furniture, plushies and milestone trophies for passive bonuses and a daily yield.`
          : 'Set up a hideout on this route: decorate it with furniture, plushies and milestone trophies for passive bonuses and a once-a-day yield.',
      }),
      isHere
        ? jsx('button', {
            className: 'location-minigame-start',
            onClick: () => dispatch({ type: 'START_SECRET_BASE' }),
            children: '\u{1F3D5}\uFE0F ENTER SECRET BASE',
          })
        : jsx('button', {
            className: 'location-minigame-start',
            disabled: !canAfford,
            onClick: () =>
              dispatch({ type: 'SETUP_SECRET_BASE', payload: { locationId } }),
            children: established
              ? canAfford
                ? `MOVE BASE HERE ($${moveCost.toLocaleString()})`
                : 'NOT ENOUGH MONEY'
              : 'SET UP SECRET BASE HERE',
          }),
    ],
  })
}
