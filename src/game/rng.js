// Small deterministic helpers. The Battle Tower uses these so a given floor is
// always the same puzzle: the opponents are seeded from the floor number and
// the battles run without random damage/crit/miss variance.

/**
 * Mulberry32 — a tiny, fast, deterministic PRNG.
 * @param {number} seed
 * @returns {() => number} A function returning [0, 1).
 */
export function mulberry32(seed) {
  let state = seed >>> 0
  return function () {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Stable 32-bit FNV-1a hash of a string, for seeding the PRNG.
 * @param {string} text
 * @returns {number}
 */
export function hashString(text) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
