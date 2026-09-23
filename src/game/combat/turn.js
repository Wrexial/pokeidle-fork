// Turn resolution: move selection, attack order and damage application. Split from game/combat.js.

import { moveMakesContact } from '../../data/move-effects.js'
import { moveData, moveLearnsets } from '../../data/gameData.js'
import { abilityAbsorbsType, abilityAttackMultiplier, abilityBlocksNonSuperEffective, abilityChangesMoveType, abilityDamageDealtMultiplier, abilityDamageTakenMultiplier, abilityEffectivenessMultiplier, abilityHalvesSuperEffective, abilityHealsFromType, abilityOf, abilityPreventsStatDrop, abilitySurvivesAtFullHp, fieldAuraMultiplier, onHitStatBoost, onHpThresholdBoost, ruinDefenseMultiplier, ruinOffenseMultiplier } from '../abilities.js'
import { chooseMoveForBattle, chooseRandomMove } from './ai.js'
import { calculateDamage, chance, isSelfTargetedMove, normalizeStatKey } from './damage.js'
import { applyEndOfTurn, reportFieldEffects } from './end-of-turn.js'
import { emptyBattleHazards } from '../hazards.js'
import { heldDamageMultiplier, heldLifeOrbRecoil, heldStatMultiplier, heldSurvivesAtFullHp } from '../held-items.js'
import { canEvolveFurther } from '../pokemon.js'
import { applyConfusion, applyContactAbility, applyInfatuation, applyLeechSeed, applyStatus, handleConfusion, handleInfatuation, statusPreventsAction } from './status.js'
import { TERRAIN_ABILITIES, TERRAIN_NAMES, TERRAIN_TURNS, terrainAbilityMultiplier, terrainDamageMultiplier, terrainPreventsPriority } from '../terrain.js'
import { applyEntryAbility, applyIntimidate, clampStatStage, effectiveSpeed, getStatLabel, getStatStage, resetStatStages, screenApplies } from './volatile.js'
import { WEATHER_ABILITIES, WEATHER_NAMES, WEATHER_TURNS, applyWeatherToMove, weatherDamageMultiplier } from '../weather.js'

/**
 * Moves that call another move. They are swapped out for the called move during
 * move selection, so the engine only ever sees a normal move.
 */
const CALLING_MOVES = new Set(['metronome', 'copycat', 'mirrorMove', 'naturePower'])

/** The move Nature Power becomes, by terrain. @type {Record<string, string>} */
const NATURE_POWER_BY_TERRAIN = {
  electric: 'thunderbolt',
  grassy: 'energyBall',
  misty: 'moonblast',
  psychic: 'psychic',
  none: 'triAttack',
}

/** @type {string[] | null} */
let metronomePool = null

/** Every move Metronome can call: a real learnset move, not another calling move. */
function callableMoves() {
  if (metronomePool) return metronomePool
  const keys = new Set()
  for (const moves of Object.values(moveLearnsets))
    for (const [, moveId] of moves)
      if (moveData[moveId] && !CALLING_MOVES.has(moveId)) keys.add(moveId)
  metronomePool = [...keys]
  return metronomePool
}

/**
 * Resolve a calling move into the move it actually uses this turn.
 * @param {string} moveId
 * @param {BattlePokemon} target
 * @param {{ type: string } | null} terrain
 * @returns {string}
 */
function resolveCalledMove(moveId, target, terrain) {
  if (moveId === 'metronome') {
    const pool = callableMoves()
    return pool[Math.floor(Math.random() * pool.length)] ?? moveId
  }
  if (moveId === 'copycat' || moveId === 'mirrorMove') {
    const last = target.lastMove
    return last && moveData[last] && !CALLING_MOVES.has(last) ? last : moveId
  }
  if (moveId === 'naturePower')
    return NATURE_POWER_BY_TERRAIN[terrain?.type ?? 'none'] ?? 'triAttack'
  return moveId
}

/**
 * Encore forces a move and Disable blocks one, while the stored move is still
 * in the Pokemon's moveset. Self-inflicted move locks (Outrage etc.) take
 * precedence and are handled before this.
 * @param {BattlePokemon} pokemon
 * @param {string} moveId
 * @returns {string}
 */
function applyMoveLock(pokemon, moveId) {
  if (
    (pokemon.encoreTurns ?? 0) > 0 &&
    pokemon.encoreMove &&
    pokemon.moves.includes(pokemon.encoreMove)
  )
    return pokemon.encoreMove
  if ((pokemon.disableTurns ?? 0) > 0 && moveId === pokemon.disabledMove)
    return pokemon.moves.find((id) => id !== pokemon.disabledMove) ?? moveId
  return moveId
}

/**
 * @param {BattlePokemon} player
 * @param {BattlePokemon} enemy
 * @param {boolean} [isTrainerBattle]
 * @param {boolean} [firstTurn]
 * @param {{ type: string, turns: number } | null} [weather]
 * @param {{ player: any, enemy: any } | null} [hazards]
 * @param {boolean} [deterministic] Battle Tower battles run without RNG.
 * @param {{ type: string, turns: number } | null} [terrain]
 * @returns {any[]}
 */
export function resolveBattleTurn(player, enemy, isTrainerBattle = !1, firstTurn = !1, weather = null, hazards = null, deterministic = !1, terrain = null) {
  const events = /** @type {any[]} */ ([])
  let activeWeather = weather ?? null,
    activeTerrain = terrain ?? null,
    activeHazards = hazards
      ? { player: { ...hazards.player }, enemy: { ...hazards.enemy } }
      : emptyBattleHazards()
  ;(player.statStages || (player.statStages = {}), enemy.statStages || (enemy.statStages = {}))
  // Neutralizing Gas suppresses every other Pokemon's ability for the turn.
  // Apply it temporarily so it does not persist through the volatile state.
  const gasActive =
    abilityOf(player) === 'neutralizingGas' || abilityOf(enemy) === 'neutralizingGas',
    suppressPlayer = gasActive && abilityOf(player) !== 'neutralizingGas',
    suppressEnemy = gasActive && abilityOf(enemy) !== 'neutralizingGas'
  if (suppressPlayer) player.abilitySuppressed = !0
  if (suppressEnemy) enemy.abilitySuppressed = !0
  const restoreGas = () => {
    if (suppressPlayer) player.abilitySuppressed = !1
    if (suppressEnemy) enemy.abilitySuppressed = !1
  }
  // Intimidate fires the first time each side is on the field.
  if (firstTurn) {
    applyIntimidate(player, enemy, events, !0)
    applyIntimidate(enemy, player, events, !1)
    applyEntryAbility(player, enemy, events, !0)
    applyEntryAbility(enemy, player, events, !1)
    const weatherSetter =
      WEATHER_ABILITIES[abilityOf(player) ?? ''] ?? WEATHER_ABILITIES[abilityOf(enemy) ?? '']
    if (weatherSetter)
      activeWeather = { type: weatherSetter, turns: WEATHER_TURNS }
    const terrainSetter =
      TERRAIN_ABILITIES[abilityOf(player) ?? ''] ?? TERRAIN_ABILITIES[abilityOf(enemy) ?? '']
    if (terrainSetter)
      activeTerrain = { type: terrainSetter, turns: TERRAIN_TURNS }
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
    const bestMove = chooseMoveForBattle(player, enemy, activeHazards, deterministic),
      lockedMove = applyMoveLock(player, bestMove.moveId)
    ;((playerMoveId = resolveCalledMove(lockedMove, enemy, activeTerrain)), (playerMove = moveData[playerMoveId]))
  }
  let enemyMoveId, enemyMove
  if (enemyMustRecharge) ((enemyMoveId = enemy.moves[0]), (enemyMove = moveData[enemyMoveId]))
  else if (enemy.lockedMove) ((enemyMoveId = enemy.lockedMove), (enemyMove = moveData[enemyMoveId]))
  else {
    const bestMove = isTrainerBattle
        ? chooseMoveForBattle(enemy, player, activeHazards, deterministic)
        : chooseRandomMove(enemy.moves),
      lockedMove = applyMoveLock(enemy, bestMove.moveId)
    ;((enemyMoveId = resolveCalledMove(lockedMove, player, activeTerrain)), (enemyMove = moveData[enemyMoveId]))
  }
  const trickRoomActive = (player.trickRoomTurns ?? 0) > 0 || (enemy.trickRoomTurns ?? 0) > 0,
    playerSpeed = effectiveSpeed(player, activeWeather, activeTerrain),
    enemySpeed = effectiveSpeed(enemy, activeWeather, activeTerrain),
    // Trick Room makes the slower Pokemon move first.
    playerActsFirst = trickRoomActive ? playerSpeed <= enemySpeed : playerSpeed >= enemySpeed,
    attackOrder = [],
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
      : playerActsFirst
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
    if (statusPreventsAction(attack.attacker, events, attack.isPlayer, deterministic)) continue
    if (handleConfusion(attack.attacker, events, attack.isPlayer, deterministic)) continue
    if (handleInfatuation(attack.attacker, events, attack.isPlayer, deterministic)) continue
    attack.attacker.lastMove = attack.moveId
    const moveDef = moveData[attack.moveId]
    if (!moveDef) continue
    // Taunt prevents status moves while it lasts.
    if ((attack.attacker.tauntTurns ?? 0) > 0 && moveDef.category === 'status') {
      events.push({
        type: 'status',
        message: `${attack.attacker.name} can't use ${moveDef.name} after the Taunt!`,
        data: {
          target: attack.isPlayer ? 'player' : 'enemy',
        },
      })
      continue
    }
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
    // Protect blocks anything aimed at the protected Pokemon this turn, but
    // Unseen Fist lets a contact move through it.
    if (
      attack.defender.protecting &&
      !isSelfTargetedMove(moveDef) &&
      !(abilityOf(attack.attacker) === 'unseenFist' && moveMakesContact(moveDef))
    ) {
      events.push({
        type: 'protect',
        message: `${attack.defender.name} protected itself!`,
      })
      continue
    }
    // Psychic Terrain blocks priority moves against grounded Pokemon.
    if ((moveDef.priority ?? 0) > 0 && terrainPreventsPriority(activeTerrain, attack.defender)) {
      events.push({
        type: 'status',
        message: `${attack.defender.name} is protected by the terrain!`,
        data: {
          target: attack.isPlayer ? 'enemy' : 'player',
        },
      })
      continue
    }
    if (moveDef.power === 0) {
      // Good as Gold makes the holder immune to status moves.
      if (abilityOf(attack.defender) === 'goodAsGold' && !isSelfTargetedMove(moveDef)) {
        events.push({
          type: 'miss',
          message: `${attack.defender.name}'s Good as Gold blocked the move!`,
        })
        continue
      }
      // A substitute blocks status moves aimed at its owner.
      if ((attack.defender.substituteHp ?? 0) > 0 && !isSelfTargetedMove(moveDef)) {
        events.push({
          type: 'status',
          message: `${attack.defender.name}'s substitute blocked the move!`,
        })
        continue
      }
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
          side = statTarget === player ? 'player' : 'enemy',
          targetAbility = abilityOf(statTarget),
          fromOpponent = moveDef.effect.target !== 'self'
        statTarget.statStages || (statTarget.statStages = {})
        for (const [statKey, delta] of Object.entries(moveDef.effect.changes)) {
          const key = normalizeStatKey(statKey),
            // Contrary flips the change, Simple doubles it.
            appliedDelta =
              targetAbility === 'contrary' ? -delta : targetAbility === 'simple' ? delta * 2 : delta,
            currentStage = statTarget.statStages[key] ?? 0,
            newStage = clampStatStage(currentStage + appliedDelta)
          // Clear Body / Hyper Cutter / ... and Mist block opponent-inflicted drops.
          if (
            appliedDelta < 0 &&
            (abilityPreventsStatDrop(statTarget, key) ||
              (fromOpponent && (statTarget.mistTurns ?? 0) > 0))
          )
            continue
          statTarget.statStages[key] = newStage
          const verb = appliedDelta > 0 ? 'rose' : 'fell',
            sharply = Math.abs(appliedDelta) >= 2 ? 'sharply ' : ''
          events.push({
            type: 'statChange',
            message: `${statTarget.name}'s ${getStatLabel(key)} ${sharply}${verb}!`,
            data: {
              target: side,
            },
          })
          // Defiant / Competitive punish an opponent's drop with a big boost.
          if (delta < 0 && fromOpponent && targetAbility !== 'contrary') {
            const boostKey =
                targetAbility === 'defiant'
                  ? 'attack'
                  : targetAbility === 'competitive'
                    ? 'spAttack'
                    : null,
              boostCurrent = boostKey ? (statTarget.statStages[boostKey] ?? 0) : 0,
              boostNext = boostKey ? clampStatStage(boostCurrent + 2) : boostCurrent
            if (boostKey && boostNext !== boostCurrent) {
              statTarget.statStages[boostKey] = boostNext
              events.push({
                type: 'statChange',
                message: `${statTarget.name}'s ${getStatLabel(boostKey)} sharply rose!`,
                data: {
                  target: side,
                },
              })
            }
          }
        }
      } else if (
        moveDef.effect?.type === 'status' &&
        (moveDef.effect.chance === void 0 || chance(moveDef.effect.chance / 100, deterministic))
      )
        applyStatus(attack.defender, moveDef.effect.status, events, !attack.isPlayer, deterministic, activeTerrain, !0)
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
        moveDef.effect.status && applyStatus(attack.attacker, moveDef.effect.status, events, attack.isPlayer, deterministic, activeTerrain)
        if (moveDef.effect.statusCure && attack.attacker.status) {
          attack.attacker.status = null
          attack.attacker.statusTurns = 0
          events.push({
            type: 'status',
            message: `${attack.attacker.name}'s status was cured!`,
            data: {
              target: attack.isPlayer ? 'player' : 'enemy',
            },
          })
        }
      } else if (moveDef.effect?.type === 'confusion') applyConfusion(attack.defender, events, !attack.isPlayer, deterministic)
      else if (moveDef.effect?.type === 'leechSeed')
        applyLeechSeed(attack.defender, events, !attack.isPlayer)
      else if (moveDef.effect?.type === 'taunt') {
        if ((attack.defender.tauntTurns ?? 0) <= 0) {
          attack.defender.tauntTurns = 3
          events.push({
            type: 'status',
            message: `${attack.defender.name} fell for the Taunt!`,
            data: {
              target: attack.isPlayer ? 'enemy' : 'player',
            },
          })
        }
      } else if (moveDef.effect?.type === 'substitute') {
        const cost = Math.max(1, Math.floor(attack.attacker.maxHp / 4))
        if (attack.attacker.currentHp > cost && (attack.attacker.substituteHp ?? 0) <= 0) {
          attack.attacker.currentHp -= cost
          attack.attacker.substituteHp = cost
          events.push({
            type: 'recoil',
            message: `${attack.attacker.name} made a substitute! (${cost} HP)`,
            data: {
              target: attack.isPlayer ? 'player' : 'enemy',
              damage: cost,
              hpAfter: attack.attacker.currentHp,
              hpMax: attack.attacker.maxHp,
            },
          })
        }
      }
      else if (moveDef.effect?.type === 'infatuation')
        applyInfatuation(attack.attacker, attack.defender, events, !attack.isPlayer)
      else if (moveDef.effect?.type === 'curse') {
        if (attack.attacker.types.includes('Ghost')) {
          const cost = Math.max(1, Math.floor(attack.attacker.maxHp / 2))
          if (attack.attacker.currentHp > cost && !attack.defender.cursed) {
            attack.attacker.currentHp -= cost
            attack.defender.cursed = !0
            events.push({
              type: 'recoil',
              message: `${attack.attacker.name} cut its own HP and put a curse on ${attack.defender.name}!`,
              data: {
                target: attack.isPlayer ? 'player' : 'enemy',
                damage: cost,
                hpAfter: attack.attacker.currentHp,
                hpMax: attack.attacker.maxHp,
              },
            })
          }
        } else {
          const stages = attack.attacker.statStages ?? (attack.attacker.statStages = {})
          for (const [key, delta] of /** @type {[string, number][]} */ ([
            ['attack', 1],
            ['defense', 1],
            ['speed', -1],
          ])) {
            const next = clampStatStage((stages[key] ?? 0) + delta)
            stages[key] = next
            events.push({
              type: 'statChange',
              message: `${attack.attacker.name}'s ${getStatLabel(key)} ${delta > 0 ? 'rose' : 'fell'}!`,
              data: {
                target: attack.isPlayer ? 'player' : 'enemy',
              },
            })
          }
        }
      }
      else if (moveDef.effect?.type === 'statReset') {
        if (moveDef.effect.target === 'all') {
          resetStatStages(attack.attacker, events, attack.isPlayer)
          resetStatStages(attack.defender, events, !attack.isPlayer)
        } else resetStatStages(attack.defender, events, !attack.isPlayer)
      }
      else if (moveDef.effect?.type === 'focusEnergy') {
        if (!attack.attacker.focusEnergy) {
          attack.attacker.focusEnergy = !0
          events.push({
            type: 'statChange',
            message: `${attack.attacker.name} is getting pumped!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      }
      else if (moveDef.effect?.type === 'aquaRing') {
        if (!attack.attacker.aquaRing) {
          attack.attacker.aquaRing = !0
          events.push({
            type: 'status',
            message: `${attack.attacker.name} surrounded itself with a veil of water!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      }
      else if (moveDef.effect?.type === 'wish') {
        attack.attacker.wishTurns = 2
        attack.attacker.wishHeal = Math.max(1, Math.floor(attack.attacker.maxHp / 2))
        events.push({
          type: 'status',
          message: `${attack.attacker.name} made a wish!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
      else if (moveDef.effect?.type === 'yawn') {
        if ((attack.defender.yawnTurns ?? 0) <= 0 && !attack.defender.status) {
          attack.defender.yawnTurns = 2
          events.push({
            type: 'status',
            message: `${attack.defender.name} grew drowsy!`,
            data: { target: attack.isPlayer ? 'enemy' : 'player' },
          })
        }
      }
      else if (moveDef.effect?.type === 'statInvert') {
        const stages = attack.defender.statStages
        if (stages && Object.values(stages).some((value) => value !== 0)) {
          for (const key of Object.keys(stages)) stages[key] = clampStatStage(-stages[key])
          events.push({
            type: 'statChange',
            message: `${attack.defender.name}'s stat changes were reversed!`,
            data: { target: attack.isPlayer ? 'enemy' : 'player' },
          })
        }
      }
      else if (moveDef.effect?.type === 'painSplit') {
        const each = Math.max(
            1,
            Math.floor((attack.attacker.currentHp + attack.defender.currentHp) / 2)
          ),
          attackerHp = Math.min(attack.attacker.maxHp, each),
          defenderHp = Math.min(attack.defender.maxHp, each),
          attackerDelta = attackerHp - attack.attacker.currentHp,
          defenderDelta = defenderHp - attack.defender.currentHp
        events.push({
          type: 'status',
          message: 'The battlers shared their pain!',
        })
        if (attackerDelta !== 0)
          events.push({
            type: attackerDelta > 0 ? 'heal' : 'damage',
            message: `${attack.attacker.name}${attackerDelta > 0 ? ' recovered HP' : ' lost HP'}!`,
            data: {
              target: attack.isPlayer ? 'player' : 'enemy',
              damage: Math.abs(attackerDelta),
              hpAfter: attackerHp,
              hpMax: attack.attacker.maxHp,
            },
          })
        if (defenderDelta !== 0)
          events.push({
            type: defenderDelta > 0 ? 'heal' : 'damage',
            message: `${attack.defender.name}${defenderDelta > 0 ? ' recovered HP' : ' lost HP'}!`,
            data: {
              target: attack.isPlayer ? 'enemy' : 'player',
              damage: Math.abs(defenderDelta),
              hpAfter: defenderHp,
              hpMax: attack.defender.maxHp,
            },
          })
        attack.attacker.currentHp = attackerHp
        attack.defender.currentHp = defenderHp
      }
      else if (moveDef.effect?.type === 'safeguard') {
        if ((attack.attacker.safeguardTurns ?? 0) <= 0) {
          attack.attacker.safeguardTurns = 5
          events.push({
            type: 'statChange',
            message: `${attack.attacker.name}'s team became cloaked in a mystical veil!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      }
      else if (moveDef.effect?.type === 'mist') {
        if ((attack.attacker.mistTurns ?? 0) <= 0) {
          attack.attacker.mistTurns = 5
          events.push({
            type: 'statChange',
            message: `${attack.attacker.name} became shrouded in mist!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      }
      else if (moveDef.effect?.type === 'encore') {
        if ((attack.defender.encoreTurns ?? 0) <= 0 && attack.defender.lastMove) {
          attack.defender.encoreMove = attack.defender.lastMove
          attack.defender.encoreTurns = 3
          events.push({
            type: 'status',
            message: `${attack.defender.name} received an encore!`,
            data: { target: attack.isPlayer ? 'enemy' : 'player' },
          })
        }
      }
      else if (moveDef.effect?.type === 'disable') {
        if ((attack.defender.disableTurns ?? 0) <= 0 && attack.defender.lastMove) {
          attack.defender.disabledMove = attack.defender.lastMove
          attack.defender.disableTurns = 4
          events.push({
            type: 'status',
            message: `${attack.defender.name}'s ${moveData[attack.defender.disabledMove]?.name ?? 'move'} was disabled!`,
            data: { target: attack.isPlayer ? 'enemy' : 'player' },
          })
        }
      }
      else if (moveDef.effect?.type === 'perishSong') {
        if ((attack.attacker.perishTurns ?? 0) <= 0 && (attack.defender.perishTurns ?? 0) <= 0) {
          attack.attacker.perishTurns = 3
          attack.defender.perishTurns = 3
          events.push({
            type: 'status',
            message: 'The song will doom both battlers in three turns!',
          })
        }
      }
      else if (moveDef.effect?.type === 'tailwind') {
        if ((attack.attacker.tailwindTurns ?? 0) <= 0) {
          attack.attacker.tailwindTurns = 4
          events.push({
            type: 'statChange',
            message: `The tailwind blew from behind ${attack.attacker.name}'s team!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      }
      else if (moveDef.effect?.type === 'trickRoom') {
        // Field-wide, so both sides carry the timer while either is in battle.
        if ((attack.attacker.trickRoomTurns ?? 0) <= 0 && (attack.defender.trickRoomTurns ?? 0) <= 0) {
          attack.attacker.trickRoomTurns = 5
          attack.defender.trickRoomTurns = 5
          events.push({
            type: 'status',
            message: `${attack.attacker.name} twisted the dimensions!`,
          })
        }
      }
      else if (moveDef.effect?.type === 'destinyBond') {
        attack.attacker.destinyBondTurns = 2
        events.push({
          type: 'status',
          message: `${attack.attacker.name} is trying to take its foe down with it!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
      else if (moveDef.effect?.type === 'ingrain') {
        if (!attack.attacker.ingrained) {
          attack.attacker.ingrained = !0
          events.push({
            type: 'status',
            message: `${attack.attacker.name} planted its roots!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      }
      else if (moveDef.effect?.type === 'laserFocus') {
        attack.attacker.laserFocus = !0
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name} focused its mind on a weak point!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
      else if (moveDef.effect?.type === 'lockOn') {
        attack.attacker.lockOnTurns = 2
        events.push({
          type: 'status',
          message: `${attack.attacker.name} took aim at ${attack.defender.name}!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
      else if (moveDef.effect?.type === 'gastroAcid') {
        attack.defender.abilitySuppressed = !0
        attack.defender.abilityOverride = null
        events.push({
          type: 'status',
          message: `${attack.defender.name}'s ability was suppressed!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      }
      else if (moveDef.effect?.type === 'worrySeed' || moveDef.effect?.type === 'simpleBeam') {
        attack.defender.abilitySuppressed = !1
        attack.defender.abilityOverride =
          moveDef.effect.type === 'worrySeed' ? 'insomnia' : 'simple'
        events.push({
          type: 'status',
          message: `${attack.defender.name}'s ability changed!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      }
      else if (moveDef.effect?.type === 'rolePlay') {
        attack.attacker.abilitySuppressed = !1
        attack.attacker.abilityOverride = abilityOf(attack.defender)
        events.push({
          type: 'status',
          message: `${attack.attacker.name} copied ${attack.defender.name}'s ability!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
      else if (moveDef.effect?.type === 'entrainment') {
        attack.defender.abilitySuppressed = !1
        attack.defender.abilityOverride = abilityOf(attack.attacker)
        events.push({
          type: 'status',
          message: `${attack.defender.name} was made to share ${attack.attacker.name}'s ability!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      }
      else if (moveDef.effect?.type === 'skillSwap') {
        const attackerAbility = abilityOf(attack.attacker),
          defenderAbility = abilityOf(attack.defender)
        attack.attacker.abilitySuppressed = !1
        attack.defender.abilitySuppressed = !1
        attack.attacker.abilityOverride = defenderAbility
        attack.defender.abilityOverride = attackerAbility
        events.push({
          type: 'status',
          message: `${attack.attacker.name} and ${attack.defender.name} swapped abilities!`,
        })
      }
      else if (moveDef.effect?.type === 'typeChange') {
        const newTypes = [...moveDef.effect.types]
        attack.defender.typesOverride = newTypes
        attack.defender.types = newTypes
        events.push({
          type: 'status',
          message: `${attack.defender.name} was transformed into the ${moveDef.effect.types.join('/')} type!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      }
      else if (moveDef.effect?.type === 'reflectType') {
        const newTypes = [...attack.defender.types]
        attack.attacker.typesOverride = newTypes
        attack.attacker.types = newTypes
        events.push({
          type: 'status',
          message: `${attack.attacker.name} copied ${attack.defender.name}'s type!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
      else if (moveDef.effect?.type === 'typeAdd') {
        const currentTypes = attack.defender.typesOverride ?? attack.defender.types
        if (!currentTypes.includes(moveDef.effect.typeName)) {
          const newTypes = [...currentTypes, moveDef.effect.typeName]
          attack.defender.typesOverride = newTypes
          attack.defender.types = newTypes
        }
        events.push({
          type: 'status',
          message: `${attack.defender.name} gained the ${moveDef.effect.typeName} type!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      }
      else if (moveDef.effect?.type === 'statSwap') {
        attack.attacker.statStages || (attack.attacker.statStages = {})
        attack.defender.statStages || (attack.defender.statStages = {})
        for (const stat of moveDef.effect.stats) {
          const attackerStage = attack.attacker.statStages[stat] ?? 0,
            defenderStage = attack.defender.statStages[stat] ?? 0
          attack.attacker.statStages[stat] = defenderStage
          attack.defender.statStages[stat] = attackerStage
        }
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name} and ${attack.defender.name} swapped stat changes!`,
        })
      }
      else if (moveDef.effect?.type === 'recycle') {
        if (attack.attacker.heldItemUsed) {
          attack.attacker.heldItemUsed = !1
          events.push({
            type: 'status',
            message: `${attack.attacker.name} recycled its held item!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        } else {
          events.push({
            type: 'status',
            message: `${attack.attacker.name}'s Recycle failed!`,
          })
        }
      }
      else if (moveDef.effect?.type === 'hazard') {
        const targetSide = /** @type {any} */ (
            attack.isPlayer ? activeHazards.enemy : activeHazards.player
          ),
          hazard = moveDef.effect.hazard
        if (hazard === 'spikes') targetSide.spikes = Math.min(3, targetSide.spikes + 1)
        else if (hazard === 'toxicSpikes')
          targetSide.toxicSpikes = Math.min(2, targetSide.toxicSpikes + 1)
        else targetSide[hazard] = !0
        events.push({
          type: 'hazard',
          message: `${attack.attacker.name} set up a hazard!`,
        })
      }
      else if (moveDef.effect?.type === 'weather') {
        activeWeather = { type: moveDef.effect.weather, turns: WEATHER_TURNS }
        events.push({
          type: 'weather',
          message: `The weather became ${WEATHER_NAMES[moveDef.effect.weather] ?? moveDef.effect.weather}!`,
        })
      } else if (moveDef.effect?.type === 'terrain') {
        activeTerrain = { type: moveDef.effect.terrain, turns: TERRAIN_TURNS }
        events.push({
          type: 'terrain',
          message: `The battlefield became ${TERRAIN_NAMES[moveDef.effect.terrain] ?? moveDef.effect.terrain}!`,
        })
      }
      continue
    }
    // Weather rewrites Weather Ball's type/power, and abilities like Normalize,
    // the -ate family and Liquid Voice rewrite the move type too.
    const effectiveMove = abilityChangesMoveType(
      attack.attacker,
      applyWeatherToMove(activeWeather, moveDef)
    )
    // Protean / Libero change the user's type to the move it is about to use.
    if (abilityOf(attack.attacker) === 'protean' || abilityOf(attack.attacker) === 'libero') {
      attack.attacker.types = [effectiveMove.type]
      attack.attacker.typesOverride = [effectiveMove.type]
    }
    // The extreme weathers refuse the opposite elemental type.
    if (
      (activeWeather?.type === 'harshSunlight' && effectiveMove.type === 'Water') ||
      (activeWeather?.type === 'heavyRain' && effectiveMove.type === 'Fire')
    ) {
      events.push({
        type: 'miss',
        message: `The ${effectiveMove.type}-type move was negated by the extreme weather!`,
      })
      continue
    }
    // Levitate / type-absorbing abilities negate the move (and usually heal).
    if (abilityAbsorbsType(attack.defender, effectiveMove.type)) {
      if (abilityHealsFromType(attack.defender, effectiveMove.type)) {
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
    // Laser Focus guarantees this hit crits; Lock-On / Mind Reader make it land.
    const guaranteedCrit = attack.attacker.laserFocus === !0,
      neverMiss = (attack.attacker.lockOnTurns ?? 0) > 0
    if (guaranteedCrit) attack.attacker.laserFocus = !1
    if (neverMiss) attack.attacker.lockOnTurns = 0
    const attackStat =
        (moveDef.category === 'physical'
          ? attack.attacker.status === 'burn'
            ? Math.max(1, Math.floor(attack.attacker.attack / 2))
            : attack.attacker.attack
          : attack.attacker.spAttack) *
        abilityAttackMultiplier(attack.attacker, effectiveMove) *
        ruinOffenseMultiplier(attack.defender, moveDef.category) *
        terrainAbilityMultiplier(
          activeTerrain,
          attack.attacker,
          moveDef.category === 'physical' ? 'attack' : 'spAttack'
        ) *
        heldStatMultiplier(
          attack.attacker,
          moveDef.category === 'physical' ? 'attack' : 'spAttack',
          canEvolveFurther(attack.attacker.speciesKey)
        ),
      defenseStat =
        (moveDef.category === 'physical' ? attack.defender.defense : attack.defender.spDefense) *
        terrainAbilityMultiplier(
          activeTerrain,
          attack.defender,
          moveDef.category === 'physical' ? 'defense' : 'spDefense'
        ) *
        ruinDefenseMultiplier(attack.attacker, moveDef.category) *
        heldStatMultiplier(
          attack.defender,
          moveDef.category === 'physical' ? 'defense' : 'spDefense',
          canEvolveFurther(attack.defender.speciesKey)
        ),
      attackStatKey = moveDef.category === 'physical' ? 'attack' : 'spAttack',
      defenseStatKey = moveDef.category === 'physical' ? 'defense' : 'spDefense',
      attackerStage =
        abilityOf(attack.defender) === 'unaware' ? 0 : getStatStage(attack.attacker, attackStatKey),
      defenderStage =
        abilityOf(attack.attacker) === 'unaware' ? 0 : getStatStage(attack.defender, defenseStatKey),
      accuracyStage = getStatStage(attack.attacker, 'accuracy'),
      evasionStage = getStatStage(attack.defender, 'evasion'),
      damageResult = calculateDamage(
        attack.attacker.level,
        attackStat,
        defenseStat,
        effectiveMove,
        attack.attacker.types,
        attack.defender.types,
        attackerStage,
        defenderStage,
        Math.max(
          (moveDef.critStage ?? 0) +
            (abilityOf(attack.attacker) === 'superLuck' ? 1 : 0) +
            (attack.attacker.focusEnergy ? 2 : 0),
          guaranteedCrit ? 3 : 0
        ),
        neverMiss,
        accuracyStage,
        evasionStage,
        deterministic,
        abilityOf(attack.attacker) === 'sniper' ? 2.25 : 2,
        ['battleArmor', 'shellArmor'].includes(abilityOf(attack.defender) ?? '')
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
          effectiveMove,
          attack.attacker.types,
          attack.defender.types,
          attackerStage,
          defenderStage,
          Math.max(
            (moveDef.critStage ?? 0) +
              (abilityOf(attack.attacker) === 'superLuck' ? 1 : 0) +
              (attack.attacker.focusEnergy ? 2 : 0),
            guaranteedCrit ? 3 : 0
          ),
          !0,
          accuracyStage,
          evasionStage,
          deterministic,
          abilityOf(attack.attacker) === 'sniper' ? 2.25 : 2,
          ['battleArmor', 'shellArmor'].includes(abilityOf(attack.defender) ?? '')
        )
        totalDamage += hitResult.damage
        anyCrit = anyCrit || hitResult.isCrit
      }
    }
    if (
      screenApplies(attack.defender, moveDef) &&
      !anyCrit &&
      abilityOf(attack.attacker) !== 'infiltrator'
    )
      totalDamage = Math.max(1, Math.floor(totalDamage / 2))
    // Ability + held-item + weather damage modifiers.
    totalDamage = Math.floor(
      totalDamage *
        abilityDamageDealtMultiplier(attack.attacker, effectiveMove, activeWeather) *
        abilityDamageTakenMultiplier(attack.defender, effectiveMove) *
        heldDamageMultiplier(attack.attacker, effectiveMove) *
        weatherDamageMultiplier(activeWeather, effectiveMove) *
        fieldAuraMultiplier(player, enemy, effectiveMove) *
        terrainDamageMultiplier(activeTerrain, attack.attacker, effectiveMove, attack.defender)
    )
    if (abilityHalvesSuperEffective(attack.defender) && damageResult.effectiveness > 1)
      totalDamage = Math.max(1, Math.floor(totalDamage / 2))
    // Tinted Lens / Neuroforce scale the effectiveness-based damage.
    totalDamage = Math.max(
      1,
      Math.floor(totalDamage * abilityEffectivenessMultiplier(attack.attacker, damageResult.effectiveness))
    )
    // Delta Stream cancels Flying-type weaknesses.
    if (
      activeWeather?.type === 'strongWinds' &&
      attack.defender.types.includes('Flying') &&
      damageResult.effectiveness > 1
    )
      totalDamage = Math.max(1, Math.floor(totalDamage / damageResult.effectiveness))
    if (abilityBlocksNonSuperEffective(attack.defender, damageResult.effectiveness)) {
      events.push({
        type: 'miss',
        message: `${attack.defender.name}'s Wonder Guard blocked the move!`,
      })
      continue
    }
    totalDamage = abilitySurvivesAtFullHp(attack.defender, attack.defender.currentHp, totalDamage)
    const sashDamage = heldSurvivesAtFullHp(
      attack.defender,
      attack.defender.currentHp,
      totalDamage
    )
    if (sashDamage !== totalDamage) {
      totalDamage = sashDamage
      attack.defender.heldItemUsed = !0
    }
    // A substitute soaks the damage before its owner.
    if ((attack.defender.substituteHp ?? 0) > 0) {
      const absorbed = Math.min(attack.defender.substituteHp, totalDamage)
      attack.defender.substituteHp -= absorbed
      totalDamage -= absorbed
      if (attack.defender.substituteHp <= 0) {
        attack.defender.substituteHp = 0
        events.push({
          type: 'status',
          message: `${attack.defender.name}'s substitute faded!`,
        })
      }
      if (totalDamage <= 0) {
        events.push({
          type: 'status',
          message: `${attack.defender.name}'s substitute took the hit!`,
        })
        continue
      }
    }
    const defenderHpBefore = attack.defender.currentHp
    // Disguise (Mimikyu) and Ice Face (Eiscue) absorb the first hit.
    const defenderAbility = abilityOf(attack.defender)
    if (
      (defenderAbility === 'disguise' && !attack.defender.disguiseBroken) ||
      (defenderAbility === 'iceFace' &&
        !attack.defender.iceFaceBroken &&
        effectiveMove.category === 'physical')
    ) {
      if (defenderAbility === 'disguise') attack.defender.disguiseBroken = !0
      else attack.defender.iceFaceBroken = !0
      events.push({
        type: 'miss',
        message: `${attack.defender.name}'s ${defenderAbility === 'disguise' ? 'disguise' : 'Ice Face'} absorbed the hit!`,
      })
      continue
    }
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
            chance(moveDef.effect.chance / 100, deterministic)
          )
            applyStatus(attack.defender, moveDef.effect.status, events, !attack.isPlayer, deterministic, activeTerrain, !0)
          break
        }
        case 'statReset': {
          if (moveDef.effect.target === 'all') {
            resetStatStages(attack.attacker, events, attack.isPlayer)
            resetStatStages(attack.defender, events, !attack.isPlayer)
          } else resetStatStages(attack.defender, events, !attack.isPlayer)
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
    // Life Orb costs the attacker some HP for each hit it lands.
    const orbRecoil = heldLifeOrbRecoil(attack.attacker, totalDamage)
    if (orbRecoil > 0) {
      attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - orbRecoil)
      events.push({
        type: 'recoil',
        message: `${attack.attacker.name} lost ${orbRecoil} HP to its Life Orb!`,
        data: {
          target: attack.isPlayer ? 'player' : 'enemy',
          damage: orbRecoil,
          hpAfter: attack.attacker.currentHp,
          hpMax: attack.attacker.maxHp,
        },
      })
      attack.attacker.currentHp <= 0 &&
        events.push({
          type: 'faint',
          message: `${attack.attacker.name} fainted!`,
          data: {
            target: attack.isPlayer ? 'player' : 'enemy',
          },
        })
    }
    // The defender's contact ability hits back (Static, Rough Skin, ...).
    applyContactAbility(
      attack.defender,
      attack.attacker,
      moveDef,
      events,
      attack.isPlayer,
      deterministic,
      activeTerrain
    )
    // The defender's ability may reward it for being hit (Justified, Weak
    // Armor, ...) or react to dropping below half HP (Berserk, Anger Shell).
    const onHit = {
      ...onHitStatBoost(attack.defender, effectiveMove, anyCrit),
      ...onHpThresholdBoost(attack.defender, defenderHpBefore),
    }
    if (Object.keys(onHit).length) {
      attack.defender.statStages || (attack.defender.statStages = {})
      for (const [stat, delta] of Object.entries(onHit)) {
        const current = attack.defender.statStages[stat] ?? 0,
          next = clampStatStage(current + delta)
        if (next === current) continue
        attack.defender.statStages[stat] = next
        events.push({
          type: 'statChange',
          message: `${attack.defender.name}'s ${getStatLabel(stat)} ${delta > 0 ? 'rose' : 'fell'}!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
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
      // Destiny Bond drags down whoever landed the KO.
      if ((attack.defender.destinyBondTurns ?? 0) > 0 && attack.attacker.currentHp > 0) {
        attack.attacker.currentHp = 0
        events.push({
          type: 'faint',
          message: `${attack.attacker.name} was dragged down by Destiny Bond!`,
          data: {
            target: attack.isPlayer ? 'player' : 'enemy',
          },
        })
      }
      // Moxie / Chilling Neigh / Grim Neigh / Beast Boost reward a KO.
      const koAbility = abilityOf(attack.attacker)
      let koStat =
        koAbility === 'moxie' || koAbility === 'chillingNeigh'
          ? 'attack'
          : koAbility === 'grimNeigh' || koAbility === 'soulHeart'
            ? 'spAttack'
            : null
      if (koAbility === 'beastBoost') {
        const stats = {
          attack: attack.attacker.attack,
          defense: attack.attacker.defense,
          spAttack: attack.attacker.spAttack,
          spDefense: attack.attacker.spDefense,
          speed: attack.attacker.speed,
        }
        koStat = /** @type {any} */ (Object.entries(stats).sort((a, b) => b[1] - a[1])[0][0])
      }
      if (koStat) {
        const stages = attack.attacker.statStages ?? (attack.attacker.statStages = {}),
          current = stages[koStat] ?? 0,
          next = clampStatStage(current + 1)
        if (next !== current) {
          stages[koStat] = next
          events.push({
            type: 'statChange',
            message: `${attack.attacker.name}'s ${getStatLabel(koStat)} rose!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      }
      break
    }
    if (attack.attacker.currentHp <= 0) break
  }
  applyEndOfTurn(player, enemy, events, activeWeather, activeTerrain, deterministic)
  reportFieldEffects(player, enemy, events, activeWeather, activeTerrain, activeHazards, weather, terrain, hazards)
  restoreGas()
  return events
}
