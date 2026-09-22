// Sinnoh Underground mining, played as a full-stage scene while the reducer is
// in the `mining` phase. The grid/dug state is local; collecting dispatches the
// found rewards with COLLECT_MINING, then END_MINIGAME closes the scene.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import {
  MINING_DIGS,
  MINING_REWARD_TILES,
  MINING_TILES,
  rewardItemName,
  rollMiningReward,
} from '../game/minigames.js'
import { useGame } from '../game/context.js'

/**
 * A shuffled grid with hidden rewards.
 * @returns {({ itemId: string, quantity: number } | null)[]}
 */
function makeGrid() {
  const grid = /** @type {({ itemId: string, quantity: number } | null)[]} */ (
    Array.from({ length: MINING_TILES }, () => null)
  ),
    indices = [...Array(MINING_TILES).keys()]
  for (let index = indices.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[indices[index], indices[swap]] = [indices[swap], indices[index]]
  }
  for (const index of indices.slice(0, MINING_REWARD_TILES)) grid[index] = rollMiningReward()
  return grid
}

export function MiningScene() {
  const { state, dispatch } = useGame(),
    [grid] = React.useState(makeGrid),
    [dug, setDug] = React.useState(() => /** @type {Set<number>} */ (new Set())),
    [found, setFound] = React.useState(
      () => /** @type {{ itemId: string, quantity: number }[]} */ ([])
    ),
    digsLeft = MINING_DIGS - dug.size,
    finished = digsLeft <= 0

  /** @param {number} index */
  function dig(index) {
    if (dug.has(index) || finished) return
    const nextDug = new Set(dug)
    nextDug.add(index)
    setDug(nextDug)
    const reward = grid[index]
    if (reward) setFound((current) => [...current, reward])
  }

  function collect() {
    dispatch({
      type: 'COLLECT_MINING',
      payload: {
        rewards: found,
      },
    })
    dispatch({ type: 'END_MINIGAME' })
  }

  return jsxs('div', {
    className: 'minigame-scene mining-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', {
            className: 'minigame-scene-title',
            children: 'Underground Mining',
          }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `${dug.size} / ${MINING_DIGS} digs`,
              ' \u00b7 ',
              `$${state.money.toLocaleString()}`,
            ],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: [
          jsx('div', {
            className: 'mining-grid',
            children: grid.map((reward, index) => {
              const isDug = dug.has(index)
              return jsx(
                'button',
                {
                  className: `mining-tile${isDug ? ' dug' : ''}${isDug && reward ? ' reward' : ''}`,
                  onClick: () => dig(index),
                  disabled: isDug || finished,
                  children: isDug ? (reward ? rewardItemName(reward.itemId) : '\u00b7') : '?',
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
                        .map((entry) => `${rewardItemName(entry.itemId)} x${entry.quantity}`)
                        .join('  \u00b7  ')
                    : 'Nothing yet.',
              }),
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-footer',
        children: jsx('button', {
          className: 'move-panel-btn confirm',
          onClick: collect,
          children:
            found.length > 0
              ? `COLLECT & LEAVE (${found.length})`
              : finished
                ? 'LEAVE EMPTY-HANDED'
                : 'LEAVE (FORFEIT DIGS)',
        }),
      }),
    ],
  })
}
