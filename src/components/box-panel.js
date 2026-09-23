// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { BOX_PAGE_SIZE, BOX_SORT_OPTIONS } from '../data/ui.js'
import { pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { getEggSpriteUrl, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, pokemonDisplayName } from '../game/pokemon.js'
import { isFemalePokemon } from '../game/breeding.js'
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
    [query, setQuery] = React.useState(''),
    [filterMode, setFilterMode] = React.useState('all'),
    [confirmDupes, setConfirmDupes] = React.useState(!1),
    [searchOpen, setSearchOpen] = React.useState(!1),
    searchActive = query.trim() !== '' || filterMode !== 'all',
    visibleBox = React.useMemo(() => {
      if (!searchActive) return state.box
      const needle = query.trim().toLowerCase()
      return state.box.filter((pokemon) => {
        if (filterMode === 'shiny' && (!pokemon.isShiny || pokemon.isEgg)) return false
        if (filterMode === 'favourite' && !pokemon.favourite) return false
        if (!needle) return true
        // Never let a search reveal a hidden egg's species.
        if (pokemon.isEgg) return 'egg'.includes(needle)
        const speciesName = pokemonSpecies[pokemon.speciesKey]?.name ?? pokemon.name
        return (
          (pokemon.nickname ?? '').toLowerCase().includes(needle) ||
          pokemon.name.toLowerCase().includes(needle) ||
          speciesName.toLowerCase().includes(needle)
        )
      })
    }, [state.box, query, filterMode, searchActive]),
    totalPages = Math.max(1, Math.ceil(visibleBox.length / BOX_PAGE_SIZE)),
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
                  jsx('button', {
                    className: 'box-pokedex-btn',
                    onClick: () => setConfirmDupes(!0),
                    children: 'Release Dupes',
                  }),
                  jsx('button', {
                    className: `box-pokedex-btn${searchActive ? ' active' : ''}`,
                    onClick: () => {
                      // Collapsing the search clears it so the box isn't left
                      // filtered with the controls hidden.
                      if (searchOpen) {
                        setQuery('')
                        setFilterMode('all')
                        setPage(0)
                      }
                      setSearchOpen(!searchOpen)
                    },
                    children: 'Search',
                  }),
                ],
              }),
              jsxs('div', {
                className: 'box-header-pager',
                children: [
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
                ],
              }),
              jsx('button', {
                className: 'box-sort-btn',
                title: 'Cycle box sort mode',
                onClick: () => {
                  ;(dispatch({
                    type: 'SET_BOX_SORT',
                  }),
                    setPage(0))
                },
                children: [
                  'Sort: ',
                  BOX_SORT_OPTIONS.find((option) => option.value === state.boxSort)?.label ?? 'Dex',
                ],
              }),
            ],
          }),
          searchOpen &&
          jsxs('div', {
            className: 'box-search',
            children: [
              jsx('input', {
                className: 'box-search-input',
                type: 'text',
                placeholder: 'Search box\u2026',
                value: query,
                onChange: /** @param {React.ChangeEvent<HTMLInputElement>} event */ (event) => {
                  setQuery(event.target.value)
                  setPage(0)
                },
              }),
              jsx('button', {
                className: `box-filter-btn${filterMode === 'all' ? ' active' : ''}`,
                onClick: () => {
                  setFilterMode('all')
                  setPage(0)
                },
                children: 'All',
              }),
              jsx('button', {
                className: `box-filter-btn${filterMode === 'shiny' ? ' active' : ''}`,
                onClick: () => {
                  setFilterMode('shiny')
                  setPage(0)
                },
                children: 'Shiny',
              }),
              jsx('button', {
                className: `box-filter-btn${filterMode === 'favourite' ? ' active' : ''}`,
                onClick: () => {
                  setFilterMode('favourite')
                  setPage(0)
                },
                children: 'Fav',
              }),
              searchActive
                ? jsx('span', {
                    className: 'box-search-count',
                    children: `${visibleBox.length} found`,
                  })
                : null,
            ],
          }),
          confirmDupes &&
            jsxs('div', {
              className: 'release-confirm',
              children: [
                jsx('span', {
                  children:
                    'Release duplicates? Keeps your best of each species and protects favourites and shinies.',
                }),
                jsxs('div', {
                  className: 'release-confirm-buttons',
                  children: [
                    jsx('button', {
                      className: 'release-confirm-yes',
                      onClick: () => {
                        dispatch({ type: 'RELEASE_DUPLICATES' })
                        setConfirmDupes(!1)
                      },
                      children: 'Yes',
                    }),
                    jsx('button', {
                      className: 'release-confirm-no',
                      onClick: () => setConfirmDupes(!1),
                      children: 'No',
                    }),
                  ],
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
                  const slotIndexAbsolute = currentPage * BOX_PAGE_SIZE + slotIndex,
                    pokemon = visibleBox[slotIndexAbsolute],
                    // The real box index (not the filtered position), so drag
                    // to the party / reordering still works while searching.
                    boxIndex = pokemon
                      ? state.box.findIndex((member) => member.id === pokemon.id)
                      : slotIndexAbsolute
                  if (pokemon) {
                    const species = pokemonSpecies[pokemon.speciesKey],
                      isInspected = inspected?.source === 'box' && inspected.id === pokemon.id,
                      isDraggingIndex = dragSource === 'box' && boxDragFromIndex === boxIndex,
                      isDropTarget = boxDropTargetIndex === boxIndex && dragSource !== null,
                      isDraggable = !!onBoxDragStart
                    return jsx(
                      'div',
                      {
                        className: `box-grid-slot filled${isInspected ? ' inspected' : ''}${pokemon.isShiny && !pokemon.isEgg ? ' shiny-slot' : ''}${isDraggingIndex ? ' dragging' : ''}${isDropTarget ? ' drop-target' : ''}`,
                        onClick: () => toggleInspected(pokemon.id),
                        title: pokemon.isEgg
                          ? `Egg \u00b7 hatches in ${pokemon.eggStepsRemaining ?? 0}`
                          : `${pokemonDisplayName(pokemon)} Lv${pokemon.level}`,
                        draggable: isDraggable,
                        onDragStart: isDraggable ? /** @param {React.DragEvent} event */ (event) => onBoxDragStart(event, boxIndex, pokemon.id) : void 0,
                        onDragOver: onBoxSlotDragOver ? /** @param {React.DragEvent} event */ (event) => onBoxSlotDragOver(event, boxIndex) : void 0,
                        onDrop,
                        onDragEnd,
                        children: jsx('img', {
                          src: pokemon.isEgg
                            ? getEggSpriteUrl()
                            : getPokemonSpriteUrl(
                                species.id,
                                !1,
                                pokemon.isShiny,
                                isFemalePokemon(pokemon)
                              ),
                          onError: pokemon.isEgg
                            ? void 0
                            : /** @param {{ target: HTMLImageElement }} event */ (event) =>
                                (event.target.src = getPokemonSpriteFallbackUrl(
                                  species.id,
                                  !1,
                                  pokemon.isShiny,
                                  isFemalePokemon(pokemon)
                                )),
                          alt: pokemon.isEgg ? 'Egg' : pokemon.name,
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
                      onDragOver: onBoxSlotDragOver && !searchActive
                        ? /** @param {React.DragEvent} event */ (event) =>
                            onBoxSlotDragOver(
                              event,
                              Math.min(
                                boxIndex,
                                visibleBox.length > 0 ? visibleBox.length - 1 : 0
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
