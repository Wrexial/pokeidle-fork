// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { evolutionItems } from '../data/items.js'
import { evolutionData, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { genderForPokemon } from '../game/breeding.js'
import { ExpBar } from './exp-bar.js'
import { HpBar } from './hp-bar.js'
import { StatsPanel } from './stats-panel.js'

/** @param {{ inspected: Inspected, setInspected: (value: Inspected) => void, releaseConfirm: string | null, setReleaseConfirm: (value: string | null) => void, dragSource?: 'party' | 'box' | null, dragFromIndex?: number | null, dropTargetIndex?: number | null, dropPosition?: 'above' | 'below' | null, onDragStart?: any, onDragOver?: any, onDrop?: any, onDragEnd?: any }} props */
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
  /** @type {Pokemon | null} */
  let inspectedPokemon = null
  let inspectedIndex = -1
  /** @type {'party' | 'box' | null} */
  let inspectedSource = null
  inspected &&
    (inspected.source === 'party'
      ? ((inspectedIndex = state.party.findIndex((memberId) => memberId.id === inspected.id)),
        inspectedIndex >= 0 && ((inspectedPokemon = state.party[inspectedIndex]), (inspectedSource = 'party')))
      : ((inspectedIndex = state.box.findIndex((memberId) => memberId.id === inspected.id)),
        inspectedIndex >= 0 && ((inspectedPokemon = state.box[inspectedIndex]), (inspectedSource = 'box'))))
  const handleSelect = React.useCallback(
      /** @param {string} partyIndex */ (partyIndex) => {
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
          entries: evolutionChain
            // Gender variants (Basculegion/Oinkologne) only offer the form that
            // matches this Pokemon's gender.
            .filter(
              (evolution) =>
                !evolution.gender || evolution.gender === genderForPokemon(inspectedPokemon)
            )
            .map((evolution) => {
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
      /** @param {number} evolutionEntry */ (evolutionEntry) => {
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
                      onDragStart: onDragStart ? /** @param {React.DragEvent} event */ (event) => onDragStart(event, index, member.id) : void 0,
                      onDragOver: onDragOver ? /** @param {React.DragEvent} event */ (event) => onDragOver(event, index) : void 0,
                      onDrop,
                      onDragEnd,
                      children: [
                        jsx('img', {
                          className: 'party-sprite',
                          src: getPokemonSpriteUrl(species.id, !1, member.isShiny),
                          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
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
