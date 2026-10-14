// The Secret Base card shown on a route's location panel: set one up, enter it,
// or move an existing one here. The body folds away behind its section title,
// which stays open by default only on the route the base already sits on.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { mapData } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { SECRET_BASE_RELOCATE_COST } from '../game/secret-base.js'

/** @param {{ locationId: string }} props */
export function SecretBaseCard({ locationId }) {
  const { state, dispatch } = useGame(),
    base = state.secretBase,
    established = !!base?.locationId,
    isHere = base?.locationId === locationId,
    [collapsed, setCollapsed] = React.useState(!isHere),
    moveCost = established && !isHere ? SECRET_BASE_RELOCATE_COST : 0,
    canAfford = state.money >= moveCost,
    // What the collapsed title shows: where the base lives, or that there is
    // none yet.
    baseLocation = base?.locationId
      ? (mapData[base.locationId]?.name ?? 'Another route')
      : 'Not set up'
  return jsxs('div', {
    className: 'location-minigames secret-base-card',
    children: [
      jsxs('button', {
        className: `section-title inverse secret-base-toggle${collapsed ? '' : ' open'}`,
        type: 'button',
        'aria-expanded': !collapsed,
        title: collapsed ? 'Show Secret Base' : 'Hide Secret Base',
        onClick: () => setCollapsed((shown) => !shown),
        children: [
          jsx('span', {
            className: 'secret-base-toggle-arrow',
            children: collapsed ? '\u25b8' : '\u25be',
          }),
          jsx('span', {
            className: 'secret-base-toggle-label',
            children: 'Secret Base',
          }),
          jsx('span', {
            className: 'secret-base-toggle-status',
            children: baseLocation,
          }),
        ],
      }),
      !collapsed &&
        jsx('p', {
          className: 'location-minigame-hint',
          children: established
            ? `Your base is set up on ${isHere ? 'this route' : 'another route'}. Decorate it with furniture, plushies and milestone trophies for passive bonuses and a daily yield.`
            : 'Set up a hideout on this route: decorate it with furniture, plushies and milestone trophies for passive bonuses and a once-a-day yield.',
        }),
      !collapsed &&
        (isHere
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
            })),
    ],
  })
}
