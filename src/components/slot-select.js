// Boot slot picker: shown when more than one save slot holds a save and no
// active slot has been chosen yet, so the player picks which one to continue.

import React from 'react'
import { jsx } from 'react/jsx-runtime'
import { clearSave, setActiveSlot } from '../data/config.js'
import { listSaveSlots } from '../game/save.js'
import { SaveSlotCard } from './save-slot-card.js'

/** @param {number} slot */
function playSlot(slot) {
  setActiveSlot(slot)
  window.location.reload()
}

/**
 * @param {number} slot
 * @param {boolean} empty
 */
function newGameInSlot(slot, empty) {
  if (!empty && !window.confirm(`Overwrite the save in Slot ${slot}? This cannot be undone.`)) return
  clearSave(slot)
  setActiveSlot(slot)
  window.location.reload()
}

export function SlotSelect() {
  const slots = React.useMemo(() => listSaveSlots(), [])
  return jsx('div', {
    className: 'starter-select slot-select',
    children: [
      jsx('h2', { className: 'starter-title', children: 'Choose a Save' }),
      jsx('p', {
        className: 'starter-subtitle',
        children: 'Multiple saves found \u2014 pick the journey to continue, or start a new one.',
      }),
      jsx('div', {
        className: 'save-slot-grid',
        children: slots.map((entry) =>
          jsx(
            SaveSlotCard,
            {
              entry,
              onPlay: () => playSlot(entry.slot),
              onNew: () => newGameInSlot(entry.slot, entry.empty),
            },
            entry.slot
          )
        ),
      }),
    ],
  })
}
