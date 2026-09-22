// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { moveCategoryIcons } from '../data/moves.js'
import { statBarColors } from '../data/ui.js'
import { natureByKey, natureName } from '../data/natures.js'

/** Short stat labels for the nature badge (matches the stat grid). @type {Record<string, string>} */
const NATURE_STAT_LABELS = {
  attack: 'Atk',
  defense: 'Def',
  spAttack: 'SpA',
  spDefense: 'SpD',
  speed: 'Spd',
}
import { moveData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { genderForPokemon, genderSymbol } from '../game/breeding.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, IV_STAT_LABELS, IV_STAT_ORDER, judgeIVs, pokemonDisplayName } from '../game/pokemon.js'
import { MoveManagerPanel } from './move-manager-panel.js'

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
    [showMoveManager, setShowMoveManager] = React.useState(!1),
    linkCables = state.inventory.linkCable ?? 0,
    gender = genderForPokemon(pokemon),
    nature = pokemon.nature ? natureByKey[pokemon.nature] : null,
    ivJudge = judgeIVs(pokemon.ivs),
    [editingName, setEditingName] = React.useState(!1),
    [nameDraft, setNameDraft] = React.useState(''),
    natureEffect = /** @param {string} statKey @returns {1 | -1 | 0} */ (statKey) =>
      nature && nature.increased !== nature.decreased
        ? nature.increased === statKey
          ? 1
          : nature.decreased === statKey
            ? -1
            : 0
        : 0
  if (!species) return null
  function commitName() {
    dispatch({
      type: 'SET_NICKNAME',
      payload: { pokemonId: pokemon.id, nickname: nameDraft },
    })
    setEditingName(!1)
  }
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
  if (pokemon.isEgg)
    return jsxs('div', {
      className: 'stats-panel',
      children: [
        jsxs('div', {
          className: 'stats-panel-header',
          children: [
            jsx('button', {
              className: 'stats-panel-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'stats-panel-identity',
          children: [
            jsx('img', {
              className: 'stats-panel-sprite',
              src: '/sprites/pokemon/egg.png',
              alt: 'Egg',
            }),
            jsxs('div', {
              className: 'stats-panel-name-block',
              children: [
                jsx('span', {
                  className: 'stats-panel-name',
                  children: 'Egg',
                }),
                jsx('span', {
                  className: 'stats-panel-level',
                  children: `Hatches in ${pokemon.eggStepsRemaining ?? 0} battles`,
                }),
              ],
            }),
          ],
        }),
        jsx('p', {
          className: 'stats-panel-egg-hint',
          children:
            'Carry this Egg in your party and win wild battles to hatch it. Eggs cannot battle.',
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
      ],
    })
  return jsxs('div', {
    className: 'stats-panel',
    children: [
      jsxs('div', {
        className: 'stats-panel-header',
        children: [
          jsx('button', {
            className: `stats-panel-fav-btn${pokemon.favourite ? ' active' : ''}`,
            onClick: () =>
              dispatch({
                type: 'TOGGLE_FAVOURITE',
                payload: { pokemonId: pokemon.id },
              }),
            title: pokemon.favourite
              ? 'Remove from favourites'
              : 'Favourite (protects from Release and Wonder Trade)',
            children: pokemon.favourite ? '\u2665' : '\u2661',
          }),
          jsx('button', {
            className: 'stats-panel-manage',
            onClick: () => setShowMoveManager(!0),
            children: 'Manage',
          }),
          jsx('button', {
            className: 'stats-panel-close',
            onClick: onClose,
            children: 'X',
          }),
        ],
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
                  editingName
                    ? jsx('input', {
                        className: 'stats-panel-name-input',
                        value: nameDraft,
                        maxLength: 12,
                        autoFocus: !0,
                        onChange: /** @param {React.ChangeEvent<HTMLInputElement>} event */ (
                          event
                        ) => setNameDraft(event.target.value),
                        onKeyDown: /** @param {React.KeyboardEvent<HTMLInputElement>} event */ (
                          event
                        ) => {
                          event.key === 'Enter' && commitName()
                          event.key === 'Escape' && setEditingName(!1)
                        },
                        onBlur: commitName,
                      })
                    : pokemonDisplayName(pokemon),
                  !editingName &&
                    jsx('button', {
                      className: 'stats-panel-name-edit',
                      title: 'Nickname',
                      onClick: () => {
                        setNameDraft(pokemon.nickname ?? '')
                        setEditingName(!0)
                      },
                      children: '\u270e',
                    }),
                  jsx('span', {
                    className: `pokemon-gender ${
                      gender === 'male'
                        ? 'gender-male'
                        : gender === 'female'
                          ? 'gender-female'
                          : 'gender-none'
                    }`,
                    children: genderSymbol(gender),
                  }),
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
              nature &&
                jsxs('span', {
                  className: 'stats-panel-nature',
                  children: [
                    jsx('span', {
                      className: 'stats-panel-nature-name',
                      children: natureName(pokemon.nature),
                    }),
                    nature.increased !== nature.decreased
                      ? jsxs('span', {
                          className: 'stats-panel-nature-effects',
                          children: [
                            jsxs('span', {
                              className: 'nature-stat nature-up',
                              title: `Raised 10% by ${natureName(pokemon.nature)}`,
                              children: [
                                '\u25b2',
                                NATURE_STAT_LABELS[nature.increased] ?? nature.increased,
                              ],
                            }),
                            jsxs('span', {
                              className: 'nature-stat nature-down',
                              title: `Lowered 10% by ${natureName(pokemon.nature)}`,
                              children: [
                                '\u25bc',
                                NATURE_STAT_LABELS[nature.decreased] ?? nature.decreased,
                              ],
                            }),
                          ],
                        })
                      : jsx('span', {
                          className: 'nature-stat nature-neutral',
                          children: 'Neutral',
                        }),
                  ],
                }),
              state.pokerus &&
                jsx('span', {
                  className: 'stats-panel-pokerus',
                  title: `Pokerus: double EXP for ${state.pokerus.battlesRemaining} more battles`,
                  children: ['PKRS \u00b7 ', state.pokerus.battlesRemaining, ' battles'],
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
                : Math.min((statRow.value / statMax) * 100, 100),
            statNature = natureEffect(statRow.key)
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
                jsxs('span', {
                  className: `stats-panel-stat-value${
                    statNature === 1 ? ' nature-up' : statNature === -1 ? ' nature-down' : ''
                  }`,
                  children: [
                    statRow.key === 'hp' ? `${statRow.value}/${statRow.max}` : statRow.value,
                    statNature === 1 ? ' \u25b2' : statNature === -1 ? ' \u25bc' : '',
                  ],
                }),
              ],
            },
            statRow.key
          )
        }),
      }),
      jsxs('div', {
        className: 'stats-panel-ivs',
        children: [
          jsxs('span', {
            className: 'stats-panel-ivs-title',
            children: ['IVs \u00b7 ', ivJudge.verdict, ' (', ivJudge.total, '/186)'],
          }),
          jsx('div', {
            className: 'stats-panel-iv-grid',
            children: IV_STAT_ORDER.map((statKey) => {
              const iv = ivJudge.perStat[statKey]
              return jsxs(
                'span',
                {
                  className: `iv-chip iv-${iv.label.toLowerCase().replace(/\s+/g, '-')}`,
                  title: `${iv.label} (${iv.value}/31)`,
                  children: [IV_STAT_LABELS[statKey], ' ', iv.value],
                },
                statKey
              )
            }),
          }),
        ],
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
      source === 'box' &&
        state.daycare.parents.length < 2 &&
        jsx('button', {
          className: 'stats-panel-btn',
          onClick: () => {
            dispatch({
              type: 'DEPOSIT_DAYCARE',
              payload: {
                pokemonId: pokemon.id,
              },
            })
            onClose()
          },
          children: 'Deposit to Daycare',
        }),
      jsxs('div', {
        className: 'stats-panel-trade',
        children: [
          jsx('button', {
            className: `stats-panel-trade-btn${linkCables <= 0 || pokemon.favourite ? ' disabled' : ''}`,
            disabled: linkCables <= 0 || tradeConfirm || !!pokemon.favourite,
            title: pokemon.favourite
              ? 'Unfavourite this Pokemon before trading it'
              : linkCables <= 0
                ? 'Buy a Link Cable in the Reward Shop'
                : 'Trade for a random Pokemon',
            onClick: () => setTradeConfirm(!0),
            children: `Wonder Trade (${linkCables})`,
          }),
          tradeConfirm &&
            jsxs('div', {
              className: 'release-confirm',
              children: [
                jsxs('span', {
                  children: ['Trade ', pokemonDisplayName(pokemon), ' for a random Pokemon?'],
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
      showMoveManager &&
        jsx(MoveManagerPanel, {
          pokemon,
          onClose: () => setShowMoveManager(!1),
        }),
    ],
  })
}
