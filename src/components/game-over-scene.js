// Nuzlocke game-over screen. Shown once the last party Pokemon faints (see the
// `nuzlockeGameOver` reducer). The only way on is to start a fresh save.

import { createPortal } from 'react-dom'
import { jsx, jsxs } from 'react/jsx-runtime'
import { clearSave } from '../data/config.js'
import { regions } from '../data/gameData.js'
import { useGame } from '../game/context.js'
import { suspendAutosave } from '../game/save.js'

export function GameOverScene() {
  const { state } = useGame(),
    region = regions.find((candidate) => candidate.id === state.startRegion),
    caught = state.pokedexCaught?.length ?? 0,
    badges = state.defeatedGyms?.length ?? 0

  function startNewSave() {
    if (
      !window.confirm(
        'Start a new save? Your Nuzlocke run has ended and this cannot be undone.'
      )
    )
      return
    // Stop the autosave before clearing so the running session can't write the
    // game-over state back into the slot.
    suspendAutosave()
    clearSave()
    window.location.reload()
  }

  return createPortal(
    jsx('div', {
      className: 'game-over-overlay',
      children: jsxs('div', {
        className: 'game-over-card',
        children: [
          jsx('span', {
            className: 'game-over-title',
            children: 'Game Over',
          }),
          jsx('p', {
            className: 'game-over-message',
            children: 'Your last Pokemon fainted. The Nuzlocke run is over.',
          }),
          jsxs('div', {
            className: 'game-over-summary',
            children: [
              jsxs('div', {
                children: ['Region: ', region?.name ?? 'Kanto'],
              }),
              jsxs('div', {
                children: ['Pok\u00e9mon caught: ', caught],
              }),
              jsxs('div', {
                children: ['Badges earned: ', badges],
              }),
            ],
          }),
          jsx('button', {
            className: 'game-over-new-btn',
            onClick: startNewSave,
            children: 'Start a New Save',
          }),
          jsx('p', {
            className: 'game-over-hint',
            children: 'This erases the current save and begins a fresh journey.',
          }),
        ],
      }),
    }),
    document.body
  )
}
