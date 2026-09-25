// Shared "what did I win?" screen for the minigames. Every minigame that pays
// out money or items renders this once its run ends, so the player always sees
// an itemised reward before the payout is claimed. `onCollect` is responsible
// for dispatching the claim (and ending the minigame); scenes guard it with a
// ref so the reward can never be granted twice.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { rewardItemName } from '../game/minigames.js'
import { ItemIcon, hasItemIcon } from './item-icon.js'

/**
 * @param {{
 *   prize?: { money?: number, items?: { itemId: string, quantity: number }[], label?: string } | null,
 *   summary?: React.ReactNode,
 *   itemName?: (itemId: string) => string,
 *   onCollect: () => void,
 *   buttonLabel?: string,
 * }} props
 */
export function MinigameRewardScreen({
  prize,
  summary,
  itemName = rewardItemName,
  onCollect,
  buttonLabel,
}) {
  const money = prize?.money ?? 0,
    items = prize?.items ?? [],
    hasReward = money !== 0 || items.length > 0
  return jsxs('div', {
    className: 'minigame-reward',
    children: [
      jsx('div', { className: 'minigame-reward-rays' }),
      jsxs('div', {
        className: 'minigame-reward-panel',
        children: [
          jsx('span', { className: 'minigame-reward-badge', children: '🏆' }),
          jsx('span', {
            className: 'minigame-reward-title',
            children: hasReward ? 'Rewards' : 'No Prize',
          }),
          prize?.label &&
            jsx('span', { className: 'minigame-reward-label', children: prize.label }),
          summary,
          jsxs('div', {
            className: 'minigame-reward-list',
            children: [
              money !== 0 &&
                jsxs(
                  'div',
                  {
                    className: 'minigame-reward-row money',
                    style: { animationDelay: '0.05s' },
                    children: [
                      jsx('span', { className: 'minigame-reward-icon', children: '💰' }),
                      jsx('span', {
                        className: 'minigame-reward-name',
                        children: money > 0 ? 'Money' : 'Spent',
                      }),
                      jsx('span', {
                        className: 'minigame-reward-qty',
                        children: `${money > 0 ? '+' : '\u2212'}$${Math.abs(money).toLocaleString()}`,
                      }),
                    ],
                  },
                  'money'
                ),
              ...items.map((item, index) =>
                jsxs(
                  'div',
                  {
                    className: 'minigame-reward-row',
                    style: { animationDelay: `${0.12 + index * 0.1}s` },
                    children: [
                      jsx('span', {
                        className: 'minigame-reward-icon',
                        children: hasItemIcon(item.itemId)
                          ? jsx(ItemIcon, { itemId: item.itemId, size: 20 })
                          : '\u{1f381}',
                      }),
                      jsx('span', {
                        className: 'minigame-reward-name',
                        children: itemName(item.itemId),
                      }),
                      item.quantity > 1 &&
                        jsx('span', {
                          className: 'minigame-reward-qty',
                          children: `\u00d7${item.quantity}`,
                        }),
                    ],
                  },
                  `${item.itemId}-${index}`
                )
              ),
              !hasReward &&
                jsx('span', {
                  className: 'minigame-reward-empty',
                  children: 'Nothing this time.',
                }),
            ],
          }),
          jsx('button', {
            className: 'move-panel-btn confirm minigame-reward-btn',
            onClick: onCollect,
            children: buttonLabel ?? (hasReward ? 'COLLECT' : 'CONTINUE'),
          }),
        ],
      }),
    ],
  })
}

/**
 * Claim-once helper. Returns a callback that dispatches an optional `claim`
 * action and then the `endAction`, but only ever fires once, so a double click
 * (or React strict-mode double-invocation) can't duplicate the payout.
 * @param {(action: GameAction) => void} dispatch
 * @returns {(endAction: GameAction, claim?: GameAction | null) => void}
 */
export function useMinigameClaim(dispatch) {
  const doneRef = React.useRef(false)
  return React.useCallback(
    (endAction, claim) => {
      if (doneRef.current) return
      doneRef.current = true
      if (claim) dispatch(claim)
      dispatch(endAction)
    },
    [dispatch]
  )
}
