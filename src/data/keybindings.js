// Rebindable hotkeys: the action list, sensible defaults and the small key
// resolver the global listener and the Settings panel share. Kept as pure data
// so it can be unit-tested without the game data.

import { SPEED_OPTIONS } from './ui.js'

/**
 * Every action a player can bind, in the order Settings lists them. `id` is
 * stable — it is the key the preference is stored under — so never rename one.
 * @type {Array<{ id: string, label: string, description: string, defaultKey: string }>}
 */
export const KEYBINDING_ACTIONS = [
  {
    id: 'togglePause',
    label: 'Pause / Resume',
    description: 'Pause or resume the idle loop.',
    defaultKey: 'p',
  },
  {
    id: 'speedUp',
    label: 'Battle Speed Up',
    description: 'Step the battle speed up one setting.',
    defaultKey: '=',
  },
  {
    id: 'speedDown',
    label: 'Battle Speed Down',
    description: 'Step the battle speed down one setting.',
    defaultKey: '-',
  },
  {
    id: 'toggleBattleMode',
    label: 'Manual / Auto Battle',
    description: 'Swap between picking each move and auto-battling.',
    defaultKey: 'm',
  },
  {
    id: 'toggleAutoCatch',
    label: 'Toggle Auto-Catch',
    description: 'Turn the automatic ball thrower on or off.',
    defaultKey: 'c',
  },
]

/**
 * The out-of-the-box bindings, keyed by action id.
 * @type {Record<string, string>}
 */
export const DEFAULT_KEYBINDINGS = Object.fromEntries(
  KEYBINDING_ACTIONS.map((action) => [action.id, action.defaultKey])
)

/**
 * Phases where the global hotkeys are active. Minigames and other
 * phase-driven scenes own the keyboard, so the hotkeys stay out of their way.
 * @type {Set<string>}
 */
export const HOTKEY_PHASES = new Set(['idle', 'battling', 'victory', 'defeat'])

/** Modifier keys report their own names; they are never bindable on their own. */
const MODIFIER_KEYS = new Set(['control', 'shift', 'alt', 'meta', 'capslock', 'os'])

/**
 * Map the shifted symbol a `key` reports back to its unshifted key, so a
 * binding on `=` also fires for `+` (and `1` for `!`). Letters are folded to
 * lower case the same way.
 * @type {Record<string, string>}
 */
const KEY_ALIASES = {
  ' ': 'space',
  '+': '=',
  _: '-',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
}

/**
 * A stable, comparable name for a KeyboardEvent key. Letters are lower-cased
 * and shifted symbols fold back to their base key.
 * @param {string | undefined | null} key
 * @returns {string | null}
 */
export function normalizeKeyName(key) {
  if (!key) return null
  if (KEY_ALIASES[key]) return KEY_ALIASES[key]
  return key.toLowerCase()
}

/**
 * Whether a normalised key name is a bare modifier (Control, Shift, ...).
 * @param {string} key
 * @returns {boolean}
 */
export function isModifierKey(key) {
  return MODIFIER_KEYS.has(key)
}

/**
 * Turn a keydown event into the canonical binding string the resolver looks
 * up, including any Ctrl / Alt / Meta prefixes. Shift is folded into the
 * key itself (see `normalizeKeyName`) rather than kept as a modifier.
 * @param {{ key: string, ctrlKey?: boolean, altKey?: boolean, metaKey?: boolean }} event
 * @returns {string | null}
 */
export function keyForEvent(event) {
  const key = normalizeKeyName(event.key)
  if (!key || isModifierKey(key)) return null
  const parts = []
  if (event.ctrlKey) parts.push('ctrl')
  if (event.altKey) parts.push('alt')
  if (event.metaKey) parts.push('meta')
  parts.push(key)
  return parts.join('+')
}

/**
 * The action id a key is bound to, or null. A binding missing from the map
 * falls back to the action's default.
 * @param {Record<string, string> | undefined | null} bindings
 * @param {string | null} key
 * @returns {string | null}
 */
export function actionForKey(bindings, key) {
  if (!key) return null
  const map = bindings && typeof bindings === 'object' ? bindings : {}
  for (const action of KEYBINDING_ACTIONS) {
    if ((map[action.id] ?? action.defaultKey) === key) return action.id
  }
  return null
}

/**
 * A human-readable label for a binding (`arrowup` -> `↑`, `ctrl+c` ->
 * `Ctrl + C`).
 * @param {string | undefined | null} key
 * @returns {string}
 */
export function keyLabel(key) {
  if (!key) return 'Unbound'
  return key
    .split('+')
    .map((part) => {
      if (part === 'space') return 'Space'
      if (part === 'arrowup') return '\u2191'
      if (part === 'arrowdown') return '\u2193'
      if (part === 'arrowleft') return '\u2190'
      if (part === 'arrowright') return '\u2192'
      if (part === 'escape') return 'Esc'
      if (part === 'enter') return 'Enter'
      if (part === 'backspace') return 'Backspace'
      if (part === 'tab') return 'Tab'
      if (part === 'delete') return 'Del'
      if (part === 'control') return 'Ctrl'
      if (part === 'alt') return 'Alt'
      if (part === 'meta') return 'Meta'
      if (part === 'shift') return 'Shift'
      return part.length === 1
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(' + ')
}

/**
 * Normalise a stored binding map: drop unknown actions and non-string values,
 * and fill anything missing with the default. Always returns a fresh object.
 * @param {unknown} value
 * @returns {Record<string, string>}
 */
export function sanitizeKeybindings(value) {
  const source = value && typeof value === 'object' ? /** @type {Record<string, any>} */ (value) : {}
  /** @type {Record<string, string>} */
  const result = {}
  for (const action of KEYBINDING_ACTIONS) {
    const bound = source[action.id]
    result[action.id] = typeof bound === 'string' && bound ? bound : action.defaultKey
  }
  return result
}

/**
 * The game actions a bound hotkey performs. Returns an array because stepping
 * the speed while paused also resumes the loop, mirroring the on-screen
 * speed control.
 * @param {string} actionId
 * @param {Pick<GameState, 'speed' | 'battleMode' | 'paused'>} state
 * @returns {GameAction[]}
 */
export function hotkeyActions(actionId, state) {
  switch (actionId) {
    case 'togglePause':
      return [{ type: 'TOGGLE_PAUSE' }]
    case 'speedUp':
    case 'speedDown': {
      const index = SPEED_OPTIONS.indexOf(state.speed),
        step = actionId === 'speedUp' ? 1 : -1,
        nextSpeed =
          SPEED_OPTIONS[
            Math.min(SPEED_OPTIONS.length - 1, Math.max(0, (index === -1 ? 0 : index) + step))
          ]
      /** @type {GameAction[]} */
      const actions = []
      if (state.paused) actions.push({ type: 'TOGGLE_PAUSE' })
      if (nextSpeed !== state.speed) actions.push({ type: 'SET_SPEED', payload: { speed: nextSpeed } })
      return actions
    }
    case 'toggleBattleMode':
      return [
        {
          type: 'SET_BATTLE_MODE',
          payload: { mode: state.battleMode === 'manual' ? 'auto' : 'manual' },
        },
      ]
    case 'toggleAutoCatch':
      return [{ type: 'TOGGLE_AUTO_CATCH' }]
    default:
      return []
  }
}
