// A launch card for a minigame or route activity, shown in the location panel.

import { jsx, jsxs } from 'react/jsx-runtime'

/**
 * @param {{ icon?: string, title: string, hint: string, actionLabel: string, disabled?: boolean, onStart: () => void }} props
 */
export function MinigameCard({ icon, title, hint, actionLabel, disabled, onStart }) {
  return jsxs('div', {
    className: 'location-minigame-card',
    children: [
      jsxs('div', {
        className: 'location-minigame-head',
        children: [
          icon ? jsx('span', { className: 'location-minigame-icon', children: icon }) : null,
          jsx('span', { className: 'location-minigame-title', children: title }),
        ],
      }),
      jsx('p', { className: 'location-minigame-hint', children: hint }),
      jsx('button', {
        className: 'location-minigame-start',
        disabled,
        onClick: onStart,
        children: actionLabel,
      }),
    ],
  })
}
