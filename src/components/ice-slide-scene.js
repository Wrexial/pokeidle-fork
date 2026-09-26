// Sinnoh's Snowpoint Temple, played as a full-stage scene while the reducer is
// in the `iceSlide` phase. Pick a direction and the hero slides until a wall or
// a boulder stops them. Clear every room to reach the temple's heart.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  ICE_SLIDE_ROOMS,
  ICE_SLIDE_TOTAL_PAR,
  iceSlidePosition,
  iceSlidePrize,
  iceSlideSolved,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { MinigameRewardScreen, useMinigameClaim } from './minigame-reward.js'

/** @type {[string, string, string][]} */
const ARROWS = [
  ['N', '\u25b2', 'Up'],
  ['W', '\u25c0', 'Left'],
  ['S', '\u25bc', 'Down'],
  ['E', '\u25b6', 'Right'],
]

/** Arrow key -> slide direction. @type {Record<string, string>} */
const ARROW_DIRECTIONS = { ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E' }

export function IceSlideScene() {
  const { state, dispatch } = useGame(),
    [roomIndex, setRoomIndex] = React.useState(0),
    [position, setPosition] = React.useState(() => ICE_SLIDE_ROOMS[0].start),
    [roomMoves, setRoomMoves] = React.useState(0),
    [totalMoves, setTotalMoves] = React.useState(0),
    [cleared, setCleared] = React.useState(0),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof iceSlidePrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    room = ICE_SLIDE_ROOMS[roomIndex]

  /** @param {string} direction */
  function attempt(direction) {
    if (prize) return
    const landing = iceSlidePosition(room, position, direction)
    if (landing === position) return
    const nextMoves = totalMoves + 1,
      nextRoomMoves = roomMoves + 1
    if (state.sfxEnabled) playSfx('tap')
    setTotalMoves(nextMoves)
    setRoomMoves(nextRoomMoves)
    setPosition(landing)
    if (!iceSlideSolved(room, landing)) return
    // Reached the exit: move on, or finish the temple.
    if (roomIndex >= ICE_SLIDE_ROOMS.length - 1) {
      if (state.sfxEnabled) playSfx('win')
      setCleared(cleared + 1)
      setPrize(iceSlidePrize(cleared + 1, nextMoves, ICE_SLIDE_TOTAL_PAR, true))
    } else {
      if (state.sfxEnabled) playSfx('good')
      const next = ICE_SLIDE_ROOMS[roomIndex + 1]
      setCleared(cleared + 1)
      setRoomIndex(roomIndex + 1)
      setPosition(next.start)
      setRoomMoves(0)
    }
  }

  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    function onKeyDown(event) {
      const direction = ARROW_DIRECTIONS[event.key]
      if (!direction || prize) return
      event.preventDefault()
      attempt(direction)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function leave() {
    if (!prize) {
      setPrize(iceSlidePrize(cleared, totalMoves, ICE_SLIDE_TOTAL_PAR, false))
      return
    }
    collect({ type: 'END_MINIGAME' }, { type: 'CLAIM_MINIGAME_REWARD', payload: prize })
  }

  const lead = state.party[0] ?? state.playerPokemon,
    species = lead ? pokemonSpecies[lead.speciesKey] : null

  return jsxs('div', {
    className: 'minigame-scene ice-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Snowpoint Temple' }),
          jsxs('span', {
            className: 'minigame-scene-tally',
            children: [
              `Room ${roomIndex + 1}/${ICE_SLIDE_ROOMS.length}`,
              ' \u00b7 ',
              prize ? (prize.label ?? '') : `Slides ${roomMoves} (par ${room.par})`,
            ],
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
                className: 'ice-summary',
                children: `Cleared ${cleared} of ${ICE_SLIDE_ROOMS.length} rooms in ${totalMoves} slides`,
              }),
            })
          : jsxs('div', {
              className: 'ice-wrap',
              children: [
                jsx('div', {
                  className: 'ice-grid',
                  style: {
                    gridTemplateColumns: `repeat(${room.width}, 1fr)`,
                    width: `min(92vw, ${room.width * 44}px)`,
                  },
                  children: room.rows.flatMap((row, rowIndex) =>
                    [...row].map((cell, colIndex) => {
                      const index = rowIndex * room.width + colIndex,
                        onGoal = index === room.goal,
                        classes = [
                          'ice-cell',
                          cell === '#' ? 'wall' : '',
                          cell === 'O' ? 'rock' : '',
                          onGoal ? 'goal' : '',
                          index === position ? 'player' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')
                      return jsx(
                        'div',
                        {
                          className: classes,
                          children:
                            index === position && species
                              ? jsx('img', {
                                  className: 'ice-player-sprite',
                                  src: getPokemonSpriteUrl(species.id),
                                  onError: /** @param {{ target: HTMLImageElement }} event */ (
                                    event
                                  ) => (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                                  alt: species.name,
                                })
                              : cell === 'O'
                                ? jsx('span', { className: 'ice-rock-mark', children: '\u2612' })
                                : onGoal
                                  ? jsx('span', { className: 'ice-goal-mark', children: '\u2744' })
                                  : null,
                        },
                        index
                      )
                    })
                  ),
                }),
                jsx('div', {
                  className: 'ice-controls',
                  children: ARROWS.map(([direction, glyph, label]) =>
                    jsx(
                      'button',
                      {
                        className: `ice-arrow ice-arrow-${direction.toLowerCase()}`,
                        onClick: () => attempt(direction),
                        'aria-label': `Slide ${label}`,
                        children: glyph,
                      },
                      direction
                    )
                  ),
                }),
                jsx('span', {
                  className: 'ice-hint',
                  children: 'Slides stop at walls and boulders \u2014 reach the snowflake',
                }),
              ],
            }),
      }),
      jsxs('div', {
        className: 'minigame-scene-footer',
        children: [
          !prize &&
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: leave,
              children: 'GIVE UP',
            }),
        ],
      }),
    ],
  })
}
