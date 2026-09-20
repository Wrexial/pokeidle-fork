// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { PokeballIcon } from './common.js'
import { STAT_DISPLAY_MAX, rarities, statBarColorsPokedex, statColours } from '../data/constants.js'
import { pokedexData, pokedexIndexes, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getRarityFromRate } from '../game/catching.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

let PokedexTile = React.memo(function ({
    speciesKey,
    status,
    rarity,
    isSelected,
    onClick,
    isShinyCaught,
    activeEffect,
    selectorMode,
  }) {
    const species = pokemonSpecies[speciesKey]
    return species
      ? jsxs('div', {
          className: `pokedex-tile rarity-border-${rarity}${isSelected ? ' selected' : ''}${selectorMode && status !== 'unseen' ? ' selector-target' : ''}`,
          onClick,
          children: [
            isShinyCaught &&
              jsx('span', {
                className: 'pokedex-shiny-star',
                children: '★',
              }),
            activeEffect?.repel &&
              jsx('span', {
                className: 'pokedex-effect-indicator repel-indicator',
                children: 'R',
              }),
            activeEffect?.honey &&
              jsx('span', {
                className: 'pokedex-effect-indicator honey-indicator',
                children: 'H',
              }),
            jsx('img', {
              className: `pokedex-tile-sprite ${status}`,
              src: getPokemonSpriteUrl(species.id),
              onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
              alt: status === 'unseen' ? '???' : species.name,
              loading: 'lazy',
            }),
            jsx('div', {
              className: 'pokedex-tile-name',
              children: status === 'unseen' ? '???' : species.name,
            }),
          ],
        })
      : null
  })

export function PokedexModal({ onClose }) {
  const { state } = useGame(),
    [selected, setSelected] = React.useState(null),
    getStatus = (speciesKey) =>
      state.pokedexCaught.includes(speciesKey)
        ? 'caught'
        : state.pokedexSeen.includes(speciesKey)
          ? 'seen'
          : 'unseen',
    caughtCount = state.pokedexCaught.length,
    seenCount = new Set([...state.pokedexSeen, ...state.pokedexCaught]).size,
    totalEntries = pokedexIndexes.length,
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
      onClick: (event) => event.stopPropagation(),
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
          className: 'pokedex-modal-grid-scroll',
          children: jsx('div', {
            className: 'pokedex-grid',
            children: pokedexIndexes.map(([speciesKey]) => {
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
                    onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(selectedSpecies.id)),
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
                                backgroundColor: statBarColorsPokedex[statRow.key],
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

const EncounterDetailPanel = React.memo(function ({
    speciesKey,
    encounter,
    rarity,
    rate,
    status,
    onClose,
    routeKey,
  }) {
    const { state, dispatch } = useGame(),
      species = pokemonSpecies[speciesKey]
    if (!species) return null
    const repelCount = state.inventory.repel ?? 0,
      honeyCount = state.inventory.honey ?? 0,
      activeRepel = state.activeEffects.find(
        (effect) => effect.type === 'repel' && effect.routeKey === routeKey && effect.speciesKey === speciesKey
      ),
      activeHoney = state.activeEffects.find(
        (effect) => effect.type === 'honey' && effect.routeKey === routeKey && effect.speciesKey === speciesKey
      ),
      applyRepel = () => {
        repelCount <= 0 ||
          !routeKey ||
          dispatch({
            type: 'USE_EFFECT_ITEM',
            payload: {
              itemId: 'repel',
              routeKey,
              speciesKey,
            },
          })
      },
      applyHoney = () => {
        honeyCount <= 0 ||
          !routeKey ||
          dispatch({
            type: 'USE_EFFECT_ITEM',
            payload: {
              itemId: 'honey',
              routeKey,
              speciesKey,
            },
          })
      },
      statRows = [
        {
          label: 'HP',
          key: 'hp',
          value: species.baseStats.hp,
        },
        {
          label: 'Atk',
          key: 'attack',
          value: species.baseStats.attack,
        },
        {
          label: 'Def',
          key: 'defense',
          value: species.baseStats.defense,
        },
        {
          label: 'SpA',
          key: 'spAttack',
          value: species.baseStats.spAttack,
        },
        {
          label: 'SpD',
          key: 'spDefense',
          value: species.baseStats.spDefense,
        },
        {
          label: 'Spd',
          key: 'speed',
          value: species.baseStats.speed,
        },
      ],
      statMax = 200
    return jsxs('div', {
      className: 'stats-panel pokedex-detail',
      children: [
        jsx('div', {
          className: 'stats-panel-header',
          children: jsx('button', {
            className: 'stats-panel-close',
            onClick: onClose,
            children: 'X',
          }),
        }),
        jsxs('div', {
          className: 'stats-panel-identity',
          children: [
            jsx('img', {
              className: `stats-panel-sprite ${status}`,
              src: getPokemonSpriteUrl(species.id),
              onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(species.id)),
              alt: status === 'unseen' ? '???' : species.name,
            }),
            jsxs('div', {
              className: 'stats-panel-name-block',
              children: [
                jsx('span', {
                  className: 'stats-panel-name',
                  children: status === 'unseen' ? '???' : species.name,
                }),
                jsx('span', {
                  className: 'stats-panel-level',
                  children:
                    status === 'unseen' ? 'Lv ??' : `Lv ${encounter.minLevel}-${encounter.maxLevel}`,
                }),
                jsx('div', {
                  className: 'stats-panel-types',
                  children:
                    status === 'unseen'
                      ? jsx('span', {
                          className: 'type-badge type-unknown',
                          children: '???',
                        })
                      : species.types.map((type) =>
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
        jsx('div', {
          className: 'pokedex-detail-encounter-info',
          children: jsx('span', {
            className: `pokedex-detail-rarity rarity-text-${rarity}`,
            children: rarities[rarity],
          }),
        }),
        routeKey &&
          status !== 'unseen' &&
          jsxs('div', {
            className: 'pokedex-detail-effects',
            children: [
              jsx('button', {
                className: `effect-use-btn repel-btn${repelCount <= 0 ? ' disabled' : ''}${activeRepel ? ' active' : ''}`,
                onClick: applyRepel,
                disabled: repelCount <= 0,
                title: activeRepel
                  ? `Repel active: ${activeRepel.battlesRemaining} battles left`
                  : `Use Repel (x${repelCount})`,
                children: activeRepel ? `Repel (${activeRepel.battlesRemaining})` : `Repel (x${repelCount})`,
              }),
              jsx('button', {
                className: `effect-use-btn honey-btn${honeyCount <= 0 ? ' disabled' : ''}${activeHoney ? ' active' : ''}`,
                onClick: applyHoney,
                disabled: honeyCount <= 0,
                title: activeHoney
                  ? `Honey active: ${activeHoney.battlesRemaining} battles left`
                  : `Use Honey (x${honeyCount})`,
                children: activeHoney ? `Honey (${activeHoney.battlesRemaining})` : `Honey (x${honeyCount})`,
              }),
            ],
          }),
        status !== 'unseen' &&
          jsx('div', {
            className: 'stats-panel-grid',
            children: statRows.map((statRow) => {
              const percent = Math.min((statRow.value / statMax) * 100, 100)
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
                          width: `${percent}%`,
                          backgroundColor: statColours[statRow.key],
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
    })
  })

export function RouteEncounterGrid({
  routeKey,
  encounters,
  onOpenCatchSettings,
  forceRarity,
}) {
  const { state, dispatch } = useGame(),
    [selected, setSelected] = React.useState(null),
    [applyingItem, setApplyingItem] = React.useState(null),
    repelCount = state.inventory.repel ?? 0,
    honeyCount = state.inventory.honey ?? 0,
    totalWeight = React.useMemo(() => encounters.reduce((accumulator, encounter) => accumulator + encounter.weight, 0), [encounters]),
    sortedEncounters = React.useMemo(() => [...encounters].sort((left, right) => right.weight - left.weight), [encounters]),
    activeEffectMap = React.useMemo(() => {
      const effectMap = {}
      for (const effect of state.activeEffects)
        (effect.type === 'repel' || effect.type === 'honey') &&
          effect.routeKey === routeKey &&
          effect.speciesKey &&
          (effectMap[effect.speciesKey] ||
            (effectMap[effect.speciesKey] = {
              repel: !1,
              honey: !1,
            }),
          (effectMap[effect.speciesKey][effect.type] = !0))
      return effectMap
    }, [state.activeEffects, routeKey]),
    getStatus = React.useCallback(
      (speciesKey) =>
        state.pokedexCaught.includes(speciesKey)
          ? 'caught'
          : state.pokedexSeen.includes(speciesKey)
            ? 'seen'
            : 'unseen',
      [state.pokedexSeen, state.pokedexCaught]
    ),
    handleTileClick = React.useCallback(
      (encounter) => {
        if (applyingItem) {
          if (getStatus(encounter) === 'unseen') return
          const weightedRate = state.inventory[applyingItem] ?? 0
          if (weightedRate <= 0) return
          ;(weightedRate <= 1 && setApplyingItem(null),
            dispatch({
              type: 'USE_EFFECT_ITEM',
              payload: {
                itemId: applyingItem,
                routeKey,
                speciesKey: encounter,
              },
            }))
          return
        }
        setSelected((weightedRate) => (weightedRate === encounter ? null : encounter))
      },
      [applyingItem, getStatus, state.inventory, dispatch, routeKey]
    ),
    closeDetail = React.useCallback(() => {
      setSelected(null)
    }, []),
    selectedEncounter = selected ? encounters.find((entry) => entry.speciesKey === selected) : null,
    rate = selectedEncounter && totalWeight > 0 ? (selectedEncounter.weight / totalWeight) * 100 : 0,
    rarity = forceRarity ?? (rate > 0 ? getRarityFromRate(rate) : 'common')
  return jsxs('div', {
    className: 'pokedex-grid-container',
    children: [
      jsxs('div', {
        className: 'pokedex-grid-header',
        children: [
          jsx('div', {
            className: 'location-section-title',
            children: 'Wild Pokemon',
          }),
          jsxs('div', {
            className: 'pokedex-header-actions',
            children: [
              jsx('button', {
                className: `effect-selector-btn repel-btn${applyingItem === 'repel' ? ' active-mode' : ''}${repelCount <= 0 ? ' disabled' : ''}`,
                onClick: () => {
                  ;(setApplyingItem((encounter) => (encounter === 'repel' ? null : 'repel')), setSelected(null))
                },
                disabled: repelCount <= 0 && applyingItem !== 'repel',
                title: 'Click then select a pokemon to apply Repel',
                children: applyingItem === 'repel' ? 'Applying...' : `Repel (${repelCount})`,
              }),
              jsx('button', {
                className: `effect-selector-btn honey-btn${applyingItem === 'honey' ? ' active-mode' : ''}${honeyCount <= 0 ? ' disabled' : ''}`,
                onClick: () => {
                  ;(setApplyingItem((encounter) => (encounter === 'honey' ? null : 'honey')), setSelected(null))
                },
                disabled: honeyCount <= 0 && applyingItem !== 'honey',
                title: 'Click then select a pokemon to apply Honey',
                children: applyingItem === 'honey' ? 'Applying...' : `Honey (${honeyCount})`,
              }),
              jsxs('button', {
                className: 'pokedex-settings-btn',
                onClick: onOpenCatchSettings,
                title: 'Catch Settings',
                children: [
                  jsx(PokeballIcon, {
                    ballId: 'pokeball',
                    size: 14,
                  }),
                  jsx('span', {
                    children: 'Catch',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      jsx('div', {
        className: `pokedex-grid${applyingItem ? ' selector-mode' : ''}`,
        children: sortedEncounters.map((encounter) => {
          const weightedRate = totalWeight > 0 ? (encounter.weight / totalWeight) * 100 : 0,
            tier = forceRarity ?? getRarityFromRate(weightedRate)
          return jsx(
            PokedexTile,
            {
              speciesKey: encounter.speciesKey,
              status: getStatus(encounter.speciesKey),
              rarity: tier,
              isSelected: selected === encounter.speciesKey,
              onClick: () => handleTileClick(encounter.speciesKey),
              isShinyCaught: state.shinyCaught.includes(encounter.speciesKey),
              activeEffect: activeEffectMap[encounter.speciesKey] ?? null,
              selectorMode: applyingItem,
            },
            encounter.speciesKey
          )
        }),
      }),
      selected &&
        selectedEncounter &&
        jsx(EncounterDetailPanel, {
          speciesKey: selected,
          encounter: selectedEncounter,
          rarity,
          rate,
          status: getStatus(selected),
          onClose: closeDetail,
          routeKey,
        }),
    ],
  })
}
