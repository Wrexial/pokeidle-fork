// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { ExpBar, HpBar } from './common.js'
import { PokedexModal } from './pokedex.js'
import { BOX_PAGE_SIZE, categoryIcons, evolutionItems, initialDragState, statBarColors } from '../data/constants.js'
import { evolutionData, moveData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'

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
            onError: (event) => (event.target.src = getPokemonSpriteFallbackUrl(species.id, !1, pokemon.isShiny)),
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
                        children: categoryIcons[moveDef.category],
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
    ],
  })
}

export function PartyPanel({
  inspected,
  setInspected,
  releaseConfirm,
  setReleaseConfirm,
  dragSource = null,
  dragFromIndex = null,
  dropTargetIndex = null,
  dropPosition = null,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const { state, dispatch } = useGame()
  let inspectedPokemon = null,
    inspectedIndex = -1,
    inspectedSource = null
  inspected &&
    (inspected.source === 'party'
      ? ((inspectedIndex = state.party.findIndex((memberId) => memberId.id === inspected.id)),
        inspectedIndex >= 0 && ((inspectedPokemon = state.party[inspectedIndex]), (inspectedSource = 'party')))
      : ((inspectedIndex = state.box.findIndex((memberId) => memberId.id === inspected.id)),
        inspectedIndex >= 0 && ((inspectedPokemon = state.box[inspectedIndex]), (inspectedSource = 'box'))))
  const handleSelect = React.useCallback(
      (partyIndex) => {
        ;(setReleaseConfirm(null),
          setInspected(
            inspected && inspected.source === 'party' && inspected.id === partyIndex
              ? null
              : {
                  source: 'party',
                  id: partyIndex,
                }
          ))
      },
      [inspected, setInspected, setReleaseConfirm]
    ),
    handleMoveToOther = React.useCallback(() => {
      if (inspected) {
        if (inspected.source === 'party') {
          const boxIndex = state.party.findIndex((member) => member.id === inspected.id)
          if (boxIndex < 0) return
          dispatch({
            type: 'PARTY_TO_BOX',
            payload: {
              partyIndex: boxIndex,
            },
          })
        } else {
          const boxIndex = state.box.findIndex((member) => member.id === inspected.id)
          if (boxIndex < 0) return
          dispatch({
            type: 'BOX_TO_PARTY',
            payload: {
              boxIndex,
            },
          })
        }
        ;(setInspected(null), setReleaseConfirm(null))
      }
    }, [inspected, state.party, state.box, dispatch, setInspected, setReleaseConfirm]),
    canReleaseNow = !!(inspectedPokemon && inspectedSource && (inspectedSource === 'box' || (inspectedSource === 'party' && state.party.length > 1))),
    requestRelease = React.useCallback(() => {
      inspectedPokemon && setReleaseConfirm(inspectedPokemon.id)
    }, [inspectedPokemon, setReleaseConfirm]),
    confirmRelease = React.useCallback(() => {
      !releaseConfirm ||
        !inspectedSource ||
        (dispatch({
          type: 'RELEASE_POKEMON',
          payload: {
            pokemonId: releaseConfirm,
            source: inspectedSource,
          },
        }),
        setInspected(null),
        setReleaseConfirm(null))
    }, [releaseConfirm, inspectedSource, dispatch, setInspected, setReleaseConfirm]),
    cancelRelease = React.useCallback(() => {
      setReleaseConfirm(null)
    }, [setReleaseConfirm]),
    evolutionInfo = React.useMemo(() => {
      if (!inspectedPokemon || state.phase === 'evolving') return
      const evolutionChain = evolutionData[inspectedPokemon.speciesKey]
      if (evolutionChain)
        return {
          entries: evolutionChain.map((evolution) => {
            const targetSpecies = pokemonSpecies[evolution.into],
              levelMet = !evolution.level || inspectedPokemon.level >= evolution.level,
              itemOwned = !evolution.item || (state.inventory[evolution.item] ?? 0) > 0,
              canEvolve = levelMet && itemOwned,
              requirementParts = []
            if ((evolution.level && requirementParts.push(`Lv. ${evolution.level}`), evolution.item)) {
              const evolutionEntry = evolution.item in evolutionItems ? evolutionItems[evolution.item].name : evolution.item
              requirementParts.push(evolutionEntry)
            }
            return {
              targetName: targetSpecies?.name ?? evolution.into,
              canEvolve,
              requirementLabel: requirementParts.join(' + ') || 'Ready',
              targetKey: evolution.into,
              itemId: evolution.item,
            }
          }),
        }
    }, [inspectedPokemon, state.phase, state.inventory]),
    handleEvolve = React.useCallback(
      (evolutionEntry) => {
        if (!inspectedPokemon || !evolutionInfo) return
        const evolution = evolutionInfo.entries[evolutionEntry]
        evolution.canEvolve &&
          (dispatch({
            type: 'START_EVOLUTION',
            payload: {
              pokemonId: inspectedPokemon.id,
              fromSpeciesKey: inspectedPokemon.speciesKey,
              toSpeciesKey: evolution.targetKey,
              consumeItem: evolution.itemId,
            },
          }),
          setInspected(null))
      },
      [inspectedPokemon, evolutionInfo, dispatch, setInspected]
    ),
    releaseTarget = releaseConfirm
      ? state.party.find((memberId) => memberId.id === releaseConfirm) || state.box.find((memberId) => memberId.id === releaseConfirm)
      : null,
    isDraggable = !!onDragStart
  return jsxs(Fragment, {
    children: [
      jsxs('div', {
        className: 'panel-header',
        children: [
          jsx('h2', {
            className: 'panel-title',
            children: 'Party',
          }),
          jsx('button', {
            className: `heal-btn${(state.phase === 'idle' || state.phase === 'battling' || state.phase === 'victory' || state.phase === 'defeat') && state.party.some((member) => member.currentHp < member.maxHp) ? '' : ' disabled'}`,
            onClick: () => {
              ;(state.phase === 'idle' ||
                state.phase === 'battling' ||
                state.phase === 'victory' ||
                state.phase === 'defeat') &&
                state.party.some((member) => member.currentHp < member.maxHp) &&
                dispatch({
                  type: 'START_HEALING',
                })
            },
            disabled: !(
              (state.phase === 'idle' ||
                state.phase === 'battling' ||
                state.phase === 'victory' ||
                state.phase === 'defeat') &&
              state.party.some((member) => member.currentHp < member.maxHp)
            ),
            children: '+ HEAL',
          }),
        ],
      }),
      jsxs('div', {
        className: 'party-content',
        children: [
          jsx('div', {
            className: 'party-list',
            children: state.party.map((member, index) => {
              const species = pokemonSpecies[member.speciesKey],
                isFirst = index === 0,
                isInspected = inspected?.source === 'party' && inspected.id === member.id,
                isDraggingIndex = dragSource === 'party' && dragFromIndex === index,
                showDropAbove =
                  dropTargetIndex === index &&
                  dropPosition === 'above' &&
                  dragFromIndex !== null &&
                  dragSource === 'party' &&
                  dragFromIndex !== index,
                showDropBelow =
                  dropTargetIndex === index &&
                  dropPosition === 'below' &&
                  dragFromIndex !== null &&
                  dragSource === 'party' &&
                  dragFromIndex !== index,
                isBoxDropTarget = dropTargetIndex === index && dragSource === 'box'
              return jsxs(
                'div',
                {
                  children: [
                    showDropAbove &&
                      jsx('div', {
                        className: 'party-slot-drop-indicator',
                      }),
                    jsxs('div', {
                      className: `party-slot${isFirst ? ' active' : ''}${isInspected ? ' inspected' : ''}${isDraggingIndex ? ' dragging' : ''}${isBoxDropTarget ? ' drop-target' : ''}`,
                      onClick: () => handleSelect(member.id),
                      draggable: isDraggable,
                      onDragStart: onDragStart ? (event) => onDragStart(event, index, member.id) : void 0,
                      onDragOver: onDragOver ? (event) => onDragOver(event, index) : void 0,
                      onDrop,
                      onDragEnd,
                      children: [
                        jsx('img', {
                          className: 'party-sprite',
                          src: getPokemonSpriteUrl(species.id, !1, member.isShiny),
                          onError: (event) =>
                            (event.target.src = getPokemonSpriteFallbackUrl(species.id, !1, member.isShiny)),
                          alt: member.name,
                        }),
                        jsxs('div', {
                          className: 'party-info',
                          children: [
                            jsxs('div', {
                              className: 'party-name-row',
                              children: [
                                jsxs('span', {
                                  children: [
                                    member.isShiny &&
                                      jsx('span', {
                                        className: 'shiny-star',
                                        children: '★',
                                      }),
                                    member.name,
                                  ],
                                }),
                                jsxs('span', {
                                  children: ['Lv', member.level],
                                }),
                              ],
                            }),
                            jsx(HpBar, {
                              current: member.currentHp,
                              max: member.maxHp,
                            }),
                            jsx(ExpBar, {
                              speciesKey: member.speciesKey,
                              level: member.level,
                              totalExp: member.totalExp,
                            }),
                          ],
                        }),
                      ],
                    }),
                    showDropBelow &&
                      jsx('div', {
                        className: 'party-slot-drop-indicator',
                      }),
                  ],
                },
                member.id
              )
            }),
          }),
          jsx('div', {
            className: 'stats-panel-spacer',
          }),
          inspectedPokemon &&
            inspectedSource &&
            jsxs(Fragment, {
              children: [
                jsx(StatsPanel, {
                  pokemon: inspectedPokemon,
                  source: inspectedSource,
                  partyLength: state.party.length,
                  onAction: handleMoveToOther,
                  onClose: () => {
                    ;(setInspected(null), setReleaseConfirm(null))
                  },
                  evolutionInfo,
                  onEvolve: handleEvolve,
                  onRelease: requestRelease,
                  canRelease: canReleaseNow && !releaseConfirm,
                }),
                releaseConfirm &&
                  releaseTarget &&
                  jsxs('div', {
                    className: 'release-confirm',
                    children: [
                      jsxs('span', {
                        children: ['Release ', releaseTarget.name, '?'],
                      }),
                      jsxs('div', {
                        className: 'release-confirm-buttons',
                        children: [
                          jsx('button', {
                            className: 'release-confirm-yes',
                            onClick: confirmRelease,
                            children: 'Yes',
                          }),
                          jsx('button', {
                            className: 'release-confirm-no',
                            onClick: cancelRelease,
                            children: 'No',
                          }),
                        ],
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

export function BoxPanel({
  inspected,
  setInspected,
  setReleaseConfirm,
  dragSource = null,
  boxDragOver = !1,
  boxDragFromIndex = null,
  boxDropTargetIndex = null,
  onBoxDragStart,
  onBoxSlotDragOver,
  onBoxDragOver,
  onBoxDrop,
  onBoxDragLeave,
  onDrop,
  onDragEnd,
}) {
  const { state, dispatch } = useGame(),
    [page, setPage] = React.useState(0),
    [showPokedex, setShowPokedex] = React.useState(!1),
    totalPages = Math.max(1, Math.ceil(state.box.length / BOX_PAGE_SIZE)),
    currentPage = Math.min(page, totalPages - 1),
    toggleInspected = (index) => {
      ;(setReleaseConfirm(null),
        setInspected(
          inspected && inspected.source === 'box' && inspected.id === index
            ? null
            : {
                source: 'box',
                id: index,
              }
        ))
    },
    prevPage = () => setPage((currentPage - 1 + totalPages) % totalPages),
    nextPage = () => setPage((currentPage + 1) % totalPages)
  return jsxs(Fragment, {
    children: [
      jsxs('div', {
        className: `box-container${boxDragOver ? ' drag-over' : ''}`,
        onDragOver: onBoxDragOver,
        onDrop: onBoxDrop,
        onDragLeave: onBoxDragLeave,
        children: [
          jsxs('div', {
            className: 'box-header',
            children: [
              jsx('button', {
                className: 'box-pokedex-btn',
                onClick: () => setShowPokedex(!0),
                children: 'Pokedex',
              }),
              jsx('button', {
                className: 'box-header-arrow',
                onClick: prevPage,
                children: '<',
              }),
              jsxs('span', {
                className: 'box-header-name',
                children: ['Box ', currentPage + 1],
              }),
              jsx('button', {
                className: 'box-header-arrow',
                onClick: nextPage,
                children: '>',
              }),
              jsx('button', {
                className: 'box-sort-btn',
                onClick: () => {
                  ;(dispatch({
                    type: 'SORT_BOX',
                  }),
                    setPage(0))
                },
                children: 'Sort',
              }),
            ],
          }),
          jsx('div', {
            className: 'box-grid-wrapper',
            children: jsx('div', {
              className: 'box-grid',
              children: Array.from(
                {
                  length: BOX_PAGE_SIZE,
                },
                (index, slotIndex) => {
                  const boxIndex = currentPage * BOX_PAGE_SIZE + slotIndex,
                    pokemon = state.box[boxIndex]
                  if (pokemon) {
                    const species = pokemonSpecies[pokemon.speciesKey],
                      isInspected = inspected?.source === 'box' && inspected.id === pokemon.id,
                      isDraggingIndex = dragSource === 'box' && boxDragFromIndex === boxIndex,
                      isDropTarget = boxDropTargetIndex === boxIndex && dragSource !== null,
                      isDraggable = !!onBoxDragStart
                    return jsx(
                      'div',
                      {
                        className: `box-grid-slot filled${isInspected ? ' inspected' : ''}${pokemon.isShiny ? ' shiny-slot' : ''}${isDraggingIndex ? ' dragging' : ''}${isDropTarget ? ' drop-target' : ''}`,
                        onClick: () => toggleInspected(pokemon.id),
                        title: `${pokemon.name} Lv${pokemon.level}`,
                        draggable: isDraggable,
                        onDragStart: onBoxDragStart ? (event) => onBoxDragStart(event, boxIndex, pokemon.id) : void 0,
                        onDragOver: onBoxSlotDragOver ? (event) => onBoxSlotDragOver(event, boxIndex) : void 0,
                        onDrop,
                        onDragEnd,
                        children: jsx('img', {
                          src: getPokemonSpriteUrl(species.id, !1, pokemon.isShiny),
                          onError: (event) =>
                            (event.target.src = getPokemonSpriteFallbackUrl(species.id, !1, pokemon.isShiny)),
                          alt: pokemon.name,
                          style: {
                            imageRendering: 'pixelated',
                          },
                        }),
                      },
                      pokemon.id
                    )
                  }
                  return jsx(
                    'div',
                    {
                      className: `box-grid-slot${boxDropTargetIndex === boxIndex && dragSource !== null ? ' drop-target' : ''}`,
                      onDragOver: onBoxSlotDragOver
                        ? (event) =>
                            onBoxSlotDragOver(
                              event,
                              Math.min(
                                boxIndex,
                                state.box.length > 0 ? state.box.length - 1 : 0
                              )
                            )
                        : void 0,
                      onDrop,
                    },
                    `empty-${slotIndex}`
                  )
                }
              ),
            }),
          }),
        ],
      }),
      showPokedex &&
        jsx(PokedexModal, {
          onClose: () => setShowPokedex(!1),
        }),
    ],
  })
}

export function PartyBoxPanel() {
  const { state, dispatch } = useGame(),
    [inspected, setInspected] = React.useState(null),
    [releaseConfirm, setReleaseConfirm] = React.useState(null),
    [partyDragIndex, setPartyDragIndex] = React.useState(null),
    [dragSource, setDragSource] = React.useState(null),
    [dropTargetIndex, setDropTargetIndex] = React.useState(null),
    [dropPosition, setDropPosition] = React.useState(null),
    [boxDragOver, setBoxDragOver] = React.useState(!1),
    [boxDragIndex, setBoxDragIndex] = React.useState(null),
    [boxDropTargetIndex, setBoxDropTargetIndex] = React.useState(null),
    dragRef = React.useRef({
      ...initialDragState,
    }),
    resetDrag = React.useCallback(() => {
      ;((dragRef.current = {
        ...initialDragState,
      }),
        setPartyDragIndex(null),
        setDragSource(null),
        setDropTargetIndex(null),
        setDropPosition(null),
        setBoxDragOver(!1),
        setBoxDragIndex(null),
        setBoxDropTargetIndex(null))
    }, []),
    handlePartyDragStart = React.useCallback((event, fromIndex, pokemonId) => {
      ;((event.dataTransfer.effectAllowed = 'move'),
        event.dataTransfer.setData('text/plain', String(fromIndex)),
        setPartyDragIndex(fromIndex),
        setDragSource('party'),
        (dragRef.current = {
          ...initialDragState,
          source: 'party',
          fromIndex,
          pokemonId,
        }))
    }, []),
    handleBoxDragStart = React.useCallback((event, fromIndex, pokemonId) => {
      ;((event.dataTransfer.effectAllowed = 'move'),
        event.dataTransfer.setData('text/plain', String(fromIndex)),
        setBoxDragIndex(fromIndex),
        setDragSource('box'),
        (dragRef.current = {
          ...initialDragState,
          source: 'box',
          fromIndex,
          pokemonId,
        }))
    }, []),
    handlePartyDragOver = React.useCallback((event, targetIndex) => {
      ;(event.preventDefault(), (event.dataTransfer.dropEffect = 'move'))
      const rect = event.currentTarget.getBoundingClientRect(),
        midpoint = rect.top + rect.height / 2,
        position = event.clientY < midpoint ? 'above' : 'below'
      ;(setDropTargetIndex(targetIndex),
        setDropPosition(position),
        setBoxDragOver(!1),
        setBoxDropTargetIndex(null),
        (dragRef.current.target = 'party'),
        (dragRef.current.targetIndex = targetIndex),
        (dragRef.current.position = position),
        (dragRef.current.droppedOnBoxContainer = !1))
    }, []),
    handleBoxSlotDragOver = React.useCallback((event, targetIndex) => {
      ;(event.preventDefault(),
        event.stopPropagation(),
        (event.dataTransfer.dropEffect = 'move'),
        setBoxDropTargetIndex(targetIndex),
        setDropTargetIndex(null),
        setDropPosition(null),
        setBoxDragOver(!1),
        (dragRef.current.target = 'box'),
        (dragRef.current.targetIndex = targetIndex),
        (dragRef.current.droppedOnBoxContainer = !1))
    }, []),
    preventDefault = React.useCallback((event) => {
      event.preventDefault()
    }, []),
    handleDrop = React.useCallback(() => {
      const {
        source,
        fromIndex,
        pokemonId,
        target,
        targetIndex,
        position,
        droppedOnBoxContainer,
      } = dragRef.current
      if (source === 'party')
        if (droppedOnBoxContainer && fromIndex >= 0)
          dispatch({
            type: 'PARTY_TO_BOX',
            payload: {
              partyIndex: fromIndex,
            },
          })
        else if (target === 'party' && pokemonId && fromIndex >= 0 && targetIndex !== null && position !== null) {
          let toIndex = position === 'below' ? targetIndex + 1 : targetIndex
          ;(fromIndex < toIndex && (toIndex -= 1),
            (toIndex = Math.max(0, Math.min(toIndex, state.party.length - 1))),
            fromIndex !== toIndex &&
              dispatch({
                type: 'REORDER_PARTY',
                payload: {
                  pokemonId,
                  toIndex,
                },
              }))
        } else
          target === 'box' &&
            fromIndex >= 0 &&
            dispatch({
              type: 'PARTY_TO_BOX',
              payload: {
                partyIndex: fromIndex,
              },
            })
      else if (source === 'box') {
        if (target === 'box' && targetIndex !== null && pokemonId && fromIndex !== targetIndex)
          dispatch({
            type: 'REORDER_BOX',
            payload: {
              pokemonId,
              toIndex: targetIndex,
            },
          })
        else if (target === 'party' && targetIndex !== null && pokemonId) {
          const boxIndex = state.box.findIndex((member) => member.id === pokemonId)
          boxIndex >= 0 &&
            (state.party.length < 6
              ? dispatch({
                  type: 'BOX_TO_PARTY',
                  payload: {
                    boxIndex,
                  },
                })
              : dispatch({
                  type: 'SWAP_PARTY_BOX',
                  payload: {
                    partyIndex: targetIndex,
                    boxIndex,
                  },
                }))
        }
      }
      resetDrag()
    }, [state.party.length, state.box, dispatch, resetDrag]),
    handleBoxDragOver = React.useCallback((event) => {
      ;(event.preventDefault(),
        (event.dataTransfer.dropEffect = 'move'),
        dragRef.current.source === 'party' &&
          (setBoxDragOver(!0),
          (dragRef.current.droppedOnBoxContainer = !0),
          (dragRef.current.target = 'box'),
          (dragRef.current.targetIndex = null)))
    }, []),
    handleBoxDrop = React.useCallback((event) => {
      event.preventDefault()
    }, []),
    handleBoxDragLeave = React.useCallback(() => {
      ;(setBoxDragOver(!1), (dragRef.current.droppedOnBoxContainer = !1))
    }, [])
  return jsxs('div', {
    className: 'side-panel left-panel',
    children: [
      jsx(PartyPanel, {
        inspected,
        setInspected,
        releaseConfirm,
        setReleaseConfirm,
        dragSource,
        dragFromIndex: partyDragIndex,
        dropTargetIndex,
        dropPosition,
        onDragStart: handlePartyDragStart,
        onDragOver: handlePartyDragOver,
        onDrop: preventDefault,
        onDragEnd: handleDrop,
      }),
      jsx(BoxPanel, {
        inspected,
        setInspected,
        setReleaseConfirm,
        dragSource,
        boxDragOver,
        boxDragFromIndex: boxDragIndex,
        boxDropTargetIndex,
        onBoxDragStart: handleBoxDragStart,
        onBoxSlotDragOver: handleBoxSlotDragOver,
        onBoxDragOver: handleBoxDragOver,
        onBoxDrop: handleBoxDrop,
        onBoxDragLeave: handleBoxDragLeave,
        onDrop: preventDefault,
        onDragEnd: handleDrop,
      }),
    ],
  })
}
