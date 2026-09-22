// Split from a grouped component file — see tools/decompile/split-components.mjs

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { SAVE_KEY, SAVE_VERSION, clearSave } from '../data/config.js'
import { repairSave, serializeSave, useGame } from '../game/context.js'

/** @param {{ onClose: () => void }} props */
export function SettingsModal({ onClose }) {
  const { state, dispatch } = useGame()
  const [confirming, setConfirming] = React.useState(!1)
  const [importError, setImportError] = React.useState('')
  const [notifyError, setNotifyError] = React.useState('')
  /** @type {React.RefObject<HTMLInputElement>} */
  const fileInputRef = React.useRef(/** @type {any} */ (null))
  function resetSave() {
    ;(clearSave(), window.location.reload())
  }
  function exportSave() {
    if (!state.playerPokemon) return
    const blob = new Blob([JSON.stringify(serializeSave(state), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pokemon-idle-save-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
  /** @param {React.ChangeEvent<HTMLInputElement>} event */
  function importSave(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      let parsed
      let repaired = null
      try {
        parsed = JSON.parse(String(reader.result))
        repaired = repairSave(parsed)
      } catch {
        repaired = null
      }
      if (!repaired) {
        setImportError('That file is not a valid Pokémon Idle save.')
        return
      }
      // Stop the idle loop so an autosave cannot overwrite the import before
      // the reload finishes.
      if (!state.paused) dispatch({ type: 'TOGGLE_PAUSE' })
      // Stamp the current version: repairSave above already validated the
      // shape, so a save from another build is upgraded rather than rejected.
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ ...parsed, version: SAVE_VERSION }))
        window.location.reload()
      } catch {
        setImportError('Could not write the save to browser storage.')
      }
    }
    reader.readAsText(file)
  }
  async function toggleBrowserNotifications() {
    if (!state.browserNotifications) {
      if (typeof Notification === 'undefined') {
        setNotifyError('This browser does not support notifications.')
        return
      }
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setNotifyError('Notification permission was denied by the browser.')
          return
        }
      }
    }
    setNotifyError('')
    dispatch({ type: 'TOGGLE_BROWSER_NOTIFICATIONS' })
  }
  return jsx('div', {
    className: 'battle-info-overlay',
    onClick: onClose,
    children: jsxs('div', {
      className: 'battle-info-modal',
      onClick: /** @param {React.MouseEvent} event */ (event) => event.stopPropagation(),
      children: [
        jsxs('div', {
          className: 'battle-info-header',
          children: [
            jsx('span', {
              className: 'battle-info-title',
              children: 'Settings',
            }),
            jsx('button', {
              className: 'battle-info-close',
              onClick: onClose,
              children: 'X',
            }),
          ],
        }),
        jsx('div', {
          className: 'battle-info-content',
          children: confirming
            ? jsxs('div', {
                className: 'settings-confirm',
                children: [
                  jsx('p', {
                    children:
                      'Are you sure? This will permanently delete all save data and restart the game.',
                  }),
                  jsxs('div', {
                    className: 'settings-confirm-buttons',
                    children: [
                      jsx('button', {
                        className: 'settings-confirm-yes',
                        onClick: resetSave,
                        children: 'Yes, Reset',
                      }),
                      jsx('button', {
                        className: 'settings-confirm-no',
                        onClick: () => setConfirming(!1),
                        children: 'Cancel',
                      }),
                    ],
                  }),
                ],
              })
            : jsxs(Fragment, {
                children: [
                  jsx('p', {
                    className: 'settings-hint',
                    children:
                      'New here? The player guide explains every feature — regions, catching, breeding, shiny hunting and more.',
                  }),
                  jsx('a', {
                    className: 'settings-guide-btn',
                    href: '/guide.html',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    children: '📖 Player Guide',
                  }),
                  jsx('a', {
                    className: 'settings-link',
                    href: '/encounter-index.html',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    children: 'Wild Encounter Index',
                  }),
                  jsxs('div', {
                    className: 'settings-section',
                    children: [
                      jsx('div', {
                        className: 'settings-section-title',
                        children: 'Notifications',
                      }),
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'Get a browser notification for shinies, new Pokedex entries, badges and other key events while the tab is in the background. Returning after a while also shows a summary.',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.browserNotifications ? ' active' : ''}`,
                        onClick: toggleBrowserNotifications,
                        children: state.browserNotifications
                          ? 'Browser Notifications: ON'
                          : 'Browser Notifications: OFF',
                      }),
                      notifyError
                        ? jsx('p', {
                            className: 'settings-save-error',
                            children: notifyError,
                          })
                        : null,
                    ],
                  }),
                  jsxs('div', {
                    className: 'settings-section',
                    children: [
                      jsx('div', {
                        className: 'settings-section-title',
                        children: 'Accessibility',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.reducedMotion ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_REDUCED_MOTION' }),
                        children: state.reducedMotion
                          ? 'Reduced Motion: ON'
                          : 'Reduced Motion: OFF',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.colourblindTypes ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_COLOURBLIND_TYPES' }),
                        children: state.colourblindTypes
                          ? 'Move Type Labels: ON'
                          : 'Move Type Labels: OFF',
                      }),
                    ],
                  }),
                  jsxs('div', {
                    className: 'settings-section',
                    children: [
                      jsx('div', {
                        className: 'settings-section-title',
                        children: 'Save Data',
                      }),
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'Export a backup of your progress, or import one from a file. Importing replaces your current save.',
                      }),
                      jsxs('div', {
                        className: 'settings-save-row',
                        children: [
                          jsx('button', {
                            className: 'settings-save-btn',
                            onClick: exportSave,
                            disabled: !state.playerPokemon,
                            children: '⬇ Export Save',
                          }),
                          jsx('button', {
                            className: 'settings-save-btn',
                            onClick: () => fileInputRef.current?.click(),
                            children: '⬆ Import Save',
                          }),
                          jsx('input', {
                            ref: fileInputRef,
                            type: 'file',
                            accept: '.json,application/json',
                            style: { display: 'none' },
                            onChange: importSave,
                          }),
                        ],
                      }),
                      importError
                        ? jsx('p', {
                            className: 'settings-save-error',
                            children: importError,
                          })
                        : null,
                    ],
                  }),
                  jsx('button', {
                    className: 'settings-reset-btn',
                    onClick: () => setConfirming(!0),
                    children: 'Reset Save Data',
                  }),
                ],
              }),
        }),
      ],
    }),
  })
}
