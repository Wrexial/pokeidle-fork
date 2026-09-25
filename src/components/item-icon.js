// A small emoji icon for a bag / shop item. See src/data/item-icons.js for why
// emoji are used instead of downloaded sprites.

import { jsx } from 'react/jsx-runtime'
import { itemIcon } from '../data/item-icons.js'

/** @param {{ itemId: string, size?: number, className?: string }} props */
export function ItemIcon({ itemId, size = 14, className }) {
  return jsx('span', {
    className: `item-icon${className ? ` ${className}` : ''}`,
    style: { fontSize: `${size}px` },
    'aria-hidden': true,
    children: itemIcon(itemId),
  })
}
