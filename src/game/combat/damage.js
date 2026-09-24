// Type chart, stat stages and damage calculation. Split from game/combat.js.

import { typechart } from '../../data/moves.js'

/**
 * @param {string} attackType
 * @param {string[]} defenderTypes
 * @returns {number}
 */
export function getTypeEffectiveness(attackType, defenderTypes) {
  let multiplier = 1
  for (const defenderType of defenderTypes) multiplier *= typechart[attackType]?.[defenderType] ?? 1
  return multiplier
}

/**
 * @param {string} attackType
 * @param {string[]} defenderTypes
 * @returns {number}
 */
export function getTypeMultiplier(attackType, defenderTypes) {
  return getTypeEffectiveness(attackType, defenderTypes)
}

/**
 * @param {number} stage
 * @returns {number}
 */
export function statStageMultiplier(stage) {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage)
}

/**
 * Critical-hit chance by crit stage: 0 = 1/24 (modern base rate), +1 = 1/8,
 * +2 = 1/2, +3 = always. `superLuck` adds a stage; Battle Armor / Shell Armor
 * and Sniper are handled at the call site.
 */
const CRIT_CHANCES = [1 / 24, 1 / 8, 1 / 2, 1]

/**
 * The game's stat keys are camelCase (`spAttack`); extracted move data sometimes
 * uses Showdown's hyphenated names. Normalise before applying a stat change.
 * @param {string} statKey
 * @returns {string}
 */
export function normalizeStatKey(statKey) {
  return (
    /** @type {Record<string, string>} */ ({
      'special-attack': 'spAttack',
      'special-defense': 'spDefense',
      'sp-atk': 'spAttack',
      'sp-def': 'spDefense',
      evasiveness: 'evasion',
    })[statKey] ?? statKey
  )
}

/**
 * Whether a move targets its own user (heals, self-buffs, Protect), so a
 * defender's Protect should not block it.
 * @param {Move} moveDef
 * @returns {boolean}
 */
export function isSelfTargetedMove(moveDef) {
  return (
    moveDef.effect?.target === 'self' ||
    moveDef.effect?.type === 'heal' ||
    moveDef.effect?.type === 'substitute' ||
    !!moveDef.protect
  )
}

/**
 * A probability check. In deterministic battles only guaranteed (100%) effects
 * happen, so the outcome never depends on luck.
 * @param {number} probability [0, 1]
 * @param {boolean} deterministic
 * @returns {boolean}
 */
export function chance(probability, deterministic) {
  return deterministic ? probability >= 1 : Math.random() < probability
}

/**
 * @param {number} attackerLevel
 * @param {number} attack
 * @param {number} defense
 * @param {Move} move
 * @param {string[]} attackerTypes
 * @param {string[]} defenderTypes
 * @param {number} [attackerStage]
 * @param {number} [defenderStage]
 * @param {number} [critStage]
 * @param {boolean} [skipAccuracy]
 * @param {number} [accuracyStage]
 * @param {number} [evasionStage]
 * @param {boolean} [deterministic] No misses, crits or damage variance.
 * @param {number} [critMultiplierBase] Damage multiplier on a crit (Sniper = 2.25).
 * @param {boolean} [critImmune] Battle Armor / Shell Armor block crits.
 * @returns {{ damage: number, isCrit: boolean, effectiveness: number, effectivenessLabel: string | null }}
 */
export function calculateDamage(attackerLevel, attack, defense, move, attackerTypes, defenderTypes, attackerStage = 0, defenderStage = 0, critStage = 0, skipAccuracy = !1, accuracyStage = 0, evasionStage = 0, deterministic = !1, critMultiplierBase = 2, critImmune = !1) {
  if (move.power === 0)
    return {
      damage: 0,
      isCrit: !1,
      effectiveness: 1,
      effectivenessLabel: null,
    }
  // An accuracy above 100 (the data's marker for a move that never misses)
  // ignores accuracy / evasion stages entirely. Accuracy 0 is the other
  // can't-miss convention (weather-perfected Thunder / Blizzard).
  const alwaysHits = move.accuracy > 100,
    effectiveAccuracy =
      move.accuracy <= 0 || alwaysHits
        ? 100
        : move.accuracy * statStageMultiplier(accuracyStage - evasionStage)
  if (!deterministic && !skipAccuracy && !alwaysHits && Math.random() * 100 >= effectiveAccuracy)
    return {
      damage: 0,
      isCrit: !1,
      effectiveness: 1,
      effectivenessLabel: 'miss',
    }
  const effectiveAttack = Math.floor(attack * statStageMultiplier(attackerStage)),
    effectiveDefense = Math.max(1, Math.floor(defense * statStageMultiplier(defenderStage))),
    baseDamage = Math.floor((Math.floor((2 * attackerLevel) / 5 + 2) * move.power * effectiveAttack) / effectiveDefense / 50 + 2),
    critChance = CRIT_CHANCES[Math.min(3, Math.max(0, critStage))] ?? CRIT_CHANCES[0],
    isCrit = !deterministic && !critImmune && Math.random() < critChance,
    critMultiplier = isCrit ? critMultiplierBase : 1,
    stabMultiplier = attackerTypes.includes(move.type) ? 1.5 : 1,
    effectiveness = getTypeMultiplier(move.type, defenderTypes),
    randomFactor = deterministic ? 0.925 : (Math.floor(Math.random() * 16) + 85) / 100,
    damage = Math.max(1, Math.floor(baseDamage * critMultiplier * stabMultiplier * effectiveness * randomFactor))
  /** @type {string | null} */
  let effectivenessLabel = null
  return (
    effectiveness === 0
      ? (effectivenessLabel = 'It had no effect!')
      : effectiveness < 1
        ? (effectivenessLabel = "It's not very effective...")
        : effectiveness > 1 && (effectivenessLabel = "It's super effective!"),
    {
      damage: effectiveness === 0 ? 0 : damage,
      isCrit,
      effectiveness,
      effectivenessLabel,
    }
  )
}

/**
 * @param {number} attackerLevel
 * @param {number} attack
 * @param {number} defense
 * @param {Move} move
 * @param {string[]} attackerTypes
 * @param {string[]} defenderTypes
 * @param {number} [attackerStage]
 * @param {number} [defenderStage]
 * @returns {number}
 */
export function estimateMoveDamage(attackerLevel, attack, defense, move, attackerTypes, defenderTypes, attackerStage = 0, defenderStage = 0) {
  if (move.power === 0) return 0
  const effectiveAttack = Math.floor(attack * statStageMultiplier(attackerStage)),
    effectiveDefense = Math.max(1, Math.floor(defense * statStageMultiplier(defenderStage))),
    baseDamage = Math.floor((Math.floor((2 * attackerLevel) / 5 + 2) * move.power * effectiveAttack) / effectiveDefense / 50 + 2),
    stabMultiplier = attackerTypes.includes(move.type) ? 1.5 : 1,
    effectiveness = getTypeMultiplier(move.type, defenderTypes)
  return Math.floor(baseDamage * stabMultiplier * effectiveness * 0.925)
}
