// Monotype challenge picker: restrict wild encounters to one of the 18 types,
// or turn the challenge off. Shared by the starter screen and Settings.

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { POKEMON_TYPES } from '../data/moves.js'

/**
 * @param {{ value: string | null, onChange: (type: string | null) => void, hint?: string }} props
 */
export function MonotypeSelect({ value, onChange, hint }) {
  return jsxs('div', {
    className: 'monotype-select',
    children: [
      jsxs('label', {
        children: [
          'Monotype: ',
          jsxs('select', {
            value: value ?? '',
            onChange: /** @param {React.ChangeEvent<HTMLSelectElement>} event */ (event) =>
              onChange(event.target.value || null),
            children: [
              jsx('option', { value: '', children: 'Off' }, 'off'),
              ...POKEMON_TYPES.map((type) => jsx('option', { value: type, children: type }, type)),
            ],
          }),
        ],
      }),
      hint ? jsx('p', { className: 'monotype-hint', children: hint }) : null,
    ],
  })
}
