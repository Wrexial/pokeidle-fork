// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { CHANGELOG, GAME_VERSION, LAST_SEEN_VERSION_KEY } from '../data/changelog.js'

export function PatchNotesModal() {
  const [show, setShow] = React.useState(!1)
  React.useEffect(() => {
    localStorage.getItem(LAST_SEEN_VERSION_KEY) !== GAME_VERSION && setShow(!0)
  }, [])
  const dismiss = () => {
    ;(localStorage.setItem(LAST_SEEN_VERSION_KEY, GAME_VERSION), setShow(!1))
  }
  if (!show) return null
  const latest = CHANGELOG[0]
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: dismiss,
    children: jsxs('div', {
      className: 'patch-notes-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsxs('span', {
              className: 'battle-info-title',
              children: ["What's New — v", latest.version],
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: dismiss,
              children: 'X',
            }),
          ],
        }),
        jsxs('div', {
          className: 'patch-notes-content',
          children: [
            jsxs('div', {
              className: 'patch-notes-title',
              children: ['Pokemon Idle v', latest.version, ' Patch Notes'],
            }),
            jsx('div', {
              className: 'patch-notes-subtitle',
              children: latest.subtitle,
            }),
            latest.sections.map((section, sectionIndex) =>
              jsxs(
                'div',
                {
                  className: 'patch-notes-section',
                  children: [
                    jsx('div', {
                      className: 'patch-notes-section-heading',
                      children: section.heading,
                    }),
                    jsx('ul', {
                      className: 'patch-notes-list',
                      children: section.items.map((item, itemIndex) =>
                        jsx(
                          'li',
                          {
                            children: item,
                          },
                          itemIndex
                        )
                      ),
                    }),
                  ],
                },
                sectionIndex
              )
            ),
            jsxs('p', {
              className: 'patch-notes-feedback',
              children: [
                'As always, feedback is welcome! Join us at',
                ' ',
                jsx('a', {
                  href: 'https://www.reddit.com/r/PkmnIdle/',
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  children: 'r/PkmnIdle',
                }),
                ' ',
                'to share your thoughts or report issues.',
              ],
            }),
          ],
        }),
        jsx('div', {
          className: 'patch-notes-footer',
          children: jsx('button', {
            className: 'patch-notes-dismiss-btn',
            onClick: dismiss,
            children: 'Got it!',
          }),
        }),
      ],
    }),
  })
}
