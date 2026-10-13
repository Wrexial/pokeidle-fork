// A launch card for a minigame or route activity, shown in the location panel.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

/**
 * @param {{ icon?: string, title: string, hint: string, types?: string[], conditionLabel?: string | null, conditionActive?: boolean, steps?: string[], actionLabel: string, disabled?: boolean, onStart: () => void, onAssign?: () => void, assignLabel?: string, assignTitle?: string, assignDisabled?: boolean }} props
 */
export function MinigameCard({
  icon,
  title,
  hint,
  types,
  conditionLabel,
  conditionActive,
  steps,
  actionLabel,
  disabled,
  onStart,
  onAssign,
  assignLabel,
  assignTitle,
  assignDisabled,
}) {
  const [helpOpen, setHelpOpen] = React.useState(false)
  return jsxs('div', {
    className: 'location-minigame-card',
    children: [
      jsxs('div', {
        className: 'location-minigame-head',
        children: [
          icon ? jsx('span', { className: 'location-minigame-icon', children: icon }) : null,
          jsx('span', { className: 'location-minigame-title', children: title }),
          jsxs('span', {
            className: 'location-minigame-head-actions',
            children: [
              onAssign
                ? jsx('button', {
                    className: 'location-minigame-assign',
                    type: 'button',
                    disabled: assignDisabled,
                    title: assignTitle ?? assignLabel,
                    onClick: onAssign,
                    children: assignLabel ?? 'ASSIGN',
                  })
                : null,
              steps?.length
                ? jsx('button', {
                    className: `location-minigame-help${helpOpen ? ' active' : ''}`,
                    type: 'button',
                    'aria-expanded': helpOpen,
                    title: helpOpen ? 'Hide how to play' : 'How to play',
                    onClick: () => setHelpOpen(!helpOpen),
                    children: '?',
                  })
                : null,
            ],
          }),
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
      conditionLabel
        ? jsx('div', {
            className: `location-minigame-condition${conditionActive ? ' active' : ''}`,
            children: conditionActive ? `\u2b50 Favoured ${conditionLabel}` : `Best ${conditionLabel}`,
          })
        : null,
      jsx('p', { className: 'location-minigame-hint', title: hint, children: hint }),
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
