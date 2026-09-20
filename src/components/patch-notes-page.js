// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { CHANGELOG } from '../data/changelog.js'

export function PatchNotesPage() {
  return jsxs('div', {
    className: 'patch-notes-page',
    children: [
      jsxs('div', {
        className: 'patch-notes-page-header',
        children: [
          jsx('a', {
            href: '#',
            className: 'patch-notes-back-btn',
            children: '← Back to Game',
          }),
          jsx('h1', {
            className: 'patch-notes-page-title',
            children: 'Patch Notes',
          }),
        ],
      }),
      jsxs('div', {
        className: 'patch-notes-page-content',
        children: [
          CHANGELOG.map((entry, entryIndex) =>
            jsxs(
              'div',
              {
                className: 'patch-notes-version-block',
                children: [
                  jsxs('div', {
                    className: 'patch-notes-page-version-header',
                    children: [
                      jsxs('span', {
                        className: 'patch-notes-page-version',
                        children: ['v', entry.version],
                      }),
                      jsx('span', {
                        className: 'patch-notes-page-subtitle',
                        children: entry.subtitle,
                      }),
                    ],
                  }),
                  entry.sections.map((section, sectionIndex) =>
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
                  entryIndex < CHANGELOG.length - 1 &&
                    jsx('hr', {
                      className: 'patch-notes-divider',
                    }),
                ],
              },
              entryIndex
            )
          ),
          jsxs('p', {
            className: 'patch-notes-feedback',
            children: [
              'Feedback is welcome! Join us at',
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
    ],
  })
}
