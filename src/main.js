// Split from the former assets/index.js.

import React from 'react'
import { createRoot } from 'react-dom/client'
import { jsx, jsxs } from 'react/jsx-runtime'
import { ErrorBoundary } from './components/error-boundary.js'
import { GameLayout } from './components/game-layout.js'
import { SlotSelect } from './components/slot-select.js'
import { StarterSelect } from './components/starter-select.js'
import { PatchNotesModal } from './components/patch-notes-modal.js'
import { PatchNotesPage } from './components/patch-notes-page.js'
import { GameProvider, useGame } from './game/context.js'
import { precacheAppShell } from './game/offline.js'
import { needsSlotChoice, suspendAutosave } from './game/save.js'
import { clearSave } from './data/config.js'

// Console helper for stuck saves: `pokemonIdleResetSave()`
// @ts-ignore
window.pokemonIdleResetSave = () => {
  suspendAutosave()
  clearSave()
  window.location.reload()
}

function AppContent() {
  const { state } = useGame()
  if (needsSlotChoice()) return jsx(SlotSelect, {})
  return state.phase === 'starterSelect' ? jsx(StarterSelect, {}) : jsx(GameLayout, {})
}

function App() {
  const [hash, setHash] = React.useState(window.location.hash)
  return (
    React.useEffect(() => {
      // reached only if the app mounted successfully — cancels the boot guard
      window.__piBooted = true
      try {
        sessionStorage.removeItem('pokemon-idle-recovery-attempts')
      } catch {
        /* ignore */
      }
      // Warm the boot-essential files so the game can reopen offline later.
      // No-op while running the dev server (offline needs a built worker).
      precacheAppShell().catch(() => {})
    }, []),
    React.useEffect(() => {
      const handleHashChange = () => setHash(window.location.hash)
      return (
        window.addEventListener('hashchange', handleHashChange),
        () => window.removeEventListener('hashchange', handleHashChange)
      )
    }, []),
    hash === '#patchnotes'
      ? jsx(PatchNotesPage, {})
      : jsx(GameProvider, {
          children: jsxs('div', {
            className: 'game-window',
            children: [jsx(AppContent, {}), jsx(PatchNotesModal, {})],
          }),
        })
  )
}

createRoot(/** @type {HTMLElement} */ (document.getElementById('root'))).render(
  jsx(React.StrictMode, {
    children: jsx(ErrorBoundary, { children: jsx(App, {}) }),
  })
)
