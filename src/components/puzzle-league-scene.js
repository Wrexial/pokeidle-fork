// Johto's Pokemon Puzzle League, played as a full-stage scene while the reducer
// is in the `puzzleLeague` phase. Swap adjacent tiles to line up three or more;
// cleared tiles cascade for a bigger score. Tiles carry a stable id so the scene
// can slide a swap, pop the cleared tiles and drop the replacements in.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { getPokemonSpriteFallbackUrl } from '../game/pokemon.js'
import {
  MATCH3_MOVES,
  MATCH3_SIZE,
  MATCH3_SPECIES,
  createMatch3Board,
  match3Prize,
  match3SwapFrames,
} from '../game/minigames.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** How long the swap slide, the clear pop and a cascade fall play for (ms). */
const SWAP_MS = 170
const CLEAR_MS = 200
const FALL_MS = 300

/** @param {number} ms */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function PuzzleLeagueScene() {
  const { state, dispatch } = useGame(),
    idRef = React.useRef(1),
    [tiles, setTiles] = React.useState(() => createMatch3Board().map((type) => makeTile(type))),
    [score, setScore] = React.useState(0),
    [moves, setMoves] = React.useState(MATCH3_MOVES),
    [selected, setSelected] = React.useState(-1),
    [busy, setBusy] = React.useState(false),
    [clearing, setClearing] = React.useState(/** @type {Set<number> | null} */ (null)),
    [message, setMessage] = React.useState('Swap two adjacent tiles to line up three.'),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof match3Prize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch)

  const done = prize !== null

  /** @param {string} type @param {boolean} [isNew] */
  function makeTile(type, isNew = false) {
    return { id: idRef.current++, type, isNew }
  }

  /** @param {string} type */
  function spriteFor(type) {
    const speciesKey = MATCH3_SPECIES[type],
      id = speciesKey ? pokemonSpecies[speciesKey]?.id : null
    return id ? getPokemonSpriteFallbackUrl(id) : null
  }

  /**
   * The next board after a cascade: survivors keep their tile (so React slides
   * them down) and the vacated top slots get freshly dropped tiles.
   * @param {{ id: number, type: string, isNew: boolean }[]} previous
   * @param {{ board: string[], cleared: number[] }} frame
   */
  function applyFrame(previous, frame) {
    const size = MATCH3_SIZE,
      cleared = new Set(frame.cleared),
      next = /** @type {{ id: number, type: string, isNew: boolean }[]} */ (new Array(size * size))
    for (let col = 0; col < size; col++) {
      const survivors = []
      for (let row = 0; row < size; row++) {
        const index = row * size + col
        if (!cleared.has(index)) survivors.push(previous[index])
      }
      const newCount = size - survivors.length
      for (let row = 0; row < size; row++) {
        const index = row * size + col
        next[index] =
          row < newCount ? makeTile(frame.board[index], true) : survivors[row - newCount]
      }
    }
    return next
  }

  /** @param {number} a @param {number} b */
  async function runSwap(a, b) {
    const result = match3SwapFrames(
      tiles.map((tile) => tile.type),
      a,
      b
    )
    setSelected(-1)
    if (!result.valid) {
      if (state.sfxEnabled) playSfx('miss')
      setMessage('No match there \u2014 try another swap.')
      return
    }
    setBusy(true)
    // Slide the two tiles into each other's slots first, then resolve.
    const swapped = [...tiles]
    ;[swapped[a], swapped[b]] = [swapped[b], swapped[a]]
    setTiles(swapped)
    if (state.sfxEnabled) playSfx('tap')
    await wait(SWAP_MS)
    let current = swapped
    for (const frame of result.frames) {
      setClearing(new Set(frame.cleared))
      if (state.sfxEnabled) playSfx(frame.cascade > 1 ? 'combo' : 'good')
      await wait(CLEAR_MS)
      const next = applyFrame(current, frame)
      setClearing(null)
      setTiles(next)
      current = next
      await wait(FALL_MS)
    }
    const nextScore = score + result.score,
      nextMoves = moves - 1
    setScore(nextScore)
    setMoves(nextMoves)
    setMessage(
      `+${result.score}${result.cascade > 1 ? ` \u00b7 ${result.cascade}x cascade!` : ''}`
    )
    setBusy(false)
    if (nextMoves <= 0) setPrize(match3Prize(nextScore))
  }

  /** @param {number} index */
  function click(index) {
    if (done || busy) return
    if (selected === -1) {
      setSelected(index)
      return
    }
    if (selected === index) {
      setSelected(-1)
      return
    }
    const rowA = Math.floor(selected / MATCH3_SIZE),
      colA = selected % MATCH3_SIZE,
      rowB = Math.floor(index / MATCH3_SIZE),
      colB = index % MATCH3_SIZE
    if (Math.abs(rowA - rowB) + Math.abs(colA - colB) !== 1) {
      setSelected(index)
      return
    }
    runSwap(selected, index)
  }

  function leave() {
    collect(
      { type: 'END_MINIGAME', payload: { score, completed: !!prize } },
      prize ? { type: 'CLAIM_MINIGAME_REWARD', payload: prize } : null
    )
  }

  return jsxs('div', {
    className: 'minigame-scene puzzle-league-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Puzzle League' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [`Score ${score}`, ' \u00b7 ', `Moves ${moves}`],
          }),
        ],
      }),
      jsxs('div', {
        className: 'minigame-scene-body',
        children: done
          ? [jsx(MinigameRewardScreen, {
              prize,
              onCollect: leave,
              summary: jsx('span', {
                className: 'puzzle-solved',
                children: `Score ${score}`,
              }),
            })]
          : [
              jsx('div', {
                className: 'match3-grid',
                style: { '--cols': String(MATCH3_SIZE) },
                children: tiles.map((tile, index) => {
                  const row = Math.floor(index / MATCH3_SIZE),
                    col = index % MATCH3_SIZE,
                    sprite = spriteFor(tile.type)
                  return jsx(
                    'button',
                    {
                      className: `match3-tile match3-${tile.type.toLowerCase()}${
                        selected === index ? ' selected' : ''
                      }${tile.isNew ? ' new' : ''}${clearing?.has(index) ? ' clearing' : ''}`,
                      style: { '--col': col, '--row': row },
                      disabled: busy || done,
                      onClick: () => click(index),
                      'aria-label': `${tile.type} tile`,
                      children: jsx('span', {
                        className: 'match3-tile-inner',
                        children: sprite
                          ? jsx('img', {
                              src: sprite,
                              alt: '',
                              draggable: false,
                            })
                          : null,
                      }),
                    },
                    tile.id
                  )
                }),
              }),
              jsx('div', { className: 'minigame-scene-log', children: message }),
            ],
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          !done &&
            jsx('button', {
              className: 'move-panel-btn cancel',
              disabled: busy,
              onClick: leave,
              children: 'LEAVE',
            }),
        ],
      }),
    ],
  })
}
