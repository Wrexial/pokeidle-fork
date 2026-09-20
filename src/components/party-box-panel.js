// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { initialDragState } from '../data/ui.js'
import { useGame } from '../game/context.js'
import { BoxPanel } from './box-panel.js'
import { PartyPanel } from './party-panel.js'

export function PartyBoxPanel() {
  const { state, dispatch } = useGame(),
    [inspected, setInspected] = React.useState(/** @type {{ source: string, id: string } | null} */ (null)),
    [releaseConfirm, setReleaseConfirm] = React.useState(/** @type {string | null} */ (null)),
    [partyDragIndex, setPartyDragIndex] = React.useState(/** @type {number | null} */ (null)),
    [dragSource, setDragSource] = React.useState(/** @type {'party' | 'box' | null} */ (null)),
    [dropTargetIndex, setDropTargetIndex] = React.useState(/** @type {number | null} */ (null)),
    [dropPosition, setDropPosition] = React.useState(/** @type {'above' | 'below' | null} */ (null)),
    [boxDragOver, setBoxDragOver] = React.useState(!1),
    [boxDragIndex, setBoxDragIndex] = React.useState(/** @type {number | null} */ (null)),
    [boxDropTargetIndex, setBoxDropTargetIndex] = React.useState(/** @type {number | null} */ (null)),
    dragRef = React.useRef({
      ...initialDragState,
    }),
    resetDrag = React.useCallback(() => {
      ;((dragRef.current = {
        ...initialDragState,
      }),
        setPartyDragIndex(null),
        setDragSource(null),
        setDropTargetIndex(null),
        setDropPosition(null),
        setBoxDragOver(!1),
        setBoxDragIndex(null),
        setBoxDropTargetIndex(null))
    }, []),
    handlePartyDragStart = React.useCallback((event, fromIndex, pokemonId) => {
      ;((event.dataTransfer.effectAllowed = 'move'),
        event.dataTransfer.setData('text/plain', String(fromIndex)),
        setPartyDragIndex(fromIndex),
        setDragSource('party'),
        (dragRef.current = {
          ...initialDragState,
          source: 'party',
          fromIndex,
          pokemonId,
        }))
    }, []),
    handleBoxDragStart = React.useCallback((event, fromIndex, pokemonId) => {
      ;((event.dataTransfer.effectAllowed = 'move'),
        event.dataTransfer.setData('text/plain', String(fromIndex)),
        setBoxDragIndex(fromIndex),
        setDragSource('box'),
        (dragRef.current = {
          ...initialDragState,
          source: 'box',
          fromIndex,
          pokemonId,
        }))
    }, []),
    handlePartyDragOver = React.useCallback((event, targetIndex) => {
      ;(event.preventDefault(), (event.dataTransfer.dropEffect = 'move'))
      const rect = event.currentTarget.getBoundingClientRect(),
        midpoint = rect.top + rect.height / 2,
        position = event.clientY < midpoint ? 'above' : 'below'
      ;(setDropTargetIndex(targetIndex),
        setDropPosition(position),
        setBoxDragOver(!1),
        setBoxDropTargetIndex(null),
        (dragRef.current.target = 'party'),
        (dragRef.current.targetIndex = targetIndex),
        (dragRef.current.position = position),
        (dragRef.current.droppedOnBoxContainer = !1))
    }, []),
    handleBoxSlotDragOver = React.useCallback((event, targetIndex) => {
      ;(event.preventDefault(),
        event.stopPropagation(),
        (event.dataTransfer.dropEffect = 'move'),
        setBoxDropTargetIndex(targetIndex),
        setDropTargetIndex(null),
        setDropPosition(null),
        setBoxDragOver(!1),
        (dragRef.current.target = 'box'),
        (dragRef.current.targetIndex = targetIndex),
        (dragRef.current.droppedOnBoxContainer = !1))
    }, []),
    preventDefault = React.useCallback((event) => {
      event.preventDefault()
    }, []),
    handleDrop = React.useCallback(() => {
      const {
        source,
        fromIndex,
        pokemonId,
        target,
        targetIndex,
        position,
        droppedOnBoxContainer,
      } = dragRef.current
      if (source === 'party')
        if (droppedOnBoxContainer && fromIndex >= 0)
          dispatch({
            type: 'PARTY_TO_BOX',
            payload: {
              partyIndex: fromIndex,
            },
          })
        else if (target === 'party' && pokemonId && fromIndex >= 0 && targetIndex !== null && position !== null) {
          let toIndex = position === 'below' ? targetIndex + 1 : targetIndex
          ;(fromIndex < toIndex && (toIndex -= 1),
            (toIndex = Math.max(0, Math.min(toIndex, state.party.length - 1))),
            fromIndex !== toIndex &&
              dispatch({
                type: 'REORDER_PARTY',
                payload: {
                  pokemonId,
                  toIndex,
                },
              }))
        } else
          target === 'box' &&
            fromIndex >= 0 &&
            dispatch({
              type: 'PARTY_TO_BOX',
              payload: {
                partyIndex: fromIndex,
              },
            })
      else if (source === 'box') {
        if (target === 'box' && targetIndex !== null && pokemonId && fromIndex !== targetIndex)
          dispatch({
            type: 'REORDER_BOX',
            payload: {
              pokemonId,
              toIndex: targetIndex,
            },
          })
        else if (target === 'party' && targetIndex !== null && pokemonId) {
          const boxIndex = state.box.findIndex((member) => member.id === pokemonId)
          boxIndex >= 0 &&
            (state.party.length < 6
              ? dispatch({
                  type: 'BOX_TO_PARTY',
                  payload: {
                    boxIndex,
                  },
                })
              : dispatch({
                  type: 'SWAP_PARTY_BOX',
                  payload: {
                    partyIndex: targetIndex,
                    boxIndex,
                  },
                }))
        }
      }
      resetDrag()
    }, [state.party.length, state.box, dispatch, resetDrag]),
    handleBoxDragOver = React.useCallback((event) => {
      ;(event.preventDefault(),
        (event.dataTransfer.dropEffect = 'move'),
        dragRef.current.source === 'party' &&
          (setBoxDragOver(!0),
          (dragRef.current.droppedOnBoxContainer = !0),
          (dragRef.current.target = 'box'),
          (dragRef.current.targetIndex = null)))
    }, []),
    handleBoxDrop = React.useCallback((event) => {
      event.preventDefault()
    }, []),
    handleBoxDragLeave = React.useCallback(() => {
      ;(setBoxDragOver(!1), (dragRef.current.droppedOnBoxContainer = !1))
    }, [])
  return jsxs('div', {
    className: 'side-panel left-panel',
    children: [
      jsx(PartyPanel, {
        inspected,
        setInspected,
        releaseConfirm,
        setReleaseConfirm,
        dragSource,
        dragFromIndex: partyDragIndex,
        dropTargetIndex,
        dropPosition,
        onDragStart: handlePartyDragStart,
        onDragOver: handlePartyDragOver,
        onDrop: preventDefault,
        onDragEnd: handleDrop,
      }),
      jsx(BoxPanel, {
        inspected,
        setInspected,
        setReleaseConfirm,
        dragSource,
        boxDragOver,
        boxDragFromIndex: boxDragIndex,
        boxDropTargetIndex,
        onBoxDragStart: handleBoxDragStart,
        onBoxSlotDragOver: handleBoxSlotDragOver,
        onBoxDragOver: handleBoxDragOver,
        onBoxDrop: handleBoxDrop,
        onBoxDragLeave: handleBoxDragLeave,
        onDrop: preventDefault,
        onDragEnd: handleDrop,
      }),
    ],
  })
}
