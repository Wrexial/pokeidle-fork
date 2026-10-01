// Lightweight UI state shared by panels that don't live in the same subtree:
// the Pokédex selection (so it survives tab swaps) and a request to jump to
// the Box with its search pre-filled from the Pokédex.

import React from 'react'
import { jsx } from 'react/jsx-runtime'

/**
 * @typedef {{
 *   pokedexSelected: string | null,
 *   setPokedexSelected: (value: string | null) => void,
 *   pokedexGen: number,
 *   setPokedexGen: (value: number) => void,
 *   boxSearch: string | null,
 *   openBoxSearch: (name: string) => void,
 *   clearBoxSearch: () => void,
 * }} UiState
 */

/** @type {React.Context<UiState | null>} */
const UiContext = React.createContext(/** @type {UiState | null} */ (null))

/** @param {{ children: any }} props */
export function UiProvider({ children }) {
  const [pokedexSelected, setPokedexSelected] = React.useState(
      /** @type {string | null} */ (null)
    ),
    [pokedexGen, setPokedexGen] = React.useState(0),
    [boxSearch, setBoxSearch] = React.useState(/** @type {string | null} */ (null)),
    openBoxSearch = React.useCallback(
      /** @param {string} name */ (name) => setBoxSearch(name),
      []
    ),
    clearBoxSearch = React.useCallback(() => setBoxSearch(null), []),
    value = React.useMemo(
      () => ({
        pokedexSelected,
        setPokedexSelected,
        pokedexGen,
        setPokedexGen,
        boxSearch,
        openBoxSearch,
        clearBoxSearch,
      }),
      [pokedexSelected, pokedexGen, boxSearch, openBoxSearch, clearBoxSearch]
    )
  return jsx(UiContext.Provider, {
    value,
    children,
  })
}

/** @returns {UiState} */
export function useUi() {
  const context = React.useContext(UiContext)
  if (!context) throw new Error('useUi must be used within UiProvider')
  return context
}
