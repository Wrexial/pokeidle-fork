// The weekly Battle Tower ladder rule set (#93), shown at the top of the Tower
// and Frontier panels so the player knows which week's rules are live.

import { jsx, jsxs } from 'react/jsx-runtime'

/**
 * @param {{ ladder: LadderRuleSet, compact?: boolean }} props
 */
export function LadderBanner({ ladder, compact = false }) {
  return jsxs('div', {
    className: `ladder-banner ladder-${ladder.key}${compact ? ' compact' : ''}`,
    children: [
      jsx('span', {
        className: 'ladder-banner-icon',
        children: ladder.icon,
      }),
      jsxs('div', {
        className: 'ladder-banner-text',
        children: [
          jsxs('span', {
            className: 'ladder-banner-title',
            children: ['Weekly ladder: ', ladder.name],
          }),
          jsx('span', {
            className: 'ladder-banner-hint',
            children: ladder.hint,
          }),
          ladder.modifiers.length > 0 &&
            jsxs('span', {
              className: 'ladder-banner-tags',
              children: ladder.modifiers.map((modifier) =>
                jsx(
                  'span',
                  {
                    className: 'ladder-tag',
                    title: modifier.hint,
                    children: `${modifier.icon} ${modifier.name}`,
                  },
                  modifier.id
                )
              ),
            }),
        ],
      }),
    ],
  })
}
