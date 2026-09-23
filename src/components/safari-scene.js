// Kanto Safari Zone, played as a full-stage scene while the reducer is in the
// `safari` phase. A limited number of free Safari Balls: Bait calms a Pokemon
// but lowers catch odds, a Rock raises catch odds but spooks it. Successful
// catches use CATCH_POKEMON; the scene ends with END_SAFARI.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { genderSymbol } from '../game/breeding.js'
import { useGame } from '../game/context.js'
import {
  SAFARI_BALL,
  SAFARI_BALLS,
  applySafariAction,
  rollSafariPokemon,
  safariFlees,
  safariThrowsBall,
  tickSafariEffects,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { PokeballIcon } from './pokeball-icon.js'

/** @typedef {ReturnType<typeof rollSafariPokemon>} SafariPokemon */

export function SafariScene() {
  const { state, dispatch } = useGame(),
    [pokemon, setPokemon] = React.useState(/** @type {SafariPokemon | null} */ (null)),
    [phase, setPhase] = React.useState(
      /** @type {'ready' | 'encounter' | 'throwing' | 'result' | 'done'} */ ('ready')
    ),
    [ballsLeft, setBallsLeft] = React.useState(SAFARI_BALLS),
    [caught, setCaught] = React.useState(/** @type {SafariPokemon[]} */ ([])),
    [modifiers, setModifiers] = React.useState(
      /** @type {{ baited?: number, rocked?: number }} */ ({})
    ),
    [outcome, setOutcome] = React.useState(/** @type {'caught' | 'fled' | 'ran' | null} */ (null)),
    [message, setMessage] = React.useState(
      `Welcome to the Safari Zone! ${SAFARI_BALLS} Safari Balls \u2014 good luck.`
    )

  function search() {
    if (ballsLeft <= 0) {
      setPhase('done')
      return
    }
    const nextPokemon = rollSafariPokemon()
    setPokemon(nextPokemon)
    setModifiers({})
    setOutcome(null)
    setPhase('encounter')
    setMessage(
      `A wild ${pokemonSpecies[nextPokemon.speciesKey]?.name ?? nextPokemon.speciesKey} appeared!`
    )
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
          dispatch({
            type: 'CATCH_POKEMON',
            payload: { speciesKey: pokemon.speciesKey, level: pokemon.level, gender: pokemon.gender },
          })
          dispatch({ type: 'MARK_CAUGHT', payload: { speciesKey: pokemon.speciesKey } })
          setCaught((current) => [...current, pokemon])
          setOutcome('caught')
          setMessage(`Gotcha! ${name} was caught!`)
          setPhase('result')
          return
        }
        if (safariFlees(pokemon.speciesKey, modifiers)) {
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
    setOutcome('ran')
    setMessage('You backed away slowly.')
    setPhase('result')
  }

  function next() {
    if (ballsLeft <= 0) setPhase('done')
    else search()
  }

  const species = pokemon ? pokemonSpecies[pokemon.speciesKey] : null,
    name = species?.name ?? pokemon?.speciesKey ?? '',
    baited = (modifiers.baited ?? 0) > 0,
    rocked = (modifiers.rocked ?? 0) > 0

  return jsxs('div', {
    className: 'safari-scene',
    children: [
      jsx('div', { className: 'safari-bg' }),
      jsxs('div', {
        className: 'safari-topbar',
        children: [
          jsx('span', { className: 'safari-heading', children: 'Safari Zone' }),
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
            : pokemon
              ? jsxs('div', {
                  className: `safari-pokemon${phase === 'throwing' ? ' throwing' : ''}`,
                  children: [
                    jsx('img', {
                      className: 'safari-sprite',
                      src: getPokemonSpriteUrl(species?.id ?? 0, !1, !1, pokemon.gender === 'female'),
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
                          children: [`Lv.${pokemon.level}`, ' \u00b7 ', genderSymbol(pokemon.gender)],
                        }),
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
              phase === 'ready'
                ? jsx('button', {
                    className: 'move-panel-btn confirm',
                    onClick: search,
                    children: 'SEARCH FOR POKEMON',
                  })
                : phase === 'encounter'
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
                    ]
                  : phase === 'throwing'
                    ? jsx('button', {
                        className: 'move-panel-btn confirm disabled',
                        disabled: !0,
                        children: 'THROWING\u2026',
                      })
                    : phase === 'result'
                      ? jsx('button', {
                          className: 'move-panel-btn confirm',
                          onClick: next,
                          children: ballsLeft <= 0 ? 'FINISH' : 'SEARCH AGAIN',
                        })
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
