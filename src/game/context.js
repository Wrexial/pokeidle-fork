// Game state provider: wires the reducer to React and autosaves it.

import React from 'react'
import { jsx } from 'react/jsx-runtime'
import { gameReducer, initialGameState } from './reducer.js'
import { SAVED_STATE_KEYS, autosaveSave, loadSavedState, resolveBootSlot } from './save.js'
import { SETTINGS_KEYS, mergeStoredSettings, storeSettings } from './settings.js'

/** @type {React.Context<{ state: GameState, dispatch: (action: GameAction) => void } | null>} */
const GameContext = React.createContext(
  /** @type {{ state: GameState, dispatch: (action: GameAction) => void } | null} */ (null)
)

/** @param {{ children: any }} props */
export function GameProvider({ children }) {
  const [state, dispatch] = React.useReducer(
    gameReducer,
    initialGameState,
    /** @returns {GameState} */ () => {
      const slot = resolveBootSlot()
      return mergeStoredSettings((slot ? loadSavedState(slot) : null) ?? initialGameState)
    }
  )
  // Preferences live in their own storage key so they outlive a save reset.
  // Writing on change (rather than every autosave) keeps it cheap. Skip the
  // write while the slot-picker is up: the fresh defaults would otherwise
  // override the settings the chosen save migrates in.
  React.useEffect(() => {
    if (resolveBootSlot() !== null) storeSettings(state)
  }, SETTINGS_KEYS.map((key) => state[key]))
  return (
    React.useEffect(() => {
      if (state.playerPokemon && (state.phase === 'idle' || state.phase === 'victory')) {
        autosaveSave(state)
      }
      // Autosave whenever the phase or any persisted slice changes. The field
      // list comes from SAVED_STATE_KEYS, so a new save field is tracked here
      // automatically instead of having to be added to a hand-written list.
    }, [state.phase, ...SAVED_STATE_KEYS.map((key) => state[key])]),
    jsx(GameContext.Provider, {
      value: {
        state,
        dispatch,
      },
      children,
    })
  )
}

/** @returns {{ state: GameState, dispatch: (action: GameAction) => void }} */
export function useGame() {
  const context = React.useContext(GameContext)
  if (!context) throw new Error('useGame must be used within GameProvider')
  return context
}

// Re-exported so the save-repair tests (which import from the provider module)
// keep working without pulling save.js in directly.
export { loadSavedState, repairSave, serializeSave } from './save.js'
