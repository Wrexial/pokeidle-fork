// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { STAT_DISPLAY_MAX, statBarColors } from '../data/ui.js'
import { pokedexData, pokedexIndexes, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { PokedexTile } from './pokedex-tile.js'

const GEN_RANGES = [
  [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
  [650, 721], [722, 809], [810, 905], [906, 1025],
]

/** @param {{ onClose: () => void }} props */
export function PokedexModal({ onClose }) {
  const { state } = useGame(),
    [selected, setSelected] = React.useState(/** @type {string | null} */ (null)),
    [gen, setGen] = React.useState(0),
    getStatus = /** @param {string} speciesKey */ (speciesKey) =>
      state.pokedexCaught.includes(speciesKey)
        ? 'caught'
        : state.pokedexSeen.includes(speciesKey)
          ? 'seen'
          : 'unseen',
    caughtSet = new Set(state.pokedexCaught),
    seenSet = new Set([...state.pokedexSeen, ...state.pokedexCaught]),
    filteredIndexes = React.useMemo(
      () =>
        gen === 0
          ? pokedexIndexes
          : pokedexIndexes.filter(
              (entry) =>
                entry[1].id >= GEN_RANGES[gen - 1][0] && entry[1].id <= GEN_RANGES[gen - 1][1]
            ),
      [gen]
    ),
    caughtCount = filteredIndexes.filter(([speciesKey]) => caughtSet.has(speciesKey)).length,
    seenCount = filteredIndexes.filter(([speciesKey]) => seenSet.has(speciesKey)).length,
    totalEntries = filteredIndexes.length,
    selectedSpecies = selected ? pokemonSpecies[selected] : null,
    selectedStatus = selected ? getStatus(selected) : 'unseen',
    statRows = selectedSpecies
      ? [
          {
            label: 'HP',
            key: 'hp',
            value: selectedSpecies.baseStats.hp,
          },
          {
            label: 'Atk',
            key: 'attack',
            value: selectedSpecies.baseStats.attack,
          },
          {
            label: 'Def',
            key: 'defense',
            value: selectedSpecies.baseStats.defense,
          },
          {
            label: 'SpA',
            key: 'spAttack',
            value: selectedSpecies.baseStats.spAttack,
          },
          {
            label: 'SpD',
            key: 'spDefense',
            value: selectedSpecies.baseStats.spDefense,
          },
          {
            label: 'Spd',
            key: 'speed',
            value: selectedSpecies.baseStats.speed,
          },
        ]
      : []
  return jsx('div', {
    className: 'pokedex-modal-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'pokedex-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'pokedex-modal-header',
          children: [
            jsx('span', {
              className: 'pokedex-modal-title',
              children: 'Pokedex',
            }),
            jsxs('span', {
              className: 'pokedex-modal-counts',
              children: [caughtCount, '/', totalEntries, ' caught · ', seenCount, '/', totalEntries, ' seen'],
            }),
            jsx('button', {
              className: 'pokedex-modal-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsx('div', {
          className: 'pokedex-gen-tabs',
          children: [{ id: 0, label: 'All' }]
            .concat(Array.from({ length: 9 }, (_, i) => ({ id: i + 1, label: String(i + 1) })))
            .map((option) =>
              jsx(
                'button',
                {
                  className: `pokedex-gen-tab${gen === option.id ? ' active' : ''}`,
                  onClick: () => setGen(option.id),
                  children: option.label,
                },
                option.id
              )
            ),
        }),
        jsx('div', {
          className: 'pokedex-modal-grid-scroll',
          children: jsx('div', {
            className: 'pokedex-grid',
            children: filteredIndexes.map(([speciesKey]) => {
              const status = getStatus(speciesKey)
              return jsx(
                PokedexTile,
                {
                  speciesKey,
                  status,
                  rarity: 'common',
                  isSelected: selected === speciesKey,
                  onClick: () => setSelected((next) => (next === speciesKey ? null : speciesKey)),
                  isShinyCaught: state.shinyCaught.includes(speciesKey),
                },
                speciesKey
              )
            }),
          }),
        }),
        selected &&
          selectedSpecies &&
          jsxs('div', {
            className: 'pokedex-modal-detail',
            children: [
              jsxs('div', {
                className: 'stats-panel-identity',
                children: [
                  jsx('img', {
                    className: `stats-panel-sprite ${selectedStatus}`,
                    src: getPokemonSpriteUrl(selectedSpecies.id),
                    onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(selectedSpecies.id)),
                    alt: selectedStatus === 'unseen' ? '???' : selectedSpecies.name,
                  }),
                  jsxs('div', {
                    className: 'stats-panel-name-block',
                    children: [
                      jsx('span', {
                        className: 'stats-panel-name',
                        children: selectedStatus === 'unseen' ? '???' : selectedSpecies.name,
                      }),
                      jsxs('span', {
                        className: 'stats-panel-level',
                        children: ['#', String(selectedSpecies.id).padStart(3, '0')],
                      }),
                      jsx('div', {
                        className: 'stats-panel-types',
                        children:
                          selectedStatus === 'unseen'
                            ? jsx('span', {
                                className: 'type-badge type-unknown',
                                children: '???',
                              })
                            : selectedSpecies.types.map((type) =>
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
                    ],
                  }),
                ],
              }),
              selectedStatus !== 'unseen' &&
                pokedexData[selected] &&
                jsxs('div', {
                  className: 'pokedex-modal-routes',
                  children: [
                    jsx('span', {
                      className: 'pokedex-modal-routes-label',
                      children: 'Routes: ',
                    }),
                    pokedexData[selected].map((statRow, percent) =>
                      jsxs(
                        'span',
                        {
                          style: {
                            whiteSpace: 'nowrap',
                          },
                          children: [
                            statRow,
                            percent < pokedexData[selected].length - 1 ? ', ' : '',
                          ],
                        },
                        statRow
                      )
                    ),
                  ],
                }),
              selectedStatus !== 'unseen' &&
                jsx('div', {
                  className: 'stats-panel-grid',
                  children: statRows.map((statRow) => {
                    const statIndex = Math.min((statRow.value / STAT_DISPLAY_MAX) * 100, 100)
                    return jsxs(
                      'div',
                      {
                        className: 'stats-panel-stat-row',
                        children: [
                          jsx('span', {
                            className: 'stats-panel-stat-label',
                            children: statRow.label,
                          }),
                          jsx('div', {
                            className: 'stats-panel-stat-bar',
                            children: jsx('div', {
                              className: 'stats-panel-stat-fill',
                              style: {
                                width: `${statIndex}%`,
                                backgroundColor: statBarColors[statRow.key],
                              },
                            }),
                          }),
                          jsx('span', {
                            className: 'stats-panel-stat-value',
                            children: statRow.value,
                          }),
                        ],
                      },
                      statRow.key
                    )
                  }),
                }),
            ],
          }),
      ],
    }),
  })
}
