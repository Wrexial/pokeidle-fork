// Saved party presets: a small modal to capture the current team and restore it.

import React from 'react'
import { createPortal } from 'react-dom'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useGame } from '../game/context.js'
import { isFeatureUnlocked } from '../game/feature-unlocks.js'

/** The phases a preset can be applied in (only the map, never mid-battle). */
const APPLYABLE_PHASES = new Set(['idle'])

export function TeamPresets() {
  const { state, dispatch } = useGame(),
    [open, setOpen] = React.useState(!1),
    presets = state.teamPresets ?? [],
    canApply = APPLYABLE_PHASES.has(state.phase),
    canSave = state.party.length > 0
  return jsxs(React.Fragment, {
    children: [
      isFeatureUnlocked(state, 'teamPresets') &&
        jsx('button', {
          className: 'team-presets-btn',
          onClick: () => setOpen(!0),
          title: 'Saved team presets',
          children: '\u2699 TEAM',
        }),
      open &&
        createPortal(
          jsx('div', {
            className: 'modal-overlay',
            onClick: () => setOpen(!1),
            children: jsxs('div', {
              className: 'modal team-presets-modal',
              onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
              children: [
                jsxs('div', {
                  className: 'modal-header',
                  children: [
                    jsx('span', {
                      className: 'modal-title',
                      children: 'Team Presets',
                    }),
                    jsx('button', {
                      className: 'modal-close',
                      onClick: () => setOpen(!1),
                      children: 'X',
                    }),
                  ],
                }),
                jsx('p', {
                  className: 'settings-hint',
                  children:
                    'Save your current party and restore it in one tap. Applying pulls any missing Pokemon back out of the box.',
                }),
                presets.length === 0
                  ? jsx('p', {
                      className: 'team-presets-empty',
                      children: 'No saved teams yet.',
                    })
                  : jsx('div', {
                      className: 'team-presets-list',
                      children: presets.map((preset) =>
                        jsxs(
                          'div',
                          {
                            className: 'team-presets-row',
                            children: [
                              jsx('span', {
                                className: 'team-presets-name',
                                children: preset.name,
                              }),
                              jsx('span', {
                                className: 'team-presets-count',
                                children: `${preset.members.length}`,
                              }),
                              jsx('button', {
                                className: 'team-presets-apply',
                                disabled: !canApply,
                                onClick: () => {
                                  dispatch({
                                    type: 'APPLY_TEAM_PRESET',
                                    payload: { presetId: preset.id },
                                  })
                                  setOpen(!1)
                                },
                                children: 'Apply',
                              }),
                              jsx('button', {
                                className: 'team-presets-delete',
                                title: 'Delete preset',
                                onClick: () =>
                                  dispatch({
                                    type: 'DELETE_TEAM_PRESET',
                                    payload: { presetId: preset.id },
                                  }),
                                children: 'X',
                              }),
                            ],
                          },
                          preset.id
                        )
                      ),
                    }),
                jsx('button', {
                  className: 'team-presets-save',
                  disabled: !canSave,
                  onClick: () =>
                    dispatch({
                      type: 'SAVE_TEAM_PRESET',
                      payload: {},
                    }),
                  children: canSave ? `Save current team (${state.party.length})` : 'No party to save',
                }),
              ],
            }),
          }),
          document.body
        ),
    ],
  })
}
