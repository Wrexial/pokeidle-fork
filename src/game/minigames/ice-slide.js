// Sinnoh's Snowpoint Temple. An ice-slide maze: pick a direction and the hero
// slides until a wall or a boulder stops them. Clear every room to reach the
// temple's heart; the exact minimum number of slides per room is computed with
// a breadth-first search, so the "par" used for scoring is always right.

/** Money spent to enter the temple. */
export const ICE_SLIDE_COST = 300

/** The slides the player can pick. */
export const ICE_SLIDE_DIRECTIONS = ['N', 'E', 'S', 'W']

/** @type {Record<string, [number, number]>} */
const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] }

/**
 * Hand-designed rooms. `#` wall, `O` boulder (stops a slide), `S` start,
 * `E` exit. Every room is solvable; `icePar` proves it at parse time.
 * @type {string[][]}
 */
export const ICE_SLIDE_LEVELS = [
  ['#####', '#S..#', '#.#.#', '#..E#', '#####'],
  ['#######', '#S..#E#', '###.#.#', '#.#.#.#', '#.#.#.#', '#.....#', '#######'],
  ['#########', '#S..#...#', '#.#.#.#.#', '#.#...#.#', '#.#####.#', '#...#.O.#', '#.#.#.#.#', '#...#..E#', '#########'],
  ['#########', '#S#.....#', '#.#.#.#.#', '#.#.#.#E#', '#.###.###', '#...#...#', '###.###.#', '#.......#', '#########'],
]

/**
 * Parse a room and compute its exact minimum number of slides.
 * @param {string[]} rows
 * @returns {{ rows: string[], width: number, height: number, walls: Set<number>, rocks: Set<number>, start: number, goal: number, par: number }}
 */
export function parseIceLevel(rows) {
  const height = rows.length,
    width = rows[0].length,
    walls = new Set(),
    rocks = new Set()
  let start = 0,
    goal = 0
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const index = row * width + col,
        cell = rows[row][col]
      if (cell === '#') walls.add(index)
      else if (cell === 'O') rocks.add(index)
      if (cell === 'S') start = index
      if (cell === 'E') goal = index
    }
  }
  /** @type {ReturnType<typeof parseIceLevel>} */
  const level = { rows, width, height, walls, rocks, start, goal, par: 0 }
  level.par = icePar(level)
  return level
}

/**
 * The cell reached by sliding from `position` in `direction` until a wall or a
 * boulder blocks the next step.
 * @param {ReturnType<typeof parseIceLevel>} level
 * @param {number} position
 * @param {string} direction
 * @returns {number}
 */
export function iceSlidePosition(level, position, direction) {
  const delta = DELTA[direction]
  if (!delta) return position
  const { width, height, walls, rocks } = level
  let row = Math.floor(position / width),
    col = position % width
  for (;;) {
    const nextRow = row + delta[0],
      nextCol = col + delta[1]
    if (nextRow < 0 || nextRow >= height || nextCol < 0 || nextCol >= width) break
    const next = nextRow * width + nextCol
    if (walls.has(next) || rocks.has(next)) break
    row = nextRow
    col = nextCol
    // The exit catches the hero, so a slide never overshoots it.
    if (next === level.goal) break
  }
  return row * width + col
}

/**
 * Whether the hero is standing on the exit.
 * @param {ReturnType<typeof parseIceLevel>} level
 * @param {number} position
 * @returns {boolean}
 */
export function iceSlideSolved(level, position) {
  return position === level.goal
}

/**
 * Breadth-first search for the shortest sequence of slides to the exit, or
 * Infinity when the room cannot be solved.
 * @param {ReturnType<typeof parseIceLevel>} level
 * @returns {number}
 */
export function icePar(level) {
  if (iceSlideSolved(level, level.start)) return 0
  const seen = new Set([level.start])
  let frontier = [level.start],
    distance = 0
  while (frontier.length > 0) {
    distance++
    const next = []
    for (const position of frontier)
      for (const direction of ICE_SLIDE_DIRECTIONS) {
        const landing = iceSlidePosition(level, position, direction)
        if (landing === position || seen.has(landing)) continue
        if (iceSlideSolved(level, landing)) return distance
        seen.add(landing)
        next.push(landing)
      }
    frontier = next
  }
  return Infinity
}

/** The parsed rooms, ready to play. @type {ReturnType<typeof parseIceLevel>[]} */
export const ICE_SLIDE_ROOMS = ICE_SLIDE_LEVELS.map(parseIceLevel)

/** The total minimum slides across every room. */
export const ICE_SLIDE_TOTAL_PAR = ICE_SLIDE_ROOMS.reduce((sum, room) => sum + room.par, 0)

/**
 * Prize for a temple run.
 * @param {number} cleared Number of rooms cleared.
 * @param {number} moves Total slides used.
 * @param {number} par Total minimum slides for the rooms attempted.
 * @param {boolean} finished Whether the whole temple was cleared.
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function iceSlidePrize(cleared, moves, par, finished) {
  if (cleared === 0) return { money: 100, items: [], label: 'Turned back at the entrance' }
  if (finished && moves <= par + 2)
    return {
      money: 4000,
      items: [
        { itemId: 'neverMeltIce', quantity: 1 },
        { itemId: 'iceStone', quantity: 1 },
      ],
      label: 'Flawless temple run!',
    }
  if (finished)
    return { money: 2500, items: [{ itemId: 'neverMeltIce', quantity: 1 }], label: 'Temple conquered' }
  return { money: 500 * cleared, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Left partway' }
}
