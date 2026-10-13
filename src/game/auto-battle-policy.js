// The player's auto-battle policy: the rules the auto-battler follows when it
// picks a move, switches Pokemon or drinks a healing item. Shared by the idle
// loop (which owns switching and item use) and the combat AI (which owns move
// choice). The defaults keep the classic auto-battler feel: it already values
// STAB through the damage estimate, avoids hurting itself on a Rocky Helmet,
// and pivots out of a losing matchup, but it never dips into the bag or
// switches on low HP alone unless the player asks it to.

import { consumableItems } from '../data/items.js'

/**
 * The auto-battler's rules.
 * @typedef {{
 *   preferStab: boolean,
 *   avoidContact: boolean,
 *   switchBelow: number,
 *   itemBelow: number,
 * }} AutoBattlePolicy
 */

/** The out-of-the-box policy. @type {AutoBattlePolicy} */
export const DEFAULT_AUTO_BATTLE_POLICY = {
  // Give a same-type attack a small edge over a slightly stronger off-type one.
  preferStab: !0,
  // Favour a non-contact move when the foe holds a Rocky Helmet (or has Rough
  // Skin / Iron Barbs).
  avoidContact: !0,
  // Switch to a healthier teammate once HP drops below this fraction (0 = only
  // switch on a losing type matchup, the classic behaviour).
  switchBelow: 0.25,
  // Use the best healing item once HP drops below this fraction (0 = never).
  itemBelow: 0,
}

/** Clamp a switch/item threshold into 0..1, keeping 0 ("off") meaningful. @param {any} value */
function normalizeThreshold(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

/** @param {number} value */
function roundThreshold(value) {
  return Math.round(normalizeThreshold(value) * 100) / 100
}

/**
 * Coerce a stored policy into a complete, valid one, filling any missing field
 * from the defaults. Anything unrecognised is dropped rather than trusted.
 * @param {any} raw
 * @returns {AutoBattlePolicy}
 */
export function normalizeAutoBattlePolicy(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  return {
    preferStab:
      source.preferStab === void 0 ? DEFAULT_AUTO_BATTLE_POLICY.preferStab : !!source.preferStab,
    avoidContact:
      source.avoidContact === void 0
        ? DEFAULT_AUTO_BATTLE_POLICY.avoidContact
        : !!source.avoidContact,
    switchBelow: Number.isFinite(source.switchBelow)
      ? roundThreshold(source.switchBelow)
      : DEFAULT_AUTO_BATTLE_POLICY.switchBelow,
    itemBelow: Number.isFinite(source.itemBelow)
      ? roundThreshold(source.itemBelow)
      : DEFAULT_AUTO_BATTLE_POLICY.itemBelow,
  }
}

/**
 * The best healing item to auto-use on `pokemon`, or null when the policy
 * shouldn't act: nothing to heal, no item in stock, or the item threshold is
 * off/not reached. Prefers the smallest potion that still lifts the Pokemon
 * back over the threshold, so a Max Potion isn't wasted on a scratch.
 * @param {Record<string, number>} inventory
 * @param {{ currentHp: number, maxHp: number }} pokemon
 * @param {number} threshold HP fraction below which the policy heals.
 * @returns {string | null}
 */
export function chooseAutoHealItem(inventory, pokemon, threshold) {
  if (!pokemon || !(threshold > 0) || pokemon.maxHp <= 0) return null
  if (pokemon.currentHp <= 0 || pokemon.currentHp >= pokemon.maxHp) return null
  if (pokemon.currentHp / pokemon.maxHp >= threshold) return null
  const missing = pokemon.maxHp - pokemon.currentHp,
    target = Math.max(0, pokemon.maxHp * threshold - pokemon.currentHp),
    candidates = []
  for (const [itemId, quantity] of Object.entries(inventory ?? {})) {
    if (quantity <= 0) continue
    const item = consumableItems[itemId]
    if (!item || item.category !== 'medicine' || item.revive) continue
    const heal = item.full ? missing : Math.min(item.heal ?? 0, missing)
    if (heal > 0) candidates.push({ itemId, heal })
  }
  if (candidates.length === 0) return null
  const enough = candidates.filter((candidate) => candidate.heal >= target)
  return (enough.length > 0 ? enough : candidates).reduce((best, candidate) =>
    candidate.heal < best.heal ? candidate : best
  ).itemId
}
