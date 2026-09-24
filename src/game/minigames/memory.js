// Hoenn's Pokemon Memory. Split out of game/minigames.js. Flip cards two at a
// time to find matching Pokemon pairs; fewer attempts scores better.

/** Money spent to play. */
export const MEMORY_COST = 200

/** Pairs on the board (a 4x4 grid). */
export const MEMORY_PAIRS = 8

/** Species used for the pairs. */
export const MEMORY_POOL = [
  'bulbasaur',
  'charmander',
  'squirtle',
  'pikachu',
  'eevee',
  'jigglypuff',
  'meowth',
  'psyduck',
  'snorlax',
  'magikarp',
  'gengar',
  'dragonite',
  'lapras',
  'arcanine',
  'umbreon',
  'lucario',
  'garchomp',
  'gardevoir',
  'metagross',
  'sylveon',
  'mimikyu',
  'rowlet',
  'litten',
  'popplio',
]

/** @param {string[]} list @returns {string[]} */
function shuffled(list) {
  const copy = [...list]
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

/**
 * A shuffled deck of species keys, each appearing twice.
 * @param {number} [pairCount]
 * @param {string[]} [pool]
 * @returns {string[]}
 */
export function createMemoryDeck(pairCount = MEMORY_PAIRS, pool = MEMORY_POOL) {
  const picks = shuffled(pool).slice(0, Math.min(pairCount, pool.length)),
    deck = picks.flatMap((speciesKey) => [speciesKey, speciesKey])
  return shuffled(deck)
}

/**
 * Prize for a finished game; a perfect game is one attempt per pair.
 * @param {number} moves
 * @param {number} [pairs]
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function memoryPrize(moves, pairs = MEMORY_PAIRS) {
  if (moves <= pairs + 1)
    return { money: 3000, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Photographic memory!' }
  if (moves <= pairs + 5)
    return { money: 1800, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Sharp recall' }
  if (moves <= pairs + 10)
    return { money: 900, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Matched them all' }
  return { money: 300, items: [], label: 'Eventually...' }
}
