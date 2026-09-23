// A small Pokedex status ball used by the caught indicators: grey for a species
// merely seen, the normal red ball for one caught, and a gold ball for one
// caught as a shiny.

import { jsx } from 'react/jsx-runtime'
import { dexBallColors } from '../data/ui.js'
import { PokeballIcon } from './pokeball-icon.js'

const STATUS_LABELS = {
  seen: 'Seen - not caught yet',
  caught: 'Caught',
  shiny: 'Shiny caught',
}

/**
 * @param {{ status: 'seen' | 'caught' | 'shiny' | null | undefined, size?: number, className?: string }} props
 */
export function DexBallBadge({ status, size = 12, className }) {
  if (status !== 'seen' && status !== 'caught' && status !== 'shiny') return null
  return jsx('span', {
    className: `dex-ball-badge dex-ball-${status}${className ? ` ${className}` : ''}`,
    title: STATUS_LABELS[status],
    children: jsx(PokeballIcon, {
      ballId: 'pokeball',
      colors: dexBallColors[status],
      size,
    }),
  })
}
