// Kalos's Poke Ball Factory, played as a full-stage scene while the reducer is
// in the `pokeballFactory` phase. Tap the conveyor tiles to rotate them until a
// continuous line runs from the left inlet to the right outlet.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  connectionsFor,
  createFactoryPuzzle,
  factoryPowered,
  factoryPrize,
  rotateFactoryTile,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

export function PokeballFactoryScene() {
  const { state, dispatch } = useGame(),
    [puzzle, setPuzzle] = React.useState(() => createFactoryPuzzle()),
    [moves, setMoves] = React.useState(0),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof factoryPrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    powered = React.useMemo(() => factoryPowered(puzzle), [puzzle]),
    outlet = puzzle.outletRow * puzzle.size + (puzzle.size - 1),
    solved =
      powered.has(outlet) &&
      connectionsFor(puzzle.tiles[outlet].type, puzzle.tiles[outlet].rot).includes('E')

  React.useEffect(() => {
    if (solved && !prize) {
      if (state.sfxEnabled) playSfx('win')
      setPrize(factoryPrize(moves, true))
    }
  }, [solved, moves, prize])

  /** @param {number} index */
  function tap(index) {
    if (prize || solved) return
    const tile = puzzle.tiles[index]
    if (!tile || tile.fixed) return
    if (state.sfxEnabled) playSfx('tap')
    setPuzzle(rotateFactoryTile(puzzle, index))
    setMoves(moves + 1)
  }

  function giveUp() {
    if (!prize) setPrize(factoryPrize(moves, false))
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene factory-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Pok\u00e9 Ball Factory' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [`Turns ${moves}`, ' \u00b7 ', solved ? 'Line connected!' : 'Connect the line'],
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children: prize
          ? jsx(MinigameRewardScreen, {
              prize,
              onCollect: leave,
              summary: jsx('span', {
                className: 'factory-summary',
                children: solved ? `Connected in ${moves} turns` : 'Shift abandoned',
              }),
            })
          : jsx('div', {
              className: 'factory-wrap',
              children: jsx('div', {
                className: 'factory-grid',
                style: { gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` },
                children: puzzle.tiles.map((tile, index) => {
                  const isPowered = powered.has(index),
                    row = Math.floor(index / puzzle.size),
                    col = index % puzzle.size
                  return jsx(
                    'button',
                    {
                      className: `factory-tile${isPowered ? ' powered' : ''}${tile.type === 'empty' ? ' empty' : ''}${row === puzzle.inletRow && col === 0 ? ' inlet' : ''}${index === outlet ? ' outlet' : ''}`,
                      onClick: () => tap(index),
                      disabled: !!prize,
                      'aria-label': `Rotate tile ${row + 1}-${col + 1}`,
                      children: connectionsFor(tile.type, tile.rot).map((direction) =>
                        jsx('span', { className: `factory-arm arm-${direction}` })
                      ),
                    },
                    index
                  )
                }),
              }),
            }),
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          !prize &&
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: giveUp,
              children: 'GIVE UP',
            }),
        ],
      }),
    ],
  })
}
