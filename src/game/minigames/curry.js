// Galar's Curry Cooking. Split out of game/minigames.js. Pick an ingredient to
// match the customer's requested flavour, then keep the campfire in the sweet
// spot while it simmers. Better timing and a matching flavour score higher.

/** Money spent to cook a curry. */
export const CURRY_COST = 400

/** How long the pot simmers. */
export const CURRY_COOK_MS = 8000

/** Half-width of the sweet spot around mid-flame (0-0.5). Tightened to offset
 * the 3-2-1 countdown that lets the player start fanning the instant it ends. */
export const CURRY_ZONE = 0.14

/** The flavours a customer can ask for. */
export const CURRY_FLAVORS = ['Spicy', 'Dry', 'Sweet', 'Bitter', 'Sour']

/**
 * The ingredients on offer; `flavor` null means it matches nothing.
 * @type {{ id: string, name: string, flavor: string | null }[]}
 */
export const CURRY_INGREDIENTS = [
  { id: 'bread', name: 'Bread', flavor: null },
  { id: 'spiceMix', name: 'Spice Mix', flavor: 'Spicy' },
  { id: 'dryHerb', name: 'Dry Herb', flavor: 'Dry' },
  { id: 'honey', name: 'Honey', flavor: 'Sweet' },
  { id: 'bitterRoot', name: 'Bitter Root', flavor: 'Bitter' },
  { id: 'sourApple', name: 'Sour Apple', flavor: 'Sour' },
]

/** The flavour the customer asks for. */
export function rollCurryRequest() {
  return CURRY_FLAVORS[Math.floor(Math.random() * CURRY_FLAVORS.length)]
}

/**
 * The cooking score (0-100): 70 points for keeping the flame in the sweet spot,
 * 30 for matching the requested flavour.
 * @param {boolean} flavorMatched
 * @param {number} quality 0-1 fraction of time spent in the sweet spot.
 * @returns {number}
 */
export function curryScore(flavorMatched, quality) {
  return Math.max(0, Math.min(100, Math.round(quality * 70 + (flavorMatched ? 30 : 0))))
}

/**
 * Prize for a curry's score.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function curryPrize(score) {
  if (score >= 90)
    return {
      money: 3000,
      items: [
        { itemId: 'curry', quantity: 2 },
        { itemId: 'expCandyL', quantity: 1 },
      ],
      label: 'Copper pot curry!',
    }
  if (score >= 70)
    return {
      money: 1800,
      items: [{ itemId: 'curry', quantity: 1 }],
      label: 'Delicious curry',
    }
  if (score >= 50)
    return {
      money: 900,
      items: [{ itemId: 'expCandyM', quantity: 1 }],
      label: 'Edible curry',
    }
  return {
    money: 300,
    items: [{ itemId: 'expCandyS', quantity: 1 }],
    label: 'Charred curry',
  }
}
