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
 * How many candidate boards a level tries before accepting a solvable one. A
 * solvable board is uncommon at deep levels (only a few percent), so this
 * matters, but exhausting it is astronomically unlikely.
 */
const VOLTORB_GENERATE_ATTEMPTS = 2000

/**
 * Build a fresh random board for a level.
 * @param {number} level
 * @returns {VoltorbBoard}
 */
function buildVoltorbBoard(level) {
  const voltorbs = voltorbCountForLevel(level),
    voltorbCells = new Set()
  while (voltorbCells.size < voltorbs)
    voltorbCells.add(Math.floor(Math.random() * VOLTORB_SIZE * VOLTORB_SIZE))
  const cells = Array.from({ length: VOLTORB_SIZE * VOLTORB_SIZE }, (_, index) => ({
    kind: /** @type {VoltorbKind} */ (
      voltorbCells.has(index) ? 'voltorb' : rollTileKind(level)
    ),
    flipped: false,
    marked: false,
  }))
  // A board with no 2s or 3s would be "cleared" before it was played, so make
  // sure there is always at least one of each (as in the real game).
  const valueCells = cells.filter((cell) => cell.kind !== 'voltorb')
  for (const kind of /** @type {VoltorbKind[]} */ (['two', 'three']))
    if (!valueCells.some((cell) => cell.kind === kind)) {
      const target =
        valueCells.find((cell) => cell.kind === 'one') ??
        valueCells.find((cell) => cell.kind !== kind)
      if (target) target.kind = kind
    }
  return {
    level,
    cells,
  }
}

/**
 * A fresh board for a level, guaranteed to be clearable by deduction alone (no
 * guess), so a run is always winnable by good play. The level's advertised
 * Voltorb count is fixed; only the tile layout is regenerated until the solver
 * below can reach every 2 and 3.
 * @param {number} level
 * @returns {VoltorbBoard}
 */
export function createVoltorbBoard(level) {
  for (let attempt = 0; attempt < VOLTORB_GENERATE_ATTEMPTS; attempt++) {
    const board = buildVoltorbBoard(level)
    if (voltorbBoardSolvable(board)) return board
  }
  return buildVoltorbBoard(level)
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

/** Tile values the solver reasons about; 0 is a Voltorb. */
const SOLVER_VALUES = [0, 1, 2, 3]

/**
 * The value each still-hidden tile in one line could hold, given the line's
 * advertised Voltorbs / point total and the values already known. The sets are
 * a sound over-approximation: a value that never appears cannot be the tile's.
 * @param {VoltorbHint} hint
 * @param {number[]} indexes
 * @param {(number | null)[]} known
 * @returns {Map<number, Set<number>>}
 */
function lineValueDomains(hint, indexes, known) {
  /** @type {Map<number, Set<number>>} */
  const domains = new Map()
  /** @type {number[]} */
  const unknown = []
  let fixedZeros = 0,
    fixedSum = 0
  for (const index of indexes) {
    const value = known[index]
    if (value === null) unknown.push(index)
    else if (value === 0) fixedZeros++
    else fixedSum += value
  }
  for (const index of unknown) domains.set(index, new Set())
  const remaining = unknown.length,
    zerosNeeded = hint.voltorbs - fixedZeros,
    sumNeeded = hint.sum - fixedSum
  if (
    zerosNeeded < 0 ||
    zerosNeeded > remaining ||
    sumNeeded < 0 ||
    sumNeeded > remaining * 3
  )
    return domains
  const assignment = new Array(remaining).fill(1)
  /**
   * Enumerate every assignment of the hidden tiles that satisfies the line.
   * @param {number} position @param {number} zeros @param {number} sum
   */
  const search = (position, zeros, sum) => {
    if (zeros > zerosNeeded || sum > sumNeeded) return
    const left = remaining - position
    if (zerosNeeded - zeros > left || sumNeeded - sum > left * 3) return
    if (position === remaining) {
      if (zeros === zerosNeeded && sum === sumNeeded)
        for (let i = 0; i < remaining; i++) {
          const domain = domains.get(unknown[i])
          if (domain) domain.add(assignment[i])
        }
      return
    }
    for (const value of SOLVER_VALUES) {
      assignment[position] = value
      search(position + 1, zeros + (value === 0 ? 1 : 0), sum + value)
    }
  }
  search(0, 0, 0)
  return domains
}

/**
 * Can this board be cleared by deduction alone, without guessing? Solves the
 * row/column hints with arc consistency: a tile that both its row and its
 * column agree cannot be a Voltorb is safe to flip, so its value is revealed
 * and the board is re-solved. Returns true once every 2 and 3 has been reached
 * that way. Sound (never accepts an unsolvable board), if not complete.
 * @param {VoltorbBoard} board
 * @returns {boolean}
 */
export function voltorbBoardSolvable(board) {
  const values = board.cells.map((cell) => CELL_POINTS[cell.kind]),
    /** @type {(number | null)[]} */
    known = new Array(board.cells.length).fill(null),
    rows = Array.from({ length: VOLTORB_SIZE }, (_, row) =>
      Array.from({ length: VOLTORB_SIZE }, (_, col) => row * VOLTORB_SIZE + col)
    ),
    cols = Array.from({ length: VOLTORB_SIZE }, (_, col) =>
      Array.from({ length: VOLTORB_SIZE }, (_, row) => row * VOLTORB_SIZE + col)
    ),
    { rows: rowHints, cols: colHints } = boardHints(board)
  // Each pass can only fix a cell, so a board's cell count of passes is enough.
  for (let pass = 0; pass < board.cells.length; pass++) {
    let changed = false
    const rowDomains = rowHints.map((hint, row) => lineValueDomains(hint, rows[row], known)),
      colDomains = colHints.map((hint, col) => lineValueDomains(hint, cols[col], known))
    for (let index = 0; index < board.cells.length; index++) {
      const row = Math.floor(index / VOLTORB_SIZE),
        col = index % VOLTORB_SIZE,
        fromRow = rowDomains[row].get(index),
        fromCol = colDomains[col].get(index)
      if (!fromRow || !fromCol) continue
      const possible = [...fromRow].filter((value) => fromCol.has(value))
      if (possible.length === 0) return false
      if (possible.includes(0)) {
        if (possible.length === 1 && known[index] !== 0) {
          known[index] = 0
          changed = true
        }
        continue
      }
      // Provably not a Voltorb: flip it to reveal the real value.
      if (known[index] !== values[index]) {
        known[index] = values[index]
        changed = true
      }
    }
    if (!changed) break
  }
  return board.cells.every(
    (cell, index) =>
      (cell.kind !== 'two' && cell.kind !== 'three') || known[index] === CELL_POINTS[cell.kind]
  )
}

/** True once every 2 and 3 tile is face up (1s may stay hidden).
 * @param {VoltorbBoard} board
 */
export function boardCleared(board) {
  let pointTiles = 0
  for (const cell of board.cells)
    if (cell.kind === 'two' || cell.kind === 'three') {
      pointTiles += 1
      if (!cell.flipped) return !1
    }
  return pointTiles > 0
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
