// Kanto Game Corner slots, played as a full-stage scene while the reducer is in
// the `gameCorner` phase. It is a 3x3 Pokemon slot machine with eight winning
// lines (3 rows, 3 columns, 2 diagonals). Each spin costs money and pays out
// through the generic minigame fee/reward actions; reels fake-spin and stop one
// at a time before any lines are scored.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import {
  SLOT_PAYLINES,
  SLOT_REELS,
  SLOT_ROWS,
  SLOT_SPIN_COST,
  SLOT_SYMBOLS,
  rollSlotSymbol,
  spinSlots,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

/** A fresh random grid (also used to seed the idle display). */
function randomGrid() {
  return Array.from({ length: SLOT_ROWS }, () =>
    Array.from({ length: SLOT_REELS }, () => rollSlotSymbol())
  )
}

export function GameCornerScene() {
  const { state, dispatch } = useGame(),
    speed = state.speed || 1,
    [grid, setGrid] = React.useState(randomGrid),
    [spinningReels, setSpinningReels] = React.useState(
      () => /** @type {boolean[]} */ (Array(SLOT_REELS).fill(false))
    ),
    [winningLines, setWinningLines] = React.useState(() => /** @type {number[]} */ ([])),
    [lastResult, setLastResult] = React.useState(
      () =>
        /** @type {{ payout: number, jackpot: boolean, lineCount: number } | null} */ (null)
    ),
    timers = React.useRef(/** @type {ReturnType<typeof setTimeout>[]} */ ([]))

  const spinning = spinningReels.some(Boolean),
    canSpin = !spinning && state.money >= SLOT_SPIN_COST,
    winningCells = React.useMemo(() => {
      const cells = new Set()
      for (const lineIndex of winningLines)
        for (const [row, col] of SLOT_PAYLINES[lineIndex]) cells.add(`${row},${col}`)
      return cells
    }, [winningLines])

  // Clear any pending stop timers if the scene closes mid-spin.
  React.useEffect(() => () => timers.current.forEach((timer) => clearTimeout(timer)), [])

  // Fake spin: keep re-rolling every reel that hasn't locked in yet.
  React.useEffect(() => {
    if (!spinning) return
    const interval = setInterval(
      () =>
        setGrid((current) =>
          current.map((row, rowIndex) =>
            row.map((symbol, colIndex) =>
              spinningReels[colIndex] ? rollSlotSymbol() : symbol
            )
          )
        ),
      Math.max(28, 70 / speed)
    )
    return () => clearInterval(interval)
  }, [spinning, spinningReels, speed])

  function spin() {
    if (!canSpin) return
    timers.current.forEach((timer) => clearTimeout(timer))
    timers.current = []
    const result = spinSlots()
    setLastResult(null)
    setWinningLines([])
    setSpinningReels(Array(SLOT_REELS).fill(true))
    dispatch({ type: 'PAY_MINIGAME_FEE', payload: { amount: SLOT_SPIN_COST } })
    const stopAt = [520, 860, 1220].map((ms) => ms / speed)
    stopAt.forEach((delay, col) => {
      timers.current.push(
        setTimeout(() => {
          setGrid((current) =>
            current.map((row, rowIndex) =>
              row.map((symbol, colIndex) =>
                colIndex === col ? result.grid[rowIndex][col] : symbol
              )
            )
          )
          setSpinningReels((current) =>
            current.map((isSpinning, colIndex) => (colIndex === col ? false : isSpinning))
          )
        }, delay)
      )
    })
    timers.current.push(
      setTimeout(
        () => {
          setWinningLines(result.wins.map((win) => win.lineIndex))
          setLastResult({
            payout: result.payout,
            jackpot: result.jackpot,
            lineCount: result.wins.length,
          })
          if (result.payout > 0)
            dispatch({
              type: 'CLAIM_MINIGAME_REWARD',
              payload: { money: result.payout, items: [] },
            })
        },
        stopAt[stopAt.length - 1] + 120 / speed
      )
    )
  }

  function leave() {
    if (spinning) return
    dispatch({ type: 'END_MINIGAME' })
  }

  const message = spinning
    ? 'Spinning\u2026'
    : lastResult
      ? lastResult.payout > 0
        ? `${lastResult.lineCount} line${lastResult.lineCount === 1 ? '' : 's'}! You won $${lastResult.payout.toLocaleString()}.${
            lastResult.jackpot ? ' JACKPOT!' : ''
          }`
        : 'No line this time.'
      : 'Match three along any of the 8 lines to win.'

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
            className: 'slot-machine',
            children: Array.from({ length: SLOT_REELS }, (_, col) =>
              jsx(
                'div',
                {
                  className: `slot-reel${spinningReels[col] ? ' spinning' : ''}`,
                  children: Array.from({ length: SLOT_ROWS }, (_, row) => {
                    const symbol = grid[row][col],
                      species = pokemonSpecies[symbol.speciesKey]
                    return jsx(
                      'div',
                      {
                        className: `slot-cell${
                          winningCells.has(`${row},${col}`) ? ' win' : ''
                        }`,
                        title: symbol.name,
                        children: jsx('img', {
                          className: 'slot-sprite',
                          src: getPokemonSpriteUrl(species?.id ?? 0),
                          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                            (event.target.src = getPokemonSpriteFallbackUrl(species?.id ?? 0)),
                          alt: symbol.name,
                        }),
                      },
                      row
                    )
                  }),
                },
                col
              )
            ),
          }),
          jsx('div', {
            className: 'game-corner-result',
            children: message,
          }),
          jsx('div', {
            className: 'game-corner-table',
            children: SLOT_SYMBOLS.map((symbol) => {
              const species = pokemonSpecies[symbol.speciesKey]
              return jsxs(
                'span',
                {
                  className: 'game-corner-payout',
                  title: `Three ${symbol.name}s \u00b7 $${(
                    symbol.payout * SLOT_SPIN_COST
                  ).toLocaleString()}`,
                  children: [
                    jsx('img', {
                      className: 'game-corner-payout-sprite',
                      src: getPokemonSpriteUrl(species?.id ?? 0),
                      alt: symbol.name,
                    }),
                    jsx('span', {
                      children: (symbol.payout * SLOT_SPIN_COST).toLocaleString(),
                    }),
                  ],
                },
                symbol.id
              )
            }),
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          jsx('button', {
            className: 'move-panel-btn cancel',
            disabled: spinning,
            onClick: leave,
            children: 'LEAVE',
          }),
          jsx('button', {
            className: 'move-panel-btn confirm',
            disabled: !canSpin,
            onClick: spin,
            children: spinning
              ? 'SPINNING\u2026'
              : state.money < SLOT_SPIN_COST
                ? 'NOT ENOUGH MONEY'
                : `SPIN ($${SLOT_SPIN_COST.toLocaleString()})`,
          }),
        ],
      }),
    ],
  })
}
