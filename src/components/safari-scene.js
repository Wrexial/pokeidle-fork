// Kanto Safari Zone, played as a full-stage scene while the reducer is in the
// `safari` phase. The reserve is split into four subsections, each with its own
// Pokemon distribution, so a hunter can pick the area that carries the rare
// species they are after. Bait calms a Pokemon but lowers catch odds, a Rock
// raises catch odds but spooks it. Successful catches use CATCH_POKEMON; the
// scene ends with END_SAFARI.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { completedGenerations, pokemonSpecies } from '../data/gameData.js'
import { genderSymbol } from '../game/breeding.js'
import { useGame } from '../game/context.js'
import { playSfx } from '../game/audio.js'
import { checkShinyOdds, shinyOddsForSpecies } from '../game/progression.js'
import {
  SAFARI_AREAS,
  SAFARI_BALL,
  SAFARI_BALLS,
  SAFARI_SHINY_MULTIPLIER,
  applySafariAction,
  rollSafariPokemon,
  safariAreaById,
  safariFlees,
  safariThrowsBall,
  tickSafariEffects,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { PokeballIcon } from './pokeball-icon.js'

/** @typedef {ReturnType<typeof rollSafariPokemon> & { isShiny?: boolean }} SafariPokemon */

/**
 * A tiny readable sprite for an area's headline finds.
 * @param {{ speciesKey: string }} props
 */
function RareFind({ speciesKey }) {
  const species = pokemonSpecies[speciesKey]
  return jsxs('span', {
    className: 'safari-area-rare',
    children: [
      jsx('img', {
        className: 'safari-area-rare-sprite',
        src: getPokemonSpriteUrl(species?.id ?? 0),
        onError: /** @param {React.SyntheticEvent} event */ (event) => {
          const image = /** @type {HTMLImageElement} */ (event.target)
          image.src = getPokemonSpriteFallbackUrl(species?.id ?? 0)
        },
        alt: species?.name ?? speciesKey,
      }),
      jsx('span', { children: species?.name ?? speciesKey }),
    ],
  })
}

export function SafariScene() {
  const { state, dispatch } = useGame(),
    [pokemon, setPokemon] = React.useState(/** @type {SafariPokemon | null} */ (null)),
    [areaId, setAreaId] = React.useState(/** @type {string | null} */ (null)),
    [phase, setPhase] = React.useState(
      /** @type {'areas' | 'encounter' | 'throwing' | 'result' | 'done'} */ ('areas')
    ),
    [ballsLeft, setBallsLeft] = React.useState(SAFARI_BALLS),
    [caught, setCaught] = React.useState(/** @type {SafariPokemon[]} */ ([])),
    [modifiers, setModifiers] = React.useState(
      /** @type {{ baited?: number, rocked?: number }} */ ({})
    ),
    [outcome, setOutcome] = React.useState(/** @type {'caught' | 'fled' | null} */ (null)),
    [message, setMessage] = React.useState(
      `Welcome to the Safari Zone! ${SAFARI_BALLS} Safari Balls \u2014 pick an area to explore.`
    )

  /** @param {string} nextAreaId */
  function search(nextAreaId) {
    if (ballsLeft <= 0) {
      setPhase('done')
      return
    }
    const nextPokemon = rollSafariPokemon(nextAreaId, state.challengeMonotype),
      completedGenerationSet = completedGenerations(state.pokedexCaught),
      isShiny = checkShinyOdds(
        Math.max(
          1,
          Math.round(
            shinyOddsForSpecies(nextPokemon.speciesKey, completedGenerationSet) /
              SAFARI_SHINY_MULTIPLIER
          )
        )
      )
    setAreaId(nextAreaId)
    setPokemon({ ...nextPokemon, isShiny })
    setModifiers({})
    setOutcome(null)
    setPhase('encounter')
    const foundName = pokemonSpecies[nextPokemon.speciesKey]?.name ?? nextPokemon.speciesKey
    setMessage(isShiny ? `A shiny wild ${foundName} appeared!` : `A wild ${foundName} appeared!`)
    dispatch({ type: 'MARK_SEEN', payload: { speciesKey: nextPokemon.speciesKey } })
  }

  // Resolve a Safari Ball throw after a short animation. Kept in an effect so
  // the timer is cleared if the scene closes mid-throw.
  React.useEffect(() => {
    if (phase !== 'throwing' || !pokemon) return
    const name = pokemonSpecies[pokemon.speciesKey]?.name ?? pokemon.speciesKey
    const timer = setTimeout(
      () => {
        if (safariThrowsBall(pokemon.speciesKey, modifiers)) {
          if (state.sfxEnabled) playSfx('catch')
          dispatch({
            type: 'CATCH_POKEMON',
            payload: {
              speciesKey: pokemon.speciesKey,
              level: pokemon.level,
              gender: pokemon.gender,
              isShiny: pokemon.isShiny,
            },
          })
          dispatch({ type: 'MARK_CAUGHT', payload: { speciesKey: pokemon.speciesKey } })
          setCaught((current) => [...current, pokemon])
          setOutcome('caught')
          setMessage(`Gotcha! ${name} was caught!`)
          setPhase('result')
          return
        }
        if (safariFlees(pokemon.speciesKey, modifiers)) {
          if (state.sfxEnabled) playSfx('miss')
          setOutcome('fled')
          setMessage(`${name} broke free and fled!`)
          setPhase('result')
          return
        }
        setMessage(`${name} broke free! Throw another ball?`)
        setModifiers(tickSafariEffects(modifiers))
        setPhase('encounter')
      },
      750 / (state.speed || 1)
    )
    return () => clearTimeout(timer)
  }, [phase, pokemon, modifiers, dispatch, state.speed])

  function throwBall() {
    if (phase !== 'encounter' || !pokemon || ballsLeft <= 0) return
    if (state.sfxEnabled) playSfx('splash')
    setBallsLeft((left) => left - 1)
    setPhase('throwing')
    setMessage('You threw a Safari Ball!')
  }

  /** @param {'bait' | 'rock'} action */
  function toss(action) {
    if (phase !== 'encounter' || !pokemon) return
    const next = applySafariAction(modifiers, action),
      name = pokemonSpecies[pokemon.speciesKey]?.name ?? pokemon.speciesKey,
      actionMessage =
        action === 'bait'
          ? `You tossed some Bait. ${name} looks calmer.`
          : `You threw a Rock. ${name} looks angry!`
    if (safariFlees(pokemon.speciesKey, next)) {
      setOutcome('fled')
      setMessage(`${actionMessage} It fled!`)
      setPhase('result')
      return
    }
    setModifiers(tickSafariEffects(next))
    setMessage(actionMessage)
    setPhase('encounter')
  }

  function runAway() {
    if (phase !== 'encounter' || !pokemon) return
    // Running straight back into the grass saves a click over a result screen.
    search(areaId ?? SAFARI_AREAS[0].id)
  }

  function changeArea() {
    setPokemon(null)
    setOutcome(null)
    setModifiers({})
    setPhase('areas')
    setMessage('Which part of the Safari Zone will you explore?')
  }

  function next() {
    if (ballsLeft <= 0) setPhase('done')
    else search(areaId ?? SAFARI_AREAS[0].id)
  }

  const species = pokemon ? pokemonSpecies[pokemon.speciesKey] : null,
    name = species?.name ?? pokemon?.speciesKey ?? '',
    area = areaId ? safariAreaById(areaId) : null,
    baited = (modifiers.baited ?? 0) > 0,
    rocked = (modifiers.rocked ?? 0) > 0

  return jsxs('div', {
    className: `safari-scene${area ? ` safari-area-${area.id}` : ''}`,
    children: [
      jsx('div', { className: 'safari-bg' }),
      jsxs('div', {
        className: 'safari-topbar',
        children: [
          jsxs('span', {
            className: 'safari-heading',
            children: area ? `Safari Zone \u00b7 ${area.name}` : 'Safari Zone',
          }),
          jsxs('span', {
            className: 'safari-tally',
            children: [
              `${ballsLeft} ball${ballsLeft === 1 ? '' : 's'} left`,
              ' \u00b7 ',
              `${caught.length} caught`,
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'safari-field',
        children:
          phase === 'done'
            ? jsxs('div', {
                className: 'safari-summary',
                children: [
                  jsx('span', { className: 'safari-summary-title', children: 'Safari Over' }),
                  jsx('span', {
                    className: 'safari-summary-note',
                    children:
                      caught.length > 0
                        ? `You caught ${caught.length} Pokemon: ${caught
                            .map((entry) => pokemonSpecies[entry.speciesKey]?.name ?? entry.speciesKey)
                            .join(', ')}.`
                        : 'You did not catch anything this trip.',
                  }),
                ],
              })
            : phase === 'areas'
              ? jsxs('div', {
                  className: 'safari-areas',
                  children: [
                    jsx('span', {
                      className: 'safari-areas-title',
                      children: `Choose an area (${ballsLeft} Safari Ball${ballsLeft === 1 ? '' : 's'})`,
                    }),
                    jsx('div', {
                      className: 'safari-area-grid',
                      children: SAFARI_AREAS.map((entry) =>
                        jsxs(
                          'button',
                          {
                            className: `safari-area safari-area-card-${entry.id}`,
                            onClick: () => search(entry.id),
                            children: [
                              jsx('span', { className: 'safari-area-name', children: entry.name }),
                              jsx('span', {
                                className: 'safari-area-desc',
                                children: entry.description,
                              }),
                              jsx('span', {
                                className: 'safari-area-rares',
                                children: entry.rares.map((speciesKey) =>
                                  jsx(RareFind, { speciesKey }, speciesKey)
                                ),
                              }),
                            ],
                          },
                          entry.id
                        )
                      ),
                    }),
                  ],
                })
              : pokemon
                ? jsxs('div', {
                    className: `safari-pokemon${phase === 'throwing' ? ' throwing' : ''}`,
                    children: [
                      jsx('img', {
                        className: 'safari-sprite',
                        src: getPokemonSpriteUrl(
                          species?.id ?? 0,
                          !1,
                          !1,
                          pokemon.gender === 'female'
                        ),
                        onError: /** @param {React.SyntheticEvent} event */ (event) => {
                          const image = /** @type {HTMLImageElement} */ (event.target)
                          image.src = getPokemonSpriteFallbackUrl(
                            species?.id ?? 0,
                            !1,
                            !1,
                            pokemon.gender === 'female'
                          )
                        },
                        alt: name,
                      }),
                      jsxs('div', {
                        className: 'safari-meta',
                        children: [
                          jsx('span', { className: 'safari-name', children: name }),
                          jsxs('span', {
                            className: 'safari-detail',
                            children: ['Lv.' + pokemon.level, ' \u00b7 ', genderSymbol(pokemon.gender)],
                          }),
                          pokemon.isShiny &&
                            jsx('span', { className: 'safari-shiny', children: '\u2605 SHINY' }),
                          (baited || rocked) &&
                            jsxs('span', {
                              className: 'safari-effects',
                              children: [
                                baited &&
                                  jsx('span', {
                                    className: 'safari-effect baited',
                                    children: `Bait ${modifiers.baited}`,
                                  }),
                                rocked &&
                                  jsx('span', {
                                    className: 'safari-effect rocked',
                                    children: `Rock ${modifiers.rocked}`,
                                  }),
                              ],
                            }),
                        ],
                      }),
                      phase === 'throwing' &&
                        jsx('div', {
                          className: 'safari-ball',
                          children: jsx(PokeballIcon, { ballId: SAFARI_BALL, size: 48 }),
                        }),
                    ],
                  })
                : jsxs('div', {
                    className: 'safari-ready',
                    children: [
                      jsx('span', { className: 'safari-ready-icon', children: '\u{1f33f}' }),
                      jsx('span', {
                        className: 'safari-ready-text',
                        children: 'Tall grass rustles all around. Search it for a Pokemon?',
                      }),
                    ],
                  }),
      }),
      jsxs('div', {
        className: 'safari-lower',
        children: [
          jsx('div', { className: 'safari-text', children: message }),
          jsx('div', {
            className: 'safari-actions',
            children:
              phase === 'encounter'
                ? [
                    jsx('button', {
                      className: 'move-panel-btn confirm',
                      onClick: throwBall,
                      disabled: ballsLeft <= 0,
                      children: `THROW SAFARI BALL (${ballsLeft})`,
                    }),
                    jsx('button', {
                      className: 'move-panel-btn',
                      onClick: () => toss('bait'),
                      children: 'BAIT',
                    }),
                    jsx('button', {
                      className: 'move-panel-btn',
                      onClick: () => toss('rock'),
                      children: 'ROCK',
                    }),
                    jsx('button', {
                      className: 'move-panel-btn cancel',
                      onClick: runAway,
                      children: 'RUN',
                    }),
                    jsx('button', {
                      className: 'move-panel-btn',
                      onClick: changeArea,
                      children: 'CHANGE AREA',
                    }),
                  ]
                : phase === 'throwing'
                  ? jsx('button', {
                      className: 'move-panel-btn confirm disabled',
                      disabled: !0,
                      children: 'THROWING\u2026',
                    })
                  : phase === 'result'
                    ? [
                        jsx('button', {
                          className: 'move-panel-btn confirm',
                          onClick: next,
                          children: ballsLeft <= 0 ? 'FINISH' : 'SEARCH AGAIN',
                        }),
                        jsx('button', {
                          className: 'move-panel-btn',
                          onClick: changeArea,
                          children: 'CHANGE AREA',
                        }),
                      ]
                    : jsx('button', {
                        className: 'move-panel-btn confirm',
                        onClick: () => dispatch({ type: 'END_SAFARI' }),
                        children: 'LEAVE THE SAFARI ZONE',
                      }),
          }),
        ],
      }),
      outcome === 'caught' && jsx('div', { className: 'safari-flash' }),
    ],
  })
}
