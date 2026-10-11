// Move-choice AI: pick the best damaging/setup/status move. Split from game/combat.js.

import { moveData } from '../../data/gameData.js'
import { estimateMoveDamage, getTypeMultiplier, normalizeStatKey } from './damage.js'
import { STATUS_IMMUNE_TYPES } from './status.js'

/**
 * Moves this battler has already seen fail against the current foe's ability
 * (absorbed, blocked, or refused by Wonder Guard), keyed by the foe's species.
 * The AI only learns these after the move actually does nothing — it is never
 * told the ability up front.
 * @param {BattlePokemon} attacker
 * @param {BattlePokemon} defender
 * @returns {string[]}
 */
function observedNullifiedMoves(attacker, defender) {
  return attacker.nullifiedMoves?.[defender.speciesKey ?? defender.name] ?? []
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
 * @param {boolean} [inverse] Inverse-battle type chart (the Battle Arena).
 * @returns {{ moveId: string, move: Move }}
 */
export function chooseBestMove(moves, attackerLevel, attack, spAttack, attackerTypes, defenderTypes, defenderDefense, defenderSpDefense, attackerStages, defenderStages, inverse = !1) {
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
    let damage = estimateMoveDamage(attackerLevel, effectiveAttack, effectiveDefense, moveDef, attackerTypes, defenderTypes, attackStage, defenseStage, inverse)
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
 * AI skill tiers, from weakest to strongest.
 * - `dumb`: throws out a random damaging move (wild Pokemon, route trainers).
 * - `smart`: heals when low and otherwise plays loose — a coin flip on setting
 *   up or landing a status, then the best hit it can find (legendary wilds,
 *   gym leaders).
 * - `smartest`: never plays the lottery; always takes the best action the
 *   heuristic can find (Elite Four, Champion, Battle Tower, the player).
 */
export const AI_SKILL = { dumb: 'dumb', smart: 'smart', smartest: 'smartest' }

/**
 * Pick a move for a battler: heal when low, set up early, otherwise deal the
 * most damage. Powers both the auto-battler and the trainer AI. A `dumb`
 * battler just throws out a random attacking move.
 * @param {BattlePokemon} attacker
 * @param {BattlePokemon} defender
 * @param {{ player: any, enemy: any } | null} [hazards]
 * @param {string} [skill] One of {@link AI_SKILL}.
 * @param {boolean} [inverse] Inverse-battle type chart (the Battle Arena).
 * @returns {{ moveId: string, move: Move }}
 */
export function chooseMoveForBattle(attacker, defender, hazards, skill = AI_SKILL.smart, inverse = !1) {
  if (skill === AI_SKILL.dumb) return chooseRandomMove(attacker.moves)
  const deterministic = skill === AI_SKILL.smartest,
    usableMoves = attacker.moves.filter((moveId) => moveData[moveId]),
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
        !observedNullifiedMoves(attacker, defender).includes(moveId) &&
        !(STATUS_IMMUNE_TYPES[effect.status] ?? []).some((type) => defender.types.includes(type))
      )
    })
    if (statusMove) return { moveId: statusMove, move: moveData[statusMove] }
  }
  // Drop moves this battler has already seen do nothing to this foe, so after
  // the first one fails it switches to the next best attack instead of
  // repeating a dead move. The memory is only ever written by a real failure.
  const nullified = observedNullifiedMoves(attacker, defender),
    counterableMoves = usableMoves.filter(
      (moveId) => moveData[moveId].power > 0 && !nullified.includes(moveId)
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
    defender.statStages,
    inverse
  )
}

/** A switch only happens when the active Pokemon is losing and a teammate is clearly better. */
const SWITCH_MARGIN = 40

/**
 * Training mode pulls the Pokemon it is levelling out once its HP drops below
 * this fraction, so a bad turn can't faint it and waste the training.
 */
const TRAINING_DANGER_HP = 1 / 3

/**
 * The best power-weighted attack `attacker` can land on `defender`, by type
 * matchup. Status moves count as 0.
 * @param {BattlePokemon} attacker
 * @param {BattlePokemon} defender
 * @param {boolean} [inverse] Inverse-battle type chart (the Battle Arena).
 * @returns {number}
 */
function bestOffence(attacker, defender, inverse = !1) {
  let best = 0
  for (const moveId of attacker.moves ?? []) {
    const move = moveData[moveId]
    if (!move || move.power <= 0) continue
    best = Math.max(best, move.power * getTypeMultiplier(move.type, defender.types, inverse))
  }
  return best
}

/**
 * How well `pokemon` lines up against `foe`: its best attack matchup minus the
 * foe's best one into it. Negative means it is losing the type war.
 * @param {BattlePokemon} pokemon
 * @param {BattlePokemon} foe
 * @param {boolean} [inverse] Inverse-battle type chart (the Battle Arena).
 * @returns {number}
 */
export function matchupScore(pokemon, foe, inverse = !1) {
  return bestOffence(pokemon, foe, inverse) - bestOffence(foe, pokemon, inverse)
}

/**
 * The party index worth switching to when the active Pokemon is losing the type
 * matchup and a teammate lines up much better, else -1. Shared by the Champion
 * and the player's auto-battler.
 * @param {BattlePokemon} active
 * @param {BattlePokemon[]} party
 * @param {BattlePokemon} foe
 * @param {number} activeIndex
 * @param {boolean} [inverse] Inverse-battle type chart (the Battle Arena).
 * @returns {number}
 */
export function chooseBestSwitch(active, party, foe, activeIndex, inverse = !1) {
  const activeScore = matchupScore(active, foe, inverse)
  if (activeScore >= 0) return -1
  let bestIndex = -1,
    bestScore = activeScore + SWITCH_MARGIN
  ;(party ?? []).forEach((member, index) => {
    if (index === activeIndex || !member || member.currentHp <= 0) return
    const score = matchupScore(member, foe, inverse)
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })
  return bestIndex
}

/**
 * Training mode's switch: unlike {@link chooseBestSwitch}, the active Pokemon
 * is only pulled out when it is actually in danger (low HP), never just for a
 * better type matchup - the point is to let it keep fighting and earning
 * EXP. It hands the field to the healthiest battle-ready teammate that is
 * itself out of danger, and returns -1 to stay in when the active Pokemon is
 * safe (or nobody is in better shape).
 * @param {BattlePokemon} active
 * @param {BattlePokemon[]} party
 * @param {number} activeIndex
 * @returns {number}
 */
export function chooseTrainingSwitch(active, party, activeIndex) {
  const activeHp = active.maxHp > 0 ? active.currentHp / active.maxHp : 1
  if (activeHp > TRAINING_DANGER_HP) return -1
  let bestIndex = -1,
    bestHp = TRAINING_DANGER_HP
  ;(party ?? []).forEach((member, index) => {
    if (index === activeIndex || !member || member.currentHp <= 0) return
    const hp = member.maxHp > 0 ? member.currentHp / member.maxHp : 0
    if (hp > bestHp) {
      bestHp = hp
      bestIndex = index
    }
  })
  return bestIndex
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
