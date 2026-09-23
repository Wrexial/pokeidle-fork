// Settings > Save Slots: play, start a new game in, or delete a save slot.

import React from 'react'
import { jsx } from 'react/jsx-runtime'
import { clearSave, getActiveSlot, setActiveSlot } from '../data/config.js'
import { useGame } from '../game/context.js'
import { listSaveSlots, persistSave } from '../game/save.js'
import { SaveSlotCard } from './save-slot-card.js'

export function SaveSlotsPanel() {
  const { state } = useGame()
  const [slots, setSlots] = React.useState(() => listSaveSlots()),
    active = getActiveSlot()

  /** @param {number} slot */
  function play(slot) {
    // Flush the current game before swapping so mid-battle progress is kept.
    persistSave(state)
    setActiveSlot(slot)
    window.location.reload()
  }

  /** @param {SaveSlotSummary} entry */
  function newGame(entry) {
    if (!entry.empty && !window.confirm(`Overwrite the save in Slot ${entry.slot}? This cannot be undone.`))
      return
    persistSave(state)
    clearSave(entry.slot)
    setActiveSlot(entry.slot)
    window.location.reload()
  }

  /** @param {SaveSlotSummary} entry */
  function remove(entry) {
    if (!window.confirm(`Delete the save in Slot ${entry.slot}? This cannot be undone.`)) return
    persistSave(state)
    clearSave(entry.slot)
    if (entry.slot === active) window.location.reload()
    else setSlots(listSaveSlots())
  }

  return jsx('div', {
    className: 'save-slot-grid compact',
    children: slots.map((entry) =>
      jsx(
        SaveSlotCard,
        {
          entry,
          active: entry.slot === active,
          onPlay: () => play(entry.slot),
          onNew: () => newGame(entry),
          onDelete: () => remove(entry),
        },
        entry.slot
      )
    ),
  })
}
