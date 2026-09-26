// Tiny synthesized audio engine — no asset files. It plays a looping chiptune
// theme per region plus short sound effects for notable events. Everything is
// opt-in: the AudioContext is only created once a toggle is switched on (a user
// gesture), so an audio-off game pays nothing.

const STEP_SECONDS = 0.16
const STEPS_PER_BAR = 8
// One root note per region (picked by a stable hash of the region id).
const ROOTS = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392, 415.3, 440]
const MELODIES = [
  [0, 2, 4, 2, 0, 4, 7, 4],
  [0, 4, 7, 4, 2, 4, 0, 2],
  [7, 4, 2, 4, 0, 2, 4, 0],
  [0, 2, 7, 4, 2, 0, 4, 2],
]
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14]

/** @type {AudioContext | null} */
let context = null
/** @type {string | null} */
let musicKey = null
/** @type {ReturnType<typeof setTimeout> | null} */
let musicTimer = null
let nextBarTime = 0
let musicRoot = 220
/** @type {number[]} */
let musicPattern = MELODIES[0]

/** @returns {AudioContext | null} */
function getContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass =
    window.AudioContext || /** @type {any} */ (window).webkitAudioContext
  if (!AudioContextClass) return null
  if (!context) context = new AudioContextClass()
  if (context.state === 'suspended') context.resume().catch(() => {})
  return context
}

/** Create/resume the AudioContext from a user gesture (the Settings toggle). */
export function unlockAudio() {
  getContext()
}

/**
 * @param {number} frequency
 * @param {number} start
 * @param {number} duration
 * @param {OscillatorType} [type]
 * @param {number} [gain]
 */
function playTone(frequency, start, duration, type = 'square', gain = 0.05) {
  const ctx = getContext()
  if (!ctx) return
  const oscillator = ctx.createOscillator(),
    amp = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.linearRampToValueAtTime(gain, start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(amp)
  amp.connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.03)
}

/** @type {Record<string, [number, number, number][]>} */
export const SFX = {
  notify: [
    [880, 0, 0.08],
    [1174.66, 0.08, 0.14],
  ],
  levelUp: [
    [523.25, 0, 0.09],
    [659.25, 0.09, 0.09],
    [783.99, 0.18, 0.2],
  ],
  shiny: [
    [1046.5, 0, 0.07],
    [1318.51, 0.07, 0.07],
    [1567.98, 0.14, 0.07],
    [2093, 0.21, 0.28],
  ],
  catch: [
    [659.25, 0, 0.08],
    [783.99, 0.08, 0.08],
    [987.77, 0.16, 0.22],
  ],
  evolution: [
    [392, 0, 0.12],
    [523.25, 0.12, 0.12],
    [659.25, 0.24, 0.12],
    [783.99, 0.36, 0.34],
  ],
  heal: [
    [523.25, 0, 0.12],
    [783.99, 0.12, 0.24],
  ],
  badge: [
    [523.25, 0, 0.1],
    [659.25, 0.1, 0.1],
    [783.99, 0.2, 0.1],
    [1046.5, 0.3, 0.34],
  ],
  dexComplete: [
    [523.25, 0, 0.12],
    [659.25, 0.12, 0.12],
    [783.99, 0.24, 0.12],
    [1046.5, 0.36, 0.2],
    [1318.51, 0.54, 0.2],
    [1567.98, 0.72, 0.5],
  ],
  // A Voltorb going off: a sharp crack into a low, rumbling boom.
  explosion: [
    [880, 0, 0.05],
    [196, 0.02, 0.12],
    [146.83, 0.08, 0.16],
    [110, 0.14, 0.24],
    [73.42, 0.22, 0.42],
  ],
  // Minigame feedback: a soft tick for a UI action, positive / negative
  // stingers for a good or bad result, and a fanfare for finishing.
  tap: [[392, 0, 0.04]],
  good: [
    [659.25, 0, 0.06],
    [987.77, 0.06, 0.12],
  ],
  great: [
    [659.25, 0, 0.05],
    [987.77, 0.05, 0.05],
    [1318.51, 0.1, 0.16],
  ],
  combo: [
    [880, 0, 0.04],
    [1174.66, 0.04, 0.04],
    [1567.98, 0.08, 0.16],
  ],
  miss: [
    [293.66, 0, 0.07],
    [220, 0.07, 0.16],
  ],
  win: [
    [523.25, 0, 0.09],
    [659.25, 0.09, 0.09],
    [783.99, 0.18, 0.09],
    [1046.5, 0.27, 0.3],
  ],
  coin: [
    [1046.5, 0, 0.05],
    [1318.51, 0.05, 0.12],
  ],
  dig: [
    [164.81, 0, 0.05],
    [123.47, 0.05, 0.12],
  ],
  splash: [
    [196, 0, 0.07],
    [261.63, 0.05, 0.1],
  ],
}

/** @param {string} name */
export function playSfx(name) {
  const ctx = getContext()
  if (!ctx) return
  const notes = SFX[name]
  if (!notes) return
  const start = ctx.currentTime + 0.02
  for (const [frequency, offset, duration] of notes)
    playTone(frequency, start + offset, duration)
}

/** @param {string} value */
function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index++)
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  return hash
}

/** @param {number} base @param {number} semitones */
const transpose = (base, semitones) => base * Math.pow(2, semitones / 12)

/** @param {number} startTime */
function scheduleBar(startTime) {
  // Bass on beats 1 and 5.
  playTone(transpose(musicRoot, -12), startTime, STEP_SECONDS * 1.6, 'triangle', 0.045)
  playTone(
    transpose(musicRoot, -12),
    startTime + STEP_SECONDS * 4,
    STEP_SECONDS * 1.6,
    'triangle',
    0.045
  )
  for (let step = 0; step < STEPS_PER_BAR; step++)
    playTone(
      transpose(musicRoot, PENTATONIC[musicPattern[step] % PENTATONIC.length]),
      startTime + step * STEP_SECONDS,
      STEP_SECONDS * 0.9,
      'square',
      0.024
    )
}

function pumpMusic() {
  const ctx = getContext()
  if (!ctx || !musicKey) return
  const barDuration = STEPS_PER_BAR * STEP_SECONDS
  // Schedule a little ahead on the audio clock so the loop stays gapless.
  while (nextBarTime < ctx.currentTime + 0.6) {
    scheduleBar(nextBarTime)
    nextBarTime += barDuration
  }
  musicTimer = setTimeout(pumpMusic, 200)
}

/**
 * Start (or switch to) the looping theme for a region key. Idempotent, so it is
 * safe to call on every render of the audio effect.
 * @param {string} key
 */
export function startMusic(key) {
  if (musicKey === key && musicTimer) return
  stopMusic()
  musicKey = key
  const ctx = getContext()
  if (!ctx) return
  const hash = hashString(key)
  musicRoot = ROOTS[hash % ROOTS.length]
  musicPattern = MELODIES[hash % MELODIES.length]
  nextBarTime = ctx.currentTime + 0.1
  pumpMusic()
}

export function stopMusic() {
  if (musicTimer) clearTimeout(musicTimer)
  musicTimer = null
  musicKey = null
}
