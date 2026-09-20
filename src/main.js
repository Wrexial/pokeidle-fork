// Split from the former assets/index.js — see tools/decompile/split-modules.mjs

import React from 'react'
import { createRoot } from 'react-dom/client'
import { jsx, jsxs } from 'react/jsx-runtime'
import { GameLayout, StarterSelect } from './components/layout.js'
import { PatchNotesModal, PatchNotesPage } from './components/settings.js'
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

createRoot(document.getElementById('root')).render(
  jsx(React.StrictMode, {
    children: jsx(App, {}),
  })
)
