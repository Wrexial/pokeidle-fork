// Game state provider: wires the reducer to React and autosaves it.

import React from 'react'
import { jsx } from 'react/jsx-runtime'
import { gameReducer, initialGameState } from './reducer.js'
import { SAVED_STATE_KEYS, loadSavedState, persistSave } from './save.js'

/** @type {React.Context<{ state: GameState, dispatch: (action: GameAction) => void } | null>} */
const GameContext = React.createContext(
  /** @type {{ state: GameState, dispatch: (action: GameAction) => void } | null} */ (null)
)

/** @param {{ children: any }} props */
export function GameProvider({ children }) {
  const [state, dispatch] = React.useReducer(
    gameReducer,
    initialGameState,
    /** @returns {GameState} */ () => loadSavedState() ?? initialGameState
  )
  return (
    React.useEffect(() => {
      if (state.playerPokemon && (state.phase === 'idle' || state.phase === 'victory')) {
        persistSave(state)
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
