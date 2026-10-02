// Johto's Ruins of Alph. A sliding picture puzzle: shuffle the stone tiles and
// slide them back into order against the single empty slot, in as few moves as
// possible. The board is scrambled by random legal slides from the solved
// state, so every puzzle is solvable.

/** Money spent to explore the ruins. */
export const SLIDING_COST = 300

/** The picture is 3x3 (eight tiles and one blank). */
export const SLIDING_SIZE = 3

/** Random legal slides used to shuffle the solved board. */
export const SLIDING_SCRAMBLE = 40

/** @type {Record<string, [number, number]>} */
const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] }

/**
 * The solved board: 1..n*n-1 in reading order, then the 0 blank.
 * @param {number} [size]
 * @returns {number[]}
 */
export function solvedSlidingBoard(size = SLIDING_SIZE) {
  const board = []
  for (let value = 1; value < size * size; value++) board.push(value)
  board.push(0)
  return board
}

/**
 * Whether the tile at `index` sits orthogonally next to the blank.
 * @param {number[]} board
 * @param {number} index
 * @param {number} [size]
 * @returns {boolean}
 */
export function canSlide(board, index, size = SLIDING_SIZE) {
  const blank = board.indexOf(0)
  if (blank < 0 || index === blank) return false
  const row = Math.floor(index / size),
    col = index % size,
    blankRow = Math.floor(blank / size),
    blankCol = blank % size
  return Math.abs(row - blankRow) + Math.abs(col - blankCol) === 1
}

/**
 * Slide the tile at `index` into the blank. Returns the board unchanged when the
 * move is not legal.
 * @param {number[]} board
 * @param {number} index
 * @param {number} [size]
 * @returns {number[]}
 */
export function slideTile(board, index, size = SLIDING_SIZE) {
  if (!canSlide(board, index, size)) return board
  const next = [...board],
    blank = next.indexOf(0)
  next[blank] = next[index]
  next[index] = 0
  return next
}

/**
 * Whether the picture is back in order.
 * @param {number[]} board
 * @returns {boolean}
 */
export function isSlidingSolved(board) {
  for (let index = 0; index < board.length - 1; index++)
    if (board[index] !== index + 1) return false
  return board[board.length - 1] === 0
}

/**
 * A shuffled, solvable board (never already solved).
 * @param {number} [size]
 * @param {() => number} [rng]
 * @returns {number[]}
 */
export function createSlidingPuzzle(size = SLIDING_SIZE, rng = Math.random) {
  let board = solvedSlidingBoard(size),
    /** The blank's position before the last slide, so the slide is not undone. */
    previousBlank = -1
  for (let step = 0; step < SLIDING_SCRAMBLE; step++) {
    const options = []
    for (let index = 0; index < board.length; index++)
      if (index !== previousBlank && canSlide(board, index, size)) options.push(index)
    if (options.length === 0) continue
    previousBlank = board.indexOf(0)
    board = slideTile(board, options[Math.floor(rng() * options.length)], size)
  }
  if (isSlidingSolved(board)) return createSlidingPuzzle(size, rng)
  return board
}

/**
 * Prize for restoring the picture.
 * @param {number} moves
 * @param {boolean} solved
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string, pokemon?: { speciesKey: string, level: number } }}
 */
export function slidingPrize(moves, solved) {
  if (!solved) return { money: 150, items: [], label: 'The ruins stay sealed' }
  if (moves <= 12)
    return {
      money: 3500,
      items: [
        { itemId: 'rareCandy', quantity: 1 },
        { itemId: 'stardust', quantity: 2 },
      ],
      label: 'Unown unlocked!',
    }
  if (moves <= 24)
    return { money: 1800, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Picture restored' }
  return { money: 700, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Solved at last' }
}

/**
 * The 28 Unown forms in Pokédex order (A is the base `unown`). The Ruins of
 * Alph puzzle hands out the next one the player is missing.
 * @type {string[]}
 */
export const UNOWN_FORMS = [
  'unown',
  ...'bcdefghijklmnopqrstuvwxyz'.split('').map((letter) => `unown-${letter}`),
  'unown-exclamation',
  'unown-question',
]

/**
 * The next Unown form the player has not caught, or a random form once the set
 * is complete, so repeats still turn up.
 * @param {string[]} caught Species keys the player has caught.
 * @param {() => number} [random]
 * @returns {string}
 */
export function nextUnownForm(caught, random = Math.random) {
  const caughtSet = new Set(caught),
    missing = UNOWN_FORMS.filter((key) => !caughtSet.has(key)),
    pool = missing.length > 0 ? missing : UNOWN_FORMS
  return pool[Math.floor(random() * pool.length)]
}

/**
 * Direction key -> the tile index that slides into the blank when it is pressed,
 * or null when nothing can move that way.
 * @param {number[]} board
 * @param {string} direction
 * @param {number} [size]
 * @returns {number | null}
 */
export function slidingTileForDirection(board, direction, size = SLIDING_SIZE) {
  const delta = DELTA[direction]
  if (!delta) return null
  const blank = board.indexOf(0),
    row = Math.floor(blank / size) + delta[0],
    col = (blank % size) + delta[1]
  if (row < 0 || row >= size || col < 0 || col >= size) return null
  return row * size + col
}
