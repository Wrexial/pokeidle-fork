// Dowsing Machine: a lost-and-found aura sweep for a route's daily hidden
// items, played as a full-stage scene while the reducer is in the `dowsing`
// phase. The hidden set is day-seeded (see game/minigames/dowsing.js) and the
// route is marked swept when the scene opens, so recovered rewards are banked
// the moment their aura is pinned down. The scanner grid is dowsing's own, not
// the Underground's dig grid.
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
    className: 'minigame-scene dowsing-scene',
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
              prize: { items: found, label: `${routeName} lost-and-found` },
              onCollect: () => endSweep({ type: 'END_DOWSING' }),
              buttonLabel: 'FINISH',
            })]
          : [
          jsx('div', {
            className: 'dowsing-grid',
            children: [...Array(DOWSING_TILES).keys()].map((index) => {
              const cell = probed[index],
                isFound = !!cell?.found,
                heat = cell?.heat ?? null
              return jsxs(
                'button',
                {
                  className: `dowsing-tile${cell ? ' swept' : ''}${isFound ? ' find' : ''}${heat ? ` aura-${heat.key}` : ''}`,
                  onClick: () => probe(index),
                  disabled: !!cell || finished,
                  title: cell
                    ? isFound
                      ? 'Lost item recovered!'
                      : heat?.label
                    : 'Probe this tile',
                  children: isFound
                    ? '\u2728'
                    : heat
                      ? jsxs('span', {
                          className: 'dowsing-aura',
                          children: [
                            jsx('span', { className: 'dowsing-aura-icon', children: heat.icon }),
                            jsx('span', { className: 'dowsing-aura-label', children: heat.label }),
                          ],
                        })
                      : '?',
                },
                index
              )
            }),
          }),
          jsxs('div', {
            className: 'dowsing-found',
            children: [
              jsx('span', {
                className: 'dowsing-found-title',
                children: 'Recovered',
              }),
              jsx('span', {
                className: 'dowsing-found-list',
                children:
                  found.length > 0
                    ? found
                        .map((entry) => `${dowsingRewardName(entry.itemId)} x${entry.quantity}`)
                        .join('  \u00b7  ')
                    : 'Nothing yet \u2014 follow a stronger aura.',
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
