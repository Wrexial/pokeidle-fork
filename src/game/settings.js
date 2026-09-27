// Player preferences stored outside the save. Keeping them in their own
// localStorage key means they survive a save reset, are shared across every
// save slot, and never travel inside an exported save / share code.
//
// The save loader still reads these fields out of older saves (for a one-time
// migration); `mergeStoredSettings` then overlays this store on top, and the
// provider writes the store back whenever a preference changes.

/** Storage key for the shared settings blob. */
export const SETTINGS_STORAGE_KEY = 'pokemon-idle-settings'

/**
 * The state fields that are player preferences rather than run progress.
 * `SAVED_STATE_KEYS` excludes all of them, so they are persisted here instead.
 */
export const SETTINGS_KEYS = /** @type {const} */ ([
  'speed',
  'battleStyle',
  'battleMode',
  'autoCatch',
  'alwaysCatchShinies',
  'globalCatchDefaults',
  'autoProceed',
  'browserNotifications',
  'notifyShiny',
  'notifyRare',
  'notifyEgg',
  'reducedMotion',
  'colourblindTypes',
  'largeText',
  'martCollapsed',
  'musicEnabled',
  'sfxEnabled',
])

/**
 * Read the stored settings blob, or null when there is nothing valid to read.
 * Never throws: storage may be unavailable.
 * @returns {Record<string, any> | null}
 */
export function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/**
 * Overlay the stored preferences onto a freshly loaded (or fresh) state. A
 * field the store doesn't carry keeps the value the state already had, which
 * is how a save's settings migrate in on the first boot after an update.
 * @param {GameState} state
 * @returns {GameState}
 */
export function mergeStoredSettings(state) {
  const stored = loadStoredSettings()
  if (!stored) return state
  /** @type {Record<string, any>} */
  const merged = { ...state }
  for (const key of SETTINGS_KEYS) if (stored[key] !== void 0) merged[key] = stored[key]
  return /** @type {GameState} */ (merged)
}

/**
 * Persist the preference fields of a state. Never throws.
 * @param {GameState} state
 * @returns {void}
 */
export function storeSettings(state) {
  try {
    /** @type {Record<string, any>} */
    const settings = {}
    for (const key of SETTINGS_KEYS) settings[key] = state[key]
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* storage may be unavailable */
  }
}

/** Remove the stored preferences (used by tests and a full reset). */
export function clearStoredSettings() {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY)
  } catch {
    /* storage may be unavailable */
  }
}
