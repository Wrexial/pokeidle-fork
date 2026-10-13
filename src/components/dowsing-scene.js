// Dowsing Machine: a hot/cold grid sweep for a route's daily hidden items,
// played as a full-stage scene while the reducer is in the `dowsing` phase.
// The hidden set is day-seeded (see game/minigames/dowsing.js) and the route is
// marked swept when the scene opens, so the found rewards are banked the moment
// they are uncovered. Reuses the Underground mining grid styling.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { mapData } from '../data/gameData.js'
import {
  DOWSING_PROBES,
  DOWSING_TILES,
  dowsingFinds,
  dowsingReading,
  dowsingRewardName,
} from '../game/minigames.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function DowsingScene() {
  const { state, dispatch } = useGame(),
    routeKey = mapData[state.currentLocation]?.routeKey ?? state.currentRoute,
    [finds] = React.useState(() => dowsingFinds(routeKey)),
    [probed, setProbed] = React.useState(
      () => /** @type {Record<number, { found: boolean, heat?: { key: string, label: string, icon: string } | null }>} */ ({})
    ),
    [found, setFound] = React.useState(
      () => /** @type {{ itemId: string, quantity: number }[]} */ ([])
    ),
    [showReward, setShowReward] = React.useState(false),
    endSweep = useMinigameClaim(dispatch),
    probesLeft = DOWSING_PROBES - Object.keys(probed).length,
    allFound = found.length >= finds.length,
    finished = probesLeft <= 0 || allFound

  /** @param {number} index */
  function probe(index) {
    if (probed[index] || finished) return
    const item = finds.find((entry) => entry.index === index),
      reading = item ? null : dowsingReading(finds, index)
    setProbed((current) => ({
      ...current,
      [index]: { found: !!item, heat: reading },
    }))
    if (state.sfxEnabled) playSfx(item ? 'coin' : 'dig')
    if (item) {
      setFound((current) => [...current, { itemId: item.itemId, quantity: item.quantity }])
      dispatch({
        type: 'FIND_DOWSING',
        payload: { rewards: [{ itemId: item.itemId, quantity: item.quantity }] },
      })
    }
  }

  function requestLeave() {
    if (found.length > 0) setShowReward(true)
    else endSweep({ type: 'END_DOWSING' })
  }

  const routeName = mapData[state.currentLocation]?.name ?? 'the route'

  return jsxs('div', {
    className: 'minigame-scene mining-scene dowsing-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', {
            className: 'minigame-scene-title',
            children: 'Dowsing Machine',
          }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `${routeName} \u00b7 ${probesLeft} / ${DOWSING_PROBES} probes`,
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: showReward
          ? [jsx(MinigameRewardScreen, {
              prize: { items: found, label: `${routeName} hidden items` },
              onCollect: () => endSweep({ type: 'END_DOWSING' }),
              buttonLabel: 'FINISH',
            })]
          : [
          jsx('div', {
            className: 'mining-grid dowsing-grid',
            children: [...Array(DOWSING_TILES).keys()].map((index) => {
              const cell = probed[index],
                isFound = !!cell?.found,
                heat = cell?.heat ?? null
              return jsxs(
                'button',
                {
                  className: `mining-tile dowsing-tile${cell ? ' dug' : ''}${isFound ? ' reward' : ''}${heat ? ` heat-${heat.key}` : ''}`,
                  onClick: () => probe(index),
                  disabled: !!cell || finished,
                  title: cell
                    ? isFound
                      ? 'Item found!'
                      : heat?.label
                    : 'Probe this tile',
                  children: isFound
                    ? '\u2728'
                    : heat
                      ? jsxs('span', {
                          className: 'dowsing-heat',
                          children: [
                            jsx('span', { className: 'dowsing-heat-icon', children: heat.icon }),
                            jsx('span', { className: 'dowsing-heat-label', children: heat.label }),
                          ],
                        })
                      : '?',
                },
                index
              )
            }),
          }),
          jsxs('div', {
            className: 'mining-found',
            children: [
              jsx('span', {
                className: 'mining-found-title',
                children: 'Found',
              }),
              jsx('span', {
                className: 'mining-found-list',
                children:
                  found.length > 0
                    ? found
                        .map((entry) => `${dowsingRewardName(entry.itemId)} x${entry.quantity}`)
                        .join('  \u00b7  ')
                    : 'Nothing yet \u2014 sweep warmer tiles.',
              }),
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-footer',
        children: !showReward && jsx('button', {
          className: 'move-panel-btn confirm',
          onClick: requestLeave,
          children:
            found.length > 0
              ? `LEAVE WITH ${found.length} FIND${found.length === 1 ? '' : 'S'}`
              : finished
                ? 'LEAVE EMPTY-HANDED'
                : 'LEAVE (FORFEIT PROBES)',
        }),
      }),
    ],
  })
}
