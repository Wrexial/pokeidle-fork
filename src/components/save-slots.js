// Settings > Save Slots: play, start a new game in, or delete a save slot.

import React from 'react'
import { jsx } from 'react/jsx-runtime'
import { clearSave, getActiveSlot, setActiveSlot } from '../data/config.js'
import { useGame } from '../game/context.js'
import { listSaveSlots, persistSave, suspendAutosave } from '../game/save.js'
import { SaveSlotCard } from './save-slot-card.js'

export function SaveSlotsPanel() {
  const { state } = useGame()
  const [slots, setSlots] = React.useState(() => listSaveSlots()),
    active = getActiveSlot()

  /** @param {number} slot */
  function play(slot) {
    // Flush the current game to its own slot, then stop autosaving so the
    // running session can't be written into the slot we are about to load.
    persistSave(state)
    suspendAutosave()
    setActiveSlot(slot)
    window.location.reload()
  }

  /** @param {SaveSlotSummary} entry */
  function newGame(entry) {
    if (!entry.empty && !window.confirm(`Overwrite the save in Slot ${entry.slot}? This cannot be undone.`))
      return
    persistSave(state)
    suspendAutosave()
    clearSave(entry.slot)
    setActiveSlot(entry.slot)
    window.location.reload()
  }

  /** @param {SaveSlotSummary} entry */
  function remove(entry) {
    if (!window.confirm(`Delete the save in Slot ${entry.slot}? This cannot be undone.`)) return
    // Deleting the slot we are playing: stop autosaving first so the running
    // session can't recreate the file, then reload into the picker.
    if (entry.slot === active) {
      suspendAutosave()
      clearSave(entry.slot)
      setActiveSlot(0)
      window.location.reload()
      return
    }
    clearSave(entry.slot)
    setSlots(listSaveSlots())
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
