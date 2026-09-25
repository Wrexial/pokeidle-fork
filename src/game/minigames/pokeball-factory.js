// Kalos's Poke Ball Factory. A pipe-rotation puzzle: rotate the conveyor tiles
// until a continuous line runs from the inlet on the left to the outlet on the
// right. Tap a tile to turn it a quarter-turn clockwise.

/** Money spent to take the factory shift. */
export const POKEBALL_FACTORY_COST = 300

/** The conveyor grid is 5x5. */
export const FACTORY_SIZE = 5

/** Compass directions, clockwise. */
export const FACTORY_DIRECTIONS = ['N', 'E', 'S', 'W']

/** @type {Record<string, string>} */
const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' }

/** @type {Record<string, [number, number]>} */
const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] }

/** Base (unrotated) connections of each tile type. @type {Record<string, string[]>} */
const BASE_CONNECTIONS = { straight: ['N', 'S'], elbow: ['N', 'E'], empty: [] }

/** @typedef {{ type: 'straight' | 'elbow' | 'empty', rot: number, fixed: boolean }} FactoryTile */
/** @typedef {{ size: number, inletRow: number, outletRow: number, tiles: FactoryTile[], solution: number[] }} FactoryPuzzle */

/**
 * The compass directions a tile connects to at a given rotation.
 * @param {string} type
 * @param {number} rot
 * @returns {string[]}
 */
export function connectionsFor(type, rot) {
  const base = BASE_CONNECTIONS[type]
  if (!base || base.length === 0) return []
  const turn = ((rot % 4) + 4) % 4
  return base.map((direction) => FACTORY_DIRECTIONS[(FACTORY_DIRECTIONS.indexOf(direction) + turn) % 4])
}

/**
 * @param {number} r
 * @param {number} c
 * @param {number} nr
 * @param {number} nc
 * @returns {string}
 */
function directionBetween(r, c, nr, nc) {
  if (nr < r) return 'N'
  if (nr > r) return 'S'
  if (nc > c) return 'E'
  return 'W'
}

/**
 * A randomized depth-first walk from the inlet to the outlet, or null if none
 * is found. The grid is tiny so the search always succeeds.
 * @param {number} size
 * @param {number} inletRow
 * @param {number} outletRow
 * @returns {[number, number][] | null}
 */
function findPath(size, inletRow, outletRow) {
  const visited = new Set([inletRow * size]),
    path = /** @type {[number, number][]} */ ([[inletRow, 0]])

  /** @param {number} r @param {number} c */
  function walk(r, c) {
    if (r === outletRow && c === size - 1) return true
    const moves = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    for (let index = moves.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1))
      ;[moves[index], moves[swap]] = [moves[swap], moves[index]]
    }
    for (const [dr, dc] of moves) {
      const nr = r + dr,
        nc = c + dc
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue
      const key = nr * size + nc
      if (visited.has(key)) continue
      visited.add(key)
      path.push([nr, nc])
      if (walk(nr, nc)) return true
      visited.delete(key)
      path.pop()
    }
    return false
  }

  return walk(inletRow, 0) ? path : null
}

/**
 * Turn a carved path into tiles with a matching solution, then scramble every
 * tile so the puzzle is not already solved.
 * @param {number} size
 * @param {number} inletRow
 * @param {number} outletRow
 * @param {[number, number][]} path
 * @returns {FactoryPuzzle}
 */
function buildPuzzle(size, inletRow, outletRow, path) {
  const tiles = /** @type {FactoryTile[]} */ (
      Array.from({ length: size * size }, () => ({ type: 'empty', rot: 0, fixed: false }))
    ),
    solution = Array(size * size).fill(0)

  for (let index = 0; index < path.length; index++) {
    const [r, c] = path[index],
      tileIndex = r * size + c,
      connections = new Set()
    if (index > 0) {
      const [pr, pc] = path[index - 1]
      connections.add(directionBetween(r, c, pr, pc))
    }
    if (index < path.length - 1) {
      const [nr, nc] = path[index + 1]
      connections.add(directionBetween(r, c, nr, nc))
    }
    if (index === 0) connections.add('W')
    if (index === path.length - 1) connections.add('E')
    const pair = [...connections],
      first = pair[0],
      second = pair[1],
      straight =
        (first === 'N' && second === 'S') ||
        (first === 'S' && second === 'N') ||
        (first === 'E' && second === 'W') ||
        (first === 'W' && second === 'E'),
      type = /** @type {'straight' | 'elbow'} */ (straight ? 'straight' : 'elbow')
    let rot = 0
    for (let candidate = 0; candidate < 4; candidate++)
      if (connectionsFor(type, candidate).slice().sort().join() === pair.slice().sort().join()) {
        rot = candidate
        break
      }
    tiles[tileIndex] = { type, rot, fixed: false }
    solution[tileIndex] = rot
  }

  for (let index = 0; index < tiles.length; index++) {
    if (tiles[index].type === 'empty') {
      const type = Math.random() < 0.5 ? 'straight' : 'elbow'
      tiles[index] = {
        type: /** @type {'straight' | 'elbow'} */ (type),
        rot: Math.floor(Math.random() * 4),
        fixed: false,
      }
    } else {
      const turn = 1 + Math.floor(Math.random() * 3)
      tiles[index] = { ...tiles[index], rot: (solution[index] + turn) % 4 }
    }
  }

  return { size, inletRow, outletRow, tiles, solution }
}

/**
 * A fresh, solvable conveyor puzzle.
 * @param {number} [size]
 * @returns {FactoryPuzzle}
 */
export function createFactoryPuzzle(size = FACTORY_SIZE) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const inletRow = Math.floor(Math.random() * size),
      outletRow = Math.floor(Math.random() * size),
      path = findPath(size, inletRow, outletRow)
    if (path) return buildPuzzle(size, inletRow, outletRow, path)
  }
  // Deterministic fallback: a straight corridor along the top row.
  const fallback = /** @type {[number, number][]} */ (
    Array.from({ length: size }, (_, c) => [0, c])
  )
  return buildPuzzle(size, 0, 0, fallback)
}

/**
 * Turn one non-fixed tile a quarter-turn clockwise.
 * @param {FactoryPuzzle} puzzle
 * @param {number} index
 * @returns {FactoryPuzzle}
 */
export function rotateFactoryTile(puzzle, index) {
  const tile = puzzle.tiles[index]
  if (!tile || tile.fixed) return puzzle
  return {
    ...puzzle,
    tiles: puzzle.tiles.map((entry, i) =>
      i === index ? { ...entry, rot: (entry.rot + 1) % 4 } : entry
    ),
  }
}

/**
 * The tiles reachable from the inlet once the line is powered. Empty when the
 * inlet tile does not open to the west.
 * @param {FactoryPuzzle} puzzle
 * @returns {Set<number>}
 */
export function factoryPowered(puzzle) {
  const { size } = puzzle,
    connections = puzzle.tiles.map((tile) => connectionsFor(tile.type, tile.rot)),
    start = puzzle.inletRow * size,
    seen = new Set([start]),
    queue = [start]
  if (!connections[start].includes('W')) return new Set()
  while (queue.length > 0) {
    const index = queue.shift()
    if (index === undefined) break
    const r = Math.floor(index / size),
      c = index % size
    for (const direction of connections[index]) {
      const [dr, dc] = DELTA[direction],
        nr = r + dr,
        nc = c + dc
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue
      const next = nr * size + nc
      if (seen.has(next)) continue
      if (!connections[next].includes(OPPOSITE[direction])) continue
      seen.add(next)
      queue.push(next)
    }
  }
  return seen
}

/**
 * Whether the line runs all the way through the outlet.
 * @param {FactoryPuzzle} puzzle
 * @returns {boolean}
 */
export function factorySolved(puzzle) {
  const { size } = puzzle,
    outlet = puzzle.outletRow * size + (size - 1),
    tile = puzzle.tiles[outlet]
  return factoryPowered(puzzle).has(outlet) && connectionsFor(tile.type, tile.rot).includes('E')
}

/** The situational balls the factory produces; none of them are sold in marts. */
export const FACTORY_BALL_POOL = [
  'quickball',
  'timerball',
  'repeatball',
  'netball',
  'diveball',
  'duskball',
  'nestball',
]

/**
 * Roll a batch of finished balls. Duplicates merge into one stack.
 * @param {number} count
 * @param {() => number} [rng]
 * @returns {{ itemId: string, quantity: number }[]}
 */
export function rollFactoryBalls(count, rng = Math.random) {
  /** @type {{ itemId: string, quantity: number }[]} */
  const items = []
  for (let index = 0; index < Math.max(0, count); index++) {
    const itemId = FACTORY_BALL_POOL[Math.floor(rng() * FACTORY_BALL_POOL.length)],
      existing = items.find((entry) => entry.itemId === itemId)
    if (existing) existing.quantity++
    else items.push({ itemId, quantity: 1 })
  }
  return items
}

/**
 * Prize for finishing a shift: a batch of the otherwise-unobtainable special
 * balls, more for a cleaner line.
 * @param {number} moves
 * @param {boolean} solved
 * @param {() => number} [rng]
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function factoryPrize(moves, solved, rng = Math.random) {
  if (!solved) return { money: 0, items: [], label: 'The conveyor jammed' }
  if (moves <= FACTORY_SIZE + 2)
    return { money: 0, items: rollFactoryBalls(4, rng), label: 'Flawless shift!' }
  if (moves <= 12)
    return { money: 0, items: rollFactoryBalls(2, rng), label: 'Line cleared' }
  return { money: 0, items: rollFactoryBalls(1, rng), label: 'Line patched up' }
}
