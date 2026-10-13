// Hide-and-seek spots: any wild route can hide a rare Pokemon behind a glyph.
// Played as a full-stage scene while the reducer is in the `hideAndSeek` phase,
// reusing the Unown Picross nonogram for the reveal, then offering the flushed
// out Pokemon as a manual encounter (like the Picnic). The spot is day-seeded
// (see game/minigames/hide-and-seek.js) and the route is marked searched when
// the scene opens, so a reload can't reroll the find.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { completedGenerations, mapData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { createBattlePokemon } from '../game/combat.js'
import {
  HIDE_AND_SEEK_SHINY_MULTIPLIER,
  UNOWN_PICROSS_SIZE,
  hideAndSeekPuzzle,
  hideAndSeekSpot,
  picrossMatches,
  picrossWrongFills,
} from '../game/minigames.js'
import { checkShinyOdds, shinyOddsForSpecies } from '../game/progression.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

export function HideAndSeekScene() {
  const { state, dispatch } = useGame(),
    routeKey = mapData[state.currentLocation]?.routeKey ?? state.currentRoute,
    [spot] = React.useState(() => hideAndSeekSpot(routeKey)),
    [puzzle] = React.useState(() => hideAndSeekPuzzle(routeKey)),
    [cells, setCells] = React.useState(() =>
      Array.from({ length: UNOWN_PICROSS_SIZE }, () => Array(UNOWN_PICROSS_SIZE).fill(0))
    ),
    [wrongFills, setWrongFills] = React.useState(0),
    [pending, setPending] = React.useState(
      () =>
        /** @type {{ enemy: any, speciesKey: string, level: number, isShiny: boolean } | null} */ (
          null
        )
    ),
    finishedRef = React.useRef(false)

  /** @param {number} row @param {number} column */
  function toggle(row, column) {
    if (pending) return
    if (state.sfxEnabled) playSfx('tap')
    setCells((previous) =>
      previous.map((line, rowIndex) =>
        rowIndex === row
          ? line.map((value, columnIndex) =>
              columnIndex === column ? (value ? 0 : 1) : value
            )
          : line
      )
    )
    setWrongFills(0)
  }

  function reveal() {
    if (finishedRef.current || !spot) return
    finishedRef.current = true
    const completedGenerationSet = completedGenerations(state.pokedexCaught),
      isShiny = checkShinyOdds(
        Math.max(
          1,
          Math.round(
            shinyOddsForSpecies(spot.speciesKey, completedGenerationSet) /
              HIDE_AND_SEEK_SHINY_MULTIPLIER
          )
        )
      ),
      enemy = createBattlePokemon(spot.speciesKey, spot.level, { isShiny, wild: true })
    // Flags this as an activity find so the battle offers a manual catch.
    enemy.fromActivity = true
    setPending({ enemy, speciesKey: spot.speciesKey, level: spot.level, isShiny })
    if (state.sfxEnabled) playSfx('win')
  }

  function check() {
    if (finishedRef.current || pending) return
    if (picrossMatches(cells, puzzle.solution)) {
      reveal()
      return
    }
    const wrong = picrossWrongFills(cells, puzzle.solution)
    setWrongFills(wrong)
    if (state.sfxEnabled) playSfx('miss')
  }

  function fight() {
    if (!pending) return
    dispatch({ type: 'MARK_SEEN', payload: { speciesKey: pending.speciesKey } })
    dispatch({ type: 'START_ENCOUNTER', payload: { enemy: pending.enemy } })
  }

  function leave() {
    dispatch({ type: 'END_HIDE_AND_SEEK' })
  }

  const routeName = mapData[state.currentLocation]?.name ?? 'the route',
    spawnSpecies = pending ? pokemonSpecies[pending.speciesKey] : null

  return jsxs('div', {
    className: 'minigame-scene unown-picross-scene hide-and-seek-scene',
    children: [
      jsx('div', { className: 'minigame-scene-bg' }),
      jsxs('div', {
        className: 'minigame-scene-header',
        children: [
          jsx('span', { className: 'minigame-scene-title', children: 'Hide-and-Seek' }),
          jsx('span', {
            className: 'minigame-scene-tally',
            children: pending
              ? `${routeName} \u00b7 spot found`
              : `${routeName}${wrongFills > 0 ? ` \u00b7 ${wrongFills} wrong` : ''}`,
          }),
        ],
      }),
      jsx('div', {
        className: 'minigame-scene-body',
        children: !spot
          ? jsx('div', {
              className: 'picnic-failed',
              children: 'Nothing seems to be hiding here today.',
            })
          : pending && spawnSpecies
            ? jsxs('div', {
                className: `picnic-spawn${pending.isShiny ? ' shiny' : ''}`,
                children: [
                  jsx('img', {
                    className: 'picnic-spawn-sprite',
                    src: getPokemonSpriteUrl(spawnSpecies.id, false, pending.isShiny),
                    onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                      (event.target.src = getPokemonSpriteFallbackUrl(
                        spawnSpecies.id,
                        false,
                        pending.isShiny
                      )),
                    alt: spawnSpecies.name,
                  }),
                  jsxs('span', {
                    className: 'picnic-spawn-name',
                    children: [pending.isShiny ? '\u2605 ' : '', spawnSpecies.name],
                  }),
                  jsx('span', {
                    className: 'picnic-spawn-level',
                    children: `Lv.${pending.level}`,
                  }),
                  jsx('div', {
                    className: 'picnic-spawn-types',
                    children: (spawnSpecies.types ?? []).map((type) =>
                      jsx(
                        'span',
                        { className: `type-badge type-${type.toLowerCase()}`, children: type },
                        type
                      )
                    ),
                  }),
                  jsxs('span', {
                    className: 'picnic-spawn-odds',
                    children: [
                      `Shiny odds \u00d7${HIDE_AND_SEEK_SHINY_MULTIPLIER}`,
                      ' \u00b7 ',
                      'cornered!',
                    ],
                  }),
                ],
              })
            : jsxs('div', {
                className: 'picross-play',
                children: [
                  jsxs('div', {
                    className: 'picross-grid',
                    children: [
                      jsx('div', { className: 'picross-corner' }),
                      ...puzzle.colClues.map((clue, column) =>
                        jsx(
                          'div',
                          { className: 'picross-clue col', children: clue.join(' ') },
                          `col-${column}`
                        )
                      ),
                      ...puzzle.rowClues.flatMap((clue, row) => [
                        jsx(
                          'div',
                          { className: 'picross-clue row', children: clue.join(' ') },
                          `row-${row}`
                        ),
                        ...Array.from({ length: UNOWN_PICROSS_SIZE }, (_, column) =>
                          jsx(
                            'button',
                            {
                              className: `picross-cell${cells[row][column] ? ' on' : ''}`,
                              onClick: () => toggle(row, column),
                              'aria-label': `Row ${row + 1} column ${column + 1}`,
                            },
                            `${row}-${column}`
                          )
                        ),
                      ]),
                    ],
                  }),
                  jsx('button', {
                    className: 'move-panel-btn confirm picross-check-btn',
                    onClick: check,
                    children: 'CHECK',
                  }),
                  jsx('div', {
                    className: 'picross-hint',
                    children: 'Numbers give the runs of filled cells in each row and column.',
                  }),
                ],
              }),
      }),
      jsx('div', {
        className: 'minigame-scene-footer',
        children: pending
          ? jsxs('div', {
              className: 'activity-actions',
              children: [
                jsx('button', {
                  className: 'move-panel-btn confirm',
                  onClick: fight,
                  children: 'BATTLE',
                }),
                jsx('button', {
                  className: 'move-panel-btn cancel',
                  onClick: leave,
                  children: 'LET IT GO',
                }),
              ],
            })
          : jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: leave,
              children: spot ? 'LEAVE THE SPOT' : 'CONTINUE',
            }),
      }),
    ],
  })
}
