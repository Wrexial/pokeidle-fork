// Kanto Game Corner slot machine. Split from game/minigames.js.



/** Money spent per slot spin. */
export const SLOT_SPIN_COST = 200

/** The slot machine is 3 reels wide and 3 rows tall. */
export const SLOT_REELS = 3

export const SLOT_ROWS = 3

/**
 * The eight winning lines, each a [row, col] triple: 3 rows, 3 columns and
 * 2 diagonals.
 * @type {[number, number][][]}
 */
export const SLOT_PAYLINES = [
  // rows
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  // columns
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  // diagonals
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
]

/**
 * Pok\u00e9mon slot symbols, their relative weight and the multiplier they pay on
 * three of a kind. The payouts are tuned to a ~91% return across all 8 lines.
 * @type {{ id: string, name: string, speciesKey: string, weight: number, payout: number }[]}
 */
export const SLOT_SYMBOLS = [
  { id: 'magikarp', name: 'Magikarp', speciesKey: 'magikarp', weight: 30, payout: 1 },
  { id: 'caterpie', name: 'Caterpie', speciesKey: 'caterpie', weight: 22, payout: 2 },
  { id: 'rattata', name: 'Rattata', speciesKey: 'rattata', weight: 16, payout: 5 },
  { id: 'meowth', name: 'Meowth', speciesKey: 'meowth', weight: 12, payout: 10 },
  { id: 'eevee', name: 'Eevee', speciesKey: 'eevee', weight: 8, payout: 20 },
  { id: 'snorlax', name: 'Snorlax', speciesKey: 'snorlax', weight: 5, payout: 45 },
  { id: 'dragonite', name: 'Dragonite', speciesKey: 'dragonite', weight: 4, payout: 90 },
  { id: 'mewtwo', name: 'Mewtwo', speciesKey: 'mewtwo', weight: 3, payout: 250 },
]

const SLOT_TOTAL_WEIGHT = SLOT_SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0)

/** The symbol that pays the most (its line is the jackpot). */
const SLOT_JACKPOT_SYMBOL = SLOT_SYMBOLS.reduce(
  (best, symbol) => (symbol.payout > best.payout ? symbol : best),
  SLOT_SYMBOLS[0]
)

/** The top slot multiplier. */
export const SLOT_JACKPOT = SLOT_JACKPOT_SYMBOL.payout

/** Roll one symbol for a cell (also used for the fake-spin animation).
 * @returns {typeof SLOT_SYMBOLS[number]}
 */
export function rollSlotSymbol() {
  let roll = Math.random() * SLOT_TOTAL_WEIGHT
  for (const symbol of SLOT_SYMBOLS) {
    roll -= symbol.weight
    if (roll <= 0) return symbol
  }
  return SLOT_SYMBOLS[0]
}

/**
 * Spin the 3\u00d73 machine and score all eight lines.
 * @returns {{
 *   grid: (typeof SLOT_SYMBOLS[number])[][],
 *   wins: { lineIndex: number, symbol: typeof SLOT_SYMBOLS[number], payout: number }[],
 *   payout: number,
 *   jackpot: boolean,
 * }}
 */
export function spinSlots() {
  const grid = Array.from({ length: SLOT_ROWS }, () =>
    Array.from({ length: SLOT_REELS }, () => rollSlotSymbol())
  )
  /** @type {{ lineIndex: number, symbol: typeof SLOT_SYMBOLS[number], payout: number }[]} */
  const wins = []
  SLOT_PAYLINES.forEach((line, lineIndex) => {
    const symbols = line.map(([row, col]) => grid[row][col])
    if (symbols.every((symbol) => symbol.id === symbols[0].id))
      wins.push({
        lineIndex,
        symbol: symbols[0],
        payout: symbols[0].payout * SLOT_SPIN_COST,
      })
  })
  const payout = wins.reduce((sum, win) => sum + win.payout, 0)
  return {
    grid,
    wins,
    payout,
    jackpot: wins.some((win) => win.symbol.id === SLOT_JACKPOT_SYMBOL.id),
  }
}
