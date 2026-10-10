// The "how to play" tutorial for a minigame or route activity. Shown once, the
// first time it is started (see BattleScreen), and reused by the location
// card's "How to play" disclosure.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

/**
 * @param {{ title: string, steps: string[], onClose: () => void }} props
 */
export function MinigameTutorial({ title, steps, onClose }) {
  // Escape dismisses the tutorial, matching the other modals. Hooks run before
  // the early return so the call order stays stable when the data is missing.
  React.useEffect(() => {
    /** @param {KeyboardEvent} event */
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  if (!title || !steps?.length) return null
  return jsx('div', {
    className: 'minigame-tutorial-overlay',
    onClick: (/** @type {React.MouseEvent<HTMLDivElement>} */ event) => {
      // Clicking the dimmed backdrop (but not the card) closes it.
      if (event.target === event.currentTarget) onClose()
    },
    children: jsxs('div', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': `${title} \u2014 how to play`,
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
                jsx('span', { className: 'minigame-tutorial-title', children: title }),
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
