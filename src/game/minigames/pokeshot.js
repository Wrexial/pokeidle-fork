// Kalos's Parfum Palace. Split out of game/minigames.js. A wildlife photo shoot:
// Pokemon flit across the gardens and you snap a picture while one is inside the
// frame. Centred shots and rarer (or shiny) Pokemon are worth the most.

/** Money spent to play. */
export const POKESHOT_COST = 400

/** How long the shoot lasts. */
export const POKESHOT_SECONDS = 25

/** The shoot length in milliseconds. */
export const POKESHOT_TIME_MS = POKESHOT_SECONDS * 1000

/** How far from centre (0-1 on the shorter axis) the frame still counts. */
export const POKESHOT_FRAME = 0.3

/** How often a target turns out to be shiny. */
export const POKESHOT_SHINY_ODDS = 1 / 40

/**
 * The Pokemon that wander the gardens, with a star rating (rarer is worth more).
 * @type {{ speciesKey: string, stars: number }[]}
 */
export const POKESHOT_POOL = [
  { speciesKey: 'pidgey', stars: 1 },
  { speciesKey: 'caterpie', stars: 1 },
  { speciesKey: 'rattata', stars: 1 },
  { speciesKey: 'oddish', stars: 1 },
  { speciesKey: 'pikachu', stars: 2 },
  { speciesKey: 'eevee', stars: 2 },
  { speciesKey: 'growlithe', stars: 2 },
  { speciesKey: 'jigglypuff', stars: 2 },
  { speciesKey: 'gengar', stars: 3 },
  { speciesKey: 'lucario', stars: 3 },
  { speciesKey: 'garchomp', stars: 3 },
  { speciesKey: 'sylveon', stars: 3 },
  { speciesKey: 'dragonite', stars: 3 },
]

/**
 * Roll the next Pokemon to wander past.
 * @returns {{ speciesKey: string, stars: number, isShiny: boolean }}
 */
export function rollPokeshotTarget() {
  const target = POKESHOT_POOL[Math.floor(Math.random() * POKESHOT_POOL.length)]
  return { ...target, isShiny: Math.random() < POKESHOT_SHINY_ODDS }
}

/**
 * Accuracy of a snap for a Pokemon `distance` from centre: 3 centred, 2 framed,
 * 1 just inside the edges, 0 missed.
 * @param {number} distance 0-1 from centre.
 * @returns {number}
 */
export function pokeshotShotScore(distance) {
  if (distance <= POKESHOT_FRAME * 0.4) return 3
  if (distance <= POKESHOT_FRAME) return 2
  if (distance <= POKESHOT_FRAME * 1.6) return 1
  return 0
}

/**
 * Points for a snap.
 * @param {number} distance
 * @param {number} stars
 * @param {boolean} isShiny
 * @returns {number}
 */
export function pokeshotShotPoints(distance, stars, isShiny) {
  return pokeshotShotScore(distance) * stars * (isShiny ? 4 : 1)
}

/**
 * Prize for the shoot's score.
 * @param {number} score
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function pokeshotPrize(score) {
  if (score >= 120)
    return {
      money: 5000,
      items: [
        { itemId: 'expCandyL', quantity: 1 },
        { itemId: 'nugget', quantity: 1 },
      ],
      label: 'Perfect portfolio!',
    }
  if (score >= 80)
    return { money: 3000, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Ace photographer' }
  if (score >= 45)
    return { money: 1600, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Nice shots' }
  if (score >= 20) return { money: 800, items: [], label: 'Got a few' }
  return { money: 250, items: [], label: 'Blurry mess' }
}
