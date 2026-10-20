// Lightweight UI state shared by panels that don't live in the same subtree:
// the Pokédex selection (so it survives tab swaps and the Box can filter to it)
// and a "show the Town Map" request the unlock popup can raise after a Champion
// win (on phones the map is a tab, so only MobileTabs can act on it).

import React from 'react'
import { jsx } from 'react/jsx-runtime'

/**
 * @typedef {{
 *   pokedexSelected: string | null,
 *   setPokedexSelected: (value: string | null) => void,
 *   pokedexGen: number,
 *   setPokedexGen: (value: number) => void,
 *   mapRequest: number,
 *   requestMap: () => void,
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
    // A counter rather than a boolean so every request is a fresh signal; the
    // mobile tab swaps to the map each time it changes.
    [mapRequest, setMapRequest] = React.useState(0),
    requestMap = React.useCallback(() => setMapRequest((pending) => pending + 1), []),
    value = React.useMemo(
      () => ({
        pokedexSelected,
        setPokedexSelected,
        pokedexGen,
        setPokedexGen,
        mapRequest,
        requestMap,
      }),
      [pokedexSelected, pokedexGen, mapRequest, requestMap]
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
