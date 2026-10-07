// Split from a grouped component file.

import React from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { clearSave } from '../data/config.js'
import { SPEED_OPTIONS } from '../data/ui.js'
import { unlockAudio } from '../game/audio.js'
import { useGame } from '../game/context.js'
import { decodeShareCode, encodeShareCode, repairSave, serializeSave, suspendAutosave, writeImportedSave } from '../game/save.js'
import { MonotypeSelect } from './monotype-select.js'
import { OfflinePanel } from './offline-panel.js'
import { SaveSlotsPanel } from './save-slots.js'

/** @param {{ onClose: () => void }} props */
export function SettingsModal({ onClose }) {
  const { state, dispatch } = useGame()
  const [confirming, setConfirming] = React.useState(!1)
  const [importError, setImportError] = React.useState('')
  const [notifyError, setNotifyError] = React.useState('')
  const [shareCode, setShareCode] = React.useState('')
  const [shareInput, setShareInput] = React.useState('')
  const [shareStatus, setShareStatus] = React.useState('')
  /** @type {React.RefObject<HTMLInputElement>} */
  const fileInputRef = React.useRef(/** @type {any} */ (null))
  function resetSave() {
    suspendAutosave()
    clearSave()
    window.location.reload()
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
      // Stop the idle loop and the autosave so neither can overwrite the
      // import before the reload finishes.
      suspendAutosave()
      if (!state.paused) dispatch({ type: 'TOGGLE_PAUSE' })
      // repairSave above already validated the shape, and writeImportedSave
      // stamps the current version, so a save from another build is upgraded
      // rather than rejected.
      if (!writeImportedSave(parsed)) {
        setImportError('Could not write the save to browser storage.')
        return
      }
      window.location.reload()
    }
    reader.readAsText(file)
  }
  /** Generate a share code from the current save and try to copy it. */
  function generateShareCode() {
    if (!state.playerPokemon) return
    const code = encodeShareCode(serializeSave(state))
    setShareCode(code)
    setShareStatus('')
    copyText(code)
  }
  /** @param {string} text */
  function copyText(text) {
    const clipboard = /** @type {any} */ (navigator).clipboard
    if (!clipboard?.writeText) {
      setShareStatus('Copy the code from the box below.')
      return
    }
    clipboard.writeText(text).then(
      () => setShareStatus('Share code copied to the clipboard!'),
      () => setShareStatus('Copy the code from the box below.')
    )
  }
  /** Load a pasted share code, replacing the current save. */
  function importShareCode() {
    const parsed = decodeShareCode(shareInput),
      repaired = parsed ? repairSave(parsed) : null
    if (!repaired) {
      setShareStatus('That share code is not a valid Pokemon Idle save.')
      return
    }
    // Stop the idle loop and the autosave so neither can overwrite the import
    // before the reload finishes.
    suspendAutosave()
    if (!state.paused) dispatch({ type: 'TOGGLE_PAUSE' })
    if (!writeImportedSave(/** @type {any} */ (parsed))) {
      setShareStatus('Could not write the save to browser storage.')
      return
    }
    window.location.reload()
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
                      'Are you sure? This will permanently delete this slot\u2019s save data and restart the game.',
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
                      'New here? The player guide explains every feature, and the battle reference lists every move, ability and held item.',
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
                  jsx('a', {
                    className: 'settings-link',
                    href: '/reference.html',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    children: 'Battle Reference',
                  }),
                  jsxs('div', {
                    className: 'settings-section',
                    children: [
                      jsx('div', {
                        className: 'settings-section-title',
                        children: 'Gameplay',
                      }),
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'Quality-of-life toggles. Auto-Catch throws a ball after a win; Always Catch Shinies overrides your catch rules for shinies; Auto-Proceed skips the continue prompt after battle events. Battle Speed sets how fast the idle loop runs.',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.autoCatch ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_AUTO_CATCH' }),
                        children: state.autoCatch ? 'Auto-Catch: ON' : 'Auto-Catch: OFF',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.alwaysCatchShinies ? ' active' : ''}`,
                        onClick: () =>
                          dispatch({
                            type: 'SET_ALWAYS_CATCH_SHINIES',
                            payload: { value: !state.alwaysCatchShinies },
                          }),
                        children: state.alwaysCatchShinies
                          ? 'Always Catch Shinies: ON'
                          : 'Always Catch Shinies: OFF',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.autoProceed ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_AUTO_PROCEED' }),
                        children: state.autoProceed ? 'Auto-Proceed: ON' : 'Auto-Proceed: OFF',
                      }),
                      jsxs('div', {
                        className: 'settings-speed',
                        children: [
                          jsx('span', {
                            className: 'settings-speed-label',
                            children: 'Battle Speed',
                          }),
                          SPEED_OPTIONS.map((option) =>
                            jsx(
                              'button',
                              {
                                className: `settings-speed-btn${state.speed === option ? ' active' : ''}`,
                                onClick: () =>
                                  dispatch({ type: 'SET_SPEED', payload: { speed: option } }),
                                children: `${option}x`,
                              },
                              option
                            )
                          ),
                        ],
                      }),
                    ],
                  }),
                  jsxs('div', {
                    className: 'settings-section',
                    children: [
                      jsx('div', {
                        className: 'settings-section-title',
                        children: 'Battles',
                      }),
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'Switch (the default) lets your auto-battler switch to a better type matchup on its own; Set never switches automatically. Your Pokemon still send the next one out after a faint either way.',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.battleStyle === 'switch' ? ' active' : ''}`,
                        onClick: () =>
                          dispatch({
                            type: 'SET_BATTLE_STYLE',
                            payload: { style: state.battleStyle === 'switch' ? 'set' : 'switch' },
                          }),
                        children:
                          state.battleStyle === 'switch'
                            ? 'Battle Style: Switch'
                            : 'Battle Style: Set',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.battleMode === 'manual' ? ' active' : ''}`,
                        onClick: () =>
                          dispatch({
                            type: 'SET_BATTLE_MODE',
                            payload: { mode: state.battleMode === 'manual' ? 'auto' : 'manual' },
                          }),
                        children:
                          state.battleMode === 'manual'
                            ? 'Battle Mode: Manual'
                            : 'Battle Mode: Auto',
                      }),
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'Manual mode lets you pick each move and switch Pokemon yourself (use the AUTO/MANUAL button on the battle screen to swap at any time). A battle left alone falls back to auto after a minute.',
                      }),
                    ],
                  }),
                  jsxs('div', {
                    className: 'settings-section',
                    children: [
                      jsx('div', {
                        className: 'settings-section-title',
                        children: 'Display',
                      }),
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'Choose how Pokemon are drawn: animated sprites (the default) or the static pixel art. Static is lighter on older devices and a natural fit with Reduced Motion.',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.spriteStyle === 'static' ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_SPRITE_STYLE' }),
                        children:
                          state.spriteStyle === 'static' ? 'Sprites: Static' : 'Sprites: Animated',
                      }),
                    ],
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
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'Choose which events can raise a notification while the tab is in the background.',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.notifyShiny ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_NOTIFY_SHINY' }),
                        children: state.notifyShiny ? 'Notify Shinies: ON' : 'Notify Shinies: OFF',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.notifyRare ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_NOTIFY_RARE' }),
                        children: state.notifyRare
                          ? 'Notify Raids & Legendaries: ON'
                          : 'Notify Raids & Legendaries: OFF',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.notifyEgg ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_NOTIFY_EGG' }),
                        children: state.notifyEgg ? 'Notify Egg Hatches: ON' : 'Notify Egg Hatches: OFF',
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
                      jsx('button', {
                        className: `settings-toggle-btn${state.largeText ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_LARGE_TEXT' }),
                        children: state.largeText ? 'Larger Text: ON' : 'Larger Text: OFF',
                      }),
                    ],
                  }),
                  jsxs('div', {
                    className: 'settings-section',
                    children: [
                      jsx('div', {
                        className: 'settings-section-title',
                        children: 'Challenge Modes',
                      }),
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'Optional hard-mode rules. Randomizer rolls a random species on every wild encounter; Level Scaling makes wild Pokemon match your active Pokemon\u2019s level; Nuzlocke releases a Pokemon the moment it faints (your last one is spared); One Catch per Route lets you catch only the first wild Pokemon on each route; Monotype limits wild encounters to a single type.',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.challengeRandomizer ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_CHALLENGE_RANDOMIZER' }),
                        children: state.challengeRandomizer
                          ? 'Randomizer: ON'
                          : 'Randomizer: OFF',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.challengeLevelScale ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_CHALLENGE_LEVEL_SCALE' }),
                        children: state.challengeLevelScale
                          ? 'Level Scaling: ON'
                          : 'Level Scaling: OFF',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.challengeNuzlocke ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_CHALLENGE_NUZLOCKE' }),
                        children: state.challengeNuzlocke ? 'Nuzlocke: ON' : 'Nuzlocke: OFF',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.challengeRestrictCatches ? ' active' : ''}`,
                        onClick: () => dispatch({ type: 'TOGGLE_CHALLENGE_RESTRICT_CATCHES' }),
                        children: state.challengeRestrictCatches
                          ? 'One Catch per Route: ON'
                          : 'One Catch per Route: OFF',
                      }),
                      jsx(MonotypeSelect, {
                        value: state.challengeMonotype,
                        onChange: /** @param {string | null} monotype */ (monotype) =>
                          dispatch({
                            type: 'SET_CHALLENGE_MONOTYPE',
                            payload: { monotype },
                          }),
                      }),
                    ],
                  }),
                  jsxs('div', {
                    className: 'settings-section',
                    children: [
                      jsx('div', {
                        className: 'settings-section-title',
                        children: 'Audio',
                      }),
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'Sound is off by default. Music loops a simple theme for each region; effects play on catches, evolutions, level-ups and big moments.',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.musicEnabled ? ' active' : ''}`,
                        onClick: () => {
                          unlockAudio()
                          dispatch({ type: 'TOGGLE_MUSIC' })
                        },
                        children: state.musicEnabled ? 'Music: ON' : 'Music: OFF',
                      }),
                      jsx('button', {
                        className: `settings-toggle-btn${state.sfxEnabled ? ' active' : ''}`,
                        onClick: () => {
                          unlockAudio()
                          dispatch({ type: 'TOGGLE_SFX' })
                        },
                        children: state.sfxEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF',
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
                      jsx('p', {
                        className: 'settings-hint settings-share-hint',
                        children:
                          'Or use a share code: copy the text and paste it into another device to move your progress without a file.',
                      }),
                      jsxs('div', {
                        className: 'settings-share',
                        children: [
                          jsx('button', {
                            className: 'settings-save-btn',
                            onClick: generateShareCode,
                            disabled: !state.playerPokemon,
                            children: '🔗 Copy Share Code',
                          }),
                          shareCode
                            ? jsx('textarea', {
                                className: 'settings-share-code',
                                readOnly: true,
                                value: shareCode,
                                onFocus: /** @param {React.FocusEvent<HTMLTextAreaElement>} event */ (event) => event.target.select(),
                              })
                            : null,
                          jsx('textarea', {
                            className: 'settings-share-code',
                            placeholder: 'Paste a share code here to load it',
                            value: shareInput,
                            onChange: /** @param {React.ChangeEvent<HTMLTextAreaElement>} event */ (event) => setShareInput(event.target.value),
                          }),
                          jsx('button', {
                            className: 'settings-save-btn',
                            onClick: importShareCode,
                            disabled: !shareInput.trim(),
                            children: '⬆ Load Share Code',
                          }),
                          shareStatus
                            ? jsx('p', { className: 'settings-share-status', children: shareStatus })
                            : null,
                        ],
                      }),
                      jsx('button', {
                        className: 'settings-reset-btn',
                        onClick: () => setConfirming(!0),
                        children: 'Reset This Slot',
                      }),
                    ],
                  }),
                  jsx(OfflinePanel, {}),
                  jsxs('div', {
                    className: 'settings-section',
                    children: [
                      jsx('div', {
                        className: 'settings-section-title',
                        children: 'Save Slots',
                      }),
                      jsx('p', {
                        className: 'settings-hint',
                        children:
                          'The game keeps up to three independent saves. Play a different one, or start a new game in any slot.',
                      }),
                      jsx(SaveSlotsPanel, {}),
                    ],
                  }),
                ],
              }),
        }),
      ],
    }),
  })
}
