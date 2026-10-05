// Game state provider: wires the reducer to React and autosaves it.

import React from 'react'
import { jsx } from 'react/jsx-runtime'
import { gameReducer, initialGameState } from './reducer.js'
import { SAVED_STATE_KEYS, autosaveSave, loadSavedState, resolveBootSlot } from './save.js'
import { SETTINGS_KEYS, mergeStoredSettings, setSpriteStyle, storeSettings } from './settings.js'

/** @type {React.Context<{ state: GameState, dispatch: (action: GameAction) => void } | null>} */
const GameContext = React.createContext(
  /** @type {{ state: GameState, dispatch: (action: GameAction) => void } | null} */ (null)
)

/**
 * The background autosave writes the whole save through `JSON.stringify` +
 * `localStorage.setItem`, which is synchronous. An idle loop finishing a battle
 * every few hundred milliseconds used to trigger one of those on each phase
 * change, so the write is throttled to at most once per second, with a trailing
 * save so the latest state always lands.
 */
const AUTOSAVE_THROTTLE_MS = 1000

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
  // Latest committed state, so a trailing save writes the newest progress
  // rather than the snapshot that scheduled it.
  const latestStateRef = React.useRef(state)
  // Keep the sprite-style cache in step before children render, so a toggle
  // takes effect on the same render rather than the next state change.
  setSpriteStyle(state.spriteStyle)
  React.useEffect(() => {
    latestStateRef.current = state
  })
  const lastAutosaveRef = React.useRef(0),
    autosaveTimerRef = React.useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))
  // Clear a pending trailing save if the provider ever unmounts.
  React.useEffect(
    () => () => {
      autosaveTimerRef.current && clearTimeout(autosaveTimerRef.current)
    },
    []
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
      if (!(state.playerPokemon && (state.phase === 'idle' || state.phase === 'victory'))) return
      const elapsed = Date.now() - lastAutosaveRef.current
      if (elapsed >= AUTOSAVE_THROTTLE_MS) {
        lastAutosaveRef.current = Date.now()
        autosaveSave(state)
        return
      }
      if (autosaveTimerRef.current) return
      autosaveTimerRef.current = setTimeout(() => {
        autosaveTimerRef.current = null
        const latest = latestStateRef.current
        if (latest.playerPokemon && (latest.phase === 'idle' || latest.phase === 'victory')) {
          lastAutosaveRef.current = Date.now()
          autosaveSave(latest)
        }
      }, AUTOSAVE_THROTTLE_MS - elapsed)
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
