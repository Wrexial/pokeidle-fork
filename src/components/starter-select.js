// First-run flow: pick Normal or Challenge mode, set any hard-mode rules, then
// choose a region starter. The same rules live in Settings for later changes.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { regionalStarters } from '../data/config.js'
import { pokemonSpecies, regions } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { isChallengeModeAvailable } from '../game/save.js'
import { calculatePokemonStats, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, getThreeStageBaseSpecies, monotypeSpeciesPool } from '../game/pokemon.js'
import { checkShinyOdds } from '../game/progression.js'
import { Icon } from './icon.js'
import { MonotypeSelect } from './monotype-select.js'

/**
 * The four selling points on the first-run welcome screen. Kept short: they
 * have to explain the game to someone who has never seen it at a glance.
 */
const WELCOME_FEATURES = [
  {
    icon: '\u{1f30d}',
    title: 'Nine regions',
    text: 'Kanto to Paldea \u2014 real routes, Gym leaders, Elite Four and a Champion for every one.',
  },
  {
    icon: '\u{26a1}',
    title: 'Idle or hands-on',
    text: 'Battles run themselves while you watch, and you can take over for moves, catches and big fights.',
  },
  {
    icon: '\u{2728}',
    title: 'Everything to collect',
    text: 'Shinies, legendaries, regional forms, ribbons, field research and a living Pok\u00e9dex.',
  },
  {
    icon: '\u{1f319}',
    title: 'Never stops',
    text: 'Catching, Field Jobs and the Pok\u00e9walker keep working while the game is closed.',
  },
]

export function StarterSelect() {
  const { state, dispatch } = useGame()
  const [step, setStep] = React.useState(/** @type {'mode' | 'challenge' | 'starter'} */ ('mode')),
    [regionId, setRegionId] = React.useState('kanto'),
    regionOrder = React.useMemo(
      // DLC sub-regions are post-game expansions with no starter track, so they
      // are never a place to begin a journey.
      () => [...regions].filter((candidate) => !candidate.isDlc).sort((a, b) => a.order - b.order),
      []
    ),
    region = regions.find((candidate) => candidate.id === regionId),
    // Challenge Mode is earned: it stays locked until this browser has beaten
    // any region's Champion (in any save slot), so a first run can't wander
    // into Nuzlocke by accident.
    challengeUnlocked = React.useMemo(() => isChallengeModeAvailable(), []),
    starters = regionalStarters[regionId] ?? regionalStarters.kanto,
    startLevel = region?.startLevel ?? 5,
    // A Monotype run doesn't let the player pick: it hands out a random base of
    // a three-stage line of the chosen type. Re-rolling per region keeps the
    // region pick meaningful (and gives the player a different partner).
    monotypeStarterKey = React.useMemo(() => {
      if (!state.challengeMonotype) return null
      const threeStage = getThreeStageBaseSpecies(state.challengeMonotype),
        pool = threeStage.length > 0 ? threeStage : monotypeSpeciesPool(state.challengeMonotype)
      return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
    }, [state.challengeMonotype, regionId]),
    monotypeStarterSpecies = monotypeStarterKey ? pokemonSpecies[monotypeStarterKey] : null

  /** Turn every challenge rule off (normal mode). */
  function clearChallenges() {
    if (state.challengeRandomizer) dispatch({ type: 'TOGGLE_CHALLENGE_RANDOMIZER' })
    if (state.challengeLevelScale) dispatch({ type: 'TOGGLE_CHALLENGE_LEVEL_SCALE' })
    if (state.challengeNuzlocke) dispatch({ type: 'TOGGLE_CHALLENGE_NUZLOCKE' })
    if (state.challengeRestrictCatches) dispatch({ type: 'TOGGLE_CHALLENGE_RESTRICT_CATCHES' })
    if (state.challengeMonotype)
      dispatch({ type: 'SET_CHALLENGE_MONOTYPE', payload: { monotype: null } })
  }

  const activeRules = [
    state.challengeRandomizer && 'Randomizer',
    state.challengeLevelScale && 'Level Scaling',
    state.challengeNuzlocke && 'Nuzlocke',
    state.challengeRestrictCatches && 'One Catch per Route',
    state.challengeMonotype && `${state.challengeMonotype} Monotype`,
  ].filter(Boolean)

  if (step === 'mode')
    return jsxs('div', {
      className: 'starter-select mode-select welcome-select',
      children: [
        jsxs('div', {
          className: 'welcome-hero',
          children: [
            jsx('h2', { className: 'starter-title welcome-title', children: 'Pok\u00e9mon Idle' }),
            jsx('p', {
              className: 'welcome-tagline',
              children:
                'A Pok\u00e9mon adventure that keeps playing while you do something else. Catch them, raise them and take on every region \u2014 one badge at a time.',
            }),
          ],
        }),
        jsx('div', {
          className: 'welcome-features',
          children: WELCOME_FEATURES.map((entry) =>
            jsxs(
              'div',
              {
                className: 'welcome-feature',
                children: [
                  jsx('span', { className: 'welcome-feature-icon', children: entry.icon }),
                  jsxs('span', {
                    className: 'welcome-feature-body',
                    children: [
                      jsx('span', { className: 'welcome-feature-title', children: entry.title }),
                      jsx('span', { className: 'welcome-feature-text', children: entry.text }),
                    ],
                  }),
                ],
              },
              entry.title
            )
          ),
        }),
        jsxs('div', {
          className: 'welcome-actions',
          children: [
            jsxs('button', {
              className: 'welcome-start',
              onClick: () => {
                clearChallenges()
                setStep('starter')
              },
              children: [
                jsxs('span', {
                  className: 'welcome-start-title',
                  children: ['Start Your Journey', jsx(Icon, { name: 'arrow-right' })],
                }),
                jsx('span', {
                  className: 'welcome-start-hint',
                  children:
                    'Normal Mode \u2014 the full adventure at its own pace. You pick a region and a starter next.',
                }),
              ],
            }),
            challengeUnlocked
              ? jsxs('button', {
                  className: 'welcome-secondary',
                  onClick: () => setStep('challenge'),
                  children: [
                    jsx('span', { className: 'welcome-secondary-title', children: 'Challenge Mode' }),
                    jsx('span', {
                      className: 'welcome-secondary-hint',
                      children:
                        'Randomizer, Level Scaling, Nuzlocke, one-catch-per-route or Monotype \u2014 pick any hard-mode rules.',
                    }),
                  ],
                })
              : jsxs('div', {
                  className: 'welcome-secondary locked',
                  children: [
                    jsxs('span', {
                      className: 'welcome-secondary-title',
                      children: [jsx(Icon, { name: 'lock' }), 'Challenge Mode'],
                    }),
                    jsx('span', {
                      className: 'welcome-secondary-hint',
                      children:
                        'Earned, not offered: beat any region Champion and the hard-mode rules open for every journey after it.',
                    }),
                  ],
                }),
          ],
        }),
      ],
    })

  if (step === 'challenge')
    return jsxs('div', {
      className: 'starter-select challenge-select',
      children: [
        jsx('h2', { className: 'starter-title', children: 'Challenge Rules' }),
        jsx('p', {
          className: 'starter-subtitle',
          children: 'Turn on any rules you want for this run. You can change them later in Settings.',
        }),
        jsxs('div', {
          className: 'challenge-rules',
          children: [
            jsxs('div', {
              className: 'challenge-rule',
              children: [
                jsx('button', {
                  className: `settings-toggle-btn${state.challengeRandomizer ? ' active' : ''}`,
                  onClick: () => dispatch({ type: 'TOGGLE_CHALLENGE_RANDOMIZER' }),
                  children: state.challengeRandomizer ? 'Randomizer: ON' : 'Randomizer: OFF',
                }),
                jsx('p', {
                  className: 'challenge-rule-hint',
                  children: 'Every wild encounter rolls a random species from the whole dex.',
                }),
              ],
            }),
            jsxs('div', {
              className: 'challenge-rule',
              children: [
                jsx('button', {
                  className: `settings-toggle-btn${state.challengeLevelScale ? ' active' : ''}`,
                  onClick: () => dispatch({ type: 'TOGGLE_CHALLENGE_LEVEL_SCALE' }),
                  children: state.challengeLevelScale ? 'Level Scaling: ON' : 'Level Scaling: OFF',
                }),
                jsx('p', {
                  className: 'challenge-rule-hint',
                  children:
                    'Wild Pokemon match your active Pokemon\u2019s level, so you cannot out-level content.',
                }),
              ],
            }),
            jsxs('div', {
              className: 'challenge-rule',
              children: [
                jsx('button', {
                  className: `settings-toggle-btn${state.challengeNuzlocke ? ' active' : ''}`,
                  onClick: () => dispatch({ type: 'TOGGLE_CHALLENGE_NUZLOCKE' }),
                  children: state.challengeNuzlocke ? 'Nuzlocke: ON' : 'Nuzlocke: OFF',
                }),
                jsx('p', {
                  className: 'challenge-rule-hint',
                  children:
                    'A party Pokemon is released the moment it faints \u2014 your last one is always spared.',
                }),
              ],
            }),
            jsxs('div', {
              className: 'challenge-rule',
              children: [
                jsx('button', {
                  className: `settings-toggle-btn${state.challengeRestrictCatches ? ' active' : ''}`,
                  onClick: () => dispatch({ type: 'TOGGLE_CHALLENGE_RESTRICT_CATCHES' }),
                  children: state.challengeRestrictCatches
                    ? 'One Catch per Route: ON'
                    : 'One Catch per Route: OFF',
                }),
                jsx('p', {
                  className: 'challenge-rule-hint',
                  children:
                    'You may only catch the first wild Pokemon you meet on each route or area.',
                }),
              ],
            }),
            jsxs('div', {
              className: 'challenge-rule',
              children: [
                jsx(MonotypeSelect, {
                  value: state.challengeMonotype,
                  onChange: /** @param {string | null} monotype */ (monotype) =>
                    dispatch({ type: 'SET_CHALLENGE_MONOTYPE', payload: { monotype } }),
                }),
                jsx('p', {
                  className: 'challenge-rule-hint',
                  children: state.challengeMonotype
                    ? `Wild encounters will be limited to ${state.challengeMonotype}-type Pokemon.`
                    : 'Limits wild encounters to a single type you pick.',
                }),
              ],
            }),
          ],
        }),
        jsxs('div', {
          className: 'mode-actions',
          children: [
            jsx('button', {
              className: 'choose-btn',
              onClick: () => setStep('starter'),
              children: 'Choose Your Starter',
            }),
            jsx('button', {
              className: 'choose-btn secondary',
              onClick: () => setStep('mode'),
              children: 'Back',
            }),
          ],
        }),
      ],
    })

  return jsxs('div', {
    className: 'starter-select',
    children: [
      jsx('h2', {
        className: 'starter-title',
        children: state.challengeMonotype ? 'Choose Your Region' : 'Choose Your Starter!',
      }),
      jsx('p', {
        className: 'starter-subtitle',
        children: state.challengeMonotype
          ? `Pick where your journey begins. A random three-stage ${state.challengeMonotype}-type Pokemon will start it with you.`
          : 'Your choice decides which region your journey begins in.',
      }),
      jsx('div', {
        className: 'starter-mode-summary',
        children:
          activeRules.length > 0
            ? `Challenge Mode: ${activeRules.join(' \u00b7 ')}`
            : 'Normal Mode',
      }),
      jsx('button', {
        className: 'starter-mode-change',
        onClick: () => setStep('mode'),
        children: 'Change mode',
      }),
      jsx('div', {
        className: 'map-region-tabs starter-region-tabs',
        children: regionOrder.map((candidate) =>
          jsx(
            'button',
            {
              className: `map-region-tab${regionId === candidate.id ? ' active' : ''}`,
              onClick: () => setRegionId(candidate.id),
              children: candidate.name,
            },
            candidate.id
          )
        ),
      }),
      state.challengeMonotype &&
        jsx('div', {
          className: 'starter-cards monotype-starter',
          children: monotypeStarterSpecies
            ? jsxs('div', {
                className: 'starter-card monotype-starter-card',
                children: [
                  jsx('img', {
                    src: getPokemonSpriteUrl(monotypeStarterSpecies.id),
                    onError: /** @param {React.SyntheticEvent} event */ (event) => ((/** @type {HTMLImageElement} */ (event.target)).src = getPokemonSpriteFallbackUrl(monotypeStarterSpecies.id)),
                    alt: monotypeStarterSpecies.name,
                    className: 'starter-sprite',
                  }),
                  jsx('h3', {
                    children: monotypeStarterSpecies.name,
                  }),
                  jsx('div', {
                    className: 'starter-types',
                    children: monotypeStarterSpecies.types.map((type) =>
                      jsx(
                        'span',
                        {
                          className: `type-badge type-${type.toLowerCase()}`,
                          children: type,
                        },
                        type
                      )
                    ),
                  }),
                  jsx('p', {
                    className: 'monotype-starter-note',
                    children: `A random three-stage ${state.challengeMonotype}-type partner, ready to grow with you.`,
                  }),
                  jsx('button', {
                    className: 'choose-btn',
                    onClick: () =>
                      dispatch({
                        type: 'SELECT_STARTER',
                        payload: {
                          speciesKey: monotypeStarterKey,
                          isShiny: checkShinyOdds(),
                          region: regionId,
                          monotype: state.challengeMonotype,
                        },
                      }),
                    children: 'Begin Journey',
                  }),
                ],
              })
            : jsx('p', {
                className: 'starter-subtitle',
                children:
                  'No three-stage Pokemon of this type exists. Pick another type in Settings.',
              }),
        }),
      !state.challengeMonotype &&
        jsx('div', {
        className: 'starter-cards',
        children: starters.map((speciesKey) => {
          const species = pokemonSpecies[speciesKey]
          if (!species) return null
          const stats = calculatePokemonStats(species, startLevel, {
            hp: 15,
            attack: 15,
            defense: 15,
            spAttack: 15,
            spDefense: 15,
            speed: 15,
          })
          return jsxs(
            'div',
            {
              className: 'starter-card',
              onClick: () =>
                dispatch({
                  type: 'SELECT_STARTER',
                  payload: {
                    speciesKey,
                    isShiny: checkShinyOdds(),
                    region: regionId,
                    monotype: state.challengeMonotype,
                  },
                }),
              children: [
                jsx('img', {
                  src: getPokemonSpriteUrl(species.id),
                  onError: /** @param {React.SyntheticEvent} event */ (event) => ((/** @type {HTMLImageElement} */ (event.target)).src = getPokemonSpriteFallbackUrl(species.id)),
                  alt: species.name,
                  className: 'starter-sprite',
                }),
                jsx('h3', {
                  children: species.name,
                }),
                jsx('div', {
                  className: 'starter-types',
                  children: species.types.map((type) =>
                    jsx(
                      'span',
                      {
                        className: `type-badge type-${type.toLowerCase()}`,
                        children: type,
                      },
                      type
                    )
                  ),
                }),
                jsxs('div', {
                  className: 'starter-stats',
                  children: [
                    jsxs('div', {
                      children: ['HP: ', stats.hp],
                    }),
                    jsxs('div', {
                      children: ['ATK: ', stats.attack],
                    }),
                    jsxs('div', {
                      children: ['DEF: ', stats.defense],
                    }),
                    jsxs('div', {
                      children: ['SP.A: ', stats.spAttack],
                    }),
                    jsxs('div', {
                      children: ['SP.D: ', stats.spDefense],
                    }),
                    jsxs('div', {
                      children: ['SPD: ', stats.speed],
                    }),
                  ],
                }),
                jsx('button', {
                  className: 'choose-btn',
                  children: 'Choose!',
                }),
              ],
            },
            speciesKey
          )
        }),
      }),
    ],
  })
}
