// Split from src/game/logic.js — see tools/decompile/split-logic.mjs

import { typechart } from '../data/moves.js'
import { moveData } from '../data/gameData.js'

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
  }
}

/** Major status conditions that persist until cured and tick each turn. */
const MAJOR_STATUSES = new Set(['poison', 'burn', 'freeze', 'sleep'])

/** Types that can't be afflicted by a given status. */
/** @type {Record<string, string[]>} */
const STATUS_IMMUNE_TYPES = {
  burn: ['Fire'],
  freeze: ['Ice'],
  poison: ['Poison', 'Steel'],
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
  if ((STATUS_IMMUNE_TYPES[status] ?? []).some((type) => target.types.includes(type))) return
  target.status = status
  target.statusTurns = status === 'sleep' ? 1 + Math.floor(Math.random() * 3) : 0
  events.push({
    type: 'status',
    message: `${target.name} was ${
      { poison: 'poisoned', burn: 'burned', freeze: 'frozen', sleep: 'put to sleep' }[status]
    }!`,
    data: {
      target: side,
    },
  })
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
 * @param {number} attackerLevel
 * @param {number} attack
 * @param {number} defense
 * @param {Move} move
 * @param {string[]} attackerTypes
 * @param {string[]} defenderTypes
 * @param {number} [attackerStage]
 * @param {number} [defenderStage]
 * @returns {{ damage: number, isCrit: boolean, effectiveness: number, effectivenessLabel: string | null }}
 */
export function calculateDamage(attackerLevel, attack, defense, move, attackerTypes, defenderTypes, attackerStage = 0, defenderStage = 0) {
  if (move.power === 0)
    return {
      damage: 0,
      isCrit: !1,
      effectiveness: 1,
      effectivenessLabel: null,
    }
  if (Math.random() * 100 >= move.accuracy)
    return {
      damage: 0,
      isCrit: !1,
      effectiveness: 1,
      effectivenessLabel: 'miss',
    }
  const effectiveAttack = Math.floor(attack * statStageMultiplier(attackerStage)),
    effectiveDefense = Math.max(1, Math.floor(defense * statStageMultiplier(defenderStage))),
    baseDamage = Math.floor((Math.floor((2 * attackerLevel) / 5 + 2) * move.power * effectiveAttack) / effectiveDefense / 50 + 2),
    isCrit = Math.random() < 1 / 16,
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
 * @param {BattlePokemon} player
 * @param {BattlePokemon} enemy
 * @param {boolean} [isTrainerBattle]
 * @returns {any[]}
 */
export function resolveBattleTurn(player, enemy, isTrainerBattle = !1) {
  const events = []
  ;(player.statStages || (player.statStages = {}), enemy.statStages || (enemy.statStages = {}))
  // Flinches only last the turn they were inflicted; clear any left over.
  ;(player.flinch = !1, enemy.flinch = !1)
  const playerMustRecharge = player.mustRecharge,
    enemyMustRecharge = enemy.mustRecharge
  ;(playerMustRecharge && (player.mustRecharge = !1), enemyMustRecharge && (enemy.mustRecharge = !1))
  let playerMoveId, playerMove
  if (playerMustRecharge) ((playerMoveId = player.moves[0]), (playerMove = moveData[playerMoveId]))
  else if (player.lockedMove) ((playerMoveId = player.lockedMove), (playerMove = moveData[playerMoveId]))
  else {
    const bestMove = chooseBestMove(
      player.moves,
      player.level,
      player.attack,
      player.spAttack,
      player.types,
      enemy.types,
      enemy.defense,
      enemy.spDefense,
      player.statStages,
      enemy.statStages
    )
    ;((playerMoveId = bestMove.moveId), (playerMove = bestMove.move))
  }
  let enemyMoveId, enemyMove
  if (enemyMustRecharge) ((enemyMoveId = enemy.moves[0]), (enemyMove = moveData[enemyMoveId]))
  else if (enemy.lockedMove) ((enemyMoveId = enemy.lockedMove), (enemyMove = moveData[enemyMoveId]))
  else {
    const bestMove = isTrainerBattle
      ? chooseBestMove(
          enemy.moves,
          enemy.level,
          enemy.attack,
          enemy.spAttack,
          enemy.types,
          player.types,
          player.defense,
          player.spDefense,
          enemy.statStages,
          player.statStages
        )
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
      : player.speed >= enemy.speed
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
    const moveDef = moveData[attack.moveId]
    if (!moveDef) continue
    if (
      (attack.attacker.lockedMove &&
        attack.attacker.lockTurnsRemaining !== void 0 &&
        attack.attacker.lockTurnsRemaining > 0 &&
        attack.attacker.lockTurnsRemaining--,
      events.push({
        type: 'attack',
        message: `${attack.attacker.name} used ${moveDef.name}!`,
        data: {
          target: attack.isPlayer ? 'enemy' : 'player',
        },
      }),
      moveDef.power === 0)
    ) {
      if (moveDef.effect?.type === 'statChange') {
        const statTarget = moveDef.effect.target === 'self' ? attack.attacker : attack.defender,
          side = statTarget === player ? 'player' : 'enemy'
        statTarget.statStages || (statTarget.statStages = {})
        for (const [statKey, delta] of Object.entries(moveDef.effect.changes)) {
          const key = statKey,
            currentStage = statTarget.statStages[key] ?? 0,
            newStage = clampStatStage(currentStage + delta)
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
      continue
    }
    const attackStat =
        moveDef.category === 'physical'
          ? attack.attacker.status === 'burn'
            ? Math.max(1, Math.floor(attack.attacker.attack / 2))
            : attack.attacker.attack
          : attack.attacker.spAttack,
      defenseStat = moveDef.category === 'physical' ? attack.defender.defense : attack.defender.spDefense,
      attackStatKey = moveDef.category === 'physical' ? 'attack' : 'spAttack',
      defenseStatKey = moveDef.category === 'physical' ? 'defense' : 'spDefense',
      attackerStage = getStatStage(attack.attacker, attackStatKey),
      defenderStage = getStatStage(attack.defender, defenseStatKey),
      damageResult = calculateDamage(
        attack.attacker.level,
        attackStat,
        defenseStat,
        moveDef,
        attack.attacker.types,
        attack.defender.types,
        attackerStage,
        defenderStage
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
    if (
      ((attack.defender.currentHp = Math.max(0, attack.defender.currentHp - damageResult.damage)),
      events.push({
        type: 'damage',
        message: `${attack.defender.name} took ${damageResult.damage} damage!`,
        data: {
          target: attack.isPlayer ? 'enemy' : 'player',
          damage: damageResult.damage,
          hpAfter: attack.defender.currentHp,
          hpMax: attack.defender.maxHp,
        },
      }),
      damageResult.isCrit &&
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
          const recoilDamage = Math.max(1, Math.floor(damageResult.damage * moveDef.effect.fraction))
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
              Math.floor((damageResult.damage * (moveDef.effect.percentage ?? 50)) / 100)
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
  // End-of-turn residual damage from poison / burn.
  /** @type {[BattlePokemon, boolean][]} */
  const residualTargets = [
    [player, !0],
    [enemy, !1],
  ]
  for (const [pokemon, isPlayerSide] of residualTargets) {
    if (pokemon.currentHp <= 0) continue
    const divisor = pokemon.status === 'poison' ? 8 : pokemon.status === 'burn' ? 16 : 0
    if (!divisor) continue
    const residual = Math.max(1, Math.floor(pokemon.maxHp / divisor))
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
  }
}
