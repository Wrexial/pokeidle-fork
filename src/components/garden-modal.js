// Berry Garden modal: plant berries in a few plots, let them ripen over wild
// wins, then harvest the crop.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { consumableItems, heldItems } from '../data/items.js'
import { useGame } from '../game/context.js'
import { GARDEN_BERRIES, isPlotReady } from '../game/garden.js'

/** @param {string} berryId */
function berryName(berryId) {
  return consumableItems[berryId]?.name ?? heldItems[berryId]?.name ?? berryId
}

/** @param {{ onClose: () => void }} props */
export function GardenModal({ onClose }) {
  const { state, dispatch } = useGame(),
    plots = state.garden?.plots ?? [],
    plantable = Object.keys(GARDEN_BERRIES),
    ownedPlantable = plantable.filter((berryId) => (state.inventory[berryId] ?? 0) > 0),
    [selectedBerry, setSelectedBerry] = React.useState(
      /** @type {string} */ (ownedPlantable[0] ?? 'oranBerry')
    )
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', { className: 'battle-info-title', children: 'Berry Garden' }),
            jsx('button', { className: 'battle-info-close', onClick: onClose, children: 'X' }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content garden-content',
          children: [
            jsx('p', {
              className: 'daycare-hint',
              children:
                'Plant a berry, win battles to let it ripen, then harvest a small crop. Pick a berry below, then tap an empty plot.',
            }),
            jsx('div', {
              className: 'garden-plots',
              children: plots.map((plot, plotIndex) => {
                const definition = plot ? GARDEN_BERRIES[plot.berryId] : null,
                  ready = isPlotReady(plot),
                  progress = plot && definition
                    ? 1 - plot.battlesRemaining / definition.growBattles
                    : 0
                return jsxs(
                  'div',
                  {
                    className: `garden-plot${plot ? '' : ' empty'}${ready ? ' ready' : ''}`,
                    onClick:
                      !plot && (state.inventory[selectedBerry] ?? 0) > 0
                        ? () =>
                            dispatch({
                              type: 'PLANT_BERRY',
                              payload: { plotIndex, berryId: selectedBerry },
                            })
                        : void 0,
                    children: [
                      plot
                        ? jsxs('div', {
                            className: 'garden-plot-filled',
                            children: [
                              jsx('span', {
                                className: 'garden-berry-name',
                                children: berryName(plot.berryId),
                              }),
                              ready
                                ? jsx('button', {
                                    className: 'garden-harvest-btn',
                                    onClick: /** @param {React.MouseEvent} e */ (e) => {
                                      e.stopPropagation()
                                      dispatch({
                                        type: 'HARVEST_BERRY',
                                        payload: { plotIndex },
                                      })
                                    },
                                    children: 'HARVEST',
                                  })
                                : jsxs('div', {
                                    className: 'garden-growth',
                                    children: [
                                      jsx('div', {
                                        className: 'garden-growth-bar',
                                        children: jsx('div', {
                                          className: 'garden-growth-fill',
                                          style: {
                                            width: `${Math.max(0, Math.min(100, progress * 100))}%`,
                                          },
                                        }),
                                      }),
                                      jsx('span', {
                                        className: 'garden-growth-label',
                                        children: `${plot.battlesRemaining} battles`,
                                      }),
                                    ],
                                  }),
                            ],
                          })
                        : jsx('span', {
                            className: 'garden-plot-empty-label',
                            children: 'Empty',
                          }),
                    ],
                  },
                  plotIndex
                )
              }),
            }),
            jsx('div', {
              className: 'garden-picker-title',
              children: 'Plant',
            }),
            jsx('div', {
              className: 'garden-picker',
              children: plantable.map((berryId) => {
                const owned = state.inventory[berryId] ?? 0
                return jsxs(
                  'button',
                  {
                    className: `garden-berry-pick${selectedBerry === berryId ? ' active' : ''}${owned <= 0 ? ' empty' : ''}`,
                    onClick: () => setSelectedBerry(berryId),
                    children: [
                      jsx('span', { className: 'garden-berry-pick-name', children: berryName(berryId) }),
                      jsx('span', {
                        className: 'garden-berry-pick-owned',
                        children: `x${owned}`,
                      }),
                    ],
                  },
                  berryId
                )
              }),
            }),
            ownedPlantable.length === 0 &&
              jsx('p', {
                className: 'daycare-hint',
                children:
                  'No plantable berries in the bag. Oran Berries are sold at any Mart; Sitrus and Lum Berries can be foraged or bought later.',
              }),
          ],
        }),
      ],
    }),
  })
}
