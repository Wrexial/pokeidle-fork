// Split from a grouped component file.

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { BOX_PAGE_SIZE, BOX_SORT_DIRECTIONS, BOX_SORT_FIELDS } from '../data/ui.js'
import { baseSpeciesKey, isSpeciesRegistered, pokemonSpecies } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { useUi } from '../game/ui-context.js'
import { getEggSpriteUrl, getPokemonSpriteFallbackUrl, getPokemonSpriteUrl, isAlphaPokemon, nextBoxSortField, parseBoxSort, pokemonDisplayName, toggleBoxSortDirection } from '../game/pokemon.js'
import { isFemalePokemon } from '../game/breeding.js'
import { fuzzyNameMatch, normalizeSearchName, speciesMatchingSearch } from '../game/species-search.js'
import { itemTooltip } from '../game/progression.js'
import { ItemIcon } from './item-icon.js'
import { SegmentedControl } from './ui-controls.js'

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
    { pokedexSelected } = useUi(),
    [page, setPage] = React.useState(0),
    [query, setQuery] = React.useState(''),
    [filterMode, setFilterMode] = React.useState('all'),
    [confirmDupes, setConfirmDupes] = React.useState(!1),
    [confirmFiltered, setConfirmFiltered] = React.useState(!1),
    [searchOpen, setSearchOpen] = React.useState(!1),
    dexSeenSet = React.useMemo(
      () => new Set([...state.pokedexSeen, ...state.pokedexCaught]),
      [state.pokedexSeen, state.pokedexCaught]
    ),
    searchActive = query.trim() !== '' || filterMode !== 'all',
    visibleBox = React.useMemo(() => {
      if (!searchActive) return state.box
      const needle = normalizeSearchName(query),
        familyMatches = speciesMatchingSearch(query)
      return state.box.filter((pokemon) => {
        if (filterMode === 'shiny' && (!pokemon.isShiny || pokemon.isEgg)) return false
        if (filterMode === 'favourite' && !pokemon.favourite) return false
        if (!needle) return true
        // Never let a search reveal a hidden egg's species.
        if (pokemon.isEgg) return 'egg'.includes(needle)
        // Match the Pokemon's own name, or any species in its evolution family
        // (so searching "Bulbasaur" also surfaces Ivysaur and Venusaur).
        return (
          fuzzyNameMatch(pokemon.nickname ?? '', needle) ||
          fuzzyNameMatch(pokemon.name, needle) ||
          Boolean(familyMatches?.has(pokemon.speciesKey))
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
    nextPage = () => setPage((currentPage + 1) % totalPages),
    boxSort = parseBoxSort(state.boxSort),
    boxSortFieldLabel =
      BOX_SORT_FIELDS.find((option) => option.value === boxSort.field)?.label ?? 'Dex',
    boxSortDirection =
      BOX_SORT_DIRECTIONS.find((option) => option.value === boxSort.direction) ??
      BOX_SORT_DIRECTIONS[0],
    // The Box follows the Pokédex: selecting a seen species filters the box to
    // it (by base name, so every regional form matches). An unseen slot is left
    // alone, so clicking a "???" entry can't reveal its name through the Box
    // search.
    dexSearchName =
      pokedexSelected && isSpeciesRegistered(dexSeenSet, pokedexSelected)
        ? pokemonSpecies[baseSpeciesKey(pokedexSelected)]?.name ?? null
        : null
  // Remember the query the Pokédex set, so closing the entry only clears the
  // auto-search and leaves a manual Box search alone.
  const appliedDexName = React.useRef('')
  React.useEffect(() => {
    if (!dexSearchName) {
      const applied = appliedDexName.current
      appliedDexName.current = ''
      setQuery((current) => (current === applied ? '' : current))
      return
    }
    appliedDexName.current = dexSearchName
    ;(setSearchOpen(true), setQuery(dexSearchName), setFilterMode('all'), setPage(0))
  }, [dexSearchName])
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
                    onClick: () => setConfirmDupes(!0),
                    children: 'Release Dupes',
                  }),
                  searchActive &&
                    visibleBox.length > 0 &&
                    jsx('button', {
                      className: 'box-pokedex-btn box-release-filtered-btn',
                      onClick: () => setConfirmFiltered(!0),
                      children: `Release Found (${visibleBox.length})`,
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
              jsxs('div', {
                className: 'box-sort-group',
                children: [
                  jsx('button', {
                    className: 'box-sort-btn',
                    title: 'Cycle the sort field',
                    onClick: () => {
                      ;(dispatch({
                        type: 'SET_BOX_SORT',
                        payload: { boxSort: nextBoxSortField(state.boxSort) },
                      }),
                        setPage(0))
                    },
                    children: `Sort: ${boxSortFieldLabel}`,
                  }),
                  jsx('button', {
                    className: 'box-sort-btn box-sort-mode-btn',
                    title: `Sort direction: ${boxSortDirection.title}`,
                    onClick: () => {
                      ;(dispatch({
                        type: 'SET_BOX_SORT',
                        payload: { boxSort: toggleBoxSortDirection(state.boxSort) },
                      }),
                        setPage(0))
                    },
                    children: `Mode: ${boxSortDirection.label}`,
                  }),
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
              jsx(SegmentedControl, {
                options: [
                  { value: 'all', label: 'All' },
                  { value: 'shiny', label: 'Shiny' },
                  { value: 'favourite', label: 'Fav' },
                ],
                value: filterMode,
                onChange: /** @param {string} next */ (next) => {
                  setFilterMode(next)
                  setPage(0)
                },
                compact: true,
                className: 'box-filter-segmented',
                'aria-label': 'Box filter',
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
          confirmFiltered &&
            jsxs('div', {
              className: 'release-confirm',
              children: [
                jsx('span', {
                  children: `Release all ${visibleBox.length} Pokemon currently shown? Favourites and shinies are protected.`,
                }),
                jsxs('div', {
                  className: 'release-confirm-buttons',
                  children: [
                    jsx('button', {
                      className: 'release-confirm-yes',
                      onClick: () => {
                        dispatch({
                          type: 'RELEASE_FILTERED',
                          payload: { ids: visibleBox.map((member) => member.id) },
                        })
                        setConfirmFiltered(!1)
                      },
                      children: 'Release',
                    }),
                    jsx('button', {
                      className: 'release-confirm-no',
                      onClick: () => setConfirmFiltered(!1),
                      children: 'Cancel',
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
                        children: jsxs('div', {
                          className: 'box-sprite-wrap',
                          children: [
                            jsx('img', {
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
                            !pokemon.isEgg &&
                              pokemon.heldItem &&
                              jsx('span', {
                                className: 'box-held-item',
                                'data-tooltip': itemTooltip(pokemon.heldItem),
                                children: jsx(ItemIcon, {
                                  itemId: pokemon.heldItem,
                                  size: 12,
                                }),
                              }),
                            !pokemon.isEgg &&
                              isAlphaPokemon(pokemon) &&
                              jsx('span', {
                                className: 'box-alpha-marker',
                                'data-tooltip': 'Alpha \u2014 a huge specimen (boosts EXP)',
                                children: '\u2605',
                              }),
                          ],
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
    ],
  })
}
