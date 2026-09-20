// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { createRoot } from 'react-dom/client'
import { jsx, jsxs } from 'react/jsx-runtime'
import { GameLayout } from './components/game-layout.js'
import { StarterSelect } from './components/starter-select.js'
import { PatchNotesModal } from './components/patch-notes-modal.js'
import { PatchNotesPage } from './components/patch-notes-page.js'
import { GameProvider, useGame } from './game/context.js'

function AppContent() {
  const { state } = useGame()
  return state.phase === 'starterSelect' ? jsx(StarterSelect, {}) : jsx(GameLayout, {})
}

function App() {
  const [hash, setHash] = React.useState(window.location.hash)
  return (
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
    children: jsx(App, {}),
  })
)
