// Settings panel for the rebindable global hotkeys. Split from
// settings-modal.js.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { KEYBINDING_ACTIONS, DEFAULT_KEYBINDINGS, keyForEvent, keyLabel } from '../data/keybindings.js'
import { useGame } from '../game/context.js'

export function KeybindingsPanel() {
  const { state, dispatch } = useGame()
  const [capturing, setCapturing] = React.useState(/** @type {string | null} */ (null))
  const bindings = state.keybindings ?? DEFAULT_KEYBINDINGS
  React.useEffect(() => {
    if (!capturing) return
    // Capture phase, and stop the event: this runs before the bubble-phase
    // global hotkey listener, so rebinding a key never also fires its old
    // action. Escape cancels without changing anything.
    const handleKeyDown = /** @param {KeyboardEvent} event */ (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') {
        setCapturing(null)
        return
      }
      const key = keyForEvent(event)
      if (!key) return
      dispatch({ type: 'SET_KEYBINDING', payload: { actionId: capturing, key } })
      setCapturing(null)
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [capturing, dispatch])
  // Flag any key bound to more than one action, so an accidental clash is
  // visible instead of silently only ever firing the first match.
  /** @type {Map<string, number>} */
  const keyCounts = new Map()
  for (const action of KEYBINDING_ACTIONS) {
    const key = bindings[action.id] ?? action.defaultKey
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1)
  }
  const hasConflict = [...keyCounts.values()].some((count) => count > 1)
  return jsxs('div', {
    className: 'settings-section',
    children: [
      jsx('div', {
        className: 'settings-section-title',
        children: 'Keybindings',
      }),
      jsx('p', {
        className: 'settings-hint',
        children:
          'Rebind the global hotkeys for the main battle screen. Click a key, then press the new one; Escape cancels. Hotkeys stay off while a minigame or a text field has the keyboard, and a modifier combo only fires the exact binding (so Ctrl+C still copies).',
      }),
      jsx('div', {
        className: 'keybind-list',
        children: KEYBINDING_ACTIONS.map((action) => {
          const key = bindings[action.id] ?? action.defaultKey,
            isCapturing = capturing === action.id,
            isConflict = (keyCounts.get(key) ?? 0) > 1
          return jsxs(
            'div',
            {
              className: 'keybind-row',
              children: [
                jsxs('div', {
                  className: 'keybind-info',
                  children: [
                    jsx('span', {
                      className: 'keybind-label',
                      children: action.label,
                    }),
                    jsx('span', {
                      className: 'keybind-description',
                      children: action.description,
                    }),
                  ],
                }),
                jsx('button', {
                  type: 'button',
                  className: `keybind-key${isCapturing ? ' capturing' : ''}${isConflict ? ' conflict' : ''}`,
                  onClick: () => setCapturing(isCapturing ? null : action.id),
                  title: isCapturing
                    ? 'Press a key, or Escape to cancel'
                    : isConflict
                      ? 'This key is bound to more than one action'
                      : 'Click to rebind',
                  children: isCapturing ? 'Press a key\u2026' : keyLabel(key),
                }),
              ],
            },
            action.id
          )
        }),
      }),
      hasConflict &&
        jsx('p', {
          className: 'keybind-conflict',
          children: 'Some actions share a key \u2014 only the first listed one will fire.',
        }),
      jsx('button', {
        className: 'settings-toggle-btn',
        onClick: () => {
          setCapturing(null)
          dispatch({ type: 'RESET_KEYBINDINGS' })
        },
        children: 'Reset Keybindings to Defaults',
      }),
    ],
  })
}
