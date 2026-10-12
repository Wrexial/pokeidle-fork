// A post-game base camp: the themed hub shown for a post-game zone (Hisui's
// Jubilife Village, the Lumiose Wild Zones' plaza). It offers a shop, a party
// heal and a launch pad into the zone's own areas, so a zone has somewhere to
// return to between excursions.

import { jsx, jsxs } from 'react/jsx-runtime'
import { mapData } from '../data/gameData.js'
import { postgameHubFor } from '../data/postgame-hubs.js'
import { useGame } from '../game/context.js'
import { computeUnlockedLocations } from '../game/progression.js'
import { ShopPanel } from './shop-panel.js'

/**
 * @param {{ locationId: string, onClose: () => void }} props
 */
export function PostgameHubModal({ locationId, onClose }) {
  const { state, dispatch } = useGame(),
    hub = postgameHubFor(locationId),
    location = mapData[locationId]
  if (!hub || !location) return null
  const subAreas = location.subAreas ?? [],
    unlockedNow = new Set(computeUnlockedLocations(state)),
    travel = (/** @type {string} */ subAreaId) => {
      if (subAreaId === state.currentLocation || !unlockedNow.has(subAreaId)) return
      dispatch({ type: 'TRAVEL', payload: { locationId: subAreaId } })
      onClose()
    }
  return jsx('div', {
    className: 'battle-info-overlay postgame-hub-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal postgame-hub-modal',
      style: { backgroundImage: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.75)), url(${hub.background})` },
      onClick: /** @param {React.MouseEvent} mouseEvent */ (mouseEvent) =>
        mouseEvent.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'postgame-hub-head',
          children: [
            jsx('span', { className: 'postgame-hub-icon', children: hub.icon }),
            jsxs('div', {
              className: 'postgame-hub-head-info',
              children: [
                jsx('span', { className: 'postgame-hub-name', children: hub.name }),
                jsx('span', { className: 'postgame-hub-subtitle', children: hub.subtitle }),
              ],
            }),
            jsx('button', { className: 'battle-info-close', onClick: onClose, children: 'X' }),
          ],
        }),
        jsx('p', { className: 'postgame-hub-greeting', children: hub.greeting }),
        jsxs('div', {
          className: 'postgame-hub-actions',
          children: [
            jsx('button', {
              className: 'gym-fight-btn',
              onClick: () => {
                dispatch({ type: 'START_HEALING' })
                onClose()
              },
              children: '\u2764 HEAL PARTY',
            }),
          ],
        }),
        jsxs('div', {
          className: 'postgame-hub-section',
          children: [
            jsx('div', { className: 'postgame-hub-section-title', children: 'Set out' }),
            jsx('div', {
              className: 'zone-area-list',
              children: subAreas.map((subArea) => {
                const unlocked = unlockedNow.has(subArea.id),
                  active = subArea.id === state.currentLocation
                return jsx(
                  'button',
                  {
                    className: `zone-area-btn${active ? ' active' : ''}${unlocked ? '' : ' locked'}`,
                    disabled: !unlocked,
                    onClick: () => travel(subArea.id),
                    children: jsx('span', {
                      className: 'zone-area-name',
                      children: unlocked ? subArea.name : '???',
                    }),
                  },
                  subArea.id
                )
              }),
            }),
          ],
        }),
        jsxs('div', {
          className: 'postgame-hub-shop',
          children: [
            jsx('div', { className: 'postgame-hub-section-title', children: 'Shop' }),
            jsx(ShopPanel, { shopDef: hub.shop }),
          ],
        }),
        jsx('p', { className: 'postgame-hub-description', children: hub.description }),
      ],
    }),
  })
}
