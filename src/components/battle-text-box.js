// Split from a grouped component file — see tools/decompile/split-components.mjs

import { jsx, jsxs } from 'react/jsx-runtime'
import { useTypewriter } from '../hooks.js'

/** @param {{ event: any, speed: number, isAtTown: boolean }} props */
export function BattleTextBox({ event, speed, isAtTown }) {
  const charDelay = Math.max(5, 30 / speed),
    defaultMessage = isAtTown ? 'Looking for trainers...' : 'Searching for wild Pokémon...',
    message = event?.message ?? defaultMessage,
    { displayed } = useTypewriter(message, charDelay)
  return jsx('div', {
    className: 'battle-text-box',
    children: jsx('div', {
      className: 'text-box-inner',
      children: jsxs('p', {
        children: [
          displayed,
          jsx('span', {
            className: 'text-cursor',
            children: '▼',
          }),
        ],
      }),
    }),
  })
}
