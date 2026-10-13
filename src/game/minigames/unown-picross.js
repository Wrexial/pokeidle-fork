// Sinnoh's Solaceon Ruins. Split out of game/minigames.js. A 5x5 nonogram: fill
// the cells that match the row and column clues and check your work. Wrong fills
// and slow solves score lower, so read the clues instead of guessing.

/** Money spent to play. */
export const UNOWN_PICROSS_COST = 350

/** The grid is size x size. */
export const UNOWN_PICROSS_SIZE = 5

/**
 * The glyphs hidden in the ruins, as 5x5 grids of 1 (filled) and 0 (empty).
 * @type {number[][][]}
 */
export const UNOWN_PICROSS_PUZZLES = [
  [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 0, 1],
  ],
  [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  [
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  [
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  [
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
  ],
]

/**
 * The run-length clues for a line (a single 0 when the line is empty).
 * @param {number[]} line
 * @returns {number[]}
 */
export function picrossClues(line) {
  const clues = []
  let run = 0
  for (const cell of line) {
    if (cell) run++
    else if (run > 0) {
      clues.push(run)
      run = 0
    }
  }
  if (run > 0) clues.push(run)
  return clues.length > 0 ? clues : [0]
}

/**
 * Pick a glyph (optionally from a seeded RNG) and derive its row and column
 * clues. The Unown Picross scene uses the default randomness; the hide-and-seek
 * spots pass a seeded RNG so a route + day always shows the same glyph.
 * @param {() => number} [rng]
 * @returns {{ solution: number[][], rowClues: number[][], colClues: number[][] }}
 */
export function createPicrossPuzzle(rng = Math.random) {
  const solution = UNOWN_PICROSS_PUZZLES[Math.floor(rng() * UNOWN_PICROSS_PUZZLES.length)],
    size = solution.length,
    rowClues = solution.map((row) => picrossClues(row)),
    colClues = Array.from({ length: size }, (_, column) =>
      picrossClues(solution.map((row) => row[column]))
    )
  return { solution: solution.map((row) => [...row]), rowClues, colClues }
}

/**
 * Whether the filled cells exactly match the solution.
 * @param {number[][]} cells
 * @param {number[][]} solution
 * @returns {boolean}
 */
export function picrossMatches(cells, solution) {
  return solution.every((row, rowIndex) => row.every((value, columnIndex) => (cells[rowIndex][columnIndex] ? 1 : 0) === value))
}

/**
 * How many cells are filled that are not in the solution.
 * @param {number[][]} cells
 * @param {number[][]} solution
 * @returns {number}
 */
export function picrossWrongFills(cells, solution) {
  let wrong = 0
  for (let row = 0; row < solution.length; row++)
    for (let column = 0; column < solution[row].length; column++)
      if (cells[row][column] && !solution[row][column]) wrong++
  return wrong
}

/**
 * A glyph's score (0-100) from the mistakes made and the time taken.
 * @param {number} mistakes
 * @param {number} elapsedMs
 * @returns {number}
 */
export function picrossScore(mistakes, elapsedMs) {
  const timePenalty = Math.floor(Math.max(0, elapsedMs) / 1000) * 0.8
  return Math.max(0, Math.round(100 - mistakes * 15 - timePenalty))
}

/**
 * Prize for a glyph's score.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function picrossPrize(score) {
  if (score >= 85)
    return {
      money: 4500,
      items: [
        { itemId: 'expCandyL', quantity: 1 },
        { itemId: 'starPiece', quantity: 1 },
      ],
      label: 'Ruin master!',
    }
  if (score >= 65)
    return { money: 2800, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Sharp eyes' }
  if (score >= 45)
    return { money: 1500, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Read the glyph' }
  if (score >= 20) return { money: 700, items: [], label: 'Slow but sure' }
  return { money: 250, items: [], label: 'Guesswork' }
}
