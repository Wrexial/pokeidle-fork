// Paldea's Picnic. Build a sandwich by dropping ingredients as the piece swings
// over the plate: land it near the middle for the most points, and drop too far
// off the edge and the whole stack topples.

/** Money spent to set up the picnic. */
export const PICNIC_COST = 250

/** Ingredients before the sandwich is finished. */
export const PICNIC_PIECES = 8

/** Time for the swinging piece to cross the plate once, in ms. */
export const PICNIC_SWING_MS = 1150

/** Beyond this offset (in half-plate units) the stack topples. */
export const PICNIC_TOPPLE_LIMIT = 0.42

/** Ingredient names, used in order. */
export const PICNIC_INGREDIENTS = [
  'Bread',
  'Lettuce',
  'Tomato',
  'Cheese',
  'Ham',
  'Egg',
  'Cucumber',
  'Avocado',
  'Bacon',
  'Onion',
]

/** Best possible score (a perfect drop every time). */
export const PICNIC_MAX_SCORE = PICNIC_PIECES * 100

/**
 * The ingredient dropped at a given step (wraps around the list).
 * @param {number} index
 * @returns {string}
 */
export function picnicIngredientFor(index) {
  return PICNIC_INGREDIENTS[index % PICNIC_INGREDIENTS.length]
}

/**
 * Score a dropped piece by how far it landed from the middle.
 * @param {number} offset -0.5 (left edge) through 0 (middle) to 0.5 (right edge)
 * @returns {{ grade: 'perfect' | 'good' | 'ok' | 'topple', points: number, topple: boolean }}
 */
export function picnicDropScore(offset) {
  const distance = Math.abs(offset)
  if (distance > PICNIC_TOPPLE_LIMIT)
    return { grade: 'topple', points: 0, topple: true }
  if (distance <= 0.08) return { grade: 'perfect', points: 100, topple: false }
  if (distance <= 0.2) return { grade: 'good', points: 60, topple: false }
  return { grade: 'ok', points: 30, topple: false }
}

/**
 * Prize for a finished (or toppled) sandwich.
 * @param {number} score
 * @param {boolean} toppled
 * @param {number} [max]
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function picnicPrize(score, toppled = false, max = PICNIC_MAX_SCORE) {
  if (toppled) return { money: 200, items: [], label: 'The stack toppled!' }
  const ratio = max > 0 ? score / max : 0
  if (ratio >= 0.9)
    return { money: 3200, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'A masterpiece!' }
  if (ratio >= 0.7)
    return { money: 2000, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Tasty sandwich' }
  if (ratio >= 0.4)
    return { money: 1100, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'A decent bite' }
  return { money: 300, items: [], label: 'At least it is edible' }
}

/** How many sandwiches are finished; keeps the max score honest in tests. */
export const PICNIC_MAX_PIECES = PICNIC_PIECES
