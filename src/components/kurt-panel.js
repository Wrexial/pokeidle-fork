// Kurt's Apricorn Ball workshop, hosted in Azalea Town. Hand him an Apricorn
// and he carves it into the matching ball. Apricorns turn up on Johto routes.

import { jsx, jsxs } from 'react/jsx-runtime'
import { APRICORN_IDS, consumableItems, pokeBalls } from '../data/items.js'
import { useGame } from '../game/context.js'
import { KURT_CRAFT_BATTLES, readyKurtCrafts } from '../game/kurt.js'
import { PokeballIcon } from './pokeball-icon.js'
import { ItemIcon } from './item-icon.js'

/** The only place Kurt works. */
export const KURT_LOCATION = 'johto-azalea-town'

export function KurtPanel() {
  const { state, dispatch } = useGame()
  if (state.currentLocation !== KURT_LOCATION) return null
  const crafts = state.kurtCrafts ?? [],
    ready = readyKurtCrafts(crafts)
  return jsxs('div', {
    className: 'location-tower kurt-panel',
    children: [
      jsx('div', {
        className: 'location-section-title',
        children: 'Kurt\u2019s Apricorn Balls',
      }),
      jsx('p', {
        className: 'tower-hint',
        children: `Hand Kurt an Apricorn and he carves it into its ball over ${KURT_CRAFT_BATTLES} wild wins. Apricorns turn up on Johto routes (and grow in the Berry Garden).`,
      }),
      crafts.length > 0 &&
        jsxs('div', {
          className: 'kurt-queue',
          children: [
            jsxs('div', {
              className: 'kurt-queue-head',
              children: [
                jsx('span', {
                  className: 'kurt-queue-title',
                  children: `Kurt is working (${crafts.length})`,
                }),
                jsx('button', {
                  className: 'gym-fight-btn',
                  disabled: ready.length === 0,
                  onClick: () => dispatch({ type: 'COLLECT_KURT_BALLS' }),
                  children: ready.length > 0 ? `COLLECT (${ready.length})` : 'NOT READY',
                }),
              ],
            }),
            ...crafts.map((craft, craftIndex) =>
              jsxs(
                'div',
                {
                  className: `kurt-queue-row${craft.battlesRemaining <= 0 ? ' ready' : ''}`,
                  children: [
                    jsx(ItemIcon, { itemId: craft.apricornId }),
                    jsx('span', {
                      className: 'kurt-queue-ball',
                      children: pokeBalls[craft.ballId]?.name ?? craft.ballId,
                    }),
                    jsx('span', {
                      className: 'kurt-queue-progress',
                      children:
                        craft.battlesRemaining > 0
                          ? `${craft.battlesRemaining} win${craft.battlesRemaining === 1 ? '' : 's'} left`
                          : 'Ready!',
                    }),
                  ],
                },
                `craft-${craftIndex}`
              )
            ),
          ],
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
