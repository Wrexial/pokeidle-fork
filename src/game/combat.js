// Split from src/game/logic.js — see tools/decompile/split-logic.mjs

import { typechart } from '../data/moves.js'
import { roamerFleeChance } from '../data/config.js'
import { moveData } from '../data/gameData.js'
import { abilityAbsorbsType, abilityAttackMultiplier, abilityBlocksNonSuperEffective, abilityDamageDealtMultiplier, abilityDamageTakenMultiplier, abilityHalvesSuperEffective, abilityHealsFromType, abilityIgnoresIndirectDamage, abilityOf, abilityPreventsStatDrop, abilityPreventsStatus, abilitySurvivesAtFullHp } from './abilities.js'

/** @returns {VolatileState} */
export function createVolatileState() {
  return {
    statStages: {
      attack: 0,
      defense: 0,
      spAttack: 0,
      spDefense: 0,
      speed: 0,
    },
    mustRecharge: !1,
    lockedMove: null,
    lockTurnsRemaining: 0,
    status: null,
    statusTurns: 0,
    flinch: !1,
    confusionTurns: 0,
    leechSeeded: !1,
    screens: { reflect: 0, lightScreen: 0 },
  }
}

/** Major status conditions that persist until cured and tick each turn. */
const MAJOR_STATUSES = new Set(['poison', 'toxic', 'burn', 'freeze', 'sleep', 'paralysis'])

/** Types that can't be afflicted by a given status. */
/** @type {Record<string, string[]>} */
const STATUS_IMMUNE_TYPES = {
  burn: ['Fire'],
  freeze: ['Ice'],
  poison: ['Poison', 'Steel'],
  toxic: ['Poison', 'Steel'],
  paralysis: ['Electric'],
}

/**
 * Inflict a status condition on a Pokemon. Fails if the target already has a
 * major status or is immune to this one; `flinching` just sets the one-turn
 * flinch flag.
 * @param {BattlePokemon} target
 * @param {string} status
 * @param {any[]} events
 * @param {boolean} targetIsPlayer whether `target` is the player's Pokemon
 */
function applyStatus(target, status, events, targetIsPlayer) {
  if (!target || target.currentHp <= 0) return
  const side = targetIsPlayer ? 'player' : 'enemy'
  if (status === 'flinching') {
    target.flinch = !0
    return
  }
  if (!MAJOR_STATUSES.has(status) || target.status) return
  if (abilityPreventsStatus(target, status)) return
  if ((STATUS_IMMUNE_TYPES[status] ?? []).some((type) => target.types.includes(type))) return
  target.status = status
  target.statusTurns =
    status === 'sleep'
      ? 1 + Math.floor(Math.random() * 3)
      : status === 'toxic'
        ? 1
        : 0
  events.push({
    type: 'status',
    message: `${target.name} was ${
      {
        poison: 'poisoned',
        toxic: 'badly poisoned',
        burn: 'burned',
        freeze: 'frozen',
        sleep: 'put to sleep',
        paralysis: 'paralyzed',
      }[status]
    }!`,
    data: {
      target: side,
    },
  })
}

/**
 * Plant a Leech Seed on a target; it drains 1/8 max HP into the other side
 * each turn. Grass types are immune, and it doesn't stack.
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} targetIsPlayer
 */
function applyLeechSeed(target, events, targetIsPlayer) {
  if (!target || target.currentHp <= 0 || target.leechSeeded) return
  if (target.types.includes('Grass')) return
  target.leechSeeded = !0
  events.push({
    type: 'status',
    message: `${target.name} was seeded!`,
    data: {
      target: targetIsPlayer ? 'player' : 'enemy',
    },
  })
}

/**
 * Confuse a Pokemon for 2-5 turns. Confusion is volatile, so it doesn't use
 * the major-status slot; an already-confused target is left alone.
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} targetIsPlayer
 */
function applyConfusion(target, events, targetIsPlayer) {
  if (!target || target.currentHp <= 0 || (target.confusionTurns ?? 0) > 0) return
  target.confusionTurns = 2 + Math.floor(Math.random() * 4)
  events.push({
    type: 'status',
    message: `${target.name} became confused!`,
    data: {
      target: targetIsPlayer ? 'player' : 'enemy',
    },
  })
}

/**
 * A confused attacker may hurt itself instead of using its move. Returns true
 * when the turn is skipped (and pushes the event), and clears confusion when
 * it wears off.
 * @param {BattlePokemon} attacker
 * @param {any[]} events
 * @param {boolean} isPlayer
 * @returns {boolean}
 */
function handleConfusion(attacker, events, isPlayer) {
  if ((attacker.confusionTurns ?? 0) <= 0) return !1
  const side = isPlayer ? 'player' : 'enemy'
  attacker.confusionTurns = (attacker.confusionTurns ?? 0) - 1
  if (attacker.confusionTurns <= 0) {
    attacker.confusionTurns = 0
    events.push({
      type: 'status',
      message: `${attacker.name} snapped out of its confusion!`,
      data: {
        target: side,
      },
    })
    return !1
  }
  if (Math.random() < 0.33) {
    const selfDamage = Math.max(1, Math.floor(attacker.maxHp / 8))
    attacker.currentHp = Math.max(0, attacker.currentHp - selfDamage)
    events.push({
      type: 'recoil',
      message: `${attacker.name} is confused and hurt itself! (${selfDamage} damage)`,
      data: {
        target: side,
        damage: selfDamage,
        hpAfter: attacker.currentHp,
        hpMax: attacker.maxHp,
      },
    })
    attacker.currentHp <= 0 &&
      events.push({
        type: 'faint',
        message: `${attacker.name} fainted!`,
        data: {
          target: side,
        },
      })
    return !0
  }
  return !1
}

/**
 * A status condition that stops a Pokemon acting this turn. Returns true when
 * the attacker's turn is skipped (pushin an explanatory event).
 * @param {BattlePokemon} attacker
 * @param {any[]} events
 * @param {boolean} isPlayer
 * @returns {boolean}
 */
function statusPreventsAction(attacker, events, isPlayer) {
  const side = isPlayer ? 'player' : 'enemy'
  if (attacker.status === 'sleep') {
    if ((attacker.statusTurns ?? 0) > 0) {
      attacker.statusTurns = (attacker.statusTurns ?? 0) - 1
      events.push({
        type: 'status',
        message: `${attacker.name} is fast asleep.`,
        data: {
          target: side,
        },
      })
      return !0
    }
    attacker.status = null
    events.push({
      type: 'status',
      message: `${attacker.name} woke up!`,
      data: {
        target: side,
      },
    })
  } else if (attacker.status === 'freeze') {
    if (Math.random() >= 0.2) {
      events.push({
        type: 'status',
        message: `${attacker.name} is frozen solid!`,
        data: {
          target: side,
        },
      })
      return !0
    }
    attacker.status = null
    events.push({
      type: 'status',
      message: `${attacker.name} thawed out!`,
      data: {
        target: side,
      },
    })
  } else if (attacker.status === 'paralysis' && Math.random() < 0.25) {
    events.push({
      type: 'status',
      message: `${attacker.name} is paralyzed! It can't move!`,
      data: {
        target: side,
      },
    })
    return !0
  }
  if (attacker.flinch) {
    attacker.flinch = !1
    events.push({
      type: 'status',
      message: `${attacker.name} flinched and couldn't move!`,
      data: {
        target: side,
      },
    })
    return !0
  }
  return !1
}

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
 * Critical-hit chance by crit stage: 0 = 1/16, +1 = 1/8, +2 = 1/2, +3 = always.
 */
const CRIT_CHANCES = [1 / 16, 1 / 8, 1 / 2, 1]

/**
 * The game's stat keys are camelCase (`spAttack`); extracted move data sometimes
 * uses Showdown's hyphenated names. Normalise before applying a stat change.
 * @param {string} statKey
 * @returns {string}
 */
function normalizeStatKey(statKey) {
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
function isSelfTargetedMove(moveDef) {
  return moveDef.effect?.target === 'self' || moveDef.effect?.type === 'heal' || !!moveDef.protect
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
 * @returns {{ damage: number, isCrit: boolean, effectiveness: number, effectivenessLabel: string | null }}
 */
export function calculateDamage(attackerLevel, attack, defense, move, attackerTypes, defenderTypes, attackerStage = 0, defenderStage = 0, critStage = 0, skipAccuracy = !1, accuracyStage = 0, evasionStage = 0) {
  if (move.power === 0)
    return {
      damage: 0,
      isCrit: !1,
      effectiveness: 1,
      effectivenessLabel: null,
    }
  const effectiveAccuracy =
    move.accuracy * statStageMultiplier(accuracyStage - evasionStage)
  if (!skipAccuracy && Math.random() * 100 >= effectiveAccuracy)
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
    isCrit = Math.random() < critChance,
    critMultiplier = isCrit ? 2 : 1,
    stabMultiplier = attackerTypes.includes(move.type) ? 1.5 : 1,
    effectiveness = getTypeMultiplier(move.type, defenderTypes),
    randomFactor = (Math.floor(Math.random() * 16) + 85) / 100,
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
 * @returns {{ moveId: string, move: Move }}
 */
export function chooseMoveForBattle(attacker, defender) {
  const usableMoves = attacker.moves.filter((moveId) => moveData[moveId]),
    hpFraction = attacker.maxHp > 0 ? attacker.currentHp / attacker.maxHp : 1,
    healMove = usableMoves.find((moveId) => moveData[moveId].effect?.type === 'heal')
  if (hpFraction < 0.45 && healMove) return { moveId: healMove, move: moveData[healMove] }
  if (hpFraction > 0.6 && Math.random() < 0.5) {
    const setupMove = usableMoves.find((moveId) => {
      const move = moveData[moveId]
      if (move.screen) {
        const screens = attacker.screens ?? {}
        return move.screen === 'both'
          ? !(screens.reflect > 0) && !(screens.lightScreen > 0)
          : !(screens[move.screen] > 0)
      }
      const effect = move.effect
      if (effect?.type !== 'statChange' || effect.target !== 'self') return false
      const stages = attacker.statStages ?? {}
      return Object.entries(effect.changes).some(([statKey, delta]) => {
        const key = normalizeStatKey(statKey)
        return delta > 0 && (stages[key] ?? 0) < 6
      })
    })
    if (setupMove) return { moveId: setupMove, move: moveData[setupMove] }
  }
  // Occasionally open with a status move the target isn't already suffering
  // from (paralysis, poison, sleep, confusion).
  if (hpFraction > 0.5 && Math.random() < 0.25) {
    const statusMove = usableMoves.find((moveId) => {
      const effect = moveData[moveId].effect
      if (effect?.type === 'confusion') return (defender.confusionTurns ?? 0) === 0
      if (effect?.type !== 'status' || effect.status === 'flinching') return false
      return (
        !defender.status &&
        !(STATUS_IMMUNE_TYPES[effect.status] ?? []).some((type) => defender.types.includes(type))
      )
    })
    if (statusMove) return { moveId: statusMove, move: moveData[statusMove] }
  }
  return chooseBestMove(
    attacker.moves,
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

/**
 * @param {{ statStages?: Record<string, number> }} volatile
 * @param {string} statKey
 * @returns {number}
 */
export function getStatStage(volatile, statKey) {
  return volatile.statStages?.[statKey] ?? 0
}

/**
 * @param {number} stage
 * @returns {number}
 */
export function clampStatStage(stage) {
  return Math.max(-6, Math.min(6, stage))
}

/**
 * Whether a screen halves this move's damage. Reflect stops physical hits,
 * Light Screen special ones; critical hits ignore both.
 * @param {BattlePokemon} defender
 * @param {Move} moveDef
 * @returns {boolean}
 */
function screenApplies(defender, moveDef) {
  const screens = defender.screens
  if (!screens) return !1
  return moveDef.category === 'physical'
    ? (screens.reflect ?? 0) > 0
    : moveDef.category === 'special'
      ? (screens.lightScreen ?? 0) > 0
      : !1
}

/**
 * Speed used for turn order: paralysis halves it.
 * @param {BattlePokemon} pokemon
 * @returns {number}
 */
function effectiveSpeed(pokemon) {
  return pokemon.status === 'paralysis'
    ? Math.max(1, Math.floor(pokemon.speed / 2))
    : pokemon.speed
}

/**
 * Intimidate lowers the opposing Pokemon's Attack by one stage on entry.
 * @param {BattlePokemon} source
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} sourceIsPlayer
 */
function applyIntimidate(source, target, events, sourceIsPlayer) {
  if (abilityOf(source) !== 'intimidate' || target.currentHp <= 0) return
  if (abilityPreventsStatDrop(target, 'attack')) return
  const stages = target.statStages ?? (target.statStages = {}),
    currentStage = stages.attack ?? 0,
    newStage = clampStatStage(currentStage - 1)
  if (newStage === currentStage) return
  stages.attack = newStage
  events.push({
    type: 'statChange',
    message: `${target.name}'s Attack fell!`,
    data: {
      target: sourceIsPlayer ? 'enemy' : 'player',
    },
  })
}

/**
 * @param {BattlePokemon} player
 * @param {BattlePokemon} enemy
 * @param {boolean} [isTrainerBattle]
 * @param {boolean} [firstTurn]
 * @returns {any[]}
 */
export function resolveBattleTurn(player, enemy, isTrainerBattle = !1, firstTurn = !1) {
  const events = /** @type {any[]} */ ([])
  ;(player.statStages || (player.statStages = {}), enemy.statStages || (enemy.statStages = {}))
  // Intimidate fires the first time each side is on the field.
  if (firstTurn) {
    applyIntimidate(player, enemy, events, !0)
    applyIntimidate(enemy, player, events, !1)
  }
  // Flinches only last the turn they were inflicted; clear any left over.
  ;(player.flinch = !1, enemy.flinch = !1)
  // Protect only lasts the turn it is used; clear any left over.
  ;(player.protecting = !1, enemy.protecting = !1)
  const playerMustRecharge = player.mustRecharge,
    enemyMustRecharge = enemy.mustRecharge
  ;(playerMustRecharge && (player.mustRecharge = !1), enemyMustRecharge && (enemy.mustRecharge = !1))
  let playerMoveId, playerMove
  if (playerMustRecharge) ((playerMoveId = player.moves[0]), (playerMove = moveData[playerMoveId]))
  else if (player.lockedMove) ((playerMoveId = player.lockedMove), (playerMove = moveData[playerMoveId]))
  else {
    const bestMove = chooseMoveForBattle(player, enemy)
    ;((playerMoveId = bestMove.moveId), (playerMove = bestMove.move))
  }
  let enemyMoveId, enemyMove
  if (enemyMustRecharge) ((enemyMoveId = enemy.moves[0]), (enemyMove = moveData[enemyMoveId]))
  else if (enemy.lockedMove) ((enemyMoveId = enemy.lockedMove), (enemyMove = moveData[enemyMoveId]))
  else {
    const bestMove = isTrainerBattle
      ? chooseMoveForBattle(enemy, player)
      : chooseRandomMove(enemy.moves)
    ;((enemyMoveId = bestMove.moveId), (enemyMove = bestMove.move))
  }
  const attackOrder = [],
    playerPriority = playerMustRecharge ? -10 : (playerMove?.priority ?? 0),
    enemyPriority = enemyMustRecharge ? -10 : (enemyMove?.priority ?? 0)
  playerPriority > enemyPriority
    ? attackOrder.push(
        {
          attacker: player,
          defender: enemy,
          moveId: playerMoveId,
          isPlayer: !0,
        },
        {
          attacker: enemy,
          defender: player,
          moveId: enemyMoveId,
          isPlayer: !1,
        }
      )
    : enemyPriority > playerPriority
      ? attackOrder.push(
          {
            attacker: enemy,
            defender: player,
            moveId: enemyMoveId,
            isPlayer: !1,
          },
          {
            attacker: player,
            defender: enemy,
            moveId: playerMoveId,
            isPlayer: !0,
          }
        )
      : effectiveSpeed(player) >= effectiveSpeed(enemy)
        ? attackOrder.push(
            {
              attacker: player,
              defender: enemy,
              moveId: playerMoveId,
              isPlayer: !0,
            },
            {
              attacker: enemy,
              defender: player,
              moveId: enemyMoveId,
              isPlayer: !1,
            }
          )
        : attackOrder.push(
            {
              attacker: enemy,
              defender: player,
              moveId: enemyMoveId,
              isPlayer: !1,
            },
            {
              attacker: player,
              defender: enemy,
              moveId: playerMoveId,
              isPlayer: !0,
            }
          )
  for (const attack of attackOrder) {
    if (attack.attacker.currentHp <= 0) continue
    if (attack.isPlayer ? playerMustRecharge : enemyMustRecharge) {
      events.push({
        type: 'recharge',
        message: `${attack.attacker.name} must recharge!`,
      })
      continue
    }
    if (statusPreventsAction(attack.attacker, events, attack.isPlayer)) continue
    if (handleConfusion(attack.attacker, events, attack.isPlayer)) continue
    const moveDef = moveData[attack.moveId]
    if (!moveDef) continue
    if (
      attack.attacker.lockedMove &&
      attack.attacker.lockTurnsRemaining !== void 0 &&
      attack.attacker.lockTurnsRemaining > 0 &&
      attack.attacker.lockTurnsRemaining--
    ) {}
    events.push({
      type: 'attack',
      message: `${attack.attacker.name} used ${moveDef.name}!`,
      data: {
        target: attack.isPlayer ? 'enemy' : 'player',
      },
    })
    // Protect blocks anything aimed at the protected Pokemon this turn.
    if (attack.defender.protecting && !isSelfTargetedMove(moveDef)) {
      events.push({
        type: 'protect',
        message: `${attack.defender.name} protected itself!`,
      })
      continue
    }
    if (moveDef.power === 0) {
      if (moveDef.protect) {
        attack.attacker.protecting = !0
        events.push({
          type: 'protect',
          message: `${attack.attacker.name} protected itself!`,
        })
      }
      if (moveDef.screen) {
        const screens = attack.attacker.screens ??
          (attack.attacker.screens = { reflect: 0, lightScreen: 0 })
        if (moveDef.screen === 'both') {
          screens.reflect = 5
          screens.lightScreen = 5
        } else screens[moveDef.screen] = 5
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name} put up a barrier!`,
          data: {
            target: attack.isPlayer ? 'player' : 'enemy',
          },
        })
      }
      if (moveDef.effect?.type === 'statChange') {
        const statTarget = moveDef.effect.target === 'self' ? attack.attacker : attack.defender,
          side = statTarget === player ? 'player' : 'enemy'
        statTarget.statStages || (statTarget.statStages = {})
        for (const [statKey, delta] of Object.entries(moveDef.effect.changes)) {
          const key = normalizeStatKey(statKey),
            currentStage = statTarget.statStages[key] ?? 0,
            newStage = clampStatStage(currentStage + delta)
          // Clear Body / Hyper Cutter / ... block opponent-inflicted drops.
          if (delta < 0 && abilityPreventsStatDrop(statTarget, key)) continue
          statTarget.statStages[key] = newStage
          const verb = delta > 0 ? 'rose' : 'fell',
            sharply = Math.abs(delta) >= 2 ? 'sharply ' : ''
          events.push({
            type: 'statChange',
            message: `${statTarget.name}'s ${getStatLabel(key)} ${sharply}${verb}!`,
            data: {
              target: side,
            },
          })
        }
      } else if (
        moveDef.effect?.type === 'status' &&
        (moveDef.effect.chance === void 0 || Math.random() * 100 < moveDef.effect.chance)
      )
        applyStatus(attack.defender, moveDef.effect.status, events, !attack.isPlayer)
      else if (moveDef.effect?.type === 'heal') {
        const healPercent = moveDef.effect.percentage ?? 50,
          healed = Math.min(
            attack.attacker.maxHp,
            attack.attacker.currentHp +
              Math.max(1, Math.floor((attack.attacker.maxHp * healPercent) / 100))
          ),
          gained = healed - attack.attacker.currentHp
        attack.attacker.currentHp = healed
        events.push({
          type: 'heal',
          message:
            gained > 0
              ? `${attack.attacker.name} recovered ${gained} HP!`
              : `${attack.attacker.name} had no HP to recover!`,
          data: {
            target: attack.isPlayer ? 'player' : 'enemy',
            hpAfter: healed,
            hpMax: attack.attacker.maxHp,
          },
        })
        moveDef.effect.status && applyStatus(attack.attacker, moveDef.effect.status, events, attack.isPlayer)
      } else if (moveDef.effect?.type === 'confusion') applyConfusion(attack.defender, events, !attack.isPlayer)
      else if (moveDef.effect?.type === 'leechSeed')
        applyLeechSeed(attack.defender, events, !attack.isPlayer)
      continue
    }
    // Levitate / type-absorbing abilities negate the move (and usually heal).
    if (abilityAbsorbsType(attack.defender, moveDef.type)) {
      if (abilityHealsFromType(attack.defender, moveDef.type)) {
        const healed = Math.min(
            attack.defender.maxHp,
            attack.defender.currentHp + Math.max(1, Math.floor(attack.defender.maxHp / 4))
          ),
          gained = healed - attack.defender.currentHp
        attack.defender.currentHp = healed
        events.push({
          type: 'heal',
          message: `${attack.defender.name} absorbed the attack!${
            gained > 0 ? ` (+${gained} HP)` : ''
          }`,
          data: {
            target: attack.isPlayer ? 'enemy' : 'player',
            hpAfter: healed,
            hpMax: attack.defender.maxHp,
          },
        })
      } else {
        events.push({
          type: 'miss',
          message: `${attack.defender.name}'s ability made it immune!`,
        })
      }
      continue
    }
    const attackStat =
        (moveDef.category === 'physical'
          ? attack.attacker.status === 'burn'
            ? Math.max(1, Math.floor(attack.attacker.attack / 2))
            : attack.attacker.attack
          : attack.attacker.spAttack) * abilityAttackMultiplier(attack.attacker),
      defenseStat = moveDef.category === 'physical' ? attack.defender.defense : attack.defender.spDefense,
      attackStatKey = moveDef.category === 'physical' ? 'attack' : 'spAttack',
      defenseStatKey = moveDef.category === 'physical' ? 'defense' : 'spDefense',
      attackerStage = getStatStage(attack.attacker, attackStatKey),
      defenderStage = getStatStage(attack.defender, defenseStatKey),
      accuracyStage = getStatStage(attack.attacker, 'accuracy'),
      evasionStage = getStatStage(attack.defender, 'evasion'),
      damageResult = calculateDamage(
        attack.attacker.level,
        attackStat,
        defenseStat,
        moveDef,
        attack.attacker.types,
        attack.defender.types,
        attackerStage,
        defenderStage,
        moveDef.critStage ?? 0,
        !1,
        accuracyStage,
        evasionStage
      )
    if (damageResult.effectivenessLabel === 'miss') {
      if (
        (events.push({
          type: 'miss',
          message: `${attack.attacker.name}'s attack missed!`,
        }),
        moveDef.effect?.type === 'crashOnMiss')
      ) {
        const crashDamage = Math.max(1, Math.floor(attack.attacker.maxHp * moveDef.effect.fraction))
        if (
          ((attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - crashDamage)),
          events.push({
            type: 'recoil',
            message: `${attack.attacker.name} kept going and crashed! (${crashDamage} damage)`,
            data: {
              target: attack.isPlayer ? 'player' : 'enemy',
              damage: crashDamage,
              hpAfter: attack.attacker.currentHp,
              hpMax: attack.attacker.maxHp,
            },
          }),
          attack.attacker.currentHp <= 0)
        ) {
          events.push({
            type: 'faint',
            message: `${attack.attacker.name} fainted!`,
            data: {
              target: attack.isPlayer ? 'player' : 'enemy',
            },
          })
          break
        }
      }
      continue
    }
    // Multi-hit moves strike 2-5 (or a fixed 2) times; accuracy is checked
    // once, then each extra hit rolls its own damage and crit.
    let hitCount = 1,
      totalDamage = damageResult.damage,
      anyCrit = damageResult.isCrit
    if (moveDef.multiHit) {
      hitCount =
        moveDef.multiHit[0] +
        Math.floor(Math.random() * (moveDef.multiHit[1] - moveDef.multiHit[0] + 1))
      for (let hit = 1; hit < hitCount; hit++) {
        const hitResult = calculateDamage(
          attack.attacker.level,
          attackStat,
          defenseStat,
          moveDef,
          attack.attacker.types,
          attack.defender.types,
          attackerStage,
          defenderStage,
          moveDef.critStage ?? 0,
          !0,
          accuracyStage,
          evasionStage
        )
        totalDamage += hitResult.damage
        anyCrit = anyCrit || hitResult.isCrit
      }
    }
    if (screenApplies(attack.defender, moveDef) && !anyCrit)
      totalDamage = Math.max(1, Math.floor(totalDamage / 2))
    // Ability damage modifiers (Thick Fat, Multiscale, pinch boosts, ...).
    totalDamage = Math.floor(
      totalDamage *
        abilityDamageDealtMultiplier(attack.attacker, moveDef) *
        abilityDamageTakenMultiplier(attack.defender, moveDef)
    )
    if (abilityHalvesSuperEffective(attack.defender) && damageResult.effectiveness > 1)
      totalDamage = Math.max(1, Math.floor(totalDamage / 2))
    if (abilityBlocksNonSuperEffective(attack.defender, damageResult.effectiveness)) {
      events.push({
        type: 'miss',
        message: `${attack.defender.name}'s Wonder Guard blocked the move!`,
      })
      continue
    }
    totalDamage = abilitySurvivesAtFullHp(attack.defender, attack.defender.currentHp, totalDamage)
    if (
      ((attack.defender.currentHp = Math.max(0, attack.defender.currentHp - totalDamage)),
      events.push({
        type: 'damage',
        message: `${attack.defender.name} took ${totalDamage} damage!${
          hitCount > 1 ? ` (${hitCount} hits)` : ''
        }`,
        data: {
          target: attack.isPlayer ? 'enemy' : 'player',
          damage: totalDamage,
          hpAfter: attack.defender.currentHp,
          hpMax: attack.defender.maxHp,
        },
      }),
      anyCrit &&
        events.push({
          type: 'critical',
          message: 'A critical hit!',
        }),
      damageResult.effectivenessLabel &&
        events.push({
          type: 'effectiveness',
          message: damageResult.effectivenessLabel,
        }),
      moveDef.effect)
    )
      switch (moveDef.effect.type) {
        case 'recoil': {
          const recoilDamage = Math.max(1, Math.floor(totalDamage * moveDef.effect.fraction))
          ;((attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - recoilDamage)),
            events.push({
              type: 'recoil',
              message: `${attack.attacker.name} was hurt by recoil! (${recoilDamage} damage)`,
              data: {
                target: attack.isPlayer ? 'player' : 'enemy',
                damage: recoilDamage,
                hpAfter: attack.attacker.currentHp,
                hpMax: attack.attacker.maxHp,
              },
            }),
            attack.attacker.currentHp <= 0 &&
              events.push({
                type: 'faint',
                message: `${attack.attacker.name} fainted!`,
                data: {
                  target: attack.isPlayer ? 'player' : 'enemy',
                },
              }))
          break
        }
        case 'recharge': {
          attack.attacker.mustRecharge = !0
          break
        }
        case 'drain': {
          const attackerHpBefore = attack.attacker.currentHp,
            healAmount = Math.max(
              1,
              Math.floor((totalDamage * (moveDef.effect.percentage ?? 50)) / 100)
            ),
            healed = Math.min(attack.attacker.maxHp, attackerHpBefore + healAmount)
          attack.attacker.currentHp = healed
          events.push({
            type: 'heal',
            message: `${attack.attacker.name} drained health! (+${healed - attackerHpBefore} HP)`,
            data: {
              target: attack.isPlayer ? 'player' : 'enemy',
              hpAfter: healed,
              hpMax: attack.attacker.maxHp,
            },
          })
          break
        }
        case 'status': {
          if (
            moveDef.effect.chance === void 0 ||
            Math.random() * 100 < moveDef.effect.chance
          )
            applyStatus(attack.defender, moveDef.effect.status, events, !attack.isPlayer)
          break
        }
        case 'selfDestruct': {
          ;((attack.attacker.currentHp = 0),
            events.push({
              type: 'faint',
              message: `${attack.attacker.name} fainted!`,
              data: {
                target: attack.isPlayer ? 'player' : 'enemy',
              },
            }))
          break
        }
        case 'multiTurnLock': {
          if (!attack.attacker.lockedMove) {
            const lockTurns =
              moveDef.effect.minTurns +
              Math.floor(
                Math.random() * (moveDef.effect.maxTurns - moveDef.effect.minTurns + 1)
              )
            ;((attack.attacker.lockedMove = attack.moveId),
              (attack.attacker.lockTurnsRemaining = lockTurns - 1))
          }
          if (
            attack.attacker.lockTurnsRemaining !== void 0 &&
            attack.attacker.lockTurnsRemaining <= 0 &&
            attack.attacker.lockedMove
          ) {
            ;((attack.attacker.lockedMove = null),
              (attack.attacker.lockTurnsRemaining = 0))
            const selfDamage = Math.max(
              1,
              Math.floor(attack.attacker.maxHp * moveDef.effect.selfDamage)
            )
            ;((attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - selfDamage)),
              events.push({
                type: 'recoil',
                message: `${attack.attacker.name} became confused and hurt itself! (${selfDamage} damage)`,
                data: {
                  target: attack.isPlayer ? 'player' : 'enemy',
                  damage: selfDamage,
                  hpAfter: attack.attacker.currentHp,
                  hpMax: attack.attacker.maxHp,
                },
              }),
              attack.attacker.currentHp <= 0 &&
                events.push({
                  type: 'faint',
                  message: `${attack.attacker.name} fainted!`,
                  data: {
                    target: attack.isPlayer ? 'player' : 'enemy',
                  },
                }))
          }
          break
        }
      }
    if (attack.defender.currentHp <= 0) {
      events.push({
        type: 'faint',
        message: `${attack.defender.name} fainted!`,
        data: {
          target: attack.isPlayer ? 'enemy' : 'player',
        },
      })
      break
    }
    if (attack.attacker.currentHp <= 0) break
  }
  // End-of-turn residual damage from poison / toxic / burn.
  /** @type {[BattlePokemon, boolean][]} */
  const residualTargets = [
    [player, !0],
    [enemy, !1],
  ]
  for (const [pokemon, isPlayerSide] of residualTargets) {
    if (pokemon.currentHp <= 0) continue
    // Magic Guard blocks poison/burn/Leach Seed residual damage.
    if (abilityIgnoresIndirectDamage(pokemon)) continue
    // Leech Seed drains into the other side independently of a major status.
    if (pokemon.leechSeeded) {
      const drain = Math.max(1, Math.floor(pokemon.maxHp / 8)),
        other = isPlayerSide ? enemy : player,
        otherBefore = other.currentHp
      pokemon.currentHp = Math.max(0, pokemon.currentHp - drain)
      other.currentHp = Math.min(other.maxHp, otherBefore + drain)
      events.push({
        type: 'damage',
        message: `${pokemon.name}'s health is sapped by Leech Seed! (${drain} damage)`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
          damage: drain,
          hpAfter: pokemon.currentHp,
          hpMax: pokemon.maxHp,
        },
      })
      events.push({
        type: 'heal',
        message: `${other.name} drained health! (+${other.currentHp - otherBefore} HP)`,
        data: {
          target: isPlayerSide ? 'enemy' : 'player',
          hpAfter: other.currentHp,
          hpMax: other.maxHp,
        },
      })
      if (pokemon.currentHp <= 0) {
        events.push({
          type: 'faint',
          message: `${pokemon.name} fainted!`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
          },
        })
        continue
      }
    }
    let residual = 0
    if (pokemon.status === 'poison') residual = Math.max(1, Math.floor(pokemon.maxHp / 8))
    else if (pokemon.status === 'burn') residual = Math.max(1, Math.floor(pokemon.maxHp / 16))
    else if (pokemon.status === 'toxic') {
      // Badly poisoned damage escalates: 1/16, 2/16, 3/16, ...
      const counter = Math.max(1, pokemon.statusTurns ?? 1)
      residual = Math.max(1, Math.floor((pokemon.maxHp * counter) / 16))
      pokemon.statusTurns = counter + 1
    } else continue
    pokemon.currentHp = Math.max(0, pokemon.currentHp - residual)
    events.push({
      type: 'damage',
      message: `${pokemon.name} was hurt by its ${pokemon.status}! (${residual} damage)`,
      data: {
        target: isPlayerSide ? 'player' : 'enemy',
        damage: residual,
        hpAfter: pokemon.currentHp,
        hpMax: pokemon.maxHp,
      },
    })
    pokemon.currentHp <= 0 &&
      events.push({
        type: 'faint',
        message: `${pokemon.name} fainted!`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
        },
      })
  }
  // End-of-turn abilities: Speed Boost raises Speed, Shed Skin may cure status.
  for (const [pokemon, isPlayerSide] of residualTargets) {
    if (pokemon.currentHp <= 0) continue
    const ability = abilityOf(pokemon)
    if (ability === 'speedBoost') {
      const stages = pokemon.statStages ?? (pokemon.statStages = {}),
        currentStage = stages.speed ?? 0,
        newStage = clampStatStage(currentStage + 1)
      if (newStage !== currentStage) {
        stages.speed = newStage
        events.push({
          type: 'statChange',
          message: `${pokemon.name}'s Speed rose!`,
          data: {
            target: isPlayerSide ? 'player' : 'enemy',
          },
        })
      }
    } else if (ability === 'shedSkin' && pokemon.status && Math.random() < 0.33) {
      pokemon.status = null
      pokemon.statusTurns = 0
      events.push({
        type: 'status',
        message: `${pokemon.name} shed its skin and recovered!`,
        data: {
          target: isPlayerSide ? 'player' : 'enemy',
        },
      })
    }
  }
  // Screens wear off after five turns.
  for (const pokemon of [player, enemy]) {
    if (!pokemon.screens) continue
    if (pokemon.screens.reflect > 0) pokemon.screens.reflect -= 1
    if (pokemon.screens.lightScreen > 0) pokemon.screens.lightScreen -= 1
  }
  // A roaming legendary may flee at the end of the turn.
  if (enemy.isRoamer && enemy.currentHp > 0 && Math.random() < roamerFleeChance)
    events.push({
      type: 'flee',
      message: `${enemy.name} fled!`,
      data: {},
    })
  return events
}

/**
 * @param {string} statKey
 * @returns {string | undefined}
 */
export function getStatLabel(statKey) {
  switch (statKey) {
    case 'attack':
      return 'Attack'
    case 'defense':
      return 'Defense'
    case 'spAttack':
      return 'Sp. Atk'
    case 'spDefense':
      return 'Sp. Def'
    case 'speed':
      return 'Speed'
    case 'accuracy':
      return 'accuracy'
    case 'evasion':
      return 'evasiveness'
  }
}
