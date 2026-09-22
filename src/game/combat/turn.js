// Turn resolution: move selection, attack order and damage application. Split from game/combat.js.

import { moveData } from '../../data/gameData.js'
import { abilityAbsorbsType, abilityAttackMultiplier, abilityBlocksNonSuperEffective, abilityDamageDealtMultiplier, abilityDamageTakenMultiplier, abilityHalvesSuperEffective, abilityHealsFromType, abilityOf, abilityPreventsStatDrop, abilitySurvivesAtFullHp } from '../abilities.js'
import { chooseMoveForBattle, chooseRandomMove } from './ai.js'
import { calculateDamage, chance, isSelfTargetedMove, normalizeStatKey } from './damage.js'
import { applyEndOfTurn, reportFieldEffects } from './end-of-turn.js'
import { emptyBattleHazards } from '../hazards.js'
import { heldDamageMultiplier, heldLifeOrbRecoil, heldStatMultiplier, heldSurvivesAtFullHp } from '../held-items.js'
import { canEvolveFurther } from '../pokemon.js'
import { applyConfusion, applyContactAbility, applyInfatuation, applyLeechSeed, applyStatus, handleConfusion, handleInfatuation, statusPreventsAction } from './status.js'
import { TERRAIN_ABILITIES, TERRAIN_NAMES, TERRAIN_TURNS, terrainDamageMultiplier, terrainPreventsPriority } from '../terrain.js'
import { applyIntimidate, clampStatStage, effectiveSpeed, getStatLabel, getStatStage, resetStatStages, screenApplies } from './volatile.js'
import { WEATHER_ABILITIES, WEATHER_NAMES, WEATHER_TURNS, weatherDamageMultiplier } from '../weather.js'

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
  // Intimidate fires the first time each side is on the field.
  if (firstTurn) {
    applyIntimidate(player, enemy, events, !0)
    applyIntimidate(enemy, player, events, !1)
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
    const bestMove = chooseMoveForBattle(player, enemy, activeHazards, deterministic)
    ;((playerMoveId = bestMove.moveId), (playerMove = bestMove.move))
  }
  let enemyMoveId, enemyMove
  if (enemyMustRecharge) ((enemyMoveId = enemy.moves[0]), (enemyMove = moveData[enemyMoveId]))
  else if (enemy.lockedMove) ((enemyMoveId = enemy.lockedMove), (enemyMove = moveData[enemyMoveId]))
  else {
    const bestMove = isTrainerBattle
      ? chooseMoveForBattle(enemy, player, activeHazards, deterministic)
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
      : effectiveSpeed(player, activeWeather) >= effectiveSpeed(enemy, activeWeather)
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
    // Protect blocks anything aimed at the protected Pokemon this turn.
    if (attack.defender.protecting && !isSelfTargetedMove(moveDef)) {
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
        (moveDef.effect.chance === void 0 || chance(moveDef.effect.chance / 100, deterministic))
      )
        applyStatus(attack.defender, moveDef.effect.status, events, !attack.isPlayer, deterministic, activeTerrain)
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
          : attack.attacker.spAttack) *
        abilityAttackMultiplier(attack.attacker) *
        heldStatMultiplier(
          attack.attacker,
          moveDef.category === 'physical' ? 'attack' : 'spAttack',
          canEvolveFurther(attack.attacker.speciesKey)
        ),
      defenseStat =
        (moveDef.category === 'physical' ? attack.defender.defense : attack.defender.spDefense) *
        heldStatMultiplier(
          attack.defender,
          moveDef.category === 'physical' ? 'defense' : 'spDefense',
          canEvolveFurther(attack.defender.speciesKey)
        ),
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
        (moveDef.critStage ?? 0) + (abilityOf(attack.attacker) === 'superLuck' ? 1 : 0),
        !1,
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
          moveDef,
          attack.attacker.types,
          attack.defender.types,
          attackerStage,
          defenderStage,
          (moveDef.critStage ?? 0) + (abilityOf(attack.attacker) === 'superLuck' ? 1 : 0),
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
    if (screenApplies(attack.defender, moveDef) && !anyCrit)
      totalDamage = Math.max(1, Math.floor(totalDamage / 2))
    // Ability + held-item + weather damage modifiers.
    totalDamage = Math.floor(
      totalDamage *
        abilityDamageDealtMultiplier(attack.attacker, moveDef) *
        abilityDamageTakenMultiplier(attack.defender, moveDef) *
        heldDamageMultiplier(attack.attacker, moveDef) *
        weatherDamageMultiplier(activeWeather, moveDef) *
        terrainDamageMultiplier(activeTerrain, attack.attacker, moveDef, attack.defender)
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
            applyStatus(attack.defender, moveDef.effect.status, events, !attack.isPlayer, deterministic, activeTerrain)
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
  applyEndOfTurn(player, enemy, events, activeWeather, activeTerrain, deterministic)
  reportFieldEffects(player, enemy, events, activeWeather, activeTerrain, activeHazards, weather, terrain, hazards)
  return events
}
