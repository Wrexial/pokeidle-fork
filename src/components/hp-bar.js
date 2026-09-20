// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'

/** @param {{ current: number, max: number }} props */
export function HpBar({ current, max }) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100)),
    barColor = percent > 50 ? '#30c855' : percent > 20 ? '#e8c030' : '#e04038'
  return jsxs('div', {
    className: 'hp-bar',
    children: [
      jsx('span', {
        className: 'hp-label',
        children: 'HP',
      }),
      jsx('div', {
        className: 'hp-track',
        children: jsx('div', {
          className: 'hp-fill',
          style: {
            width: `${percent}%`,
            backgroundColor: barColor,
            transition: 'width 0.5s ease, background-color 0.5s ease',
          },
        }),
      }),
    ],
  })
}
