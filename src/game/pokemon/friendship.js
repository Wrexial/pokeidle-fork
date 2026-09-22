// Friendship constants and gain. Split from game/pokemon.js.



/** Birthday friendship every newly obtained Pokemon starts with. */
export const BASE_FRIENDSHIP = 70

/** Maximum friendship a Pokemon can reach. */
export const MAX_FRIENDSHIP = 255

/**
 * Clamp a Pokemon's friendship, defaulting old saves to the base value.
 * @param {Pokemon} pokemon
 * @param {number} amount
 * @returns {number}
 */
export function gainFriendship(pokemon, amount) {
  return Math.min(MAX_FRIENDSHIP, Math.max(0, (pokemon.friendship ?? BASE_FRIENDSHIP) + amount))
}
