// Hoenn's Lights Out. Split out of game/minigames.js. A small puzzle: every tap
// toggles a tile and its four neighbours; turn every light back on in as few
// taps as you can.

/** Money spent to start a puzzle. */
export const LIGHTS_OUT_COST = 250

/** The board is 4x4. */
export const LIGHTS_OUT_SIZE = 4

/** How many random taps scramble the solved board. */
export const LIGHTS_OUT_SCRAMBLE = 6

/**
 * Toggle a tile and its orthogonal neighbours.
 * @param {boolean[]} grid
 * @param {number} index
 * @param {number} [size]
 * @returns {boolean[]}
 */
export function toggleLights(grid, index, size = LIGHTS_OUT_SIZE) {
  const next = [...grid],
    row = Math.floor(index / size),
    col = index % size,
    flip = (/** @type {number} */ r, /** @type {number} */ c) => {
      if (r >= 0 && r < size && c >= 0 && c < size) next[r * size + c] = !next[r * size + c]
    }
  flip(row, col)
  flip(row - 1, col)
  flip(row + 1, col)
  flip(row, col - 1)
  flip(row, col + 1)
  return next
}

/**
 * A scrambled board: start solved (all on) and apply random taps, so a solution
 * always exists. Never returns an already-solved board.
 * @param {number} [size]
 * @param {number} [scramble]
 * @returns {boolean[]}
 */
export function createLightsOut(size = LIGHTS_OUT_SIZE, scramble = LIGHTS_OUT_SCRAMBLE) {
  let grid = Array(size * size).fill(true)
  for (let tap = 0; tap < scramble; tap++)
    grid = toggleLights(grid, Math.floor(Math.random() * size * size), size)
  if (grid.every(Boolean)) grid = toggleLights(grid, Math.floor(Math.random() * size * size), size)
  return grid
}

/** @param {boolean[]} grid */
export function lightsSolved(grid) {
  return grid.every(Boolean)
}

/**
 * Prize for the number of taps used to solve the puzzle.
 * @param {number} moves
 * @param {boolean} solved
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function lightsOutPrize(moves, solved) {
  if (!solved) return { money: 200, items: [], label: 'Puzzle abandoned' }
  if (moves <= LIGHTS_OUT_SCRAMBLE)
    return { money: 3000, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Flawless!' }
  if (moves <= 10)
    return { money: 1500, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Solved' }
  return { money: 600, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Solved, eventually' }
}
