// Terrain. Like weather, it is battle-scoped: `state.terrain` holds the active
// type and turns, is passed into `resolveBattleTurn`, and comes back as a
// `terrain` event the reducer stores. Pure helpers here; src/game/combat.js
// applies them.
import { isGrounded } from './hazards.js'

/** How many turns a terrain lasts. */
export const TERRAIN_TURNS = 5

/** Move ids that set terrain. @type {Record<string, string>} */
export const TERRAIN_MOVES = {
  electricTerrain: 'electric',
  grassyTerrain: 'grassy',
  mistyTerrain: 'misty',
  psychicTerrain: 'psychic',
}

/** Abilities that set terrain on entry. @type {Record<string, string>} */
export const TERRAIN_ABILITIES = {
  electricSurge: 'electric',
  grassySurge: 'grassy',
  mistySurge: 'misty',
  psychicSurge: 'psychic',
}

/** Human-readable terrain name. @type {Record<string, string>} */
export const TERRAIN_NAMES = {
  electric: 'electric terrain',
  grassy: 'grassy terrain',
  misty: 'misty terrain',
  psychic: 'psychic terrain',
}

/** Icon per terrain for the battle badge. @type {Record<string, string>} */
export const TERRAIN_ICONS = {
  electric: '\u26a1',
  grassy: '\ud83c\udf3f',
  misty: '\ud83c\udf2b\ufe0f',
  psychic: '\ud83d\udd2e',
}

/**
 * Damage multiplier from the terrain. Boosts match the boost only when the
 * attacker is grounded; Misty halves Dragon damage.
 * @param {{ type: string } | null | undefined} terrain
 * @param {BattlePokemon} attacker
 * @param {Move} moveDef
 * @param {BattlePokemon} defender
 * @returns {number}
 */
export function terrainDamageMultiplier(terrain, attacker, moveDef, defender) {
  if (!terrain || !moveDef) return 1
  if (terrain.type === 'grassy') {
    if (isGrounded(attacker) && moveDef.type === 'Grass') return 1.3
    // Grassy Terrain softens Earthquake/Bulldoze/Magnitude for grounded targets.
    if (isGrounded(defender) && /earthquake|bulldoze|magnitude/i.test(moveDef.name ?? '')) return 0.5
    return 1
  }
  if (terrain.type === 'electric' && isGrounded(attacker) && moveDef.type === 'Electric') return 1.3
  if (terrain.type === 'psychic' && isGrounded(attacker) && moveDef.type === 'Psychic') return 1.3
  if (terrain.type === 'misty' && moveDef.type === 'Dragon') return 0.5
  return 1
}

/**
 * Whether the terrain protects a grounded Pokemon from a status condition.
 * @param {{ type: string } | null | undefined} terrain
 * @param {BattlePokemon} target
 * @param {string} status
 * @returns {boolean}
 */
export function terrainPreventsStatus(terrain, target, status) {
  if (!terrain || !isGrounded(target)) return !1
  if (terrain.type === 'electric' && status === 'sleep') return !0
  if (terrain.type === 'misty') return !0
  return !1
}

/**
 * Whether the terrain blocks priority moves against a grounded Pokemon
 * (Psychic Terrain).
 * @param {{ type: string } | null | undefined} terrain
 * @param {BattlePokemon} target
 * @returns {boolean}
 */
export function terrainPreventsPriority(terrain, target) {
  return !!terrain && terrain.type === 'psychic' && isGrounded(target)
}

/**
 * End-of-turn terrain healing (Grassy Terrain heals grounded Pokemon).
 * @param {{ type: string } | null | undefined} terrain
 * @param {BattlePokemon} pokemon
 * @returns {number}
 */
export function terrainHeal(terrain, pokemon) {
  return terrain?.type === 'grassy' && isGrounded(pokemon)
    ? Math.max(1, Math.floor(pokemon.maxHp / 16))
    : 0
}
