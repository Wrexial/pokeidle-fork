// Johto's Pokemon Puzzle League. Split out of game/minigames.js. A match-3
// board: swap adjacent tiles to line up three or more, which clear, cascade and
// score. A limited number of moves.

/** Money spent to play. */
export const MATCH3_COST = 300

/** The board is 8x8. */
export const MATCH3_SIZE = 8

/** Swaps allowed per game. */
export const MATCH3_MOVES = 12

/** Points per cleared tile, multiplied by the cascade depth. */
export const MATCH3_MATCH_POINTS = 10

/** The tile types, themed on Pokemon types. */
export const MATCH3_TYPES = ['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Normal']

/**
 * A random tile type, optionally avoiding some (used to seed without matches).
 * @param {string[]} [types]
 * @param {string[]} [avoid]
 * @returns {string}
 */
export function randomMatch3Type(types = MATCH3_TYPES, avoid = []) {
  const pool = types.filter((type) => !avoid.includes(type)),
    source = pool.length > 0 ? pool : types
  return source[Math.floor(Math.random() * source.length)]
}

/**
 * A full board with no pre-existing matches.
 * @param {number} [size]
 * @param {string[]} [types]
 * @returns {string[]}
 */
export function createMatch3Board(size = MATCH3_SIZE, types = MATCH3_TYPES) {
  /** @type {string[]} */
  const board = []
  for (let row = 0; row < size; row++)
    for (let col = 0; col < size; col++) {
      const avoid = []
      if (col >= 2 && board[row * size + col - 1] === board[row * size + col - 2])
        avoid.push(board[row * size + col - 1])
      if (row >= 2 && board[(row - 1) * size + col] === board[(row - 2) * size + col])
        avoid.push(board[(row - 1) * size + col])
      board.push(randomMatch3Type(types, avoid))
    }
  return board
}

/**
 * Every index that is part of a horizontal or vertical run of three or more.
 * @param {(string | null)[]} board
 * @param {number} [size]
 * @returns {Set<number>}
 */
export function findMatches(board, size = MATCH3_SIZE) {
  const matched = new Set()
  for (let row = 0; row < size; row++) {
    let col = 0
    while (col < size) {
      const type = board[row * size + col]
      let end = col + 1
      while (end < size && typeof type === 'string' && board[row * size + end] === type) end++
      if (typeof type === 'string' && end - col >= 3)
        for (let k = col; k < end; k++) matched.add(row * size + k)
      col = end
    }
  }
  for (let col = 0; col < size; col++) {
    let row = 0
    while (row < size) {
      const type = board[row * size + col]
      let end = row + 1
      while (end < size && typeof type === 'string' && board[end * size + col] === type) end++
      if (typeof type === 'string' && end - row >= 3)
        for (let k = row; k < end; k++) matched.add(k * size + col)
      row = end
    }
  }
  return matched
}

/**
 * Clear every match, drop the tiles and refill from the top, repeating while
 * new matches form. Returns the settled board, score and cascade count.
 * @param {(string | null)[]} board
 * @param {number} [size]
 * @param {string[]} [types]
 * @returns {{ board: string[], score: number, cascade: number }}
 */
export function resolveMatch3(board, size = MATCH3_SIZE, types = MATCH3_TYPES) {
  const current = [...board]
  let score = 0,
    cascade = 0
  for (;;) {
    const matched = findMatches(current, size)
    if (matched.size === 0) break
    cascade++
    score += matched.size * MATCH3_MATCH_POINTS * cascade
    for (const index of matched) current[index] = null
    for (let col = 0; col < size; col++) {
      const column = []
      for (let row = size - 1; row >= 0; row--) {
        const value = current[row * size + col]
        if (value !== null) column.push(value)
      }
      for (let row = size - 1, depth = 0; row >= 0; row--, depth++)
        current[row * size + col] =
          depth < column.length ? column[depth] : randomMatch3Type(types)
    }
  }
  return { board: /** @type {string[]} */ (current), score, cascade }
}

/**
 * Attempt to swap two tiles. The board is unchanged (and `valid` false) unless
 * the swap makes a match.
 * @param {(string | null)[]} board
 * @param {number} a
 * @param {number} b
 * @param {number} [size]
 * @param {string[]} [types]
 * @returns {{ valid: boolean, board: string[], score: number, cascade: number }}
 */
export function tryMatch3Swap(board, a, b, size = MATCH3_SIZE, types = MATCH3_TYPES) {
  const swapped = [...board]
  ;[swapped[a], swapped[b]] = [swapped[b], swapped[a]]
  if (findMatches(swapped, size).size === 0)
    return { valid: false, board: /** @type {string[]} */ (board), score: 0, cascade: 0 }
  const resolved = resolveMatch3(swapped, size, types)
  return { valid: true, ...resolved }
}

/**
 * Prize for a finished game.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function match3Prize(score) {
  if (score >= 1500)
    return { money: 5000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'League champion!' }
  if (score >= 900)
    return { money: 3000, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Great chain' }
  if (score >= 400)
    return { money: 1500, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Nice clearing' }
  return { money: 400, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Good try' }
}
