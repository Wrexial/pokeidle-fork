// Sinnoh's Snowpoint Temple Strength chambers. Unlike the ice rooms (which
// slide until something stops you), these are one-step push puzzles: shove the
// boulder onto the pressure plate to unseal the exit. The exact minimum number
// of moves is computed with a breadth-first search over player + block states,
// so the par used for scoring is always right.

/** The moves the player can make. */
export const STRENGTH_DIRECTIONS = ['N', 'E', 'S', 'W']

/** @type {Record<string, [number, number]>} */
const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] }

/**
 * Hand-designed strength rooms. `#` wall, `.` floor, `S` start, `B` pushable
 * boulder, `*` pressure plate, `E` exit (sealed until every plate is covered).
 * A run plays a random subset of these (see `ice-temple.js`), so the pool is
 * wider than any single run.
 * @type {string[][]}
 */
const STRENGTH_LEVELS = [
  ['#######', '#S....#', '#.B...#', '#.*...#', '#....E#', '#######'],
  ['#########', '#S......#', '#..##...#', '#..B....#', '#..##...#', '#...*...#', '#..##...#', '#......E#', '#########'],
  ['#########', '#S......#', '#.B...B.#', '#.*...*.#', '#.......#', '#....E..#', '#########'],
  ['#########', '#S......#', '#..###..#', '#.B.*...#', '#..###..#', '#....E..#', '#########'],
]

/**
 * Parse a room.
 * @param {string[]} rows
 * @returns {{ rows: string[], width: number, height: number, walls: Set<number>, plates: Set<number>, start: number, exit: number, blockStarts: number[], par: number }}
 */
export function parseStrengthLevel(rows) {
  const height = rows.length,
    width = rows[0].length,
    walls = new Set(),
    plates = new Set(),
    blockStarts = []
  let start = 0,
    exit = 0
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const index = row * width + col,
        cell = rows[row][col]
      if (cell === '#') walls.add(index)
      else if (cell === '*') plates.add(index)
      else if (cell === 'B') blockStarts.push(index)
      if (cell === 'S') start = index
      if (cell === 'E') exit = index
    }
  }
  /** @type {ReturnType<typeof parseStrengthLevel>} */
  const level = { rows, width, height, walls, plates, start, exit, blockStarts, par: 0 }
  level.par = strengthPar(level)
  return level
}

/** @typedef {{ player: number, blocks: Set<number> }} StrengthState */

/** The opening state of a room. @param {ReturnType<typeof parseStrengthLevel>} level */
export function createStrengthState(level) {
  return { player: level.start, blocks: new Set(level.blockStarts) }
}

/** Whether every pressure plate currently holds a boulder.
 * @param {ReturnType<typeof parseStrengthLevel>} level
 * @param {Set<number>} blocks
 */
function allPlatesCovered(level, blocks) {
  for (const plate of level.plates) if (!blocks.has(plate)) return false
  return true
}

/** Whether the room is finished (plates covered and the player on the exit).
 * @param {ReturnType<typeof parseStrengthLevel>} level
 * @param {StrengthState} state
 */
export function strengthSolved(level, state) {
  return allPlatesCovered(level, state.blocks) && state.player === level.exit
}

/**
 * Step one cell in `direction`, pushing a boulder if one is in the way. Returns
 * null when the move is blocked. Pushing a boulder onto a plate presses it;
 * pushing it off releases it.
 * @param {ReturnType<typeof parseStrengthLevel>} level
 * @param {StrengthState} state
 * @param {string} direction
 * @returns {StrengthState | null}
 */
export function strengthMove(level, state, direction) {
  const delta = DELTA[direction]
  if (!delta) return null
  const { width, height, walls, exit } = level,
    row = Math.floor(state.player / width),
    col = state.player % width,
    nextRow = row + delta[0],
    nextCol = col + delta[1]
  if (nextRow < 0 || nextRow >= height || nextCol < 0 || nextCol >= width) return null
  const next = nextRow * width + nextCol
  if (walls.has(next)) return null
  const exitOpen = allPlatesCovered(level, state.blocks)
  // The exit is a sealed gate until every plate is covered.
  if (next === exit && !exitOpen) return null
  if (!state.blocks.has(next)) return { player: next, blocks: state.blocks }
  const beyondRow = nextRow + delta[0],
    beyondCol = nextCol + delta[1]
  if (beyondRow < 0 || beyondRow >= height || beyondCol < 0 || beyondCol >= width) return null
  const beyond = beyondRow * width + beyondCol
  // A boulder can't be shoved into a wall, another boulder or the exit.
  if (walls.has(beyond) || state.blocks.has(beyond) || beyond === exit) return null
  const blocks = new Set(state.blocks)
  blocks.delete(next)
  blocks.add(beyond)
  return { player: next, blocks }
}

/**
 * Breadth-first search for the fewest moves to finish the room, or Infinity if
 * it cannot be solved.
 * @param {ReturnType<typeof parseStrengthLevel>} level
 * @returns {number}
 */
export function strengthPar(level) {
  const start = createStrengthState(level)
  if (strengthSolved(level, start)) return 0
  /** @param {StrengthState} state */
  const key = (state) =>
    `${state.player}|${[...state.blocks].sort((left, right) => left - right).join(',')}`
  const seen = new Set([key(start)])
  let frontier = [start],
    distance = 0
  while (frontier.length > 0) {
    distance++
    const next = []
    for (const state of frontier)
      for (const direction of STRENGTH_DIRECTIONS) {
        const moved = strengthMove(level, state, direction)
        if (!moved) continue
        if (strengthSolved(level, moved)) return distance
        const stateKey = key(moved)
        if (seen.has(stateKey)) continue
        seen.add(stateKey)
        next.push(moved)
      }
    frontier = next
  }
  return Infinity
}

/** The parsed rooms, ready to play. @type {ReturnType<typeof parseStrengthLevel>[]} */
export const STRENGTH_ROOMS = STRENGTH_LEVELS.map(parseStrengthLevel)

/** The total minimum moves across every strength room. */
export const STRENGTH_TOTAL_PAR = STRENGTH_ROOMS.reduce((sum, room) => sum + room.par, 0)
