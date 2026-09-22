// Sinnoh Underground mining minigame — the first region minigame (see
// src/game/minigames.js). The grid/dug state is local; only the collected
// rewards are dispatched to the reducer.
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

/** @param {{ onClose: () => void }} props */
export function MiningModal({ onClose }) {
  const { dispatch } = useGame(),
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
    onClose()
  }
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal mining-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Underground Mining',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'battle-info-content',
          children: [
            jsx('p', {
              className: 'mining-hint',
              children: `Dig for treasures hidden in the wall. You have ${dug.size} / ${MINING_DIGS} digs \u2014 find as much as you can.`,
            }),
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
                found.length > 0
                  ? jsx('span', {
                      className: 'mining-found-list',
                      children: found
                        .map((entry) => `${rewardItemName(entry.itemId)} x${entry.quantity}`)
                        .join('  \u00b7  '),
                    })
                  : jsx('span', {
                      className: 'mining-found-list',
                      children: 'Nothing yet.',
                    }),
              ],
            }),
            jsx('button', {
              className: `stats-panel-trade-btn${found.length === 0 ? ' disabled' : ''}`,
              disabled: found.length === 0,
              onClick: collect,
              children: finished
                ? 'COLLECT & LEAVE'
                : `COLLECT NOW (${found.length} item${found.length === 1 ? '' : 's'})`,
            }),
          ],
        }),
      ],
    }),
  })
}
