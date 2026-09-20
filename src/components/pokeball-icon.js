// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { pokeballColors } from '../data/ui.js'

/** @param {{ ballId: string, size?: number, disabled?: boolean }} props */
export function PokeballIcon({ ballId, size = 10, disabled }) {
  const clipId = React.useId(),
    colors = pokeballColors[ballId]
  return jsxs('svg', {
    className: disabled ? 'pokeball-disabled' : void 0,
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    children: [
      jsx('defs', {
        children: jsx('clipPath', {
          id: clipId,
          children: jsx('circle', {
            cx: '12',
            cy: '12',
            r: '11',
          }),
        }),
      }),
      jsx('circle', {
        cx: '12',
        cy: '12',
        r: '11',
        fill: colors.top,
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('rect', {
        x: '0',
        y: '12',
        width: '24',
        height: '12',
        fill: colors.bottom,
        clipPath: `url(#${clipId})`,
      }),
      jsx('circle', {
        cx: '12',
        cy: '12',
        r: '11',
        fill: 'none',
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('line', {
        x1: '1',
        y1: '12',
        x2: '8',
        y2: '12',
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('line', {
        x1: '16',
        y1: '12',
        x2: '23',
        y2: '12',
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('circle', {
        cx: '12',
        cy: '12',
        r: '4',
        fill: colors.ring,
        stroke: '#2a1808',
        strokeWidth: '2',
      }),
      jsx('circle', {
        cx: '12',
        cy: '12',
        r: '2',
        fill: colors.dot,
      }),
    ],
  })
}
