// Held-item effects. Like abilities, the battle engine (src/game/combat.js)
// reads these pure lookups; the acquisition/equip UI lives elsewhere.
import { heldItems } from '../data/items.js'

const HELD_ITEM_KEYS = Object.keys(heldItems)

/**
 * Roll a random held item for an enemy (or null).
 * @param {number} [chance]
 * @param {() => number} [rng]
 * @returns {string | null}
 */
export function rollHeldItem(chance = 0.25, rng = Math.random) {
  return rng() < chance ? HELD_ITEM_KEYS[Math.floor(rng() * HELD_ITEM_KEYS.length)] : null
}

/** @param {BattlePokemon} pokemon */
export function heldItemOf(pokemon) {
  return pokemon?.heldItem ?? null
}

/** @param {BattlePokemon} pokemon */
export function heldItemEffect(pokemon) {
  const heldItem = heldItemOf(pokemon)
  return heldItem ? (heldItems[heldItem]?.effect ?? null) : null
}

/**
 * Multiplier a held item applies to one of the holder's stats.
 * @param {BattlePokemon} pokemon
 * @param {string} statKey
 * @param {boolean} [canEvolve] Whether the holder can still evolve (Eviolite).
 * @returns {number}
 */
export function heldStatMultiplier(pokemon, statKey, canEvolve = !1) {
  const effect = heldItemEffect(pokemon)
  if (!effect) return 1
  if (effect.type === 'statBoost') return effect.stat === statKey ? effect.multiplier : 1
  if (effect.type === 'eviolite' && canEvolve)
    return statKey === 'defense' || statKey === 'spDefense' ? 1.5 : 1
  return 1
}

/**
 * Damage multiplier for the attacker's held item (Life Orb, type boosters).
 * @param {BattlePokemon} pokemon
 * @param {Move} moveDef
 * @returns {number}
 */
export function heldDamageMultiplier(pokemon, moveDef) {
  const effect = heldItemEffect(pokemon)
  if (!effect) return 1
  if (effect.type === 'lifeOrb') return effect.multiplier
  if (effect.type === 'typeBoost' && effect.moveType === moveDef?.type) return 1.2
  return 1
}

/**
 * Focus Sash: survive a knockout from full HP with 1 HP (once per battle).
 * @param {BattlePokemon} pokemon
 * @param {number} hpBefore
 * @param {number} damage
 * @returns {number}
 */
export function heldSurvivesAtFullHp(pokemon, hpBefore, damage) {
  return heldItemEffect(pokemon)?.type === 'focusSash' && !pokemon.heldItemUsed && hpBefore >= pokemon.maxHp && damage >= hpBefore
    ? hpBefore - 1
    : damage
}

/** Leftovers healing at the end of a turn (0 when not held). @param {BattlePokemon} pokemon */
export function heldLeftoversHeal(pokemon) {
  return heldItemEffect(pokemon)?.type === 'leftovers' ? Math.max(1, Math.floor(pokemon.maxHp / 16)) : 0
}

/** Sitrus-style berry healing once below its threshold. @param {BattlePokemon} pokemon */
export function heldBerryHeal(pokemon) {
  const effect = heldItemEffect(pokemon)
  return effect?.type === 'berry' &&
    !pokemon.heldItemUsed &&
    pokemon.currentHp > 0 &&
    pokemon.currentHp <= pokemon.maxHp * effect.threshold
    ? Math.max(1, Math.floor(pokemon.maxHp * effect.heal))
    : 0
}

/** Whether the holder's Lum Berry can cure it right now. @param {BattlePokemon} pokemon */
export function heldCuresStatus(pokemon) {
  return heldItemEffect(pokemon)?.type === 'lumBerry' && !pokemon.heldItemUsed
}

/** Life Orb recoil for a hit that dealt `damage`. @param {BattlePokemon} pokemon @param {number} damage */
export function heldLifeOrbRecoil(pokemon, damage) {
  const effect = heldItemEffect(pokemon)
  return effect?.type === 'lifeOrb' ? Math.max(1, Math.floor(pokemon.maxHp * effect.recoil)) : 0
}
