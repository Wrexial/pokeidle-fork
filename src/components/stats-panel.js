// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { moveCategoryIcons } from '../data/moves.js'
import { statBarColors } from '../data/ui.js'
import { moveData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

/** @param {{ pokemon: Pokemon, source: 'party' | 'box', partyLength: number, onAction: () => void, onClose: () => void, evolutionInfo?: { entries: { targetName: string, canEvolve: boolean, requirementLabel: string, targetKey: string, itemId?: string }[] } | null, onEvolve?: (index: number) => void, onRelease?: () => void, canRelease?: boolean }} props */
export function StatsPanel({
  pokemon,
  source,
  partyLength,
  onAction,
  onClose,
  evolutionInfo,
  onEvolve,
  onRelease,
  canRelease,
}) {
  const species = pokemonSpecies[pokemon.speciesKey]
  const { state, dispatch } = useGame(),
    [tradeConfirm, setTradeConfirm] = React.useState(!1),
    linkCables = state.inventory.linkCable ?? 0
  if (!species) return null
  const statRows = [
      {
        label: 'HP',
        key: 'hp',
        value: pokemon.currentHp,
        max: pokemon.maxHp,
      },
      {
        label: 'Atk',
        key: 'attack',
        value: pokemon.attack,
        max: 999,
      },
      {
        label: 'Def',
        key: 'defense',
        value: pokemon.defense,
        max: 999,
      },
      {
        label: 'SpA',
        key: 'spAttack',
        value: pokemon.spAttack,
        max: 999,
      },
      {
        label: 'SpD',
        key: 'spDefense',
        value: pokemon.spDefense,
        max: 999,
      },
      {
        label: 'Spd',
        key: 'speed',
        value: pokemon.speed,
        max: 999,
      },
    ],
    statMax = 200,
    canMove = (source === 'party' && partyLength > 1) || (source === 'box' && partyLength < 6),
    actionLabel = source === 'party' ? 'Send to Box' : 'Move to Party'
  return jsxs('div', {
    className: 'stats-panel',
    children: [
      jsx('div', {
        className: 'stats-panel-header',
        children: jsx('button', {
          className: 'stats-panel-close',
          onClick: onClose,
          children: 'X',
        }),
      }),
      evolutionInfo &&
        jsx('div', {
          className: 'stats-panel-evolve-row',
          children: evolutionInfo.entries.map((evolutionEntry, entryIndex) =>
            jsxs(
              'button',
              {
                className: `stats-panel-evolve-btn${evolutionEntry.canEvolve ? '' : ' disabled'}`,
                onClick: () => evolutionEntry.canEvolve && onEvolve?.(entryIndex),
                disabled: !evolutionEntry.canEvolve,
                children: [
                  jsx('span', {
                    className: 'evolve-btn-label',
                    children: evolutionInfo.entries.length > 1 ? evolutionEntry.targetName : 'EVOLVE',
                  }),
                  jsx('span', {
                    className: 'evolve-btn-req',
                    children: evolutionEntry.requirementLabel,
                  }),
                ],
              },
              entryIndex
            )
          ),
        }),
      jsxs('div', {
        className: 'stats-panel-identity',
        children: [
          jsx('img', {
            className: 'stats-panel-sprite',
            src: getPokemonSpriteUrl(species.id, !1, pokemon.isShiny),
            onError: /** @param {{ target: HTMLImageElement }} event */ (event) => (event.target.src = getPokemonSpriteFallbackUrl(species.id, !1, pokemon.isShiny)),
            alt: pokemon.name,
          }),
          jsxs('div', {
            className: 'stats-panel-name-block',
            children: [
              jsxs('span', {
                className: 'stats-panel-name',
                children: [
                  pokemon.isShiny &&
                    jsx('span', {
                      className: 'shiny-star',
                      children: '★',
                    }),
                  pokemon.name,
                ],
              }),
              jsxs('span', {
                className: 'stats-panel-level',
                children: ['Lv', pokemon.level],
              }),
              jsx('div', {
                className: 'stats-panel-types',
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
            ],
          }),
        ],
      }),
      jsx('div', {
        className: 'stats-panel-grid',
        children: statRows.map((statRow) => {
          const statIndex =
            statRow.key === 'hp'
              ? statRow.max > 0
                ? (statRow.value / statRow.max) * 100
                : 0
              : Math.min((statRow.value / statMax) * 100, 100)
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
                  children: statRow.key === 'hp' ? `${statRow.value}/${statRow.max}` : statRow.value,
                }),
              ],
            },
            statRow.key
          )
        }),
      }),
      jsxs('div', {
        className: 'stats-panel-moves',
        children: [
          jsx('span', {
            className: 'stats-panel-moves-title',
            children: 'Moves',
          }),
          pokemon.moves.map((moveId) => {
            const moveDef = moveData[moveId]
            return moveDef
              ? jsxs(
                  'div',
                  {
                    className: `stats-panel-move type-bg-${moveDef.type.toLowerCase()}`,
                    children: [
                      jsx('span', {
                        className: 'stats-panel-move-icon',
                        children: moveCategoryIcons[moveDef.category],
                      }),
                      jsx('span', {
                        className: 'stats-panel-move-name',
                        children: moveDef.name,
                      }),
                      jsxs('span', {
                        className: 'stats-panel-move-stats',
                        children: [
                          moveDef.power > 0 &&
                            jsxs('span', {
                              children: [moveDef.power, ' pw'],
                            }),
                          jsxs('span', {
                            children: [moveDef.accuracy, '%'],
                          }),
                        ],
                      }),
                    ],
                  },
                  moveId
                )
              : null
          }),
        ],
      }),
      canMove
        ? jsx('button', {
            className: 'stats-panel-btn',
            onClick: onAction,
            children: actionLabel,
          })
        : null,
      canRelease &&
        jsx('button', {
          className: 'stats-panel-release-btn',
          onClick: onRelease,
          children: 'Release',
        }),
      jsxs('div', {
        className: 'stats-panel-trade',
        children: [
          jsx('button', {
            className: `stats-panel-trade-btn${linkCables <= 0 ? ' disabled' : ''}`,
            disabled: linkCables <= 0 || tradeConfirm,
            title: linkCables <= 0 ? 'Buy a Link Cable in the Reward Shop' : 'Trade for a random Pokemon',
            onClick: () => setTradeConfirm(!0),
            children: `Wonder Trade (${linkCables})`,
          }),
          tradeConfirm &&
            jsxs('div', {
              className: 'release-confirm',
              children: [
                jsxs('span', {
                  children: ['Trade ', pokemon.name, ' for a random Pokemon?'],
                }),
                jsxs('div', {
                  className: 'release-confirm-buttons',
                  children: [
                    jsx('button', {
                      className: 'release-confirm-yes',
                      onClick: () => {
                        dispatch({
                          type: 'WONDER_TRADE',
                          payload: {
                            pokemonId: pokemon.id,
                          },
                        })
                        setTradeConfirm(!1)
                        onClose()
                      },
                      children: 'Yes',
                    }),
                    jsx('button', {
                      className: 'release-confirm-no',
                      onClick: () => setTradeConfirm(!1),
                      children: 'No',
                    }),
                  ],
                }),
              ],
            }),
        ],
      }),
    ],
  })
}
