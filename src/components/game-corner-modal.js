// Kanto Game Corner slots minigame. Each spin costs money; matching all three
// reels pays a multiple. The cost and payout are dispatched through the generic
// minigame fee/reward actions.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { SLOT_SPIN_COST, SLOT_SYMBOLS, spinSlots } from '../game/minigames.js'

/** @param {{ onClose: () => void }} props */
export function GameCornerModal({ onClose }) {
  const { state, dispatch } = useGame(),
    [reels, setReels] = React.useState(() => [SLOT_SYMBOLS[0], SLOT_SYMBOLS[1], SLOT_SYMBOLS[2]]),
    [lastPayout, setLastPayout] = React.useState(0),
    [spinCount, setSpinCount] = React.useState(0)
  function spin() {
    if (state.money < SLOT_SPIN_COST) return
    const result = spinSlots()
    setReels(result.reels)
    setLastPayout(result.payout)
    setSpinCount((count) => count + 1)
    dispatch({
      type: 'PAY_MINIGAME_FEE',
      payload: {
        amount: SLOT_SPIN_COST,
      },
    })
    if (result.payout > 0)
      dispatch({
        type: 'CLAIM_MINIGAME_REWARD',
        payload: {
          money: result.payout,
          items: [],
        },
      })
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
              children: 'Game Corner',
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
            jsx('div', {
              className: `game-corner-reels${lastPayout > 0 ? ' win' : ''}`,
              key: spinCount,
              children: reels.map((symbol, index) =>
                jsx(
                  'span',
                  {
                    className: 'game-corner-reel',
                    children: symbol.icon,
                  },
                  index
                )
              ),
            }),
            jsx('div', {
              className: 'game-corner-result',
              children:
                lastPayout > 0
                  ? `Three ${reels[0].name}s! You won $${lastPayout.toLocaleString()}.`
                  : spinCount > 0
                    ? 'No match this time.'
                    : 'Match all three reels to win.',
            }),
            jsx('button', {
              className: 'stats-panel-trade-btn',
              disabled: state.money < SLOT_SPIN_COST,
              onClick: spin,
              children:
                state.money < SLOT_SPIN_COST
                  ? 'NOT ENOUGH MONEY'
                  : `SPIN ($${SLOT_SPIN_COST.toLocaleString()})`,
            }),
            jsx('div', {
              className: 'game-corner-table',
              children: SLOT_SYMBOLS.map((symbol) =>
                jsx(
                  'span',
                  {
                    className: 'game-corner-payout',
                    title: `Three ${symbol.name}s`,
                    children: `${symbol.icon}${symbol.icon}${symbol.icon} = ${(
                      symbol.payout * SLOT_SPIN_COST
                    ).toLocaleString()}`,
                  },
                  symbol.id
                )
              ),
            }),
          ],
        }),
      ],
    }),
  })
}
