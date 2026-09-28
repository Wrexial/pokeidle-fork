// Sinnoh's Snowpoint Temple, played as a full-stage scene while the reducer is
// in the `iceSlide` phase. The temple opens with a Strength chamber -- shove the
// boulder onto the pressure plate to unseal the way -- then drops into the ice
// rooms, where you slide until a wall or boulder stops you. Clear every stage to
// reach the temple's heart.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import {
  ICE_SLIDE_ROOMS,
  ICE_SLIDE_TOTAL_PAR,
  STRENGTH_ROOMS,
  STRENGTH_TOTAL_PAR,
  createStrengthState,
  iceSlidePosition,
  iceSlidePrize,
  iceSlideSolved,
  strengthMove,
  strengthSolved,
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

/** Arrow key -> move direction. @type {Record<string, string>} */
const ARROW_DIRECTIONS = { ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E' }

// The Strength gate comes first, then the ice rooms. Each stage carries the
// parsed room and a mode so the scene knows how the hero moves through it.
const STAGES = [
  ...STRENGTH_ROOMS.map((level) => ({ mode: /** @type {const} */ ('strength'), level })),
  ...ICE_SLIDE_ROOMS.map((room) => ({ mode: /** @type {const} */ ('ice'), room })),
]
const TEMPLE_TOTAL_PAR = STRENGTH_TOTAL_PAR + ICE_SLIDE_TOTAL_PAR

export function IceSlideScene() {
  const { state, dispatch } = useGame(),
    [stageIndex, setStageIndex] = React.useState(0),
    [position, setPosition] = React.useState(() => ICE_SLIDE_ROOMS[0].start),
    [strength, setStrength] = React.useState(() => createStrengthState(STRENGTH_ROOMS[0])),
    [stageMoves, setStageMoves] = React.useState(0),
    [totalMoves, setTotalMoves] = React.useState(0),
    [cleared, setCleared] = React.useState(0),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof iceSlidePrize> | null} */ (null)
    ),
    collect = useMinigameClaim(dispatch),
    stage = STAGES[stageIndex],
    isStrength = stage.mode === 'strength',
    rows = isStrength ? stage.level.rows : stage.room.rows,
    width = isStrength ? stage.level.width : stage.room.width,
    height = isStrength ? stage.level.height : stage.room.height,
    stagePar = isStrength ? stage.level.par : stage.room.par,
    playerIndex = isStrength ? strength.player : position,
    platesCovered =
      isStrength && [...stage.level.plates].every((plate) => strength.blocks.has(plate))

  /**
   * Advance to the next room, or finish the temple when there is none.
   * @param {number} nextMoves Total moves after the winning move.
   */
  function finishStage(nextMoves) {
    const nextCleared = cleared + 1
    if (stageIndex >= STAGES.length - 1) {
      if (state.sfxEnabled) playSfx('win')
      setCleared(nextCleared)
      setPrize(iceSlidePrize(nextCleared, nextMoves, TEMPLE_TOTAL_PAR, true))
      return
    }
    if (state.sfxEnabled) playSfx('good')
    const next = STAGES[stageIndex + 1]
    setCleared(nextCleared)
    setStageIndex(stageIndex + 1)
    setStageMoves(0)
    if (next.mode === 'strength') setStrength(createStrengthState(next.level))
    else setPosition(next.room.start)
  }

  /** @param {string} direction */
  function attempt(direction) {
    if (prize) return
    if (isStrength) {
      const moved = strengthMove(stage.level, strength, direction)
      if (!moved) return
      const nextMoves = totalMoves + 1
      if (state.sfxEnabled) playSfx('tap')
      setTotalMoves(nextMoves)
      setStageMoves(stageMoves + 1)
      setStrength(moved)
      if (strengthSolved(stage.level, moved)) finishStage(nextMoves)
      return
    }
    const landing = iceSlidePosition(stage.room, position, direction)
    if (landing === position) return
    const nextMoves = totalMoves + 1
    if (state.sfxEnabled) playSfx('tap')
    setTotalMoves(nextMoves)
    setStageMoves(stageMoves + 1)
    setPosition(landing)
    if (iceSlideSolved(stage.room, landing)) finishStage(nextMoves)
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
      setPrize(iceSlidePrize(cleared, totalMoves, TEMPLE_TOTAL_PAR, false))
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
              `Room ${stageIndex + 1}/${STAGES.length}`,
              ' \u00b7 ',
              prize
                ? (prize.label ?? '')
                : `${isStrength ? 'Strength \u00b7 pushes' : 'Slides'} ${stageMoves} (par ${stagePar})`,
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
                children: `Cleared ${cleared} of ${STAGES.length} rooms in ${totalMoves} moves`,
              }),
            })
          : jsxs('div', {
              className: 'ice-wrap',
              children: [
                jsx('div', {
                  className: 'ice-grid',
                  style: {
                    gridTemplateColumns: `repeat(${width}, 1fr)`,
                    width: `min(92vw, ${width * 44}px, 330px)`,
                  },
                  children: Array.from({ length: width * height }, (_, index) => {
                    const row = Math.floor(index / width),
                      col = index % width,
                      cell = rows[row][col],
                      block = isStrength && strength.blocks.has(index),
                      onGoal = !isStrength && index === stage.room.goal,
                      onExit = isStrength && index === stage.level.exit,
                      onPlate = isStrength && stage.level.plates.has(index)
                    const classes = [
                      'ice-cell',
                      cell === '#' ? 'wall' : '',
                      !isStrength && cell === 'O' ? 'rock' : '',
                      onGoal ? 'goal' : '',
                      block ? 'block' : '',
                      onPlate ? 'plate' : '',
                      onExit ? `exit${platesCovered ? ' open' : ' locked'}` : '',
                      index === playerIndex ? 'player' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                    return jsx(
                      'div',
                      {
                        className: classes,
                        children:
                          index === playerIndex && species
                            ? jsx('img', {
                                className: 'ice-player-sprite',
                                src: getPokemonSpriteUrl(species.id),
                                onError: /** @param {{ target: HTMLImageElement }} event */ (
                                  event
                                ) => (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                                alt: species.name,
                              })
                            : block
                              ? jsx('span', { className: 'ice-block-mark', children: '\u25a0' })
                              : !isStrength && cell === 'O'
                                ? jsx('span', { className: 'ice-rock-mark', children: '\u2612' })
                                : onGoal
                                  ? jsx('span', { className: 'ice-goal-mark', children: '\u2744' })
                                  : onPlate
                                    ? jsx('span', {
                                        className: 'ice-plate-mark',
                                        children: '\u25ce',
                                      })
                                    : onExit
                                      ? jsx('span', {
                                          className: 'ice-goal-mark',
                                          children: platesCovered ? '\u{1f513}' : '\u{1f512}',
                                        })
                                      : null,
                      },
                      index
                    )
                  }),
                }),
                jsxs('div', {
                  className: 'ice-side',
                  children: [
                    jsx('div', {
                      className: 'ice-controls',
                      children: ARROWS.map(([direction, glyph, label]) =>
                        jsx(
                          'button',
                          {
                            className: `ice-arrow ice-arrow-${direction.toLowerCase()}`,
                            onClick: () => attempt(direction),
                            'aria-label': `Move ${label}`,
                            children: glyph,
                          },
                          direction
                        )
                      ),
                    }),
                    jsx('span', {
                      className: 'ice-hint',
                      children: isStrength
                        ? 'Strength: push the boulder onto the plate to unseal the exit'
                        : 'Slides stop at walls and boulders \u2014 reach the snowflake',
                    }),
                  ],
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
