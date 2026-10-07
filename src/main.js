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
import { BOOT_BACKUP_KEY, clearSave } from './data/config.js'

// If a startup failure made the inline boot guard clear the saves, it left a
// backup behind (index.html). Bring them back before the app reads storage, so
// a transient boot failure (a flaky network, a service worker hiccup) can't
// silently cost the player their progress.
;(function restoreBootBackup() {
  try {
    const raw = localStorage.getItem(BOOT_BACKUP_KEY)
    if (!raw) return
    const hasSave = Object.keys(localStorage).some((key) => key.indexOf('pokemon-idle-save') === 0)
    if (hasSave) return
    const backup = JSON.parse(raw)
    const saves = backup && backup.saves ? backup.saves : {}
    const keys = Object.keys(saves)
    if (keys.length === 0) return
    for (const key of keys) localStorage.setItem(key, String(saves[key]))
    if (backup.activeSlot) localStorage.setItem('pokemon-idle-active-slot', backup.activeSlot)
    console.warn(`[pokemon-idle] restored ${keys.length} save slot(s) from the boot backup`)
  } catch {
    /* storage may be unavailable */
  }
})()

// Console helper for stuck saves: `pokemonIdleResetSave()`
// @ts-ignore
window.pokemonIdleResetSave = () => {
  suspendAutosave()
  clearSave()
  window.location.reload()
}

// Recover a save the inline boot guard backed up before clearing it (see
// BOOT_BACKUP_KEY in index.html). Run it in the browser console.
// @ts-ignore
window.pokemonIdleRestoreBootBackup = () => {
  try {
    const raw = localStorage.getItem(BOOT_BACKUP_KEY)
    if (!raw) return 'No boot backup found.'
    const backup = JSON.parse(raw)
    if (!backup || !backup.saves) return 'The boot backup is empty.'
    for (const [key, value] of Object.entries(backup.saves)) {
      localStorage.setItem(key, String(value))
    }
    if (backup.activeSlot) localStorage.setItem('pokemon-idle-active-slot', backup.activeSlot)
    return `Restored ${Object.keys(backup.saves).length} save slot(s). Reload to play them.`
  } catch {
    return 'Could not restore the boot backup.'
  }
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
