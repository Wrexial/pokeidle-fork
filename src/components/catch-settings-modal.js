// Split from a grouped component file.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { autoCatchBallOrder, pokeBalls } from '../data/items.js'
import { CATCH_MODE_OPTIONS } from '../data/ui.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { getCatchRule } from '../game/progression.js'
import { NumberControl } from './ui-controls.js'
import { PokeballIcon } from './pokeball-icon.js'

export const CatchSettingsModal = React.memo(
  /** @param {{ routeKey: string, encounters: any[], onClose: () => void }} props */
  function ({ routeKey, encounters, onClose }) {
    const { state, dispatch } = useGame(),
      baseRule = getCatchRule(state, routeKey, encounters[0]?.speciesKey),
      mode = baseRule.mode,
      enabledBalls = baseRule.enabledBalls,
      levelThreshold = baseRule.levelThreshold,
      setMode = React.useCallback(
        /** @param {string} newMode */ (newMode) => {
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
        /** @param {number} newLevelThreshold */ (newLevelThreshold) => {
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
        /** @param {string} ballId */ (ballId) => {
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
        /** @param {string} speciesKey */ (speciesKey) => {
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
        onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
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
                className: 'section-title',
                children: 'Catch Mode',
              }),
              CATCH_MODE_OPTIONS.map(({ value: encounter, label: species, hint }) =>
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
                        jsx(NumberControl, {
                          value: levelThreshold,
                          min: 1,
                          max: 100,
                          onChange: setLevelThreshold,
                          compact: true,
                          className: 'level-threshold-control',
                          'aria-label': 'Level threshold',
                        }),
                      hint &&
                        mode === encounter &&
                        jsx('span', {
                          className: 'catch-mode-hint',
                          children: hint,
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
                  // autoCatchBallOrder already leaves out the Master Ball, which
                  // is thrown from its own battle button rather than auto-catch.
                  autoCatchBallOrder.map((event) =>
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
                className: 'section-title',
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
                      onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
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
