// Focus / target hunting (#61): a compact bar in the location panel, and the
// modal where a species or type is chosen. The active hunt's target spawns more
// often and its progress (encounters, catches, best hit, time) is tracked.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokemonSpecies } from '../data/gameData.js'
import { POKEMON_TYPES } from '../data/moves.js'
import { useGame } from '../game/context.js'
import {
  formatHuntDuration,
  huntLabel,
  huntProgress,
  isValidHuntTarget,
  routesForHunt,
} from '../game/hunt.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { normalizeSearchName, speciesMatchingSearch } from '../game/species-search.js'

/** How many species matches to list before the search narrows. */
const HUNT_SEARCH_LIMIT = 24

/**
 * The compact hunt bar shown in the location panel. Opens the picker modal.
 * @param {{ onOpen: () => void }} props
 */
export function HuntBar({ onOpen }) {
  const { state } = useGame(),
    hunt = state.hunt,
    progress = huntProgress(hunt)
  return jsxs('button', {
    className: `hunt-bar${hunt ? ' active' : ''}`,
    onClick: onOpen,
    title: hunt
      ? `Focus Hunt: ${huntLabel(hunt)}`
      : 'Focus on a species or type to find it more often',
    children: [
      jsx('span', { className: 'hunt-bar-icon', children: '\u{1f3af}' }),
      hunt
        ? jsxs('span', {
            className: 'hunt-bar-text',
            children: [
              jsx('span', {
                className: 'hunt-bar-target',
                children: huntLabel(hunt),
              }),
              jsxs('span', {
                className: 'hunt-bar-progress',
                children: [
                  `${progress.encounters} seen`,
                  progress.catches > 0 ? ` \u00b7 ${progress.catches} caught` : '',
                ],
              }),
            ],
          })
        : jsx('span', {
            className: 'hunt-bar-text',
            children: 'Focus Hunt',
          }),
    ],
  })
}

/**
 * The focus-hunt modal: pick a species or type, or review / stop the current
 * hunt.
 * @param {{ onClose: () => void }} props
 */
export function HuntModal({ onClose }) {
  const { state, dispatch } = useGame(),
    hunt = state.hunt,
    [mode, setMode] = React.useState(/** @type {'species' | 'type'} */ (hunt?.mode ?? 'species')),
    [query, setQuery] = React.useState('')

  /** @param {'species' | 'type'} nextMode @param {string} target */
  function choose(nextMode, target) {
    if (!isValidHuntTarget(nextMode, target)) return
    dispatch({ type: 'SET_HUNT', payload: { mode: nextMode, target } })
    onClose()
  }

  const needle = normalizeSearchName(query),
    familyMatches = query ? speciesMatchingSearch(query) : null,
    searchResults = React.useMemo(() => {
      if (!needle || !familyMatches) return []
      return Object.entries(pokemonSpecies)
        .filter(([speciesKey, species]) => species.id > 0 && familyMatches.has(speciesKey))
        .sort((left, right) => left[1].id - right[1].id)
        .slice(0, HUNT_SEARCH_LIMIT)
    }, [needle, familyMatches]),
    targetSpecies = hunt?.mode === 'species' ? pokemonSpecies[hunt.target] : null,
    routes = React.useMemo(() => routesForHunt(hunt), [hunt])

  return jsx('div', {
    className: 'catch-modal-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'catch-modal hunt-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'catch-modal-header',
          children: [
            jsx('span', { className: 'catch-modal-title', children: 'Focus Hunt' }),
            jsx('button', { className: 'catch-modal-close', onClick: onClose, children: 'X' }),
          ],
        }),
        hunt
          ? jsxs('div', {
              className: 'hunt-active',
              children: [
                jsxs('div', {
                  className: 'hunt-active-head',
                  children: [
                    targetSpecies
                      ? jsx('img', {
                          className: 'hunt-active-sprite',
                          src: getPokemonSpriteUrl(targetSpecies.id),
                          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                            (event.target.src = getPokemonSpriteFallbackUrl(targetSpecies.id)),
                          alt: targetSpecies.name,
                        })
                      : jsx('span', { className: 'hunt-active-icon', children: '\u{1f3af}' }),
                    jsxs('div', {
                      className: 'hunt-active-info',
                      children: [
                        jsx('span', {
                          className: 'hunt-active-target',
                          children: huntLabel(hunt),
                        }),
                        jsx('span', {
                          className: 'hunt-active-hint',
                          children: 'The target turns up 3\u00d7 as often on routes and activities.',
                        }),
                      ],
                    }),
                    jsx('button', {
                      className: 'hunt-stop-btn',
                      onClick: () => dispatch({ type: 'CLEAR_HUNT' }),
                      children: 'Stop',
                    }),
                  ],
                }),
                jsxs('div', {
                  className: 'hunt-stat-row',
                  children: [
                    jsxs('span', {
                      className: 'hunt-stat',
                      children: [
                        jsx('span', { className: 'hunt-stat-value', children: huntProgress(hunt).encounters }),
                        ' seen',
                      ],
                    }),
                    jsxs('span', {
                      className: 'hunt-stat',
                      children: [
                        jsx('span', { className: 'hunt-stat-value', children: huntProgress(hunt).catches }),
                        ' caught',
                      ],
                    }),
                    jsx('span', {
                      className: 'hunt-stat',
                      children:
                        huntProgress(hunt).bestQuality
                          ? `best: ${huntProgress(hunt).bestQuality}`
                          : 'no activity hit yet',
                    }),
                    jsxs('span', {
                      className: 'hunt-stat',
                      children: [
                        'time: ',
                        formatHuntDuration(huntProgress(hunt).elapsedMs),
                      ],
                    }),
                  ],
                }),
                routes.length > 0 &&
                  jsxs('div', {
                    className: 'hunt-routes',
                    children: [
                      jsx('span', {
                        className: 'hunt-routes-label',
                        children: 'Found on:',
                      }),
                      ...routes.map((route) =>
                        jsx(
                          'span',
                          { className: 'hunt-route-chip', children: route.name },
                          route.locationId
                        )
                      ),
                    ],
                  }),
              ],
            })
          : jsx('p', {
              className: 'hunt-empty-hint',
              children:
                'Pick a species or type to focus on. Its wild and activity encounter rate is boosted and its hunt progress is tracked here.',
            }),
        jsxs('div', {
          className: 'hunt-mode-toggle',
          children: [
            jsx('button', {
              className: `hunt-mode-btn${mode === 'species' ? ' active' : ''}`,
              onClick: () => setMode('species'),
              children: 'Species',
            }),
            jsx('button', {
              className: `hunt-mode-btn${mode === 'type' ? ' active' : ''}`,
              onClick: () => setMode('type'),
              children: 'Type',
            }),
          ],
        }),
        mode === 'species'
          ? jsxs(React.Fragment, {
              children: [
                jsx('input', {
                  className: 'box-search-input hunt-search-input',
                  type: 'text',
                  placeholder: 'Search a Pokemon\u2026',
                  value: query,
                  onChange: /** @param {React.ChangeEvent<HTMLInputElement>} event */ (event) =>
                    setQuery(event.target.value),
                }),
                jsxs('div', {
                  className: 'hunt-species-list',
                  children: [
                    !query && jsx('span', { className: 'hunt-list-hint', children: 'Type a name to search.' }),
                    query &&
                      searchResults.length === 0 &&
                      jsx('span', { className: 'hunt-list-hint', children: 'No matches.' }),
                    ...searchResults.map(([speciesKey, species]) =>
                      jsxs(
                        'button',
                        {
                          className: 'hunt-species-row',
                          onClick: () => choose('species', speciesKey),
                          children: [
                            jsx('img', {
                              className: 'hunt-species-sprite',
                              src: getPokemonSpriteUrl(species.id),
                              onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
                                (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
                              alt: species.name,
                            }),
                            jsx('span', { className: 'hunt-species-name', children: species.name }),
                            jsx('span', {
                              className: 'hunt-species-types',
                              children: species.types.join(' / '),
                            }),
                          ],
                        },
                        speciesKey
                      )
                    ),
                  ],
                }),
              ],
            })
          : jsx('div', {
              className: 'hunt-type-grid',
              children: POKEMON_TYPES.map((type) =>
                jsx(
                  'button',
                  {
                    className: `hunt-type-btn type-bg-${type.toLowerCase()}${hunt?.mode === 'type' && hunt.target === type ? ' active' : ''}`,
                    onClick: () => choose('type', type),
                    children: type,
                  },
                  type
                )
              ),
            }),
      ],
    }),
  })
}
