// Unova's Type Fusion. Split out of game/minigames.js. A 2048-style slide puzzle
// themed on Pokemon types: push a direction and every tile slides that way, two
// equal tiles merge into the next type up, and a fresh Normal tile appears.
// Score as much as possible before the move limit runs out.

/** Money spent to play. */
export const TYPE_FUSION_COST = 350

/** Board is size x size. */
export const TYPE_FUSION_SIZE = 4

/** Swipes allowed in one run. */
export const TYPE_FUSION_MOVES = 100

/**
 * The merge ladder: level 1 is Normal, and two of a level fuse into the next.
 * The last type sits at the top and cannot merge further.
 * @type {string[]}
 */
export const TYPE_FUSION_TYPES = [
  'Normal',
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Dragon',
]

/** The highest level on the ladder. */
export const TYPE_FUSION_MAX_LEVEL = TYPE_FUSION_TYPES.length

/**
 * The label for a tile level (1-based), or '' for an empty cell.
 * @param {number} level
 * @returns {string}
 */
export function typeFusionLabel(level) {
  return level >= 1 && level <= TYPE_FUSION_TYPES.length ? TYPE_FUSION_TYPES[level - 1] : ''
}

/**
 * An empty board.
 * @param {number} [size]
 * @returns {number[][]}
 */
export function emptyTypeFusionBoard(size = TYPE_FUSION_SIZE) {
  return Array.from({ length: size }, () => Array(size).fill(0))
}

/**
 * Drop a fresh tile (mostly Normal, sometimes the next type) into a random empty
 * cell. Returns a new board.
 * @param {number[][]} board
 * @returns {number[][]}
 */
export function spawnTypeFusionTile(board) {
  const empty = []
  for (let row = 0; row < board.length; row++)
    for (let column = 0; column < board[row].length; column++)
      if (board[row][column] === 0) empty.push([row, column])
  if (empty.length === 0) return board.map((row) => [...row])
  const [row, column] = empty[Math.floor(Math.random() * empty.length)],
    next = board.map((line) => [...line])
  next[row][column] = Math.random() < 0.9 ? 1 : 2
  return next
}

/**
 * A fresh board with two starting tiles.
 * @param {number} [size]
 * @returns {number[][]}
 */
export function createTypeFusionBoard(size = TYPE_FUSION_SIZE) {
  return spawnTypeFusionTile(spawnTypeFusionTile(emptyTypeFusionBoard(size)))
}

/**
 * Slide and merge a single line toward index 0.
 * @param {number[]} line
 * @returns {{ line: number[], gained: number }}
 */
function slideLine(line) {
  const packed = line.filter((value) => value > 0),
    out = []
  let gained = 0
  for (let index = 0; index < packed.length; index++) {
    if (
      index + 1 < packed.length &&
      packed[index] === packed[index + 1] &&
      packed[index] < TYPE_FUSION_MAX_LEVEL
    ) {
      const merged = packed[index] + 1
      out.push(merged)
      gained += 2 ** merged
      index++
    } else out.push(packed[index])
  }
  while (out.length < line.length) out.push(0)
  return { line: out, gained }
}

/**
 * Slide the whole board in a direction.
 * @param {number[][]} board
 * @param {'left' | 'right' | 'up' | 'down'} direction
 * @returns {{ board: number[][], gained: number, moved: boolean }}
 */
export function slideTypeFusion(board, direction) {
  const size = board.length,
    next = board.map((row) => [...row])
  let gained = 0
  if (direction === 'left' || direction === 'right') {
    for (let row = 0; row < size; row++) {
      const line = next[row]
      if (direction === 'right') line.reverse()
      const result = slideLine(line)
      gained += result.gained
      if (direction === 'right') result.line.reverse()
      next[row] = result.line
    }
  } else {
    for (let column = 0; column < size; column++) {
      const line = []
      for (let row = 0; row < size; row++) line.push(next[row][column])
      if (direction === 'down') line.reverse()
      const result = slideLine(line)
      gained += result.gained
      if (direction === 'down') result.line.reverse()
      for (let row = 0; row < size; row++) next[row][column] = result.line[row]
    }
  }
  const moved = next.some((row, rowIndex) =>
    row.some((value, columnIndex) => value !== board[rowIndex][columnIndex])
  )
  return { board: next, gained, moved }
}

/**
 * Whether any move is still possible.
 * @param {number[][]} board
 * @returns {boolean}
 */
export function typeFusionCanMove(board) {
  for (let row = 0; row < board.length; row++)
    for (let column = 0; column < board[row].length; column++) {
      if (board[row][column] === 0) return true
      if (column + 1 < board[row].length && board[row][column] === board[row][column + 1]) return true
      if (row + 1 < board.length && board[row][column] === board[row + 1][column]) return true
    }
  return false
}

/**
 * Prize for a run's score.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function typeFusionPrize(score) {
  if (score >= 6000)
    return {
      money: 5000,
      items: [
        { itemId: 'expCandyL', quantity: 1 },
        { itemId: 'rareCandy', quantity: 1 },
      ],
      label: 'Type master!',
    }
  if (score >= 3500)
    return {
      money: 3000,
      items: [{ itemId: 'expCandyM', quantity: 1 }],
      label: 'Fusion expert',
    }
  if (score >= 1800)
    return { money: 1600, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Good merging' }
  if (score >= 800) return { money: 800, items: [], label: 'Warmed up' }
  return { money: 250, items: [], label: 'Barely fused' }
}
