// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { formatMoveAccuracy } from '../data/moves.js'
import { moveData } from '../data/gameData.js'
import { tmItemId } from '../data/tms.js'
import { useGame } from '../game/context.js'
import { getFamilyLearnset, getTutorMoves, pokemonDisplayName } from '../game/pokemon.js'
import { moveTooltip } from '../game/move-info.js'
import { MoveCategoryIcon } from './move-category-icon.js'

/** @param {{ pokemon: Pokemon, onClose: () => void }} props */
export function MoveManagerPanel({ pokemon, onClose }) {
  const { state, dispatch } = useGame(),
    // Freeze the target at mount: the active Pokemon can change (faint and
    // auto-switch) while the panel is open, and the moves must never land on a
    // different Pokemon.
    [target] = React.useState(() => pokemon),
    targetId = target.id,
    [moves, setMoves] = React.useState(() => [...target.moves]),
    availableMoves = getFamilyLearnset(target.speciesKey, target.level),
    tutorMoves = getTutorMoves(target.speciesKey),
    // TMs are reusable unlocks: a tutor move is only selectable once its TM has
    // been found, and teaching it costs nothing.
    ownedTutorSet = new Set(
      tutorMoves.filter((moveId) => (state.inventory[tmItemId(moveId)] ?? 0) > 0)
    ),
    tutorSet = new Set(tutorMoves),
    allMoves = [
      ...availableMoves.map(({ moveId, learnLevel }) => ({ moveId, learnLevel })),
      ...tutorMoves.map((moveId) => ({ moveId, learnLevel: -1 })),
    ]
  /** @param {string} moveId */
  function toggleMove(moveId) {
    if (tutorSet.has(moveId) && !ownedTutorSet.has(moveId)) return
    moves.includes(moveId)
      ? moves.length > 1 && setMoves(moves.filter((existingMoveId) => existingMoveId !== moveId))
      : moves.length < 4 && setMoves([...moves, moveId])
  }
  function confirmMoves() {
    ;(dispatch({
      type: 'SET_MOVES',
      payload: {
        pokemonId: targetId,
        moves,
      },
    }),
      onClose())
  }
  return jsx('div', {
    className: 'move-panel-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'move-panel',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'move-panel-header',
          children: [
            jsx('span', {
              className: 'move-panel-title',
              children: 'Manage Moves',
            }),
            jsxs('span', {
              className: 'move-panel-species',
              children: [pokemonDisplayName(target), ' Lv.', target.level],
            }),
          ],
        }),
        jsxs('div', {
          className: 'move-panel-section-label',
          children: ['Current Moves (', moves.length, '/4)'],
        }),
        jsx('div', {
          className: 'move-panel-slots',
          children: [0, 1, 2, 3].map((slotIndex) => {
            const moveId = moves[slotIndex],
              moveDef = moveId ? moveData[moveId] : null
            return moveDef
              ? jsxs(
                  'div',
                  {
                    className: `move-panel-slot type-bg-${moveDef.type.toLowerCase()}`,
                    'data-tooltip': moveTooltip(moveId, moveDef),
                    onClick: () => toggleMove(moveId),
                    children: [
                      jsx('span', {
                        className: 'move-panel-slot-icon',
                        children: jsx(MoveCategoryIcon, {
                          category: moveDef.category,
                        }),
                      }),
                      jsx('span', {
                        className: 'move-panel-slot-name',
                        children: moveDef.name,
                      }),
                    ],
                  },
                  slotIndex
                )
              : jsx(
                  'div',
                  {
                    className: 'move-panel-slot empty',
                    children: '---',
                  },
                  slotIndex
                )
          }),
        }),
        jsx('div', {
          className: 'move-panel-section-label',
          children: `Available Moves${tutorMoves.length ? ` \u00b7 TMs ${ownedTutorSet.size}/${tutorMoves.length}` : ''}`,
        }),
        jsx('div', {
          className: 'move-panel-list',
          children: allMoves.map(({ moveId, learnLevel }) => {
            const moveDef = moveData[moveId]
            if (!moveDef) return null
            const isSelected = moves.includes(moveId),
              isTutor = learnLevel < 0,
              locked = isTutor && !ownedTutorSet.has(moveId)
            return jsxs(
              'div',
              {
                className: `move-panel-item type-bg-${moveDef.type.toLowerCase()} ${isSelected ? 'selected' : ''}${locked ? ' locked' : ''}`,
                'data-tooltip': moveTooltip(moveId, moveDef),
                onClick: () => toggleMove(moveId),
                children: [
                  jsx('span', {
                    className: 'move-panel-item-icon',
                    children: jsx(MoveCategoryIcon, {
                      category: moveDef.category,
                    }),
                  }),
                  jsx('span', {
                    className: 'move-panel-item-name',
                    children: moveDef.name,
                  }),
                  jsx('span', {
                    className: 'move-panel-item-stats',
                    children: moveDef.power > 0 ? moveDef.power : '---',
                  }),
                  jsx('span', {
                    className: 'move-panel-item-stats',
                    children: formatMoveAccuracy(moveDef.accuracy),
                  }),
                  jsxs('span', {
                    className: 'move-panel-item-level',
                    children: isTutor ? (locked ? 'No TM' : 'TM') : `Lv.${learnLevel}`,
                  }),
                ],
              },
              moveId
            )
          }),
        }),
        jsxs('div', {
          className: 'move-panel-buttons',
          children: [
            jsx('button', {
              className: 'move-panel-btn cancel',
              onClick: onClose,
              children: 'Cancel',
            }),
            jsx('button', {
              className: 'move-panel-btn confirm',
              onClick: confirmMoves,
              children: 'Confirm',
            }),
          ],
        }),
      ],
    }),
  })
}
