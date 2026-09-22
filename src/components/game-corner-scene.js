// Kanto Game Corner slots, played as a full-stage scene while the reducer is in
// the `gameCorner` phase. Each spin costs money and matching all three reels
// pays a multiple, spent/earned through the generic minigame fee/reward actions.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { SLOT_SPIN_COST, SLOT_SYMBOLS, spinSlots } from '../game/minigames.js'

export function GameCornerScene() {
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

  return jsxs('div', {
    className: 'minigame-scene game-corner-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', {
            className: 'minigame-scene-title',
            children: 'Game Corner',
          }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: `$${state.money.toLocaleString()}`,
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
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
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          jsx('button', {
            className: 'move-panel-btn cancel',
            onClick: () => dispatch({ type: 'END_MINIGAME' }),
            children: 'LEAVE',
          }),
          jsx('button', {
            className: 'move-panel-btn confirm',
            disabled: state.money < SLOT_SPIN_COST,
            onClick: spin,
            children:
              state.money < SLOT_SPIN_COST
                ? 'NOT ENOUGH MONEY'
                : `SPIN ($${SLOT_SPIN_COST.toLocaleString()})`,
          }),
        ],
      }),
    ],
  })
}
