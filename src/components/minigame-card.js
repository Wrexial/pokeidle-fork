// A launch card for a minigame or route activity, shown in the location panel.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

/**
 * @param {{ icon?: string, title: string, hint: string, types?: string[], steps?: string[], actionLabel: string, disabled?: boolean, onStart: () => void }} props
 */
export function MinigameCard({ icon, title, hint, types, steps, actionLabel, disabled, onStart }) {
  const [helpOpen, setHelpOpen] = React.useState(false)
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
      types?.length
        ? jsx('div', {
            className: 'location-minigame-types',
            children: types.map((type) =>
              jsx(
                'span',
                { className: `type-badge type-${type.toLowerCase()}`, children: type },
                type
              )
            ),
          })
        : null,
      jsx('p', { className: 'location-minigame-hint', children: hint }),
      steps?.length
        ? jsx('button', {
            className: `location-minigame-help${helpOpen ? ' active' : ''}`,
            onClick: () => setHelpOpen(!helpOpen),
            children: helpOpen ? 'HIDE HOW TO PLAY' : 'HOW TO PLAY',
          })
        : null,
      helpOpen && steps?.length
        ? jsx('ol', {
            className: 'location-minigame-steps',
            children: steps.map((step, index) => jsx('li', { children: step }, index)),
          })
        : null,
      jsx('button', {
        className: 'location-minigame-start',
        disabled,
        onClick: onStart,
        children: actionLabel,
      }),
    ],
  })
}
