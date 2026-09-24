// Unova's Voltorb Flip. Split out of game/minigames.js. A 5x5 deduction board:
// every row and column advertises how many Voltorbs and how many points it
// hides, and you flip tiles for coins. A Voltorb ends the run; clearing every
// 2 and 3 banks the board and moves you up a level.

/** Money spent to start a run. */
export const VOLTORB_FLIP_COST = 200

/** The board is 5x5. */
export const VOLTORB_SIZE = 5

/** Runs top out here (deeper levels hide more Voltorbs and 3s). */
export const VOLTORB_MAX_LEVEL = 8

/** A cleared board adds this, times the level, on top of the tile values. */
export const VOLTORB_CLEAR_BONUS = 250

/** Coins per point of a flipped 2 or 3, times the level. */
export const VOLTORB_COIN_SCALE = 10

/**
 * @typedef {'voltorb' | 'one' | 'two' | 'three'} VoltorbKind
 * @typedef {{ kind: VoltorbKind, flipped: boolean, marked: boolean }} VoltorbCell
 * @typedef {{ level: number, cells: VoltorbCell[] }} VoltorbBoard
 * @typedef {{ voltorbs: number, sum: number }} VoltorbHint
 */

const CELL_POINTS = { voltorb: 0, one: 1, two: 2, three: 3 }

/** Voltorbs on a level's board (6 at level 1 up to 10 at level 8).
 * @param {number} level
 */
export function voltorbCountForLevel(level) {
  return Math.min(5 + level, 10)
}

/** Higher levels hide more 3s and fewer 1s.
 * @param {number} level
 * @returns {VoltorbKind}
 */
function rollTileKind(level) {
  const threeWeight = Math.min(level, 5),
    twoWeight = 3,
    oneWeight = Math.max(1, 9 - level),
    total = threeWeight + twoWeight + oneWeight
  let roll = Math.random() * total
  if ((roll -= threeWeight) < 0) return 'three'
  if ((roll -= twoWeight) < 0) return 'two'
  return 'one'
}

/**
 * Build a fresh board for a level.
 * @param {number} level
 * @returns {VoltorbBoard}
 */
export function createVoltorbBoard(level) {
  const voltorbs = voltorbCountForLevel(level),
    voltorbCells = new Set()
  while (voltorbCells.size < voltorbs)
    voltorbCells.add(Math.floor(Math.random() * VOLTORB_SIZE * VOLTORB_SIZE))
  return {
    level,
    cells: Array.from({ length: VOLTORB_SIZE * VOLTORB_SIZE }, (_, index) => ({
      kind: /** @type {VoltorbKind} */ (
        voltorbCells.has(index) ? 'voltorb' : rollTileKind(level)
      ),
      flipped: false,
      marked: false,
    })),
  }
}

/**
 * The Voltorbs / point total advertised for each row and column.
 * @param {VoltorbBoard} board
 * @returns {{ rows: VoltorbHint[], cols: VoltorbHint[] }}
 */
export function boardHints(board) {
  const rows = Array.from({ length: VOLTORB_SIZE }, () => ({ voltorbs: 0, sum: 0 })),
    cols = Array.from({ length: VOLTORB_SIZE }, () => ({ voltorbs: 0, sum: 0 }))
  board.cells.forEach((cell, index) => {
    const row = Math.floor(index / VOLTORB_SIZE),
      col = index % VOLTORB_SIZE
    if (cell.kind === 'voltorb') {
      rows[row].voltorbs++
      cols[col].voltorbs++
    } else {
      rows[row].sum += CELL_POINTS[cell.kind]
      cols[col].sum += CELL_POINTS[cell.kind]
    }
  })
  return { rows, cols }
}

/** True once every non-Voltorb tile is face up.
 * @param {VoltorbBoard} board
 */
export function boardCleared(board) {
  return board.cells.every((cell) => cell.kind === 'voltorb' || cell.flipped)
}

/** True once a Voltorb has been flipped this board.
 * @param {VoltorbBoard} board
 */
export function boardExploded(board) {
  return board.cells.some((cell) => cell.kind === 'voltorb' && cell.flipped)
}

/**
 * Flip a tile. A flipped tile (or one flipped after an explosion) is ignored.
 * @param {VoltorbBoard} board
 * @param {number} index
 * @returns {VoltorbBoard}
 */
export function flipVoltorbCell(board, index) {
  if (boardExploded(board)) return board
  const cell = board.cells[index]
  if (!cell || cell.flipped) return board
  return {
    ...board,
    cells: board.cells.map((candidate, cellIndex) =>
      cellIndex === index ? { ...candidate, flipped: true } : candidate
    ),
  }
}

/**
 * Toggle a player's "Voltorb" mark on a hidden tile.
 * @param {VoltorbBoard} board
 * @param {number} index
 * @returns {VoltorbBoard}
 */
export function toggleVoltorbMark(board, index) {
  const cell = board.cells[index]
  if (!cell || cell.flipped) return board
  return {
    ...board,
    cells: board.cells.map((candidate, cellIndex) =>
      cellIndex === index ? { ...candidate, marked: !candidate.marked } : candidate
    ),
  }
}

/**
 * Coins a board is worth right now: the flipped 2s and 3s times the level,
 * plus a clear bonus once every 2 and 3 is found.
 * @param {VoltorbBoard} board
 * @returns {number}
 */
export function voltorbBoardCoins(board) {
  let coins = 0
  for (const cell of board.cells)
    if (cell.flipped && cell.kind !== 'voltorb')
      coins += CELL_POINTS[cell.kind] * VOLTORB_COIN_SCALE * board.level
  if (boardCleared(board)) coins += VOLTORB_CLEAR_BONUS * board.level
  return coins
}

/**
 * The final reward for a finished run. Deep runs also carry a candy out.
 * @param {number} banked
 * @param {number} maxLevel
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function voltorbFlipPrize(banked, maxLevel) {
  /** @type {{ itemId: string, quantity: number }[]} */
  const items = []
  if (maxLevel >= VOLTORB_MAX_LEVEL)
    items.push({ itemId: 'rareCandy', quantity: 1 })
  else if (maxLevel >= 5) items.push({ itemId: 'expCandyL', quantity: 1 })
  else if (maxLevel >= 3) items.push({ itemId: 'expCandyM', quantity: 1 })
  return {
    money: banked,
    items,
    label:
      maxLevel >= VOLTORB_MAX_LEVEL
        ? 'Board master!'
        : maxLevel >= 5
          ? 'Deep run!'
          : maxLevel >= 3
            ? 'Nice streak'
            : 'Run over',
  }
}
