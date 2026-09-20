// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { PokeballIcon } from './common.js'
import { CATCH_MODE_OPTIONS, CHANGELOG, GAME_VERSION, LAST_SEEN_VERSION_KEY, SAVE_KEY_ALT, ballOrder, pokeBalls } from '../data/constants.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { getCatchRule } from '../game/progression.js'

export function SettingsModal({ onClose }) {
  const [confirming, setConfirming] = React.useState(!1)
  function resetSave() {
    ;(localStorage.removeItem(SAVE_KEY_ALT), window.location.reload())
  }
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal',
      onClick: (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Settings',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsx('div', {
          className: 'battle-info-content',
          children: confirming
            ? jsxs('div', {
                className: 'settings-confirm',
                children: [
                  jsx('p', {
                    children:
                      'Are you sure? This will permanently delete all save data and restart the game.',
                  }),
                  jsxs('div', {
                    className: 'settings-confirm-buttons',
                    children: [
                      jsx('button', {
                        className: 'settings-confirm-yes',
                        onClick: resetSave,
                        children: 'Yes, Reset',
                      }),
                      jsx('button', {
                        className: 'settings-confirm-no',
                        onClick: () => setConfirming(!1),
                        children: 'Cancel',
                      }),
                    ],
                  }),
                ],
              })
            : jsx('button', {
                className: 'settings-reset-btn',
                onClick: () => setConfirming(!0),
                children: 'Reset Save Data',
              }),
        }),
      ],
    }),
  })
}

export const CatchSettingsModal = React.memo(function ({ routeKey, encounters, onClose }) {
    const { state, dispatch } = useGame(),
      baseRule = getCatchRule(state, routeKey, encounters[0]?.speciesKey),
      mode = baseRule.mode,
      enabledBalls = baseRule.enabledBalls,
      levelThreshold = baseRule.levelThreshold,
      setMode = React.useCallback(
        (newMode) => {
          for (const encounter of encounters) {
            const rule = getCatchRule(state, routeKey, encounter.speciesKey)
            dispatch({
              type: 'SET_CATCH_RULE',
              payload: {
                routeKey,
                speciesKey: encounter.speciesKey,
                rule: {
                  ...rule,
                  mode: newMode,
                },
              },
            })
          }
        },
        [state, routeKey, encounters, dispatch]
      ),
      setLevelThreshold = React.useCallback(
        (event) => {
          const newLevelThreshold = Math.max(1, Math.min(100, Number(event.target.value) || 1))
          for (const encounter of encounters) {
            const rule = getCatchRule(state, routeKey, encounter.speciesKey)
            dispatch({
              type: 'SET_CATCH_RULE',
              payload: {
                routeKey,
                speciesKey: encounter.speciesKey,
                rule: {
                  ...rule,
                  levelThreshold: newLevelThreshold,
                },
              },
            })
          }
        },
        [state, routeKey, encounters, dispatch]
      ),
      toggleBall = React.useCallback(
        (ballId) => {
          for (const encounter of encounters) {
            const rule = getCatchRule(state, routeKey, encounter.speciesKey),
              currentBalls = rule.enabledBalls
            let nextBalls
            ;(currentBalls.includes(ballId) ? (nextBalls = currentBalls.filter((otherBallId) => otherBallId !== ballId)) : (nextBalls = [...currentBalls, ballId]),
              dispatch({
                type: 'SET_CATCH_RULE',
                payload: {
                  routeKey,
                  speciesKey: encounter.speciesKey,
                  rule: {
                    ...rule,
                    enabledBalls: nextBalls,
                  },
                },
              }))
          }
        },
        [state, routeKey, encounters, dispatch]
      ),
      toggleSpecies = React.useCallback(
        (speciesKey) => {
          const rule = getCatchRule(state, routeKey, speciesKey)
          dispatch({
            type: 'SET_CATCH_RULE',
            payload: {
              routeKey,
              speciesKey,
              rule: {
                ...rule,
                enabled: !rule.enabled,
              },
            },
          })
        },
        [state, routeKey, dispatch]
      ),
      enableAll = React.useCallback(() => {
        dispatch({
          type: 'TOGGLE_ROUTE_CATCH_ALL',
          payload: {
            routeKey,
            enabled: !0,
          },
        })
      }, [routeKey, dispatch]),
      disableAll = React.useCallback(() => {
        dispatch({
          type: 'TOGGLE_ROUTE_CATCH_ALL',
          payload: {
            routeKey,
            enabled: !1,
          },
        })
      }, [routeKey, dispatch])
    return jsx('div', {
      className: 'catch-modal-overlay',
      onClick: onClose,
      children: jsxs('div', {
        className: 'catch-modal',
        onClick: (event) => event.stopPropagation(),
        children: [
          jsxs('div', {
            className: 'catch-modal-header',
            children: [
              jsx('span', {
                className: 'catch-modal-title',
                children: 'Catch Settings',
              }),
              jsx('button', {
                className: 'catch-modal-close',
                onClick: onClose,
                children: 'X',
              }),
            ],
          }),
          jsx('button', {
            className: `catch-shiny-toggle${state.alwaysCatchShinies ? ' active' : ''}`,
            onClick: () =>
              dispatch({
                type: 'SET_ALWAYS_CATCH_SHINIES',
                payload: {
                  value: !state.alwaysCatchShinies,
                },
              }),
            children: '★ Always catch shinies',
          }),
          jsxs('div', {
            className: 'catch-modal-route-settings',
            children: [
              jsx('div', {
                className: 'catch-modal-section-title',
                children: 'Catch Mode',
              }),
              CATCH_MODE_OPTIONS.map(({ value: encounter, label: species }) =>
                jsxs(
                  'label',
                  {
                    className: 'catch-mode-option',
                    children: [
                      jsx('input', {
                        type: 'radio',
                        name: 'modal-catch-mode',
                        checked: mode === encounter,
                        onChange: () => setMode(encounter),
                      }),
                      jsx('span', {
                        children: species,
                      }),
                      encounter === 'level_threshold' &&
                        mode === 'level_threshold' &&
                        jsx('input', {
                          type: 'number',
                          className: 'level-threshold-input',
                          value: levelThreshold,
                          onChange: setLevelThreshold,
                          min: 1,
                          max: 100,
                          onClick: (event) => event.stopPropagation(),
                        }),
                    ],
                  },
                  encounter
                )
              ),
              jsxs('div', {
                className: 'catch-ball-selector',
                children: [
                  jsx('span', {
                    className: 'catch-ball-label',
                    children: 'Ball:',
                  }),
                  ballOrder.map((event) =>
                    jsx(
                      'button',
                      {
                        className: `catch-ball-icon-btn${enabledBalls.includes(event) ? ' active' : ''}`,
                        onClick: () => toggleBall(event),
                        title: pokeBalls[event].name,
                        children: jsx(PokeballIcon, {
                          ballId: event,
                          size: 10,
                          disabled: !enabledBalls.includes(event),
                        }),
                      },
                      event
                    )
                  ),
                ],
              }),
            ],
          }),
          jsx('div', {
            className: 'catch-modal-divider',
          }),
          jsxs('div', {
            className: 'catch-modal-species-header',
            children: [
              jsx('span', {
                className: 'catch-modal-section-title',
                children: 'Pokemon',
              }),
              jsxs('div', {
                className: 'catch-modal-bulk-btns',
                children: [
                  jsx('button', {
                    className: 'encounter-bulk-btn',
                    onClick: enableAll,
                    children: 'All',
                  }),
                  jsx('button', {
                    className: 'encounter-bulk-btn',
                    onClick: disableAll,
                    children: 'None',
                  }),
                ],
              }),
            ],
          }),
          jsx('div', {
            className: 'catch-modal-species-list',
            children: encounters.map((encounter) => {
              const species = pokemonSpecies[encounter.speciesKey]
              if (!species) return null
              const rule = getCatchRule(state, routeKey, encounter.speciesKey)
              return jsxs(
                'div',
                {
                  className: 'catch-modal-species-row',
                  onClick: () => toggleSpecies(encounter.speciesKey),
                  children: [
                    jsx('img', {
                      className: 'catch-modal-species-sprite',
                      src: getPokemonSpriteUrl(species.id),
                      onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                      alt: species.name,
                    }),
                    jsx('span', {
                      className: 'catch-modal-species-name',
                      children: species.name,
                    }),
                    jsx('span', {
                      className: `catch-toggle${rule.enabled ? ' active' : ''}`,
                      children: rule.enabled ? 'CATCH' : 'SKIP',
                    }),
                  ],
                },
                encounter.speciesKey
              )
            }),
          }),
        ],
      }),
    })
  })

export function PatchNotesModal() {
  const [show, setShow] = React.useState(!1)
  React.useEffect(() => {
    localStorage.getItem(LAST_SEEN_VERSION_KEY) !== GAME_VERSION && setShow(!0)
  }, [])
  const dismiss = () => {
    ;(localStorage.setItem(LAST_SEEN_VERSION_KEY, GAME_VERSION), setShow(!1))
  }
  if (!show) return null
  const latest = CHANGELOG[0]
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: dismiss,
    children: jsxs('div', {
      className: 'patch-notes-modal',
      onClick: (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsxs('span', {
              className: 'battle-info-title',
              children: ["What's New — v", latest.version],
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: dismiss,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'patch-notes-content',
          children: [
            jsxs('div', {
              className: 'patch-notes-title',
              children: ['Pokemon Idle v', latest.version, ' Patch Notes'],
            }),
            jsx('div', {
              className: 'patch-notes-subtitle',
              children: latest.subtitle,
            }),
            latest.sections.map((section, sectionIndex) =>
              jsxs(
                'div',
                {
                  className: 'patch-notes-section',
                  children: [
                    jsx('div', {
                      className: 'patch-notes-section-heading',
                      children: section.heading,
                    }),
                    jsx('ul', {
                      className: 'patch-notes-list',
                      children: section.items.map((item, itemIndex) =>
                        jsx(
                          'li',
                          {
                            children: item,
                          },
                          itemIndex
                        )
                      ),
                    }),
                  ],
                },
                sectionIndex
              )
            ),
            jsxs('p', {
              className: 'patch-notes-feedback',
              children: [
                'As always, feedback is welcome! Join us at',
                ' ',
                jsx('a', {
                  href: 'https://www.reddit.com/r/PkmnIdle/',
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  children: 'r/PkmnIdle',
                }),
                ' ',
                'to share your thoughts or report issues.',
              ],
            }),
          ],
        }),
        jsx('div', {
          className: 'patch-notes-footer',
          children: jsx('button', {
            className: 'patch-notes-dismiss-btn',
            onClick: dismiss,
            children: 'Got it!',
          }),
        }),
      ],
    }),
  })
}

export function PatchNotesPage() {
  return jsxs('div', {
    className: 'patch-notes-page',
    children: [
      jsxs('div', {
        className: 'patch-notes-page-header',
        children: [
          jsx('a', {
            href: '#',
            className: 'patch-notes-back-btn',
            children: '← Back to Game',
          }),
          jsx('h1', {
            className: 'patch-notes-page-title',
            children: 'Patch Notes',
          }),
        ],
      }),
      jsxs('div', {
        className: 'patch-notes-page-content',
        children: [
          CHANGELOG.map((entry, entryIndex) =>
            jsxs(
              'div',
              {
                className: 'patch-notes-version-block',
                children: [
                  jsxs('div', {
                    className: 'patch-notes-page-version-header',
                    children: [
                      jsxs('span', {
                        className: 'patch-notes-page-version',
                        children: ['v', entry.version],
                      }),
                      jsx('span', {
                        className: 'patch-notes-page-subtitle',
                        children: entry.subtitle,
                      }),
                    ],
                  }),
                  entry.sections.map((section, sectionIndex) =>
                    jsxs(
                      'div',
                      {
                        className: 'patch-notes-section',
                        children: [
                          jsx('div', {
                            className: 'patch-notes-section-heading',
                            children: section.heading,
                          }),
                          jsx('ul', {
                            className: 'patch-notes-list',
                            children: section.items.map((item, itemIndex) =>
                              jsx(
                                'li',
                                {
                                  children: item,
                                },
                                itemIndex
                              )
                            ),
                          }),
                        ],
                      },
                      sectionIndex
                    )
                  ),
                  entryIndex < CHANGELOG.length - 1 &&
                    jsx('hr', {
                      className: 'patch-notes-divider',
                    }),
                ],
              },
              entryIndex
            )
          ),
          jsxs('p', {
            className: 'patch-notes-feedback',
            children: [
              'Feedback is welcome! Join us at',
              ' ',
              jsx('a', {
                href: 'https://www.reddit.com/r/PkmnIdle/',
                target: '_blank',
                rel: 'noopener noreferrer',
                children: 'r/PkmnIdle',
              }),
              ' ',
              'to share your thoughts or report issues.',
            ],
          }),
        ],
      }),
    ],
  })
}
