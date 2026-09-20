// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { rarities, statBarColors } from '../data/ui.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

export const EncounterDetailPanel = React.memo(
  /** @param {{ speciesKey: string, encounter: any, rarity: string, rate: number, status: string, onClose: () => void, routeKey: string }} props */
  function ({
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
    })
  })
