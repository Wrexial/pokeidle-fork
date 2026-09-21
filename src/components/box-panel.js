// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { BOX_PAGE_SIZE } from '../data/ui.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getPokemonSpriteFallbackUrl, getPokemonSpriteUrl } from '../game/pokemon.js'
import { PokedexModal } from './pokedex-modal.js'
import { RecordsModal } from './records-modal.js'
import { DaycareModal } from './daycare-modal.js'

/** @param {{ inspected: Inspected, setInspected: (value: Inspected) => void, setReleaseConfirm: (value: string | null) => void, dragSource?: 'party' | 'box' | null, boxDragOver?: boolean, boxDragFromIndex?: number | null, boxDropTargetIndex?: number | null, onBoxDragStart?: any, onBoxSlotDragOver?: any, onBoxDragOver?: any, onBoxDrop?: any, onBoxDragLeave?: any, onDrop?: any, onDragEnd?: any }} props */
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
    [showRecords, setShowRecords] = React.useState(!1),
    [showDaycare, setShowDaycare] = React.useState(!1),
    totalPages = Math.max(1, Math.ceil(state.box.length / BOX_PAGE_SIZE)),
    currentPage = Math.min(page, totalPages - 1),
    toggleInspected = /** @param {string} index */ (index) => {
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
              jsxs('div', {
                className: 'box-header-actions',
                children: [
                  jsx('button', {
                    className: 'box-pokedex-btn',
                    onClick: () => setShowPokedex(!0),
                    children: 'Pokedex',
                  }),
                  jsx('button', {
                    className: 'box-pokedex-btn',
                    onClick: () => setShowRecords(!0),
                    children: 'Records',
                  }),
                  jsx('button', {
                    className: 'box-pokedex-btn',
                    onClick: () => setShowDaycare(!0),
                    children: 'Daycare',
                  }),
                ],
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
                        onDragStart: onBoxDragStart ? /** @param {React.DragEvent} event */ (event) => onBoxDragStart(event, boxIndex, pokemon.id) : void 0,
                        onDragOver: onBoxSlotDragOver ? /** @param {React.DragEvent} event */ (event) => onBoxSlotDragOver(event, boxIndex) : void 0,
                        onDrop,
                        onDragEnd,
                        children: jsx('img', {
                          src: getPokemonSpriteUrl(species.id, !1, pokemon.isShiny),
                          onError: /** @param {{ target: HTMLImageElement }} event */ (event) =>
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
                        ? /** @param {React.DragEvent} event */ (event) =>
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
      showRecords &&
        jsx(RecordsModal, {
          onClose: () => setShowRecords(!1),
        }),
      showDaycare &&
        jsx(DaycareModal, {
          onClose: () => setShowDaycare(!1),
        }),
    ],
  })
}
