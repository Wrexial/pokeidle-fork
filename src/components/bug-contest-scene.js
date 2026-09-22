// Johto Bug Catching Contest, played as a full-stage scene while the reducer
// is in the `bugCatching` phase. Rustle one of three bushes, see which bug
// turns up (its name, level and gender only), then throw a free Net Ball or
// let it go. A miss may spook the bug into fleeing, so the rare catches are a
// gamble. Successful catches are added to the party/box immediately with
// CATCH_POKEMON; the scene ends with END_BUG_CONTEST.
import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { genderSymbol } from '../game/breeding.js'
import { useGame } from '../game/context.js'
import {
  BUG_CONTEST_BUSHES,
  BUG_CONTEST_RUSTLES,
  bugContestPrize,
  bugStays,
  buildContestResults,
  contestPlayerRank,
  rewardItemName,
  rollContestBug,
  throwNetBall,
} from '../game/minigames.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { PokeballIcon } from './pokeball-icon.js'

/**
 * @typedef {ReturnType<typeof rollContestBug>} ContestBug
 */

export function BugContestScene() {
  const { state, dispatch } = useGame(),
    baseLevel = state.playerPokemon?.level ?? 20,
    [step, setStep] = React.useState('bushes'),
    [bug, setBug] = React.useState(/** @type {ContestBug | null} */ (null)),
    [rustlesLeft, setRustlesLeft] = React.useState(BUG_CONTEST_RUSTLES),
    [caught, setCaught] = React.useState(/** @type {ContestBug[]} */ ([])),
    [message, setMessage] = React.useState('Rustle a bush and see what is hiding!'),
    [madeCatch, setMadeCatch] = React.useState(!1),
    [results, setResults] = React.useState(
      () => /** @type {ReturnType<typeof buildContestResults>} */ ([])
    ),
    [prize, setPrize] = React.useState(
      () => /** @type {ReturnType<typeof bugContestPrize> | null} */ (null)
    )

  // Resolve a Net Ball throw after a short animation. Kept in an effect so the
  // timer is cleared if the scene closes mid-throw.
  React.useEffect(() => {
    if (step !== 'throwing' || !bug) return
    const timer = setTimeout(
      () => {
        const species = pokemonSpecies[bug.speciesKey],
          name = species?.name ?? bug.speciesKey
        if (throwNetBall(bug.speciesKey)) {
          dispatch({
            type: 'CATCH_POKEMON',
            payload: { speciesKey: bug.speciesKey, level: bug.level, gender: bug.gender },
          })
          dispatch({ type: 'MARK_CAUGHT', payload: { speciesKey: bug.speciesKey } })
          setCaught((current) => [...current, bug])
          setMadeCatch(!0)
          setMessage(`Gotcha! ${name} was caught!`)
        } else if (bugStays(bug.speciesKey)) {
          setMadeCatch(!1)
          setMessage(`${name} broke free and stayed put. Throw again?`)
          setStep('revealed')
          return
        } else {
          setMadeCatch(!1)
          setMessage(`${name} broke free and scurried into the grass!`)
        }
        setStep('resolved')
      },
      // A touch slower than the game speed so the throw reads clearly.
      750 / (state.speed || 1)
    )
    return () => clearTimeout(timer)
  }, [step, bug, dispatch, state.speed])

  /** @param {number} index */
  function rustleBush(index) {
    if (step !== 'bushes') return
    const nextBug = rollContestBug(baseLevel)
    setBug(nextBug)
    setRustlesLeft((left) => left - 1)
    setStep('revealed')
    setMessage(`Something rustles in bush ${index + 1}\u2026`)
    dispatch({ type: 'MARK_SEEN', payload: { speciesKey: nextBug.speciesKey } })
  }

  function throwBall() {
    if (!bug || step !== 'revealed') return
    setStep('throwing')
    setMessage('You threw a Net Ball!')
  }

  function runAway() {
    if (!bug || step !== 'revealed') return
    setMadeCatch(!1)
    const name = pokemonSpecies[bug.speciesKey]?.name ?? bug.speciesKey
    setMessage(`You let the ${name} go.`)
    setStep('resolved')
  }

  function nextRustle() {
    if (rustlesLeft <= 0) {
      const board = buildContestResults(caught, baseLevel)
      setMessage('The judges tally the scores\u2026')
      setResults(board)
      setPrize(bugContestPrize(contestPlayerRank(board)))
      setStep('done')
      return
    }
    setBug(null)
    setMadeCatch(!1)
    setStep('bushes')
    setMessage('Rustle a bush and see what is hiding!')
  }

  const species = bug ? pokemonSpecies[bug.speciesKey] : null,
    activeBugName = species?.name ?? bug?.speciesKey ?? ''

  return jsxs('div', {
    className: 'bug-contest-scene',
    children: [
      jsx('div', { className: 'bug-contest-bg' }),
      jsxs('div', {
        className: 'bug-contest-topbar',
        children: [
          jsx('span', {
            className: 'bug-contest-heading',
            children: 'Bug Catching Contest',
          }),
          jsxs('span', {
            className: 'bug-contest-tally',
            children: [
              `${rustlesLeft} rustle${rustlesLeft === 1 ? '' : 's'} left`,
              ' \u00b7 ',
              `${caught.length} caught`,
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'bug-contest-field',
        children:
          step === 'bushes'
            ? jsx('div', {
                className: 'bug-contest-bushes',
                children: Array.from({ length: BUG_CONTEST_BUSHES }, (_, index) =>
                  jsxs(
                    'button',
                    {
                      className: 'bug-contest-bush',
                      onClick: () => rustleBush(index),
                      children: [
                        jsx('span', {
                          className: 'bug-contest-bush-leaf',
                        }),
                        jsx('span', {
                          className: 'bug-contest-bush-mark',
                          children: '?',
                        }),
                      ],
                    },
                    index
                  )
                ),
              })
            : step === 'done'
              ? jsxs('div', {
                  className: 'bug-contest-results',
                  children: [
                    jsx('span', {
                      className: 'bug-contest-results-title',
                      children: 'Contest Results',
                    }),
                    jsx('div', {
                      className: 'bug-contest-podium',
                      children: [1, 0, 2]
                        .map((place) => ({ place, entry: results[place] }))
                        .filter(({ entry }) => entry)
                        .map(({ place, entry }) =>
                          jsxs(
                            'div',
                            {
                              className: `bug-contest-place place-${place + 1}${
                                entry.isPlayer ? ' player' : ''
                              }`,
                              children: [
                                jsx('span', {
                                  className: 'bug-contest-place-rank',
                                  children: ['1st', '2nd', '3rd'][place],
                                }),
                                jsx('img', {
                                  className: 'bug-contest-place-sprite',
                                  src: getPokemonSpriteUrl(pokemonSpecies[entry.speciesKey]?.id ?? 0),
                                  alt: pokemonSpecies[entry.speciesKey]?.name ?? entry.speciesKey,
                                }),
                                jsx('span', {
                                  className: 'bug-contest-place-name',
                                  children: pokemonSpecies[entry.speciesKey]?.name ?? entry.speciesKey,
                                }),
                                jsxs('span', {
                                  className: 'bug-contest-place-detail',
                                  children: [`Lv.${entry.level} `, genderSymbol(entry.gender)],
                                }),
                                jsx('span', {
                                  className: 'bug-contest-place-owner',
                                  children: entry.owner,
                                }),
                                jsx('span', {
                                  className: 'bug-contest-place-score',
                                  children: `Score ${entry.score}`,
                                }),
                              ],
                            },
                            `${entry.owner}-${entry.speciesKey}-${place}`
                          )
                        ),
                    }),
                    prize &&
                      jsxs('div', {
                        className: 'bug-contest-prize',
                        children: [
                          jsx('span', {
                            className: 'bug-contest-prize-label',
                            children: prize.label,
                          }),
                          jsxs('span', {
                            className: 'bug-contest-prize-reward',
                            children: [
                              `$${prize.money.toLocaleString()}`,
                              ...prize.items.map(
                                (item) => ` + ${rewardItemName(item.itemId)} x${item.quantity}`
                              ),
                            ],
                          }),
                        ],
                      }),
                    jsx('span', {
                      className: 'bug-contest-results-note',
                      children:
                        caught.length > 0
                          ? `You caught ${caught.length} bug${caught.length === 1 ? '' : 's'}: ${caught
                              .map((bug) => pokemonSpecies[bug.speciesKey]?.name ?? bug.speciesKey)
                              .join(', ')}.`
                          : 'You did not catch anything this time.',
                    }),
                  ],
                })
              : bug &&
                jsxs('div', {
                  className: `bug-contest-bug${step === 'throwing' ? ' throwing' : ''}`,
                  children: [
                    jsx('img', {
                      className: 'bug-contest-bug-sprite',
                      src: getPokemonSpriteUrl(species?.id ?? 0),
                      onError: /** @param {React.SyntheticEvent} event */ (event) => {
                        const image = /** @type {HTMLImageElement} */ (event.target)
                        image.src = getPokemonSpriteFallbackUrl(species?.id ?? 0)
                      },
                      alt: activeBugName,
                    }),
                    jsxs('div', {
                      className: 'bug-contest-bug-meta',
                      children: [
                        jsx('span', {
                          className: 'bug-contest-bug-name',
                          children: activeBugName,
                        }),
                        jsxs('span', {
                          className: 'bug-contest-bug-detail',
                          children: [
                            `Lv.${bug.level}`,
                            ' \u00b7 ',
                            genderSymbol(bug.gender),
                          ],
                        }),
                      ],
                    }),
                    step === 'throwing' &&
                      jsx('div', {
                        className: 'bug-contest-ball',
                        children: jsx(PokeballIcon, { ballId: 'netball', size: 48 }),
                      }),
                  ],
                }),
      }),
      jsxs('div', {
        className: 'bug-contest-lower',
        children: [
          jsx('div', {
            className: 'bug-contest-text',
            children: message,
          }),
          jsx('div', {
            className: 'bug-contest-actions',
            children:
              step === 'bushes'
                ? null
                : step === 'revealed'
                  ? [
                      jsx('button', {
                        className: 'move-panel-btn confirm',
                        onClick: throwBall,
                        children: 'THROW NET BALL',
                      }),
                      jsx('button', {
                        className: 'move-panel-btn cancel',
                        onClick: runAway,
                        children: 'RUN AWAY',
                      }),
                    ]
                  : step === 'throwing'
                    ? jsx('button', {
                        className: 'move-panel-btn confirm disabled',
                        disabled: !0,
                        children: 'THROWING\u2026',
                      })
                    : step === 'resolved'
                      ? jsx('button', {
                          className: 'move-panel-btn confirm',
                          onClick: nextRustle,
                          children: rustlesLeft <= 0 ? 'FINISH' : 'NEXT RUSTLE',
                        })
                      : jsx('button', {
                          className: 'move-panel-btn confirm',
                          onClick: () => {
                            if (prize)
                              dispatch({
                                type: 'CLAIM_MINIGAME_REWARD',
                                payload: { money: prize.money, items: prize.items },
                              })
                            dispatch({ type: 'END_BUG_CONTEST' })
                          },
                          children: prize ? 'COLLECT PRIZE & LEAVE' : 'LEAVE THE PARK',
                        }),
          }),
        ],
      }),
      madeCatch &&
        jsx('div', {
          className: 'bug-contest-flash',
        }),
    ],
  })
}
