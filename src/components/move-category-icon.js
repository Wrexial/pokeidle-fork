// Inline move-category icons (physical / special / status). Drawn as SVG
// rather than the old Unicode glyphs (✴ / ◎ / ☯), which rendered
// inconsistently across platforms and read poorly at small sizes. Any unknown
// category falls back to the status swirl.
import { jsx, jsxs } from 'react/jsx-runtime'

/** @type {Record<string, any>} */
const ICON_SHAPES = {
  // A sharp four-point burst: "impact".
  physical: jsx('path', {
    d: 'M7 0.4 L8.4 5.6 L13.6 7 L8.4 8.4 L7 13.6 L5.6 8.4 L0.4 7 L5.6 5.6 Z',
    fill: 'currentColor',
  }),
  // Concentric rings: ranged / energy.
  special: jsxs('g', {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    children: [
      jsx('circle', { cx: 7, cy: 7, r: 5.8 }),
      jsx('circle', { cx: 7, cy: 7, r: 3, opacity: 0.7 }),
      jsx('circle', { cx: 7, cy: 7, r: 1.1, fill: 'currentColor', stroke: 'none' }),
    ],
  }),
  // An open swirl with a centre dot: a non-damaging effect.
  status: jsxs('g', {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    children: [
      jsx('path', { d: 'M7 1.6 A5.4 5.4 0 1 0 12.4 7' }),
      jsx('circle', { cx: 7, cy: 7, r: 1.4, fill: 'currentColor', stroke: 'none' }),
    ],
  }),
}

/** @param {{ category: string }} props */
export function MoveCategoryIcon({ category }) {
  return jsx('svg', {
    viewBox: '0 0 14 14',
    'aria-hidden': 'true',
    focusable: 'false',
    style: { width: '1em', height: '1em', display: 'block' },
    children: ICON_SHAPES[category] ?? ICON_SHAPES.status,
  })
}
