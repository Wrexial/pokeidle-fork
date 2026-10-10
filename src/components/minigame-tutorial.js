// The "how to play" tutorial for a minigame. Shown once, the first time the
// minigame is started (see BattleScreen), and reused by the location card's
// "How to play" disclosure.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { MINIGAME_INFO, MINIGAME_TUTORIALS } from '../game/minigames.js'

/**
 * @param {{ minigameId: string, onClose: () => void }} props
 */
export function MinigameTutorial({ minigameId, onClose }) {
  const info = MINIGAME_INFO[minigameId],
    steps = MINIGAME_TUTORIALS[minigameId]
  // Escape dismisses the tutorial, matching the other modals. Hooks run before
  // the early return so the call order stays stable when the id is invalid.
  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  if (!info || !steps?.length) return null
  return jsx('div', {
    className: 'minigame-tutorial-overlay',
    onClick: (/** @type {React.MouseEvent<HTMLDivElement>} */ event) => {
      // Clicking the dimmed backdrop (but not the card) closes it.
      if (event.target === event.currentTarget) onClose()
    },
    children: jsxs('div', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': `${info.title} \u2014 how to play`,
      className: 'minigame-tutorial',
      children: [
        jsxs('div', {
          className: 'minigame-tutorial-head',
          children: [
            jsx('span', { className: 'minigame-tutorial-badge', children: '?' }),
            jsxs('div', {
              className: 'minigame-tutorial-heading',
              children: [
                jsx('span', { className: 'minigame-tutorial-kicker', children: 'HOW TO PLAY' }),
                jsx('span', { className: 'minigame-tutorial-title', children: info.title }),
              ],
            }),
          ],
        }),
        jsx('ol', {
          className: 'minigame-tutorial-steps',
          children: steps.map((step, index) => jsx('li', { children: step }, index)),
        }),
        jsx('button', {
          className: 'minigame-tutorial-close',
          onClick: onClose,
          children: 'GOT IT',
        }),
      ],
    }),
  })
}
