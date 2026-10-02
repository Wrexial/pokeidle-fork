// Procedural ice-slide rooms for Snowpoint Temple. A generated room is only
// accepted when it is solvable and "fair": every state the player can slide
// into must still be able to reach the exit, so a wrong move can always be
// recovered and never soft-locks a paid run. The parser's `icePar` proves
// solvability and `iceSlidePosition` backs the fairness walk.

import { ICE_SLIDE_DIRECTIONS, iceSlidePosition, parseIceLevel } from './ice-slide.js'

/** Room shapes the generator rolls from. @type {[number, number][]} */
export const ICE_GENERATOR_SIZES = [
  [7, 7],
  [9, 7],
  [9, 9],
  [11, 7],
  [11, 9],
]

/** Interior wall densities the generator rolls. */
export const ICE_GENERATOR_DENSITIES = [0.18, 0.22, 0.26]

/** Shortest a generated room may be, in slides. */
export const ICE_GENERATOR_MIN_PAR = 3

/** How many layouts to attempt before giving up on a room. */
export const ICE_GENERATOR_ATTEMPTS = 60

/** @typedef {ReturnType<typeof parseIceLevel>} IceLevel */

/**
 * Every cell the hero can slide into, starting from `from`.
 * @param {IceLevel} level
 * @param {number} from
 * @returns {Set<number>}
 */
function reachableFrom(level, from) {
  const seen = new Set([from])
  const stack = [from]
  while (stack.length > 0) {
    const position = /** @type {number} */ (stack.pop())
    for (const direction of ICE_SLIDE_DIRECTIONS) {
      const landing = iceSlidePosition(level, position, direction)
      if (landing !== position && !seen.has(landing)) {
        seen.add(landing)
        stack.push(landing)
      }
    }
  }
  return seen
}

/**
 * Every cell from which the exit can eventually be reached (including the exit
 * itself), walked backwards over the directed slide graph.
 * @param {IceLevel} level
 * @returns {Set<number>}
 */
function statesThatCanReachGoal(level) {
  const { width, height, walls, goal } = level
  const canReach = new Set([goal])
  const stack = [goal]
  while (stack.length > 0) {
    const target = /** @type {number} */ (stack.pop())
    for (let index = 0; index < width * height; index++) {
      if (walls.has(index) || canReach.has(index)) continue
      for (const direction of ICE_SLIDE_DIRECTIONS) {
        if (iceSlidePosition(level, index, direction) === target) {
          canReach.add(index)
          stack.push(index)
          break
        }
      }
    }
  }
  return canReach
}

/**
 * Whether every state reachable from the start can still reach the exit, so a
 * wrong move is always recoverable. The hand-designed rooms all pass this, and
 * the generator only emits rooms that do.
 * @param {IceLevel} level
 * @returns {boolean}
 */
export function isIceRoomFair(level) {
  if (!Number.isFinite(level.par)) return false
  const canReach = statesThatCanReachGoal(level)
  for (const position of reachableFrom(level, level.start)) {
    if (!canReach.has(position)) return false
  }
  return true
}

/**
 * Carve and validate one candidate room, or return null when it fails a check.
 * @param {() => number} random
 * @param {[number, number]} size
 * @param {number} density
 * @param {number} minPar
 * @returns {IceLevel | null}
 */
function carveIceRoom(random, size, density, minPar) {
  const [width, height] = size
  /** @type {string[][]} */
  const cells = []
  for (let row = 0; row < height; row++) {
    /** @type {string[]} */
    const line = []
    for (let col = 0; col < width; col++) {
      const edge = row === 0 || col === 0 || row === height - 1 || col === width - 1
      line.push(edge || random() < density ? '#' : '.')
    }
    cells.push(line)
  }
  /** @type {[number, number][]} */
  const starts = []
  /** @type {[number, number][]} */
  const goals = []
  for (let row = 1; row < height - 1; row++)
    for (let col = 1; col < width - 1; col++) {
      if (cells[row][col] === '#') continue
      if (row + col < (height + width) / 2) starts.push([row, col])
      else goals.push([row, col])
    }
  if (starts.length === 0 || goals.length === 0) return null
  const [startRow, startCol] = starts[Math.floor(random() * starts.length)]
  const [goalRow, goalCol] = goals[Math.floor(random() * goals.length)]
  cells[startRow][startCol] = 'S'
  cells[goalRow][goalCol] = 'E'
  const level = parseIceLevel(cells.map((line) => line.join('')))
  if (!Number.isFinite(level.par) || level.par < minPar) return null
  if (!isIceRoomFair(level)) return null
  return level
}

/**
 * Roll one fair, solvable ice room, retrying with fresh layouts until one
 * passes. Returns null after `attempts` tries.
 * @param {() => number} [random]
 * @param {{ size?: [number, number], density?: number, minPar?: number, attempts?: number }} [options]
 * @returns {IceLevel | null}
 */
export function generateIceRoom(random = Math.random, options = {}) {
  const attempts = options.attempts ?? ICE_GENERATOR_ATTEMPTS
  for (let attempt = 0; attempt < attempts; attempt++) {
    const size =
        options.size ??
        ICE_GENERATOR_SIZES[Math.floor(random() * ICE_GENERATOR_SIZES.length)],
      density =
        options.density ??
        ICE_GENERATOR_DENSITIES[Math.floor(random() * ICE_GENERATOR_DENSITIES.length)]
    const room = carveIceRoom(random, size, density, options.minPar ?? ICE_GENERATOR_MIN_PAR)
    if (room) return room
  }
  return null
}
