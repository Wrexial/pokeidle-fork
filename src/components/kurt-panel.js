// Kurt's Apricorn Ball workshop, hosted in Azalea Town. Hand him an Apricorn
// and he carves it into the matching ball. Apricorns turn up on Johto routes.

import { jsx, jsxs } from 'react/jsx-runtime'
import { APRICORN_IDS, consumableItems, pokeBalls } from '../data/items.js'
import { useGame } from '../game/context.js'
import { PokeballIcon } from './pokeball-icon.js'
import { ItemIcon } from './item-icon.js'

/** The only place Kurt works. */
export const KURT_LOCATION = 'johto-azalea-town'

export function KurtPanel() {
  const { state, dispatch } = useGame()
  if (state.currentLocation !== KURT_LOCATION) return null
  return jsxs('div', {
    className: 'location-tower kurt-panel',
    children: [
      jsx('div', {
        className: 'location-section-title',
        children: 'Kurt\u2019s Apricorn Balls',
      }),
      jsx('p', {
        className: 'tower-hint',
        children:
          'Kurt carves one Apricorn into the ball it makes. Apricorns turn up on Johto routes as you win wild battles.',
      }),
      jsx('div', {
        className: 'kurt-list',
        children: APRICORN_IDS.map((apricornId) => {
          const apricorn = consumableItems[apricornId],
            ballId = /** @type {string} */ (apricorn.kurtBall),
            ball = pokeBalls[ballId],
            owned = state.inventory[apricornId] ?? 0
          return jsxs(
            'div',
            {
              className: 'kurt-row',
              children: [
                jsx(ItemIcon, { itemId: apricornId }),
                jsxs('span', {
                  className: 'kurt-name',
                  children: [
                    apricorn.name,
                    jsx('span', { className: 'kurt-owned', children: ` (${owned})` }),
                  ],
                }),
                jsx(PokeballIcon, { ballId, size: 12, disabled: owned <= 0 }),
                jsx('span', { className: 'kurt-ball-name', children: ball.name }),
                jsx('button', {
                  className: 'gym-fight-btn',
                  disabled: owned <= 0,
                  onClick: () =>
                    dispatch({
                      type: 'CRAFT_APRICORN_BALL',
                      payload: { apricornId },
                    }),
                  children: 'CRAFT',
                }),
              ],
            },
            apricornId
          )
        }),
      }),
    ],
  })
}
