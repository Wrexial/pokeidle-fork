// Move-choice AI: pick the best damaging/setup/status move. Split from game/combat.js.

import { moveData } from '../../data/gameData.js'
import { abilityAbsorbsType, abilityBlocksMove, abilityBlocksNonSuperEffective, abilityPreventsStatus } from '../abilities.js'
import { estimateMoveDamage, getTypeMultiplier, normalizeStatKey } from './damage.js'
import { STATUS_IMMUNE_TYPES } from './status.js'

/**
 * Whether the target's ability makes a damaging move do nothing: it absorbs
 * the type, blocks the move, or (Wonder Guard) refuses a non-super-effective
 * hit. An attacker with Mold Breaker / Teravolt / Turboblaze bypasses these,
 * which the helpers already account for.
 * @param {BattlePokemon} attacker
 * @param {BattlePokemon} defender
 * @param {Move} moveDef
 * @returns {boolean}
 */
function moveNullifiedByAbility(attacker, defender, moveDef) {
  if (!attacker || !defender || !moveDef || moveDef.power <= 0) return false
  if (abilityAbsorbsType(defender, moveDef.type, attacker)) return true
  if (abilityBlocksMove(defender, moveDef, attacker)) return true
  return abilityBlocksNonSuperEffective(
    defender,
    getTypeMultiplier(moveDef.type, defender.types),
    attacker
  )
}

/**
 * @param {string[]} moves
 * @param {number} attackerLevel
 * @param {number} attack
 * @param {number} spAttack
 * @param {string[]} attackerTypes
 * @param {string[]} defenderTypes
 * @param {number} defenderDefense
 * @param {number} defenderSpDefense
 * @param {Record<string, number>} [attackerStages]
 * @param {Record<string, number>} [defenderStages]
 * @returns {{ moveId: string, move: Move }}
 */
export function chooseBestMove(moves, attackerLevel, attack, spAttack, attackerTypes, defenderTypes, defenderDefense, defenderSpDefense, attackerStages, defenderStages) {
  let bestMoveId = moves[0],
    bestDamage = -1
  for (const moveId of moves) {
    const moveDef = moveData[moveId]
    if (!moveDef || moveDef.power === 0) continue
    const effectiveAttack = moveDef.category === 'physical' ? attack : spAttack,
      effectiveDefense = moveDef.category === 'physical' ? defenderDefense : defenderSpDefense,
      attackStatKey = moveDef.category === 'physical' ? 'attack' : 'spAttack',
      defenseStatKey = moveDef.category === 'physical' ? 'defense' : 'spDefense',
      attackStage = attackerStages?.[attackStatKey] ?? 0,
      defenseStage = defenderStages?.[defenseStatKey] ?? 0
    let damage = estimateMoveDamage(attackerLevel, effectiveAttack, effectiveDefense, moveDef, attackerTypes, defenderTypes, attackStage, defenseStage)
    if (moveDef.effect)
      switch (moveDef.effect.type) {
        case 'recoil':
          damage *= 1 - moveDef.effect.fraction
          break
        case 'recharge':
          damage *= 0.5
          break
        case 'selfDestruct':
          damage *= 0.15
          break
        case 'multiTurnLock':
          damage *= 0.75
          break
        case 'crashOnMiss':
          damage *= moveDef.accuracy / 100
          break
      }
    damage > bestDamage && ((bestDamage = damage), (bestMoveId = moveId))
  }
  return {
    moveId: bestMoveId,
    move: moveData[bestMoveId],
  }
}

/**
 * Pick a move for a battler that isn't a wild random picker: heal when low,
 * set up early, otherwise deal the most damage. Powers both the auto-battler
 * and the trainer AI.
 * @param {BattlePokemon} attacker
 * @param {BattlePokemon} defender
 * @param {{ player: any, enemy: any } | null} [hazards]
 * @param {boolean} [deterministic] Drop the random setup/status gates (Battle Tower).
 * @returns {{ moveId: string, move: Move }}
 */
export function chooseMoveForBattle(attacker, defender, hazards, deterministic = !1) {
  const usableMoves = attacker.moves.filter((moveId) => moveData[moveId]),
    hpFraction = attacker.maxHp > 0 ? attacker.currentHp / attacker.maxHp : 1,
    healMove = usableMoves.find((moveId) => moveData[moveId].effect?.type === 'heal')
  if (hpFraction < 0.45 && healMove) return { moveId: healMove, move: moveData[healMove] }
  if (deterministic ? hpFraction > 0.5 : hpFraction > 0.6 && Math.random() < 0.5) {
    const setupMove = usableMoves.find((moveId) => {
      const move = moveData[moveId]
      if (move.screen) {
        const screens = attacker.screens ?? {}
        return move.screen === 'both'
          ? !(screens.reflect > 0) && !(screens.lightScreen > 0)
          : !(screens[move.screen] > 0)
      }
      if (move.effect?.type === 'hazard' && hazards) {
        const side = attacker.isPlayer ? hazards.enemy : hazards.player,
          hazard = move.effect.hazard
        return hazard === 'spikes'
          ? (side?.spikes ?? 0) < 3
          : hazard === 'toxicSpikes'
            ? (side?.toxicSpikes ?? 0) < 2
            : !side?.[hazard]
      }
      const effect = move.effect
      if (effect?.type !== 'statChange' || effect.target !== 'self') return false
      const stages = attacker.statStages ?? {}
      // Only set up while the relevant stats are still unboosted, so the AI
      // doesn't spam Swords Dance instead of attacking.
      return Object.entries(effect.changes).some(([statKey, delta]) => {
        const key = normalizeStatKey(statKey)
        return delta > 0 && (stages[key] ?? 0) <= 0
      })
    })
    if (setupMove) return { moveId: setupMove, move: moveData[setupMove] }
  }
  // Occasionally open with a status move the target isn't already suffering
  // from (paralysis, poison, sleep, confusion).
  if (!deterministic && hpFraction > 0.5 && Math.random() < 0.25) {
    const statusMove = usableMoves.find((moveId) => {
      const effect = moveData[moveId].effect
      if (effect?.type === 'confusion') return (defender.confusionTurns ?? 0) === 0
      if (effect?.type !== 'status' || effect.status === 'flinching') return false
      return (
        !defender.status &&
        !moveNullifiedByAbility(attacker, defender, moveData[moveId]) &&
        !abilityPreventsStatus(defender, effect.status) &&
        !(STATUS_IMMUNE_TYPES[effect.status] ?? []).some((type) => defender.types.includes(type))
      )
    })
    if (statusMove) return { moveId: statusMove, move: moveData[statusMove] }
  }
  // A target's ability can nullify a damaging move outright. When the AI has
  // anything else to use, drop the dead moves so it picks the next best one
  // instead of repeating an attack that cannot land.
  const counterableMoves = usableMoves.filter(
      (moveId) =>
        moveData[moveId].power > 0 && !moveNullifiedByAbility(attacker, defender, moveData[moveId])
    ),
    attackingMoves = counterableMoves.length > 0 ? counterableMoves : usableMoves
  return chooseBestMove(
    attackingMoves,
    attacker.level,
    attacker.attack,
    attacker.spAttack,
    attacker.types,
    defender.types,
    defender.defense,
    defender.spDefense,
    attacker.statStages,
    defender.statStages
  )
}

/**
 * @param {string[]} moves
 * @returns {{ moveId: string, move: Move }}
 */
export function chooseRandomMove(moves) {
  const damagingMoves = moves.filter((moveId) => {
      const moveDef = moveData[moveId]
      return moveDef && moveDef.power > 0
    }),
    pool = damagingMoves.length > 0 ? damagingMoves : moves,
    picked = pool[Math.floor(Math.random() * pool.length)]
  return {
    moveId: picked,
    move: moveData[picked],
  }
}
