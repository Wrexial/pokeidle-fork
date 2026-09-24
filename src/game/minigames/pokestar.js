// Unova's Pokestar Studios. Split out of game/minigames.js. The director gives a
// brief for each shot; pick the take that best matches it. Three shots, scored
// out of three each.

/** Money spent to shoot a film. */
export const POKESTAR_COST = 500

/** Shots per film. */
export const POKESTAR_SHOT_COUNT = 3

/** Every shot's best take is worth this. */
export const POKESTAR_TAKE_MAX = 3

/**
 * @typedef {{ label: string, score: number }} PokestarTake
 * @typedef {{ brief: string, takes: PokestarTake[] }} PokestarShot
 */

/** @type {PokestarShot[]} */
export const POKESTAR_SHOTS = [
  {
    brief: 'The hero bursts onto the scene with fearless energy.',
    takes: [
      { label: 'Kick the door clean off its hinges', score: 3 },
      { label: 'Stand tall and point at the horizon', score: 2 },
      { label: 'Wave hello awkwardly', score: 1 },
      { label: 'Trip over a cable', score: 0 },
    ],
  },
  {
    brief: 'A tender farewell at the train station.',
    takes: [
      { label: 'A long, wordless hug as the whistle blows', score: 3 },
      { label: 'Shake hands briskly', score: 2 },
      { label: 'Yell about taxes', score: 0 },
      { label: 'Wave from the window', score: 1 },
    ],
  },
  {
    brief: 'The monster looms and the hero reacts in terror.',
    takes: [
      { label: 'A blood-curdling scream', score: 3 },
      { label: 'Take one nervous step back', score: 2 },
      { label: 'Offer it a sandwich', score: 0 },
      { label: 'Frown slightly', score: 1 },
    ],
  },
  {
    brief: 'A tense standoff: nobody moves, nobody blinks.',
    takes: [
      { label: 'Hold a dead-eyed stare', score: 3 },
      { label: 'Slowly reach for the holster', score: 2 },
      { label: 'Check your phone', score: 0 },
      { label: 'Clear your throat', score: 1 },
    ],
  },
  {
    brief: 'The detective pieces the whole mystery together.',
    takes: [
      { label: 'Snap your fingers as it clicks', score: 3 },
      { label: 'Nod thoughtfully at the clues', score: 2 },
      { label: 'Shrug and give up', score: 0 },
      { label: 'Squint at the evidence', score: 1 },
    ],
  },
  {
    brief: 'A slapstick pratfall for the comedy reel.',
    takes: [
      { label: 'Slip on a banana peel into the fountain', score: 3 },
      { label: 'Stub your toe on a chair', score: 2 },
      { label: 'Deliver a solemn monologue', score: 0 },
      { label: 'Tug your collar sheepishly', score: 1 },
    ],
  },
  {
    brief: 'The villain reveals the plan with icy confidence.',
    takes: [
      { label: 'Stroll out of the shadows, cape swirling', score: 3 },
      { label: 'Adjust your gloves and smile', score: 2 },
      { label: 'Apologise and leave', score: 0 },
      { label: 'Point at the map', score: 1 },
    ],
  },
  {
    brief: 'A victory celebration for the closing shot.',
    takes: [
      { label: 'Leap into the air, arms wide', score: 3 },
      { label: 'Raise a fist and grin', score: 2 },
      { label: 'Sit down and sigh', score: 0 },
      { label: 'Give a polite nod', score: 1 },
    ],
  },
]

/**
 * Pick a random set of distinct shots for a film.
 * @param {number} [count]
 * @returns {PokestarShot[]}
 */
export function pickPokestarShots(count = POKESTAR_SHOT_COUNT) {
  const pool = [...POKESTAR_SHOTS],
    shots = []
  while (shots.length < Math.min(count, pool.length)) {
    const index = Math.floor(Math.random() * pool.length)
    shots.push(pool[index])
    pool.splice(index, 1)
  }
  return shots
}

/**
 * Prize for a finished film.
 * @param {number} score
 * @param {number} [max]
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function pokestarPrize(score, max = POKESTAR_SHOT_COUNT * POKESTAR_TAKE_MAX) {
  const ratio = max > 0 ? score / max : 0
  if (score >= max)
    return { money: 5000, items: [{ itemId: 'rareCandy', quantity: 2 }], label: 'Box-office smash!' }
  if (ratio >= 0.75)
    return { money: 3000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Critically acclaimed' }
  if (ratio >= 0.5)
    return { money: 1500, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Solid release' }
  return { money: 400, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Straight to video' }
}
