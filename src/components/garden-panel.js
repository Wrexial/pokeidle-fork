// Berry Garden panel, shown inside Poké Pelago. Split from the old standalone
// modal so Pelago can host it alongside companion care.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { consumableItems, heldItems } from '../data/items.js'
import { useGame } from '../game/context.js'
import { BLEND_BERRY_COST, GARDEN_BERRIES, isPlotReady } from '../game/garden.js'

/** @param {string} berryId */
function berryName(berryId) {
  return consumableItems[berryId]?.name ?? heldItems[berryId]?.name ?? berryId
}

export function GardenPanel() {
  const { state, dispatch } = useGame(),
    plots = state.garden?.plots ?? [],
    plantable = Object.keys(GARDEN_BERRIES),
    ownedPlantable = plantable.filter((berryId) => (state.inventory[berryId] ?? 0) > 0),
    [selectedBerry, setSelectedBerry] = React.useState(
      /** @type {string} */ (ownedPlantable[0] ?? 'oranBerry')
    )
  return jsxs('div', {
    className: 'garden-content',
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
            progress =
              plot && definition ? 1 - plot.battlesRemaining / definition.growBattles : 0
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
                              onClick: /** @param {React.MouseEvent} event */ (event) => {
                                event.stopPropagation()
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
      jsx('div', {
        className: 'garden-picker-title',
        children: 'Blend',
      }),
      jsxs('button', {
        className: 'garden-blend-btn',
        disabled: (state.inventory[selectedBerry] ?? 0) < BLEND_BERRY_COST,
        onClick: () =>
          dispatch({ type: 'BLEND_BERRIES', payload: { berryId: selectedBerry } }),
        children: [
          `Blend ${BLEND_BERRY_COST}x ${berryName(selectedBerry)} into a Poffin`,
          ' \u2014 a party Pokemon\u2019s friendship +30',
        ],
      }),
    ],
  })
}
