// Tracks whether the browser currently has a network connection.
//
// The animated sprite set (~440 MB) is deliberately not part of the offline
// download, so when the device goes offline the sprite helper falls back to the
// static art instead of requesting gifs that are not cached.
//
// `navigator.onLine` turns false the moment the device loses its connection,
// which is exactly when the offline cache should take over. The value is cached
// at module scope so the low-level sprite helper can read it without a hook;
// `useOnlineStatus` re-renders the app when it changes.

/** @type {boolean} */
let online = typeof navigator === 'undefined' ? true : navigator.onLine !== false

/** @type {Set<() => void>} */
const listeners = new Set()

function emit() {
  for (const listener of listeners) listener()
}

// The Node test stub for `window` has no addEventListener, so guard for it.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('online', () => {
    online = true
    emit()
  })
  window.addEventListener('offline', () => {
    online = false
    emit()
  })
}

/** @returns {boolean} */
export function isOnline() {
  return online
}

/**
 * Force the connection state. Used by tests; the browser drives the real value
 * through the online / offline events.
 * @param {boolean} value
 */
export function setOnline(value) {
  online = Boolean(value)
  emit()
}

/**
 * Subscribe to connection changes.
 * @param {() => void} listener
 * @returns {() => void} an unsubscribe function
 */
export function subscribeOnline(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
