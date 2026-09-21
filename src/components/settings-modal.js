// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { clearSave } from '../data/config.js'

/** @param {{ onClose: () => void }} props */
export function SettingsModal({ onClose }) {
  const [confirming, setConfirming] = React.useState(!1)
  function resetSave() {
    ;(clearSave(), window.location.reload())
  }
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Settings',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsx('div', {
          className: 'battle-info-content',
          children: confirming
            ? jsxs('div', {
                className: 'settings-confirm',
                children: [
                  jsx('p', {
                    children:
                      'Are you sure? This will permanently delete all save data and restart the game.',
                  }),
                  jsxs('div', {
                    className: 'settings-confirm-buttons',
                    children: [
                      jsx('button', {
                        className: 'settings-confirm-yes',
                        onClick: resetSave,
                        children: 'Yes, Reset',
                      }),
                      jsx('button', {
                        className: 'settings-confirm-no',
                        onClick: () => setConfirming(!1),
                        children: 'Cancel',
                      }),
                    ],
                  }),
                ],
              })
            : jsxs(Fragment, {
                children: [
                  jsx('p', {
                    className: 'settings-hint',
                    children:
                      'New here? The player guide explains every feature — regions, catching, breeding, shiny hunting and more.',
                  }),
                  jsx('a', {
                    className: 'settings-guide-btn',
                    href: '/guide.html',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    children: '📖 Player Guide',
                  }),
                  jsx('a', {
                    className: 'settings-link',
                    href: '/encounter-index.html',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    children: 'Wild Encounter Index',
                  }),
                  jsx('button', {
                    className: 'settings-reset-btn',
                    onClick: () => setConfirming(!0),
                    children: 'Reset Save Data',
                  }),
                ],
              }),
        }),
      ],
    }),
  })
}
