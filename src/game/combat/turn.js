// Turn resolution: move selection, attack order and damage application. Split from game/combat.js.

import { moveMakesContact } from '../../data/move-effects.js'
import { moveData, moveLearnsets } from '../../data/gameData.js'
import { heldItems } from '../../data/items.js'
import { MAX_MOVE_BY_TYPE, gmaxMoveFor, maxMoveBasePower } from '../../data/max-moves.js'
import { Z_CRYSTAL_TYPE, Z_MOVE_BY_TYPE, Z_STATUS_BOOSTS, Z_STATUS_EFFECTS, zMoveBasePower } from '../../data/z-moves.js'
import { abilityAbsorbsType, abilityAttackMultiplier, abilityAvoidsContact, abilityBlocksMove, abilityBlocksNonSuperEffective, abilityBlocksWind, abilityChangesMoveType, abilityDamageDealtMultiplier, abilityDamageTakenMultiplier, abilityEffectivenessMultiplier, abilityHalvesSuperEffective, abilityHealsFromType, abilityHitsGhost, abilityOf, abilityPreventsStatDrop, abilityPreventsStatus, abilityStatusAccuracyMultiplier, abilitySurvivesAtFullHp, fieldAuraMultiplier, isWindMove, onHitStatBoost, onHpThresholdBoost, onKoBoostStat, ruinDefenseMultiplier, ruinOffenseMultiplier, rivalryDamageMultiplier, stakeoutDamageMultiplier } from '../abilities.js'
import { AI_SKILL, chooseMoveForBattle } from './ai.js'
import { changeBattleForm } from './setup.js'
import { calculateDamage, chance, getTypeEffectiveness, isSelfTargetedMove, normalizeStatKey } from './damage.js'
import { applyEndOfTurn, reportFieldEffects } from './end-of-turn.js'
import { emptyBattleHazards } from '../hazards.js'
import { heldBerryHeal, heldChoiceItem, heldContactRecoil, heldDamageMultiplier, heldItemBoostType, heldLifeOrbRecoil, heldStatMultiplier, heldSurvivesAtFullHp, heldTerrainExtenderTurns } from '../held-items.js'
import { canEvolveFurther } from '../pokemon.js'
import { VARIABLE_POWER_MOVES, withVariablePower } from './variable-power.js'
import { CHARGE_MOVES, hitsSemiInvulnerable } from './charge-moves.js'
import { applyConfusion, applyContactAbility, applyInfatuation, applyLeechSeed, applyStatus, handleConfusion, handleInfatuation, statusPreventsAction } from './status.js'
import { TERRAIN_ABILITIES, TERRAIN_NAMES, TERRAIN_TURNS, terrainAbilityMultiplier, terrainDamageMultiplier, terrainPreventsPriority } from '../terrain.js'
import { applyEntryAbility, applyIntimidate, clampStatStage, effectiveSpeed, getStatLabel, getStatStage, healBlocked, resetStatStages, screenApplies } from './volatile.js'
import { WEATHER_ABILITIES, WEATHER_NAMES, WEATHER_TURNS, applyWeatherToMove, weatherDamageMultiplier } from '../weather.js'

/**
 * Moves that call another move. They are swapped out for the called move during
 * move selection, so the engine only ever sees a normal move.
 */
const CALLING_MOVES = new Set(['metronome', 'copycat', 'mirrorMove', 'naturePower', 'sleepTalk', 'assist', 'meFirst'])

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

/**
 * Apply a `statChange` effect to the move's user or target, honouring Contrary
 * / Simple, Clear Body / Mist, and the Opportunist / Defiant / Competitive
 * reactions. Shared by status moves (applied directly) and damaging moves
 * (applied after the hit as an added effect).
 * @param {any} attack
 * @param {Move} moveDef
 * @param {any[]} events
 * @param {boolean} [deterministic]
 * @param {boolean} [secondary] Damaging-move added effect: roll its chance and
 *   let Shield Dust block it.
 */
function applyStatChange(attack, moveDef, events, deterministic = !1, secondary = !1) {
  applyStatChangeEffect(attack, moveDef.effect, events, deterministic, secondary)
}

/**
 * The shared body of {@link applyStatChange}, taking the effect object directly
 * so a move's `secondary` (which may carry a stat change) can reuse it.
 * @param {any} attack
 * @param {any} effect
 * @param {any[]} events
 * @param {boolean} [deterministic]
 * @param {boolean} [secondary]
 */
function applyStatChangeEffect(attack, effect, events, deterministic = !1, secondary = !1) {
  if (!effect) return
  const fromOpponent = effect.target !== 'self'
  // Shield Dust ignores a damaging move's added effects on its holder.
  if (secondary && fromOpponent && abilityOf(attack.defender) === 'shieldDust') return
  if (
    secondary &&
    effect.chance !== void 0 &&
    !chance(
      (effect.chance * (abilityOf(attack.attacker) === 'sereneGrace' ? 2 : 1)) / 100,
      deterministic
    )
  )
    return
  // Magic Bounce reflects an opponent's stat drop back onto the user.
  let statTarget = fromOpponent ? attack.defender : attack.attacker
  if (
    fromOpponent &&
    attack.attacker !== attack.defender &&
    abilityOf(statTarget) === 'magicBounce' &&
    !['moldBreaker', 'teravolt', 'turboblaze'].includes(abilityOf(attack.attacker) ?? '') &&
    Object.values(effect.changes).some((delta) => delta < 0)
  )
    statTarget = attack.attacker
  const side = statTarget === attack.attacker
      ? attack.isPlayer
        ? 'player'
        : 'enemy'
      : attack.isPlayer
        ? 'enemy'
        : 'player',
    targetAbility = abilityOf(statTarget)
  statTarget.statStages || (statTarget.statStages = {})
  for (const [statKey, delta] of Object.entries(effect.changes)) {
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
    // Opportunist copies a foe's self-boost onto the holder.
    if (!fromOpponent && appliedDelta > 0 && abilityOf(attack.defender) === 'opportunist') {
      const oppStages = attack.defender.statStages ?? (attack.defender.statStages = {}),
        oppCurrent = oppStages[key] ?? 0,
        oppNext = clampStatStage(oppCurrent + appliedDelta)
      if (oppNext !== oppCurrent) {
        oppStages[key] = oppNext
        events.push({
          type: 'statChange',
          message: `${attack.defender.name} copied the boost!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      }
    }
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
}

/**
 * Apply a damaging move's extra secondary effect (a status or stat change) on
 * top of its primary one, so a move can both burn and recoil (Flare Blitz) or
 * paralyse and recoil (Volt Tackle). Shield Dust and Serene Grace apply as for
 * any added effect.
 * @param {any} attack
 * @param {Move} moveDef
 * @param {any[]} events
 * @param {boolean} deterministic
 * @param {any} activeTerrain
 */
function applySecondaryEffect(attack, moveDef, events, deterministic, activeTerrain) {
  const secondary = moveDef.secondary
  if (!secondary) return
  if (secondary.changes) {
    applyStatChangeEffect(attack, secondary, events, deterministic, !0)
    return
  }
  if (!secondary.status && !secondary.statuses) return
  if (abilityOf(attack.defender) === 'shieldDust') return
  const odds =
    (secondary.chance ?? 100) * (abilityOf(attack.attacker) === 'sereneGrace' ? 2 : 1)
  if (!chance(odds / 100, deterministic)) return
  const pool = secondary.statuses ?? [secondary.status],
    status = deterministic ? pool[0] : pool[Math.floor(Math.random() * pool.length)]
  if (!status) return
  applyStatus(
    attack.defender,
    status,
    events,
    !attack.isPlayer,
    deterministic,
    activeTerrain,
    !0,
    attack.attacker
  )
}

/**
 * Remember that a move did nothing to this foe, so the AI stops choosing it
 * after it has actually failed. The AI is never told the foe's ability, so its
 * first attempt is always allowed through.
 * @param {{ attacker?: BattlePokemon, defender?: BattlePokemon, moveId?: string }} attack
 */
function rememberNullifiedMove(attack) {
  const { attacker, defender, moveId } = attack
  if (!attacker || !defender || !moveId) return
  const key = defender.speciesKey ?? defender.name,
    memory = attacker.nullifiedMoves ?? (attacker.nullifiedMoves = {}),
    moves = memory[key] ?? (memory[key] = [])
  if (!moves.includes(moveId)) moves.push(moveId)
}

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
 * @param {BattlePokemon} attacker
 * @param {BattlePokemon} target
 * @param {{ type: string } | null} terrain
 * @returns {string}
 */
function resolveCalledMove(moveId, attacker, target, terrain) {
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
  // Assist borrows a random move known by another party member.
  if (moveId === 'assist') {
    const pool = (attacker?.assistPool ?? []).filter(
      (/** @type {string} */ id) => moveData[id] && !CALLING_MOVES.has(id)
    )
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : moveId
  }
  return moveId
}

/**
 * Move a held item from `victim` to `thief` (Magician / Pickpocket).
 * @param {BattlePokemon} thief
 * @param {BattlePokemon} victim
 * @param {any[]} events
 * @param {boolean} thiefIsPlayer
 */
function stealHeldItem(thief, victim, events, thiefIsPlayer) {
  if (thief.heldItem || !victim.heldItem) return
  // Sticky Hold glues the item in place.
  if (abilityOf(victim) === 'stickyHold') return
  const item = victim.heldItem
  thief.heldItem = item
  thief.heldItemOverride = item
  thief.heldItemOverridden = !0
  victim.heldItem = null
  victim.heldItemOverride = null
  victim.heldItemOverridden = !0
  events.push({
    type: 'status',
    message: `${thief.name} stole ${victim.name}'s held item!`,
    data: { target: thiefIsPlayer ? 'player' : 'enemy' },
  })
}

/**
 * Priority after ability modifiers (Prankster, Gale Wings, Triage, Stall).
 * @param {BattlePokemon} pokemon
 * @param {Move | undefined} moveDef
 * @returns {number}
 */
function effectivePriority(pokemon, moveDef) {
  if (!moveDef) return 0
  const ability = abilityOf(pokemon)
  let priority = moveDef.priority ?? 0
  if (ability === 'prankster' && moveDef.category === 'status') priority += 1
  if (
    ability === 'galeWings' &&
    moveDef.type === 'Flying' &&
    pokemon.currentHp >= pokemon.maxHp
  )
    priority += 1
  if (ability === 'triage' && moveDef.effect?.type === 'heal') priority += 3
  if (ability === 'myceliumMight' && moveDef.category === 'status') priority -= 1
  if (ability === 'stall') priority -= 1
  return priority
}

/**
 * Quick Draw: a 30% chance to move first within its priority bracket.
 * @param {BattlePokemon} pokemon
 * @param {boolean} deterministic
 * @returns {boolean}
 */
function quickDrawActive(pokemon, deterministic) {
  return abilityOf(pokemon) === 'quickDraw' && chance(0.3, deterministic)
}

/**
 * Apply a Choice item's lock: the first move used becomes the only move the
 * holder can pick (until it switches out).
 * @param {BattlePokemon} pokemon
 * @param {string} preferredMoveId
 * @returns {string}
 */
function respectChoice(pokemon, preferredMoveId) {
  if (!heldChoiceItem(pokemon)) return preferredMoveId
  if (pokemon.choiceLock && pokemon.moves.includes(pokemon.choiceLock)) return pokemon.choiceLock
  pokemon.choiceLock = preferredMoveId
  return preferredMoveId
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
 * Apply a Z-Crystal's stat boosts to the user (Z-status effects).
 * @param {any} attack
 * @param {Record<string, number>} boost
 * @param {any[]} events
 * @returns {boolean}
 */
function applyZBoostEffect(attack, boost, events) {
  const stages = attack.attacker.statStages ?? (attack.attacker.statStages = {})
  let changed = !1
  for (const [stat, delta] of Object.entries(boost)) {
    const current = stages[stat] ?? 0,
      next = clampStatStage(current + delta)
    if (next === current) continue
    stages[stat] = next
    changed = !0
    events.push({
      type: 'statChange',
      message: `${attack.attacker.name}'s ${getStatLabel(stat)} ${delta > 0 ? 'rose' : 'fell'}!`,
      data: { target: attack.isPlayer ? 'player' : 'enemy' },
    })
  }
  return changed
}

/**
 * Turn the active move into its Max / G-Max / Z-Move form when the holder is
 * Gigantamaxed or holds a matching Z-Crystal. The Z-Power is consumed once per
 * battle; Max forms last as long as the Gigantamax does.
 * @param {any} attack
 * @param {Move} moveDef
 * @param {any[]} events
 * @returns {{ moveDef: Move, transformed: boolean }}
 */
function applyMaxOrZMove(attack, moveDef, events) {
  if (attack.attacker.speciesKey?.startsWith('gx-')) {
    if (moveDef.category === 'status') return { moveDef: moveData.maxGuard ?? moveDef, transformed: !0 }
    const gmaxKey = gmaxMoveFor(attack.attacker.speciesKey, moveDef.type),
      key =
        gmaxKey && moveData[gmaxKey] && moveData[gmaxKey].type === moveDef.type
          ? gmaxKey
          : MAX_MOVE_BY_TYPE[moveDef.type],
      maxDef = moveData[key]
    if (!maxDef) return { moveDef, transformed: !1 }
    const fixed = ['gMaxDrumSolo', 'gMaxFireball', 'gMaxHydrosnipe'].includes(key)
    return {
      moveDef: {
        ...maxDef,
        category: moveDef.category,
        power: fixed ? maxDef.power : maxMoveBasePower(moveDef.power ?? 0, moveDef.type),
        accuracy: 101,
      },
      transformed: !0,
    }
  }
  const crystalType = attack.attacker.heldItem ? Z_CRYSTAL_TYPE[attack.attacker.heldItem] : null
  if (!crystalType || attack.attacker.zMoveUsed || moveDef.type !== crystalType)
    return { moveDef, transformed: !1 }
  if (moveDef.category !== 'status' && (moveDef.power ?? 0) > 0) {
    const zDef = moveData[Z_MOVE_BY_TYPE[crystalType]]
    if (!zDef) return { moveDef, transformed: !1 }
    attack.attacker.zMoveUsed = !0
    return {
      moveDef: { ...zDef, category: moveDef.category, power: zMoveBasePower(moveDef.power), accuracy: 101 },
      transformed: !0,
    }
  }
  if (moveDef.category === 'status') {
    attack.attacker.zMoveUsed = !0
    const boost = Z_STATUS_BOOSTS[attack.moveId]
    if (boost) applyZBoostEffect(attack, boost, events)
    const effect = Z_STATUS_EFFECTS[attack.moveId]
    if (effect === 'clearnegativeboost') {
      const stages = attack.attacker.statStages ?? (attack.attacker.statStages = {})
      for (const stat of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'])
        if ((stages[stat] ?? 0) < 0) stages[stat] = 0
    } else if (effect === 'crit2') attack.attacker.focusEnergy = !0
    else if (effect === 'heal') {
      const healed = Math.min(
        attack.attacker.maxHp,
        attack.attacker.currentHp + Math.floor(attack.attacker.maxHp / 2)
      )
      attack.attacker.currentHp = healed
      events.push({
        type: 'heal',
        message: `${attack.attacker.name} restored HP!`,
        data: { target: attack.isPlayer ? 'player' : 'enemy', hpAfter: healed, hpMax: attack.attacker.maxHp },
      })
    }
    events.push({ type: 'status', message: `${attack.attacker.name} unleashed its Z-Power!` })
    return { moveDef, transformed: !0 }
  }
  return { moveDef, transformed: !1 }
}

/**
 * Abilities / volatile states that make a battler impossible to trap or force
 * out (Suction Cups, Ingrain).
 * @param {any} pokemon
 * @returns {boolean}
 */
function trapPrevented(pokemon) {
  return abilityOf(pokemon) === 'suctionCups' || pokemon?.ingrained === true
}

/**
 * Whether a battler is prevented from switching out (trapped by Block / Mean
 * Look / Spider Web or by Arena Trap / Shadow Tag / Magnet Pull).
 * @param {any} pokemon
 * @returns {boolean}
 */
export function isTrapped(pokemon) {
  return !!(
    pokemon?.trappedByMove ||
    pokemon?.trappedByAbility ||
    (pokemon?.fairyLockTurns ?? 0) > 0
  )
}

/**
 * Queue the switch a move asks for: self-switch pivots (Baton Pass, Teleport,
 * U-turn, Volt Switch, Flip Turn, Shed Tail, Parting Shot), forced switches
 * (Roar, Whirlwind, Dragon Tail, Circle Throw) and trapping moves (Block,
 * Mean Look, Spider Web).
 * @param {any} attack
 * @param {Move} moveDef
 * @param {any[]} events
 * @param {any[]} switchQueue
 */
function pushSwitchEffect(attack, moveDef, events, switchQueue) {
  const effect = moveDef.effect
  if (effect?.type === 'revive') {
    events.push({
      type: 'revive',
      message: `${attack.attacker.name} blessed the fallen!`,
      data: { target: attack.isPlayer ? 'player' : 'enemy' },
    })
    return
  }
  if (effect?.type === 'trap') {
    if (trapPrevented(attack.defender)) {
      events.push({ type: 'status', message: `${attack.defender.name} can't be trapped!` })
      return
    }
    attack.defender.trappedByMove = !0
    events.push({
      type: 'status',
      message: `${attack.defender.name} can no longer escape!`,
      data: { target: attack.isPlayer ? 'enemy' : 'player' },
    })
    return
  }
  if (effect?.type === 'selfSwitch' || moveDef.selfSwitch) {
    if (isTrapped(attack.attacker)) {
      events.push({
        type: 'status',
        message: `${attack.attacker.name} can't switch out!`,
        data: { target: attack.isPlayer ? 'player' : 'enemy' },
      })
      return
    }
    if (effect?.substituteCost) {
      const cost = Math.max(1, Math.floor(attack.attacker.maxHp * effect.substituteCost))
      if (attack.attacker.currentHp <= cost || (attack.attacker.substituteHp ?? 0) > 0) return
      attack.attacker.currentHp -= cost
      attack.attacker.substituteHp = cost
      events.push({
        type: 'recoil',
        message: `${attack.attacker.name} shed its tail! (${cost} HP)`,
        data: {
          target: attack.isPlayer ? 'player' : 'enemy',
          damage: cost,
          hpAfter: attack.attacker.currentHp,
          hpMax: attack.attacker.maxHp,
        },
      })
    }
    switchQueue.push({
      type: 'switchRequest',
      message: `${attack.attacker.name} is switching out!`,
      data: {
        target: attack.isPlayer ? 'player' : 'enemy',
        passBoosts: effect?.passBoosts ? { ...attack.attacker.statStages } : null,
      },
    })
    return
  }
  if (effect?.type === 'forceSwitch') {
    if (trapPrevented(attack.defender) || isTrapped(attack.defender)) {
      events.push({
        type: 'status',
        message: `${attack.defender.name} can't be dragged out!`,
        data: { target: attack.isPlayer ? 'enemy' : 'player' },
      })
      return
    }
    switchQueue.push({
      type: 'switchRequest',
      message: `${attack.defender.name} was dragged out!`,
      data: { target: attack.isPlayer ? 'enemy' : 'player' },
    })
  }
}

/**
 * Arena Trap / Shadow Tag / Magnet Pull pin the opposing active Pokemon on
 * entry (Arena Trap only grounds grounded foes, Magnet Pull only Steel types).
 * @param {any} source
 * @param {any} target
 */
function applyTrapAbility(source, target) {
  const ability = abilityOf(source)
  if (!ability) return
  const grounded =
    !(target.types ?? []).includes('Flying') && abilityOf(target) !== 'levitate'
  const traps =
    ability === 'shadowTag'
      ? abilityOf(target) !== 'shadowTag'
      : ability === 'arenaTrap'
        ? grounded
        : ability === 'magnetPull'
          ? (target.types ?? []).includes('Steel')
          : !1
  if (traps) target.trappedByAbility = !0
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
 * @param {string | null} [enemySkill] AI skill for the foe (defaults from `isTrainerBattle`).
 * @param {string | null} [playerSkill] AI skill for the player's auto-battler.
 * @param {boolean} [playerSkipMove] The player switched or used an item this
 *   turn, so their Pokemon does not attack — only the foe acts.
 * @param {string | null} [playerMoveChoice] The move the player picked in a
 *   manual battle. Forced moves (recharge / charging / locked) still win.
 * @param {boolean} [enemySkipMove] The foe spent its turn switching Pokemon,
 *   so only the player acts.
 * @param {boolean} [skipEndOfTurn] Don't run the end-of-turn residual pass.
 *   A doubles round resolves several single actions and runs it once itself.
 * @param {{ preferStab?: boolean, avoidContact?: boolean } | null} [autoBattlePolicy]
 *   The player's auto-battle move policy, if any.
 * @param {boolean} [weatherLock] The ladder's Weather Lock: the starting
 *   weather can't be changed or expire for the whole battle.
 * @returns {any[]}
 */
export function resolveBattleTurn(player, enemy, isTrainerBattle = !1, firstTurn = !1, weather = null, hazards = null, deterministic = !1, terrain = null, enemySkill = null, playerSkill = null, playerSkipMove = !1, playerMoveChoice = null, enemySkipMove = !1, skipEndOfTurn = !1, inverseTypeChart = !1, autoBattlePolicy = null, weatherLock = !1) {
  const events = /** @type {any[]} */ ([])
  // Switch requests are queued and appended after the end-of-turn residual, so
  // the residuals still apply to the outgoing Pokemon.
  const switchQueue = /** @type {any[]} */ ([])
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
  // Trapping abilities pin the foe every turn (they last only while the
  // trapper is on the field).
  ;(player.trappedByAbility = !1, enemy.trappedByAbility = !1)
  applyTrapAbility(player, enemy)
  applyTrapAbility(enemy, player)
  // Intimidate fires the first time each side is on the field.
  if (firstTurn) {
    applyIntimidate(player, enemy, events, !0)
    applyIntimidate(enemy, player, events, !1)
    applyEntryAbility(player, enemy, events, !0)
    applyEntryAbility(enemy, player, events, !1)
    const weatherSetter =
      WEATHER_ABILITIES[abilityOf(player) ?? ''] ?? WEATHER_ABILITIES[abilityOf(enemy) ?? '']
    if (weatherSetter && !weatherLock)
      activeWeather = { type: weatherSetter, turns: WEATHER_TURNS }
    const playerTerrain = TERRAIN_ABILITIES[abilityOf(player) ?? ''],
      enemyTerrain = TERRAIN_ABILITIES[abilityOf(enemy) ?? ''],
      terrainSetter = playerTerrain ?? enemyTerrain
    if (terrainSetter)
      activeTerrain = {
        type: terrainSetter,
        turns: TERRAIN_TURNS + heldTerrainExtenderTurns(playerTerrain ? player : enemy),
      }
    // Teraform Zero clears the weather and terrain when it enters.
    if (abilityOf(player) === 'teraformZero' || abilityOf(enemy) === 'teraformZero') {
      if (activeWeather && !weatherLock) {
        activeWeather = null
        events.push({ type: 'weather', message: 'The weather was cleared!', data: { weather: null } })
      }
      if (activeTerrain) {
        activeTerrain = null
        events.push({ type: 'terrain', message: 'The terrain was cleared!', data: { terrain: null } })
      }
    }
  }
  // Air Lock / Cloud Nine suppress the weather's effects entirely.
  const weatherSuppressed =
      ['airLock', 'cloudNine'].includes(abilityOf(player) ?? '') ||
      ['airLock', 'cloudNine'].includes(abilityOf(enemy) ?? ''),
    effectiveWeather = weatherSuppressed ? null : activeWeather
  // Leaf Guard blocks status while the sun is shining.
  player.leafGuardActive = abilityOf(player) === 'leafGuard' && effectiveWeather?.type === 'sun'
  enemy.leafGuardActive = abilityOf(enemy) === 'leafGuard' && effectiveWeather?.type === 'sun'
  // Forecast and Mimicry change the holder's type with the weather / terrain.
  for (const [mon, isPlayerSide] of /** @type {[any, boolean][]} */ ([ [player, !0], [enemy, !1] ])) {
    const ability = abilityOf(mon)
    if (ability === 'forecast') {
      const formKey =
        effectiveWeather?.type === 'sun' || effectiveWeather?.type === 'harshSunlight'
          ? 'castform-sunny'
          : effectiveWeather?.type === 'rain' || effectiveWeather?.type === 'heavyRain'
            ? 'castform-rainy'
            : effectiveWeather?.type === 'snow' || effectiveWeather?.type === 'hail'
              ? 'castform-snowy'
              : 'castform'
      changeBattleForm(mon, formKey, events, isPlayerSide)
    } else if (ability === 'mimicry') {
      const type = /** @type {Record<string, string>} */ ({
        electric: 'Electric',
        grassy: 'Grass',
        misty: 'Fairy',
        psychic: 'Psychic',
      })[activeTerrain?.type ?? '']
      if (type) {
        mon.types = [type]
        mon.typesOverride = [type]
      }
    } else if (ability === 'multitype' || ability === 'rksSystem') {
      // Arceus / Silvally take the type of the type-boosting item they hold.
      const type = heldItemBoostType(mon.heldItem)
      if (type) {
        mon.types = [type]
        mon.typesOverride = [type]
      }
    }
  }
  // Flinches only last the turn they were inflicted; clear any left over.
  ;(player.flinch = !1, enemy.flinch = !1)
  // Protect only lasts the turn it is used; clear any left over.
  ;(player.protecting = !1, enemy.protecting = !1)
  ;(player.enduring = !1, enemy.enduring = !1)
  ;(player.magicCoat = !1, enemy.magicCoat = !1)
  ;(player.ionDeluge = !1, enemy.ionDeluge = !1)
  ;(player.electrified = !1, enemy.electrified = !1)
  // Protect can't be used on consecutive turns: remember whether it was used
  // last turn, then clear the chain (a use this turn sets it again).
  ;(player.protectUsedLastTurn = (player.protectChain ?? 0) > 0,
    enemy.protectUsedLastTurn = (enemy.protectChain ?? 0) > 0,
    player.protectChain = 0,
    enemy.protectChain = 0)
  const playerMustRecharge = player.mustRecharge,
    enemyMustRecharge = enemy.mustRecharge
  ;(playerMustRecharge && (player.mustRecharge = !1), enemyMustRecharge && (enemy.mustRecharge = !1))
  // Deterministic (Battle Tower) battles always use the top tier so their
  // move choice matches their no-RNG damage rolls.
  const enemyAiSkill =
      enemySkill ?? (deterministic ? AI_SKILL.smartest : isTrainerBattle ? AI_SKILL.smart : AI_SKILL.dumb),
    playerAiSkill = playerSkill ?? (deterministic ? AI_SKILL.smartest : AI_SKILL.smart)
  let playerMoveId, playerMove
  if (playerSkipMove) {
    // The player switched or used an item, so their Pokemon takes no action.
    playerMoveId = null
    playerMove = void 0
  } else if (playerMustRecharge) ((playerMoveId = player.moves[0]), (playerMove = moveData[playerMoveId]))
  else if (player.chargingMove) ((playerMoveId = player.chargingMove), (playerMove = moveData[playerMoveId]))
  else if (player.lockedMove) ((playerMoveId = player.lockedMove), (playerMove = moveData[playerMoveId]))
  else if (playerMoveChoice && player.moves.includes(playerMoveChoice)) {
    // The player picked this move by hand; Encore / Disable still apply.
    const lockedMove = applyMoveLock(player, respectChoice(player, playerMoveChoice))
    ;((playerMoveId = resolveCalledMove(lockedMove, player, enemy, activeTerrain)), (playerMove = moveData[playerMoveId]))
  } else {
    const bestMove = chooseMoveForBattle(player, enemy, activeHazards, playerAiSkill, inverseTypeChart, autoBattlePolicy),
      lockedMove = applyMoveLock(player, respectChoice(player, bestMove.moveId))
    ;((playerMoveId = resolveCalledMove(lockedMove, player, enemy, activeTerrain)), (playerMove = moveData[playerMoveId]))
  }
  let enemyMoveId, enemyMove
  if (enemyMustRecharge) ((enemyMoveId = enemy.moves[0]), (enemyMove = moveData[enemyMoveId]))
  else if (enemy.chargingMove) ((enemyMoveId = enemy.chargingMove), (enemyMove = moveData[enemyMoveId]))
  else if (enemy.lockedMove) ((enemyMoveId = enemy.lockedMove), (enemyMove = moveData[enemyMoveId]))
  else {
    const bestMove = chooseMoveForBattle(enemy, player, activeHazards, enemyAiSkill, inverseTypeChart),
      lockedMove = applyMoveLock(enemy, respectChoice(enemy, bestMove.moveId))
    ;((enemyMoveId = resolveCalledMove(lockedMove, enemy, player, activeTerrain)), (enemyMove = moveData[enemyMoveId]))
  }
  const trickRoomActive = (player.trickRoomTurns ?? 0) > 0 || (enemy.trickRoomTurns ?? 0) > 0,
    playerSpeed = effectiveSpeed(player, effectiveWeather, activeTerrain),
    enemySpeed = effectiveSpeed(enemy, effectiveWeather, activeTerrain),
    // Trick Room makes the slower Pokemon move first.
    playerActsFirst = trickRoomActive ? playerSpeed <= enemySpeed : playerSpeed >= enemySpeed,
    attackOrder = [],
    playerPriority = playerMustRecharge ? -10 : effectivePriority(player, playerMove),
    enemyPriority = enemyMustRecharge ? -10 : effectivePriority(enemy, enemyMove),
    // Quick Draw is rolled once per side, then breaks a same-priority tie.
    playerQuickDraw = !playerSkipMove && quickDrawActive(player, deterministic),
    enemyQuickDraw = !enemySkipMove && quickDrawActive(enemy, deterministic)
  if (playerSkipMove && enemySkipMove) {
    // Both sides spent the turn switching or using an item.
  } else if (playerSkipMove)
    attackOrder.push({
      attacker: enemy,
      defender: player,
      moveId: enemyMoveId,
      isPlayer: !1,
    })
  else if (enemySkipMove)
    attackOrder.push({
      attacker: player,
      defender: enemy,
      moveId: playerMoveId,
      isPlayer: !0,
    })
  else if (playerPriority > enemyPriority)
    attackOrder.push(
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
  else if (enemyPriority > playerPriority)
    attackOrder.push(
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
  else if (playerQuickDraw && !enemyQuickDraw)
    attackOrder.push(
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
  else if (enemyQuickDraw && !playerQuickDraw)
    attackOrder.push(
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
  else if (playerActsFirst)
    attackOrder.push(
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
  else
    attackOrder.push(
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
  // Snatch (+4 priority) steals the foe's status move. Both moves are already
  // chosen, so swap the queued actions before they resolve.
  if (playerMoveId === 'snatch' && !playerSkipMove && enemyMove?.category === 'status') {
    playerMoveId = enemyMoveId
    playerMove = enemyMove
    const playerAttack = attackOrder.find((entry) => entry.isPlayer),
      enemyAttack = attackOrder.find((entry) => !entry.isPlayer)
    if (playerAttack) playerAttack.moveId = enemyMoveId
    if (enemyAttack) enemyAttack.moveId = null
    events.push({ type: 'status', message: `${player.name} snatched the move!` })
  } else if (enemyMoveId === 'snatch' && !enemySkipMove && playerMove?.category === 'status') {
    enemyMoveId = playerMoveId
    enemyMove = playerMove
    const enemyAttack = attackOrder.find((entry) => !entry.isPlayer),
      playerAttack = attackOrder.find((entry) => entry.isPlayer)
    if (enemyAttack) enemyAttack.moveId = playerMoveId
    if (playerAttack) playerAttack.moveId = null
    events.push({ type: 'status', message: `${enemy.name} snatched the move!` })
  }
  for (const [attackIndex, attack] of attackOrder.entries()) {
    if (attack.attacker.currentHp <= 0) continue
    if (attack.isPlayer ? playerMustRecharge : enemyMustRecharge) {
      events.push({
        type: 'recharge',
        message: `${attack.attacker.name} must recharge!`,
      })
      continue
    }
    // Sleep Talk and Snore are usable while asleep. Tick the sleep counter
    // here, then let the move through instead of skipping the turn.
    const sleepOnlyMove = attack.moveId === 'sleepTalk' || attack.moveId === 'snore'
    let sleepMoveUsable = false
    if (sleepOnlyMove && attack.attacker.status === 'sleep') {
      if ((attack.attacker.statusTurns ?? 0) > 0) {
        attack.attacker.statusTurns = (attack.attacker.statusTurns ?? 0) - 1
        sleepMoveUsable = true
      } else {
        attack.attacker.status = null
        attack.attacker.statusTurns = 0
        events.push({
          type: 'status',
          message: `${attack.attacker.name} woke up!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
    }
    if (
      !sleepMoveUsable &&
      statusPreventsAction(attack.attacker, events, attack.isPlayer, deterministic)
    )
      continue
    if (sleepOnlyMove && !sleepMoveUsable) {
      events.push({
        type: 'status',
        message: `${attack.attacker.name} can't use ${
          moveData[attack.moveId]?.name ?? attack.moveId
        } while awake!`,
      })
      continue
    }
    if (handleConfusion(attack.attacker, events, attack.isPlayer, deterministic)) continue
    if (handleInfatuation(attack.attacker, events, attack.isPlayer, deterministic)) continue
    // Sleep Talk calls a random move from the user's own moveset.
    if (sleepMoveUsable && attack.moveId === 'sleepTalk') {
      const pool = attack.attacker.moves.filter(
        (id) => id !== 'sleepTalk' && moveData[id] && !CALLING_MOVES.has(id)
      )
      if (pool.length === 0) {
        events.push({ type: 'status', message: 'But it failed!' })
        continue
      }
      attack.moveId = deterministic ? pool[0] : pool[Math.floor(Math.random() * pool.length)]
    }
    let moveDef = moveData[attack.moveId]
    if (!moveDef) continue
    // Me First borrows the foe's chosen move (if it is a damaging one) at 1.5x
    // power. The foe's pick is already known for this turn.
    if (attack.moveId === 'meFirst') {
      const targetMoveId = attack.isPlayer ? enemyMoveId : playerMoveId,
        targetMove = targetMoveId ? moveData[targetMoveId] : null
      if (targetMove && (targetMove.power ?? 0) > 0) {
        attack.moveId = targetMoveId
        moveDef = { ...targetMove, power: Math.floor(targetMove.power * 1.5) }
        events.push({
          type: 'status',
          message: `${attack.attacker.name} seized the moment!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else {
        events.push({ type: 'status', message: `${attack.attacker.name}'s Me First failed!` })
        continue
      }
    }
    // Gigantamax (Max Mushroom) and a matching Z-Crystal rewrite the move.
    const maxOrZ = applyMaxOrZMove(attack, moveDef, events)
    moveDef = maxOrZ.moveDef
    const transformedMove = maxOrZ.transformed
    // Track consecutive uses of the same move for Round / Echoed Voice before
    // `lastMove` is overwritten.
    attack.attacker.sameMoveStreak =
      attack.attacker.lastMove === attack.moveId ? (attack.attacker.sameMoveStreak ?? 0) + 1 : 1
    attack.attacker.lastMove = attack.moveId
    // Truant loafs around every other turn.
    if (abilityOf(attack.attacker) === 'truant') {
      if (attack.attacker.truantSkip) {
        attack.attacker.truantSkip = !1
        events.push({
          type: 'status',
          message: `${attack.attacker.name} is loafing around!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
        continue
      }
      attack.attacker.truantSkip = !0
    }
    // Stance Change turns Aegislash into Blade form for an attack and back for
    // King's Shield.
    if (abilityOf(attack.attacker) === 'stanceChange') {
      if (moveDef.name === "King's Shield")
        changeBattleForm(attack.attacker, 'aegislash', events, attack.isPlayer)
      else if (moveDef.category !== 'status')
        changeBattleForm(attack.attacker, 'aegislash-b', events, attack.isPlayer)
    }
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
    // Torment blocks using the same move twice in a row.
    if (
      (attack.attacker.tormentTurns ?? 0) > 0 &&
      attack.attacker.lastMove &&
      attack.moveId === attack.attacker.lastMove
    ) {
      events.push({
        type: 'status',
        message: `${attack.attacker.name} can't use the same move twice in a row!`,
        data: { target: attack.isPlayer ? 'player' : 'enemy' },
      })
      continue
    }
    // Powder: a Fire move detonates the powder instead of landing.
    if (attack.attacker.powdered && moveDef.type === 'Fire') {
      const boom = Math.max(1, Math.floor(attack.attacker.maxHp / 4))
      attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - boom)
      attack.attacker.powdered = !1
      events.push({
        type: 'recoil',
        message: `The powder exploded on ${attack.attacker.name}! (${boom} damage)`,
        data: {
          target: attack.isPlayer ? 'player' : 'enemy',
          damage: boom,
          hpAfter: attack.attacker.currentHp,
          hpMax: attack.attacker.maxHp,
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
        // The move actually used (the base id), so field research can track it.
        moveId: attack.moveId,
      },
    })
    // Two-turn moves: the user charges this turn and strikes on the next. A
    // Max / Z-Move always resolves in one turn.
    const chargeMove = transformedMove ? null : CHARGE_MOVES[attack.moveId]
    if (chargeMove) {
      if (attack.attacker.chargingMove !== attack.moveId) {
        attack.attacker.chargingMove = attack.moveId
        attack.attacker.semiInvulnerable = chargeMove.invulnerable ?? null
        events.push({ type: 'status', message: chargeMove.message(attack.attacker.name) })
        continue
      }
      attack.attacker.chargingMove = null
      attack.attacker.semiInvulnerable = null
    }
    // A semi-invulnerable target (Fly, Dig, Dive, ...) only takes hits from the
    // handful of moves that reach it.
    if (
      attack.defender.semiInvulnerable &&
      !isSelfTargetedMove(moveDef) &&
      !hitsSemiInvulnerable(attack.moveId, attack.defender.semiInvulnerable)
    ) {
      events.push({
        type: 'miss',
        message: `${attack.attacker.name}'s attack missed!`,
      })
      continue
    }
    // Affection: a well-kept companion can read an incoming attack and dodge
    // it outright. Only the player's Pokemon carries the chance, and a move
    // that always hits is never dodged.
    if (
      !attack.isPlayer &&
      !isSelfTargetedMove(moveDef) &&
      moveDef.accuracy <= 100 &&
      (attack.defender.dodgeChance ?? 0) > 0 &&
      Math.random() < attack.defender.dodgeChance
    ) {
      events.push({
        type: 'miss',
        message: `${attack.defender.name} read the attack and dodged!`,
        data: { target: attack.isPlayer ? 'enemy' : 'player' },
      })
      continue
    }
    // Protect blocks anything aimed at the protected Pokemon this turn, but
    // Unseen Fist lets a contact move through it.
    if (
      attack.defender.protecting &&
      !isSelfTargetedMove(moveDef) &&
      !(
        ((abilityOf(attack.attacker) === 'unseenFist' ||
          abilityOf(attack.attacker) === 'piercingDrill') &&
          moveMakesContact(moveDef)) ||
        moveDef.name === 'G-Max One Blow' ||
        moveDef.name === 'G-Max Rapid Flow'
      )
    ) {
      events.push({
        type: 'protect',
        message: `${attack.defender.name} protected itself!`,
        data: {
          target: attack.isPlayer ? 'enemy' : 'player',
          blocked: !0,
        },
      })
      continue
    }
    // Psychic Terrain and Dazzling / Queenly Majesty / Armor Tail block priority
    // moves against the protected side.
    if (
      (moveDef.priority ?? 0) > 0 &&
      (terrainPreventsPriority(activeTerrain, attack.defender) ||
        ['dazzling', 'queenlyMajesty', 'armorTail'].includes(abilityOf(attack.defender) ?? ''))
    ) {
      events.push({
        type: 'status',
        message: `${attack.defender.name} is protected by the terrain!`,
        data: {
          target: attack.isPlayer ? 'enemy' : 'player',
        },
      })
      continue
    }
    // Bulletproof / Soundproof / Damp / Overcoat block their move families.
    if (abilityBlocksMove(attack.defender, moveDef, attack.attacker)) {
      rememberNullifiedMove(attack)
      events.push({
        type: 'miss',
        message: `${attack.defender.name}'s ability blocked the move!`,
      })
      continue
    }
    // Variable-power moves (Heat Crash, Low Kick, ...) store power 0 in the
    // table but are damaging, so they skip the status-move branch.
    if (moveDef.power === 0 && !VARIABLE_POWER_MOVES.has(attack.moveId)) {
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
        const side = attack.isPlayer ? 'player' : 'enemy'
        // A repeat on the next turn fails outright (Gen 6+ behaviour).
        if (attack.attacker.protectUsedLastTurn) {
          events.push({
            type: 'protect',
            message: `${attack.attacker.name}'s protection failed!`,
            data: { target: side, failed: !0 },
          })
        } else {
          attack.attacker.protecting = !0
          attack.attacker.protectChain = 1
          events.push({
            type: 'protect',
            message: `${attack.attacker.name} protected itself!`,
            data: { target: side, blocked: !1 },
          })
        }
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
        applyStatChange(attack, moveDef, events, deterministic)
        if (moveDef.effect.statusCure && attack.attacker.status) {
          attack.attacker.status = null
          attack.attacker.statusTurns = 0
          events.push({
            type: 'status',
            message: `${attack.attacker.name}'s status was cured!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
        if (moveDef.effect.hpCost) {
          const cost = Math.max(1, Math.floor(attack.attacker.maxHp * moveDef.effect.hpCost))
          attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - cost)
          events.push({
            type: 'recoil',
            message: `${attack.attacker.name} cut its own HP! (${cost} damage)`,
            data: {
              target: attack.isPlayer ? 'player' : 'enemy',
              damage: cost,
              hpAfter: attack.attacker.currentHp,
              hpMax: attack.attacker.maxHp,
            },
          })
        }
      } else if (moveDef.effect?.type === 'randomBoost') {
        const stats = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'],
          key = deterministic ? stats[0] : stats[Math.floor(Math.random() * stats.length)],
          stages = attack.attacker.statStages ?? (attack.attacker.statStages = {})
        stages[key] = clampStatStage((stages[key] ?? 0) + 2)
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name}'s ${getStatLabel(key)} rose sharply!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'powerTrick') {
        const attackStat = attack.attacker.attack
        attack.attacker.attack = attack.attacker.defense
        attack.attacker.defense = attackStat
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name} swapped its Attack and Defense!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'psychUp') {
        attack.attacker.statStages = { ...(attack.defender.statStages ?? {}) }
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name} copied ${attack.defender.name}'s stat changes!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'selfCureStatus') {
        if (attack.attacker.status) {
          attack.attacker.status = null
          attack.attacker.statusTurns = 0
          events.push({
            type: 'status',
            message: `${attack.attacker.name}'s status was cured!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      } else if (moveDef.effect?.type === 'magnetRise') {
        attack.attacker.magnetRiseTurns = 5
        events.push({
          type: 'status',
          message: `${attack.attacker.name} levitated with electromagnetism!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'conversion') {
        const firstMove = attack.attacker.moves
          ?.filter((/** @type {string} */ id) => id !== attack.moveId)
          .map((/** @type {string} */ id) => moveData[id])
          .find(Boolean)
        if (firstMove) {
          attack.attacker.types = [firstMove.type]
          attack.attacker.typesOverride = [firstMove.type]
          events.push({
            type: 'status',
            message: `${attack.attacker.name} changed type to ${firstMove.type}!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      } else if (moveDef.effect?.type === 'camouflage') {
        const camoType =
          /** @type {Record<string, string>} */ ({
            electric: 'Electric',
            grassy: 'Grass',
            misty: 'Fairy',
            psychic: 'Psychic',
          })[activeTerrain?.type ?? ''] ?? 'Normal'
        attack.attacker.types = [camoType]
        attack.attacker.typesOverride = [camoType]
        events.push({
          type: 'status',
          message: `${attack.attacker.name} changed type to ${camoType}!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'enduring') {
        attack.attacker.enduring = !0
        events.push({
          type: 'status',
          message: `${attack.attacker.name} braced itself!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'tidyUp') {
        const stages = attack.attacker.statStages ?? (attack.attacker.statStages = {})
        for (const key of ['attack', 'speed'])
          stages[key] = clampStatStage((stages[key] ?? 0) + 1)
        const cleared = emptyBattleHazards()
        activeHazards.player = cleared.player
        activeHazards.enemy = cleared.enemy
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name} tidied up the battlefield!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'psychoShift') {
        if (
          attack.attacker.status &&
          !attack.defender.status &&
          !abilityPreventsStatus(attack.defender, attack.attacker.status)
        ) {
          const shifted = attack.attacker.status
          applyStatus(attack.defender, shifted, events, !attack.isPlayer, deterministic, activeTerrain, !0, attack.attacker)
          if (attack.defender.status === shifted) {
            attack.attacker.status = null
            attack.attacker.statusTurns = 0
          }
        }
      } else if (moveDef.effect?.type === 'purify') {
        if (attack.defender.status) {
          attack.defender.status = null
          attack.defender.statusTurns = 0
          const healed = Math.min(
            attack.attacker.maxHp,
            attack.attacker.currentHp + Math.max(1, Math.floor(attack.attacker.maxHp / 2))
          )
          attack.attacker.currentHp = healed
          events.push({
            type: 'status',
            message: `${attack.attacker.name} purified ${attack.defender.name}!`,
            data: { target: attack.isPlayer ? 'enemy' : 'player' },
          })
          events.push({
            type: 'heal',
            message: `${attack.attacker.name} recovered HP!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy', hpAfter: healed, hpMax: attack.attacker.maxHp },
          })
        }
      } else if (moveDef.effect?.type === 'conversion2') {
        // Conversion 2 picks a type that resists the foe's last move.
        const lastMove = moveData[attack.defender.lastMove ?? '']
        if (lastMove) {
          const TYPE_CHART = [
            'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
            'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
          ]
          const resist = TYPE_CHART.find((type) => getTypeEffectiveness(lastMove.type, [type]) < 1)
          if (resist) {
            attack.attacker.types = [resist]
            attack.attacker.typesOverride = [resist]
            events.push({
              type: 'status',
              message: `${attack.attacker.name} changed type to ${resist}!`,
              data: { target: attack.isPlayer ? 'player' : 'enemy' },
            })
          }
        }
      } else if (moveDef.effect?.type === 'courtChange') {
        const swap = activeHazards.player
        activeHazards.player = activeHazards.enemy
        activeHazards.enemy = swap
        events.push({ type: 'status', message: `${attack.attacker.name} swapped the battlefield hazards!` })
      } else if (moveDef.effect?.type === 'foresight') {
        attack.defender.identified = !0
        events.push({
          type: 'status',
          message: `${attack.attacker.name} identified ${attack.defender.name}!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      } else if (moveDef.effect?.type === 'luckyChant') {
        attack.attacker.luckyChantTurns = 5
        events.push({
          type: 'status',
          message: `${attack.attacker.name} shielded itself from critical hits!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'powerShift') {
        const attackStat = attack.attacker.attack
        attack.attacker.attack = attack.attacker.spAttack
        attack.attacker.spAttack = attackStat
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name} shifted its power!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'stockpile') {
        attack.attacker.stockpile = Math.min(3, (attack.attacker.stockpile ?? 0) + 1)
        events.push({
          type: 'status',
          message: `${attack.attacker.name} stockpiled ${attack.attacker.stockpile}!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'swallow') {
        const stock = attack.attacker.stockpile ?? 0
        if (stock > 0 && !healBlocked(attack.attacker)) {
          const percent = stock === 1 ? 25 : stock === 2 ? 50 : 100,
            healed = Math.min(
              attack.attacker.maxHp,
              attack.attacker.currentHp + Math.max(1, Math.floor((attack.attacker.maxHp * percent) / 100))
            )
          attack.attacker.currentHp = healed
          attack.attacker.stockpile = 0
          events.push({
            type: 'heal',
            message: `${attack.attacker.name} swallowed its stockpile!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy', hpAfter: healed, hpMax: attack.attacker.maxHp },
          })
        }
      } else if (moveDef.effect?.type === 'torment') {
        attack.defender.tormentTurns = 5
        events.push({
          type: 'status',
          message: `${attack.defender.name} was subjected to torment!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      } else if (moveDef.effect?.type === 'transform') {
        attack.attacker.types = [...attack.defender.types]
        attack.attacker.typesOverride = [...attack.defender.types]
        for (const stat of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'])
          attack.attacker[stat] = attack.defender[stat]
        events.push({
          type: 'status',
          message: `${attack.attacker.name} transformed into ${attack.defender.name}!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'nightmare') {
        if (attack.defender.status === 'sleep') {
          attack.defender.nightmare = !0
          events.push({
            type: 'status',
            message: `${attack.defender.name} began having a nightmare!`,
            data: { target: attack.isPlayer ? 'enemy' : 'player' },
          })
        }
      } else if (moveDef.effect?.type === 'doodle') {
        attack.defender.abilityOverride = abilityOf(attack.attacker)
        attack.defender.abilitySuppressed = !1
        events.push({
          type: 'status',
          message: `${attack.defender.name} copied ${attack.attacker.name}'s ability!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      } else if (moveDef.effect?.type === 'gravity') {
        attack.attacker.gravityTurns = 5
        attack.defender.gravityTurns = 5
        events.push({ type: 'status', message: 'Gravity intensified!' })
      } else if (moveDef.effect?.type === 'telekinesis') {
        attack.defender.telekinesisTurns = 3
        events.push({
          type: 'status',
          message: `${attack.defender.name} was hurled into the air!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      } else if (moveDef.effect?.type === 'sport') {
        const turns = 5,
          sport = moveDef.effect.sport
        for (const mon of [attack.attacker, attack.defender]) {
          mon.sportTurns = turns
          mon.sportType = sport
        }
        events.push({
          type: 'status',
          message: sport === 'mud' ? 'Electricity was weakened!' : 'Fire was weakened!',
        })
      } else if (moveDef.effect?.type === 'powder') {
        if (!attack.defender.types.includes('Grass')) {
          attack.defender.powdered = !0
          events.push({
            type: 'status',
            message: `${attack.defender.name} was covered in powder!`,
            data: { target: attack.isPlayer ? 'enemy' : 'player' },
          })
        }
      } else if (moveDef.effect?.type === 'embargo') {
        attack.defender.embargoTurns = 5
        events.push({
          type: 'status',
          message: `${attack.defender.name} can't use its held item!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      } else if (moveDef.effect?.type === 'wonderRoom') {
        attack.attacker.wonderRoomTurns = 5
        attack.defender.wonderRoomTurns = 5
        events.push({ type: 'status', message: 'The dimensions became strange!' })
      } else if (moveDef.effect?.type === 'ionDeluge') {
        attack.attacker.ionDeluge = !0
        attack.defender.ionDeluge = !0
        events.push({ type: 'status', message: 'A deluge of ions charges the field!' })
      } else if (moveDef.effect?.type === 'electrify') {
        attack.defender.electrified = !0
        events.push({
          type: 'status',
          message: `${attack.defender.name} was electrified!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      } else if (moveDef.effect?.type === 'magicCoat') {
        attack.attacker.magicCoat = !0
        events.push({
          type: 'status',
          message: `${attack.attacker.name} shrouded itself in a magic coat!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'teatime') {
        for (const mon of [attack.attacker, attack.defender]) {
          const heal = heldBerryHeal(mon)
          if (heal > 0) {
            mon.heldItemUsed = !0
            mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal)
            events.push({
              type: 'heal',
              message: `${mon.name} ate its held Berry!`,
              data: {
                target: mon === attack.attacker ? (attack.isPlayer ? 'player' : 'enemy') : attack.isPlayer ? 'enemy' : 'player',
                hpAfter: mon.currentHp,
                hpMax: mon.maxHp,
              },
            })
          }
        }
      } else if (moveDef.effect?.type === 'happyHour') {
        attack.attacker.happyHour = !0
        events.push({
          type: 'status',
          message: `Everyone is celebrating \u2014 prize money is doubled!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      } else if (moveDef.effect?.type === 'fairyLock') {
        attack.attacker.fairyLockTurns = 2
        attack.defender.fairyLockTurns = 2
        events.push({
          type: 'status',
          message: 'The battlefield was sealed with a fairy lock!',
        })
      } else if (moveDef.effect?.type === 'mimic' || moveDef.effect?.type === 'sketch') {
        // Copy the foe's last move into the user's moveset (the reducer edits
        // the party member; Mimic replaces Mimic, Sketch replaces Sketch).
        const learned = attack.defender.lastMove
        if (learned && moveData[learned])
          events.push({
            type: 'learnMove',
            message: `${attack.attacker.name} copied ${moveData[learned].name}!`,
            data: {
              moveId: learned,
              replace: attack.moveId,
              target: attack.isPlayer ? 'player' : 'enemy',
            },
          })
      } else if (moveDef.effect?.type === 'magicRoom') {
        attack.attacker.magicRoomTurns = 5
        attack.defender.magicRoomTurns = 5
        events.push({
          type: 'status',
          message: 'The dimensions became strange \u2014 held items are disabled!',
        })
      } else if (
        moveDef.effect?.type === 'status' &&
        (moveDef.effect.chance === void 0 ||
          chance(
            (moveDef.effect.chance * (abilityOf(attack.attacker) === 'sereneGrace' ? 2 : 1)) / 100,
            deterministic
          ))
      )
        applyStatus(attack.defender, moveDef.effect.status, events, !attack.isPlayer, deterministic, activeTerrain, !0, attack.attacker)
      else if (moveDef.effect?.type === 'heal' && healBlocked(attack.attacker))
        events.push({
          type: 'status',
          message: `${attack.attacker.name} can't restore HP because of Heal Block!`,
          data: {
            target: attack.isPlayer ? 'player' : 'enemy',
          },
        })
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
        if ((attack.defender.tauntTurns ?? 0) <= 0 && abilityOf(attack.defender) !== 'aromaVeil') {
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
      else if (moveDef.effect?.type === 'speedSwap') {
        // Speed Swap trades the raw Speed stats (not the stat stages).
        const attackerSpeed = attack.attacker.speed,
          defenderSpeed = attack.defender.speed
        attack.attacker.speed = defenderSpeed
        attack.defender.speed = attackerSpeed
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name} swapped Speed with ${attack.defender.name}!`,
        })
      }
      else if (moveDef.effect?.type === 'statSplit') {
        // Power / Guard Split averages the raw stats (rounded down), ignoring
        // stat stages, and gives both battlers the average.
        for (const stat of moveDef.effect.stats) {
          const average = Math.floor(
            ((attack.attacker[stat] ?? 0) + (attack.defender[stat] ?? 0)) / 2
          )
          attack.attacker[stat] = average
          attack.defender[stat] = average
        }
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name} shared its stats with ${attack.defender.name}!`,
        })
      }
      else if (moveDef.effect?.type === 'healBlock') {
        if ((attack.defender.healBlockTurns ?? 0) <= 0) {
          attack.defender.healBlockTurns = 5
          events.push({
            type: 'status',
            message: `${attack.defender.name} was prevented from healing!`,
            data: {
              target: attack.isPlayer ? 'enemy' : 'player',
            },
          })
        }
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
      else if (moveDef.effect?.type === 'itemSwap') {
        if (abilityOf(attack.attacker) === 'stickyHold' || abilityOf(attack.defender) === 'stickyHold') {
          events.push({
            type: 'status',
            message: `${attack.attacker.name}'s ${moveDef.name} failed!`,
          })
        } else {
          const attackerItem = attack.attacker.heldItem ?? null,
            defenderItem = attack.defender.heldItem ?? null
        attack.attacker.heldItem = defenderItem
        attack.attacker.heldItemOverride = defenderItem
        attack.attacker.heldItemOverridden = !0
        attack.defender.heldItem = attackerItem
        attack.defender.heldItemOverride = attackerItem
        attack.defender.heldItemOverridden = !0
        events.push({
          type: 'status',
          message: `${attack.attacker.name} swapped held items with ${attack.defender.name}!`,
        })
        }
      }
      else if (moveDef.effect?.type === 'bestow') {
        if (!attack.defender.heldItem && attack.attacker.heldItem) {
          const item = attack.attacker.heldItem
          attack.defender.heldItem = item
          attack.defender.heldItemOverride = item
          attack.defender.heldItemOverridden = !0
          attack.attacker.heldItem = null
          attack.attacker.heldItemOverride = null
          attack.attacker.heldItemOverridden = !0
          events.push({
            type: 'status',
            message: `${attack.attacker.name} gave its held item to ${attack.defender.name}!`,
          })
        } else {
          events.push({
            type: 'status',
            message: `${attack.attacker.name}'s Bestow failed!`,
          })
        }
      }
      else if (moveDef.effect?.type === 'corrosiveGas') {
        if (attack.defender.heldItem && abilityOf(attack.defender) !== 'stickyHold') {
          attack.defender.heldItem = null
          attack.defender.heldItemOverride = null
          attack.defender.heldItemOverridden = !0
          events.push({
            type: 'status',
            message: `${attack.defender.name}'s held item was corroded away!`,
            data: { target: attack.isPlayer ? 'enemy' : 'player' },
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
      else if (moveDef.effect?.type === 'weather' && !weatherLock) {
        activeWeather = { type: moveDef.effect.weather, turns: WEATHER_TURNS }
        events.push({
          type: 'weather',
          message: `The weather became ${WEATHER_NAMES[moveDef.effect.weather] ?? moveDef.effect.weather}!`,
        })
      } else if (moveDef.effect?.type === 'terrain') {
        activeTerrain = {
          type: moveDef.effect.terrain,
          turns: TERRAIN_TURNS + heldTerrainExtenderTurns(attack.attacker),
        }
        events.push({
          type: 'terrain',
          message: `The battlefield became ${TERRAIN_NAMES[moveDef.effect.terrain] ?? moveDef.effect.terrain}!`,
        })
      } else if (moveDef.effect?.type === 'healingWish') {
        // The user faints (via `selfDestruct` below); the reducer heals the
        // next Pokemon sent out when it consumes this event.
        events.push({
          type: 'healingWish',
          message: `${attack.attacker.name} made a wish for its team!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
      // Status moves flagged selfDestruct (Memento) faint their user too.
      if (moveDef.selfDestruct && attack.attacker.currentHp > 0) {
        attack.attacker.currentHp = 0
        events.push({
          type: 'faint',
          message: `${attack.attacker.name} fainted!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
      // Trapping / switching status moves queue their effect.
      pushSwitchEffect(attack, moveDef, events, switchQueue)
      continue
    }
    // Weather rewrites Weather Ball's type/power, abilities like Normalize and
    // the -ate family rewrite the move type, and Compound Eyes / Victory Star
    // sharpen accuracy.
    const baseMove = abilityChangesMoveType(
        attack.attacker,
        applyWeatherToMove(effectiveWeather, moveDef)
      ),
      // Ion Deluge turns Normal moves Electric; Electrify forces Electric on the
      // target's next move.
      baseMove2 =
        (baseMove.type === 'Normal' && (attack.attacker.ionDeluge || attack.defender.ionDeluge)) ||
        attack.attacker.electrified
          ? { ...baseMove, type: 'Electric' }
          : baseMove,
      accuracyMult =
        (abilityOf(attack.attacker) === 'compoundEyes' ? 1.3 : 1) *
        (abilityOf(attack.attacker) === 'victoryStar' ? 1.1 : 1) *
        // Wonder Skin halves the accuracy of status moves aimed at its holder.
        (baseMove.category === 'status' ? abilityStatusAccuracyMultiplier(attack.defender) : 1),
      accuracyMove =
        accuracyMult === 1 || !(baseMove2.accuracy > 0) || baseMove2.accuracy > 100
          ? baseMove2
          : { ...baseMove2, accuracy: Math.min(100, baseMove2.accuracy * accuracyMult) },
      // Heat Crash, Electro Ball, Eruption, Stored Power, ... fill in their base
      // power from the two battlers here.
      effectiveMove = withVariablePower(
        attack.moveId,
        attack.attacker,
        attack.defender,
        accuracyMove,
        { terrain: activeTerrain, movedFirst: attackIndex === 0 }
      )
    // Protean / Libero change the user's type to the move it is about to use.
    if (abilityOf(attack.attacker) === 'protean' || abilityOf(attack.attacker) === 'libero') {
      attack.attacker.types = [effectiveMove.type]
      attack.attacker.typesOverride = [effectiveMove.type]
    }
    // Gulp Missile: Cramorant swallows its catch when it uses Surf or Dive.
    if (
      abilityOf(attack.attacker) === 'gulpMissile' &&
      attack.attacker.speciesKey === 'cramorant' &&
      (effectiveMove.name === 'Surf' || effectiveMove.name === 'Dive')
    )
      changeBattleForm(
        attack.attacker,
        attack.attacker.currentHp <= attack.attacker.maxHp / 2
          ? 'cramorant-gorging'
          : 'cramorant-gulping',
        events,
        attack.isPlayer
      )
    // The extreme weathers refuse the opposite elemental type.
    if (
      (effectiveWeather?.type === 'harshSunlight' && effectiveMove.type === 'Water') ||
      (effectiveWeather?.type === 'heavyRain' && effectiveMove.type === 'Fire')
    ) {
      events.push({
        type: 'miss',
        message: `The ${effectiveMove.type}-type move was negated by the extreme weather!`,
      })
      continue
    }
    // Levitate / type-absorbing abilities negate the move (and usually heal).
    if (abilityAbsorbsType(attack.defender, effectiveMove.type, attack.attacker)) {
      rememberNullifiedMove(attack)
      if (abilityHealsFromType(attack.defender, effectiveMove.type, attack.attacker) && !healBlocked(attack.defender)) {
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
    // Magnet Rise grounds the holder against Ground moves for a few turns.
    if (
      ((attack.defender.magnetRiseTurns ?? 0) > 0 || (attack.defender.telekinesisTurns ?? 0) > 0) &&
      effectiveMove.type === 'Ground'
    ) {
      events.push({ type: 'miss', message: `${attack.defender.name} is levitating!` })
      continue
    }
    // Wind Rider is immune to wind moves and gains Attack from them.
    if (abilityBlocksWind(attack.defender, effectiveMove, attack.attacker)) {
      rememberNullifiedMove(attack)
      const windStages = attack.defender.statStages ?? (attack.defender.statStages = {}),
        windCurrent = windStages.attack ?? 0,
        windNext = clampStatStage(windCurrent + 1)
      if (windNext !== windCurrent) {
        windStages.attack = windNext
        events.push({
          type: 'statChange',
          message: `${attack.defender.name}'s Attack rose!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      }
      events.push({
        type: 'miss',
        message: `${attack.defender.name}'s Wind Rider made it immune!`,
      })
      continue
    }
    // Laser Focus guarantees this hit crits; Merciless always crits a statused
    // foe; Lock-On / Mind Reader make it land.
    const guaranteedCrit =
        attack.attacker.laserFocus === !0 ||
        (abilityOf(attack.attacker) === 'merciless' && !!attack.defender.status),
      neverMiss =
        (attack.attacker.lockOnTurns ?? 0) > 0 ||
        (attack.defender.telekinesisTurns ?? 0) > 0 ||
        abilityOf(attack.attacker) === 'noGuard' ||
        abilityOf(attack.defender) === 'noGuard'
    if (attack.attacker.laserFocus === !0) attack.attacker.laserFocus = !1
    if ((attack.attacker.lockOnTurns ?? 0) > 0) attack.attacker.lockOnTurns = 0
    // Scrappy and Mind's Eye let Normal and Fighting moves hit Ghost-types,
    // Foresight identifies the foe, and Gravity grounds a Flying target.
    let defenderTypesForMove =
      (abilityHitsGhost(attack.attacker) || attack.defender.identified) &&
      (effectiveMove.type === 'Normal' || effectiveMove.type === 'Fighting')
        ? attack.defender.types.filter((type) => type !== 'Ghost')
        : attack.defender.types
    if (effectiveMove.type === 'Ground' && (attack.defender.gravityTurns ?? 0) > 0)
      defenderTypesForMove = defenderTypesForMove.filter((type) => type !== 'Flying')
    const attackStat =
        (moveDef.category === 'physical'
          ? attack.attacker.status === 'burn'
            ? Math.max(1, Math.floor(attack.attacker.attack / 2))
            : attack.attacker.attack
          : attack.attacker.spAttack) *
        (abilityOf(attack.attacker) === 'defeatist' &&
        attack.attacker.currentHp <= attack.attacker.maxHp / 2
          ? 0.5
          : 1) *
        (abilityOf(attack.attacker) === 'slowStart' && (attack.attacker.slowStartTurns ?? 0) > 0
          ? 0.5
          : 1) *
        (abilityOf(attack.attacker) === 'flowerGift' && effectiveWeather?.type === 'sun' ? 1.5 : 1) *
        (abilityOf(attack.attacker) === 'orichalcumPulse' &&
        moveDef.category === 'physical' &&
        effectiveWeather?.type === 'sun'
          ? 1.33
          : 1) *
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
        (moveDef.category === 'physical'
          ? (attack.attacker.wonderRoomTurns ?? 0) > 0 || (attack.defender.wonderRoomTurns ?? 0) > 0
            ? attack.defender.spDefense
            : attack.defender.defense
          : (attack.attacker.wonderRoomTurns ?? 0) > 0 || (attack.defender.wonderRoomTurns ?? 0) > 0
            ? attack.defender.defense
            : attack.defender.spDefense) *
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
      evasionStage =
        getStatStage(attack.defender, 'evasion') +
        (abilityOf(attack.defender) === 'sandVeil' && effectiveWeather?.type === 'sandstorm' ? 1 : 0) +
        (abilityOf(attack.defender) === 'snowCloak' &&
        (effectiveWeather?.type === 'snow' || effectiveWeather?.type === 'hail')
          ? 1
          : 0) +
        (abilityOf(attack.defender) === 'tangledFeet' && (attack.defender.confusionTurns ?? 0) > 0
          ? 1
          : 0),
      damageResult = calculateDamage(
        attack.attacker.level,
        attackStat,
        defenseStat,
        effectiveMove,
        attack.attacker.types,
        defenderTypesForMove,
        attackerStage,
        defenderStage,
        Math.max(
          (moveDef.critStage ?? 0) +
            (abilityOf(attack.attacker) === 'superLuck' ? 1 : 0) +
            (attack.attacker.focusEnergy ? 2 : 0) +
            (attack.attacker.critBonus ?? 0),
          guaranteedCrit ? 3 : 0
        ),
        neverMiss,
        accuracyStage,
        evasionStage,
        deterministic,
        abilityOf(attack.attacker) === 'sniper' ? 2.25 : 2,
        ['battleArmor', 'shellArmor'].includes(abilityOf(attack.defender) ?? '') ||
          (attack.defender.luckyChantTurns ?? 0) > 0,
        inverseTypeChart
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
        abilityOf(attack.attacker) === 'skillLink'
          ? moveDef.multiHit[1]
          : moveDef.multiHit[0] +
            Math.floor(Math.random() * (moveDef.multiHit[1] - moveDef.multiHit[0] + 1))
      for (let hit = 1; hit < hitCount; hit++) {
        const hitResult = calculateDamage(
          attack.attacker.level,
          attackStat,
          defenseStat,
          effectiveMove,
          attack.attacker.types,
          defenderTypesForMove,
          attackerStage,
          defenderStage,
          Math.max(
            (moveDef.critStage ?? 0) +
              (abilityOf(attack.attacker) === 'superLuck' ? 1 : 0) +
              (attack.attacker.focusEnergy ? 2 : 0) +
              (attack.attacker.critBonus ?? 0),
            guaranteedCrit ? 3 : 0
          ),
          !0,
          accuracyStage,
          evasionStage,
          deterministic,
          abilityOf(attack.attacker) === 'sniper' ? 2.25 : 2,
          ['battleArmor', 'shellArmor'].includes(abilityOf(attack.defender) ?? '') ||
            (attack.defender.luckyChantTurns ?? 0) > 0,
          inverseTypeChart
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
        abilityDamageDealtMultiplier(attack.attacker, effectiveMove, effectiveWeather) *
        rivalryDamageMultiplier(attack.attacker, attack.defender) *
        stakeoutDamageMultiplier(attack.attacker, attack.isPlayer ? enemySkipMove : playerSkipMove) *
        abilityDamageTakenMultiplier(attack.defender, effectiveMove, attack.attacker) *
        heldDamageMultiplier(attack.attacker, effectiveMove) *
        weatherDamageMultiplier(effectiveWeather, effectiveMove) *
        fieldAuraMultiplier(player, enemy, effectiveMove) *
        terrainDamageMultiplier(activeTerrain, attack.attacker, effectiveMove, attack.defender)
    )
    // Charge (and Electromorphosis / Wind Power) doubles the next Electric move.
    if (attack.attacker.charged && effectiveMove.type === 'Electric') {
      totalDamage = Math.max(1, Math.floor(totalDamage * 2))
      attack.attacker.charged = false
    }
    // Mud Sport weakens Electric moves and Water Sport weakens Fire moves.
    if ((attack.attacker.sportTurns ?? 0) > 0) {
      if (attack.attacker.sportType === 'mud' && effectiveMove.type === 'Electric')
        totalDamage = Math.max(1, Math.floor(totalDamage / 2))
      if (attack.attacker.sportType === 'water' && effectiveMove.type === 'Fire')
        totalDamage = Math.max(1, Math.floor(totalDamage / 2))
    }
    if (abilityHalvesSuperEffective(attack.defender, attack.attacker) && damageResult.effectiveness > 1)
      totalDamage = Math.max(1, Math.floor(totalDamage / 2))
    // Tera Shell halves every hit while the holder is at full HP.
    if (
      abilityOf(attack.defender) === 'teraShell' &&
      attack.defender.currentHp >= attack.defender.maxHp &&
      totalDamage > 0
    )
      totalDamage = Math.max(1, Math.floor(totalDamage / 2))
    // Tinted Lens / Neuroforce scale the effectiveness-based damage (but never
    // turn an immune hit into damage).
    if (totalDamage > 0)
      totalDamage = Math.max(
        1,
        Math.floor(totalDamage * abilityEffectivenessMultiplier(attack.attacker, damageResult.effectiveness))
      )
    // Delta Stream cancels Flying-type weaknesses.
    if (
      effectiveWeather?.type === 'strongWinds' &&
      attack.defender.types.includes('Flying') &&
      damageResult.effectiveness > 1
    )
      totalDamage = Math.max(1, Math.floor(totalDamage / damageResult.effectiveness))
    if (abilityBlocksNonSuperEffective(attack.defender, damageResult.effectiveness, attack.attacker)) {
      rememberNullifiedMove(attack)
      events.push({
        type: 'miss',
        message: `${attack.defender.name}'s Wonder Guard blocked the move!`,
      })
      continue
    }
    totalDamage = abilitySurvivesAtFullHp(attack.defender, attack.defender.currentHp, totalDamage, attack.attacker)
    // Endure keeps the holder alive at 1 HP for the rest of the turn.
    if (attack.defender.enduring && totalDamage >= attack.defender.currentHp)
      totalDamage = Math.max(0, attack.defender.currentHp - 1)
    const sashDamage = heldSurvivesAtFullHp(
      attack.defender,
      attack.defender.currentHp,
      totalDamage
    )
    if (sashDamage !== totalDamage) {
      totalDamage = sashDamage
      attack.defender.heldItemUsed = !0
    }
    // Affection: a well-kept companion can tough out a knockout, leaving it at
    // 1 HP. The chance is rolled on the player's Pokemon only, once per battle
    // (set when the active battler is the pinned companion).
    if (
      !attack.isPlayer &&
      !attack.defender.toughOutUsed &&
      (attack.defender.toughOutChance ?? 0) > 0 &&
      totalDamage >= attack.defender.currentHp &&
      Math.random() < attack.defender.toughOutChance
    ) {
      totalDamage = Math.max(0, attack.defender.currentHp - 1)
      attack.defender.toughOutUsed = !0
      events.push({
        type: 'status',
        message: `${attack.defender.name} toughed it out so you wouldn't feel sad!`,
        data: { target: 'player' },
      })
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
    // Parental Bond lands a second, weaker hit.
    if (
      abilityOf(attack.attacker) === 'parentalBond' &&
      !moveDef.multiHit &&
      (moveDef.power ?? 0) > 0
    )
      totalDamage += Math.max(1, Math.floor(totalDamage * 0.25))
    // Disguise (Mimikyu) and Ice Face (Eiscue) absorb the first hit.
    const defenderAbility = abilityOf(attack.defender)
    if (
      (defenderAbility === 'disguise' && !attack.defender.disguiseBroken) ||
      (defenderAbility === 'iceFace' &&
        !attack.defender.iceFaceBroken &&
        effectiveMove.category === 'physical')
    ) {
      if (defenderAbility === 'disguise') attack.defender.disguiseBroken = !0
      else {
        attack.defender.iceFaceBroken = !0
        changeBattleForm(attack.defender, 'eiscue-noice', events, !attack.isPlayer)
      }
      events.push({
        type: 'miss',
        message: `${attack.defender.name}'s ${defenderAbility === 'disguise' ? 'disguise' : 'Ice Face'} absorbed the hit!`,
      })
      continue
    }
    // Recoil, drain and Liquid Ooze all scale off the damage actually dealt
    // (capped at the target's remaining HP), not the attack's raw damage.
    const dealtDamage = Math.min(totalDamage, defenderHpBefore)
    if (
      ((attack.defender.currentHp = Math.max(0, attack.defender.currentHp - totalDamage)),
      events.push({
        type: 'damage',
        message: `${attack.defender.name} took ${dealtDamage} damage!${
          hitCount > 1 ? ` (${hitCount} hits)` : ''
        }`,
        data: {
          target: attack.isPlayer ? 'enemy' : 'player',
          damage: dealtDamage,
          hpAfter: attack.defender.currentHp,
          hpMax: attack.defender.maxHp,
          // The move that landed, so the battle scene can flash a matching
          // impact over the target.
          moveId: attack.moveId,
          moveType: moveDef?.type,
          moveCategory: moveDef?.category,
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
        case 'weather': {
          if (!weatherLock) {
            activeWeather = { type: moveDef.effect.weather, turns: WEATHER_TURNS }
            events.push({
              type: 'weather',
              message: `The weather became ${WEATHER_NAMES[moveDef.effect.weather] ?? moveDef.effect.weather}!`,
            })
          }
          break
        }
        case 'terrain': {
          activeTerrain = {
            type: moveDef.effect.terrain,
            turns: TERRAIN_TURNS + heldTerrainExtenderTurns(attack.attacker),
          }
          events.push({
            type: 'terrain',
            message: `The battlefield became ${TERRAIN_NAMES[moveDef.effect.terrain] ?? moveDef.effect.terrain}!`,
          })
          break
        }
        case 'hazard': {
          const targetSide = /** @type {any} */ (
              attack.isPlayer ? activeHazards.enemy : activeHazards.player
            ),
            hazard = moveDef.effect.hazard
          if (hazard === 'spikes') targetSide.spikes = Math.min(3, targetSide.spikes + 1)
          else if (hazard === 'toxicSpikes')
            targetSide.toxicSpikes = Math.min(2, targetSide.toxicSpikes + 1)
          else targetSide[hazard] = !0
          events.push({ type: 'hazard', message: `${attack.attacker.name} set up a hazard!` })
          break
        }
        case 'leechSeed':
          applyLeechSeed(attack.defender, events, !attack.isPlayer)
          break
        case 'infatuation':
          applyInfatuation(attack.attacker, attack.defender, events, !attack.isPlayer)
          break
        case 'confusion':
          applyConfusion(attack.defender, events, !attack.isPlayer, deterministic)
          break
        case 'heal': {
          if (healBlocked(attack.attacker)) break
          const healed = Math.min(
            attack.attacker.maxHp,
            attack.attacker.currentHp +
              Math.max(1, Math.floor((attack.attacker.maxHp * (moveDef.effect.percentage ?? 50)) / 100))
          )
          attack.attacker.currentHp = healed
          events.push({
            type: 'heal',
            message: `${attack.attacker.name} restored HP!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy', hpAfter: healed, hpMax: attack.attacker.maxHp },
          })
          break
        }
        case 'selfCureStatus': {
          if (attack.attacker.status) {
            attack.attacker.status = null
            attack.attacker.statusTurns = 0
            events.push({
              type: 'status',
              message: `${attack.attacker.name}'s status was cured!`,
              data: { target: attack.isPlayer ? 'player' : 'enemy' },
            })
          }
          break
        }
        case 'focusEnergy':
          attack.attacker.focusEnergy = !0
          events.push({
            type: 'status',
            message: `${attack.attacker.name} is getting pumped!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
          break
        case 'screen': {
          const screens = attack.attacker.screens ?? (attack.attacker.screens = { reflect: 0, lightScreen: 0 })
          if (moveDef.effect.screen === 'both') {
            screens.reflect = 5
            screens.lightScreen = 5
          } else screens[moveDef.effect.screen] = 5
          events.push({
            type: 'statChange',
            message: `${attack.attacker.name} put up a barrier!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
          break
        }
        case 'torment':
          attack.defender.tormentTurns = 5
          events.push({
            type: 'status',
            message: `${attack.defender.name} was subjected to torment!`,
            data: { target: attack.isPlayer ? 'enemy' : 'player' },
          })
          break
        case 'removeScreens':
          if (attack.defender.screens) {
            attack.defender.screens = { reflect: 0, lightScreen: 0 }
            events.push({
              type: 'status',
              message: `${attack.attacker.name} blew away the barriers!`,
              data: { target: attack.isPlayer ? 'enemy' : 'player' },
            })
          }
          break
        case 'recoil': {
          // Rock Head ignores recoil damage.
          if (abilityOf(attack.attacker) === 'rockHead') break
          const recoilDamage = Math.max(1, Math.floor(dealtDamage * moveDef.effect.fraction))
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
          // Liquid Ooze turns the drain into damage for the attacker.
          if (abilityOf(attack.defender) === 'liquidOoze') {
            const oozeDamage = Math.max(
              1,
              Math.floor((dealtDamage * (moveDef.effect.percentage ?? 50)) / 100)
            )
            attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - oozeDamage)
            events.push({
              type: 'recoil',
              message: `${attack.attacker.name} was hurt by Liquid Ooze! (${oozeDamage} damage)`,
              data: {
                target: attack.isPlayer ? 'player' : 'enemy',
                damage: oozeDamage,
                hpAfter: attack.attacker.currentHp,
                hpMax: attack.attacker.maxHp,
              },
            })
            attack.attacker.currentHp <= 0 &&
              events.push({
                type: 'faint',
                message: `${attack.attacker.name} fainted!`,
                data: { target: attack.isPlayer ? 'player' : 'enemy' },
              })
            break
          }
          // Heal Block suppresses the drain's recovery, but not the damage.
          if (healBlocked(attack.attacker)) break
          const attackerHpBefore = attack.attacker.currentHp,
            healAmount = Math.max(
              1,
              Math.floor((dealtDamage * (moveDef.effect.percentage ?? 50)) / 100)
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
          // Shield Dust ignores secondary effects on its holder.
          if (abilityOf(attack.defender) === 'shieldDust') break
          // Fake Out only flinches on the user's first turn on the field.
          if (moveDef.effect.firstTurnOnly && !firstTurn) break
          if (
            moveDef.effect.chance === void 0 ||
            chance(
              (moveDef.effect.chance * (abilityOf(attack.attacker) === 'sereneGrace' ? 2 : 1)) /
                100,
              deterministic
            )
          )
            applyStatus(attack.defender, moveDef.effect.status, events, !attack.isPlayer, deterministic, activeTerrain, !0, attack.attacker)
          break
        }
        case 'statusPool': {
          // One status rolled from a set (Tri Attack, Dire Claw).
          if (abilityOf(attack.defender) === 'shieldDust') break
          if (
            moveDef.effect.chance !== void 0 &&
            !chance(
              (moveDef.effect.chance * (abilityOf(attack.attacker) === 'sereneGrace' ? 2 : 1)) /
                100,
              deterministic
            )
          )
            break
          const pool = moveDef.effect.statuses ?? [],
            status = deterministic ? pool[0] : pool[Math.floor(Math.random() * pool.length)]
          if (status)
            applyStatus(attack.defender, status, events, !attack.isPlayer, deterministic, activeTerrain, !0, attack.attacker)
          break
        }
        case 'cureStatus': {
          // Wake-Up Slap wakes a sleeping target; Smelling Salts cures paralysis.
          const statuses = moveDef.effect.statuses ?? []
          if (attack.defender.status && statuses.includes(attack.defender.status)) {
            attack.defender.status = null
            attack.defender.statusTurns = 0
            events.push({
              type: 'status',
              message: `${attack.defender.name} was cured of its status!`,
              data: { target: attack.isPlayer ? 'enemy' : 'player' },
            })
          }
          break
        }
        case 'statChange': {
          // A damaging move's stat change (Overheat's self-drop, Fire Lash's
          // guaranteed Defense drop, ...) is an added effect after the hit.
          applyStatChange(attack, moveDef, events, deterministic, !0)
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
    applySecondaryEffect(attack, moveDef, events, deterministic, activeTerrain)
    // Pivot / force-switch damaging moves (U-turn, Dragon Tail, ...) queue it.
    pushSwitchEffect(attack, moveDef, events, switchQueue)
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
    // A Rocky Helmet hurts the contact attacker for 1/6 of its max HP.
    const helmetRecoil =
      moveMakesContact(effectiveMove) && !abilityAvoidsContact(attack.attacker)
        ? heldContactRecoil(attack.defender, attack.attacker)
        : 0
    if (helmetRecoil > 0 && attack.attacker.currentHp > 0) {
      attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - helmetRecoil)
      events.push({
        type: 'recoil',
        message: `${attack.attacker.name} was hurt by the Rocky Helmet! (${helmetRecoil} damage)`,
        data: {
          target: attack.isPlayer ? 'player' : 'enemy',
          damage: helmetRecoil,
          hpAfter: attack.attacker.currentHp,
          hpMax: attack.attacker.maxHp,
        },
      })
      attack.attacker.currentHp <= 0 &&
        events.push({
          type: 'faint',
          message: `${attack.attacker.name} fainted!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
    }
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
    // Spicy Spray lowers the attacker's Attack when the holder is hit.
    if (abilityOf(attack.defender) === 'spicySpray' && attack.attacker.currentHp > 0) {
      const sprayStages = attack.attacker.statStages ?? (attack.attacker.statStages = {}),
        sprayCurrent = sprayStages.attack ?? 0,
        sprayNext = clampStatStage(sprayCurrent - 1)
      if (sprayNext !== sprayCurrent && !abilityPreventsStatDrop(attack.attacker, 'attack')) {
        sprayStages.attack = sprayNext
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name}'s Attack fell!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
    }
    // Gulp Missile spits its catch at whoever knocks Cramorant out of its form.
    if (
      abilityOf(attack.defender) === 'gulpMissile' &&
      (attack.defender.speciesKey === 'cramorant-gulping' ||
        attack.defender.speciesKey === 'cramorant-gorging') &&
      attack.attacker.currentHp > 0
    ) {
      const wasGulping = attack.defender.speciesKey === 'cramorant-gulping',
        missileDamage = Math.max(1, Math.floor(attack.attacker.maxHp / 4))
      attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - missileDamage)
      events.push({
        type: 'recoil',
        message: `${attack.attacker.name} was hit by the Gulp Missile! (${missileDamage} damage)`,
        data: {
          target: attack.isPlayer ? 'player' : 'enemy',
          damage: missileDamage,
          hpAfter: attack.attacker.currentHp,
          hpMax: attack.attacker.maxHp,
        },
      })
      if (wasGulping) {
        const stages = attack.attacker.statStages ?? (attack.attacker.statStages = {}),
          current = stages.defense ?? 0,
          next = clampStatStage(current - 1)
        if (next !== current && !abilityPreventsStatDrop(attack.attacker, 'defense')) {
          stages.defense = next
          events.push({
            type: 'statChange',
            message: `${attack.attacker.name}'s Defense fell!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
        }
      } else {
        applyStatus(attack.attacker, 'paralysis', events, attack.isPlayer, deterministic, activeTerrain, !0, attack.defender)
      }
      changeBattleForm(attack.defender, 'cramorant', events, !attack.isPlayer)
    }
    // Lingering Aroma replaces the attacker's ability if the move made contact.
    if (
      abilityOf(attack.defender) === 'lingeringAroma' &&
      moveMakesContact(effectiveMove) &&
      !abilityAvoidsContact(attack.attacker)
    ) {
      const attackerAromaAbility = abilityOf(attack.attacker)
      if (attackerAromaAbility && attackerAromaAbility !== 'lingeringAroma') {
        attack.attacker.abilityOverride = 'lingeringAroma'
        attack.attacker.abilitySuppressed = !1
      }
    }
    // Electromorphosis charges on any hit; Wind Power only on a wind move.
    if (
      (abilityOf(attack.defender) === 'electromorphosis' ||
        (abilityOf(attack.defender) === 'windPower' && isWindMove(effectiveMove))) &&
      !attack.defender.charged
    ) {
      attack.defender.charged = !0
      events.push({
        type: 'status',
        message: `${attack.defender.name} became charged!`,
        data: { target: attack.isPlayer ? 'enemy' : 'player' },
      })
    }
    // Emergency Exit / Wimp Out sends the holder out once it drops below half.
    const exitAbility = abilityOf(attack.defender)
    if (
      (exitAbility === 'emergencyExit' || exitAbility === 'wimpOut') &&
      attack.defender.currentHp > 0 &&
      attack.defender.currentHp <= attack.defender.maxHp / 2 &&
      !attack.defender.emergencySwitched &&
      !isTrapped(attack.defender)
    ) {
      attack.defender.emergencySwitched = !0
      switchQueue.push({
        type: 'switchRequest',
        message: `${attack.defender.name} is switching out!`,
        data: { target: attack.isPlayer ? 'enemy' : 'player' },
      })
    }
    // Power Construct transforms Zygarde into its Complete Forme below half HP.
    if (
      abilityOf(attack.defender) === 'powerConstruct' &&
      attack.defender.currentHp > 0 &&
      attack.defender.currentHp <= attack.defender.maxHp / 2
    )
      changeBattleForm(attack.defender, 'zygarde-c', events, !attack.isPlayer)
    // Zen Mode puts Darmanitan into its Zen form below half HP.
    if (abilityOf(attack.defender) === 'zenMode') {
      const galarian = attack.defender.speciesKey.startsWith('g-darmanitan'),
        zenForm = galarian ? 'g-darmanitan-z' : 'darmanitan-z',
        baseForm = galarian ? 'g-darmanitan' : 'darmanitan'
      if (attack.defender.currentHp > 0 && attack.defender.currentHp <= attack.defender.maxHp / 2)
        changeBattleForm(attack.defender, zenForm, events, !attack.isPlayer)
      else changeBattleForm(attack.defender, baseForm, events, !attack.isPlayer)
    }
    // Shields Down flips Minior between its Meteor and Core forms.
    if (abilityOf(attack.defender) === 'shieldsDown') {
      if (attack.defender.currentHp > 0 && attack.defender.currentHp <= attack.defender.maxHp / 2)
        changeBattleForm(attack.defender, 'minior-core', events, !attack.isPlayer)
      else changeBattleForm(attack.defender, 'minior-meteor', events, !attack.isPlayer)
    }
    // Magician steals on the hit; Pickpocket steals on contact.
    if (abilityOf(attack.attacker) === 'magician')
      stealHeldItem(attack.attacker, attack.defender, events, attack.isPlayer)
    // Color Change matches the holder's type to the move that hit it.
    if (abilityOf(attack.defender) === 'colorChange') {
      attack.defender.types = [effectiveMove.type]
      attack.defender.typesOverride = [effectiveMove.type]
    }
    if (abilityOf(attack.defender) === 'pickpocket' && moveMakesContact(effectiveMove) && !abilityAvoidsContact(attack.attacker))
      stealHeldItem(attack.defender, attack.attacker, events, !attack.isPlayer)
    // Item-targeting moves. Sticky Hold still protects the item.
    if (moveDef.effect?.type === 'stealItem')
      stealHeldItem(attack.attacker, attack.defender, events, attack.isPlayer)
    else if (moveDef.effect?.type === 'knockOff' || moveDef.effect?.type === 'incinerate') {
      const item = attack.defender.heldItem,
        itemName = item ? (heldItems[item]?.name ?? item) : null,
        isBerry = item ? heldItems[item]?.effect?.type === 'berry' : false
      if (
        item &&
        abilityOf(attack.defender) !== 'stickyHold' &&
        (moveDef.effect.type !== 'incinerate' || isBerry)
      ) {
        attack.defender.heldItem = null
        attack.defender.heldItemOverride = null
        attack.defender.heldItemOverridden = !0
        events.push({
          type: 'status',
          message:
            moveDef.effect.type === 'incinerate'
              ? `${attack.defender.name}'s ${itemName} was burned away!`
              : `${attack.attacker.name} knocked off ${attack.defender.name}'s ${itemName}!`,
          data: { target: attack.isPlayer ? 'enemy' : 'player' },
        })
      }
    } else if (moveDef.effect?.type === 'eatBerry') {
      const item = attack.defender.heldItem,
        effect = item ? heldItems[item]?.effect : null
      if (item && effect?.type === 'berry') {
        attack.defender.heldItem = null
        attack.defender.heldItemOverride = null
        attack.defender.heldItemOverridden = !0
        const heal = Math.max(1, Math.floor(attack.attacker.maxHp * effect.heal))
        attack.attacker.currentHp = Math.min(
          attack.attacker.maxHp,
          attack.attacker.currentHp + heal
        )
        events.push({
          type: 'status',
          message: `${attack.attacker.name} ate ${attack.defender.name}'s ${
            heldItems[item]?.name ?? item
          }!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
    }
    // Poison Touch can poison the target from a contact move.
    if (
      abilityOf(attack.attacker) === 'poisonTouch' &&
      moveMakesContact(effectiveMove) &&
      !abilityAvoidsContact(attack.attacker) &&
      chance(0.3, deterministic)
    )
      applyStatus(attack.defender, 'poison', events, !attack.isPlayer, deterministic, activeTerrain, !0, attack.attacker)
    // Further on-hit ability reactions.
    const attackerAbility = abilityOf(attack.attacker),
      defenderAbilityOnHit = abilityOf(attack.defender)
    if (attackerAbility === 'stench' && chance(0.1, deterministic)) attack.defender.flinch = !0
    if (attackerAbility === 'toxicChain' && chance(0.3, deterministic)) {
      applyStatus(attack.defender, 'toxic', events, !attack.isPlayer, deterministic, activeTerrain, !0, attack.attacker)
      if (attackerAbility === 'poisonPuppeteer') applyConfusion(attack.defender, events, !attack.isPlayer, deterministic)
    }
    if (defenderAbilityOnHit === 'cursedBody' && chance(0.3, deterministic)) {
      attack.attacker.disabledMove = attack.moveId
      attack.attacker.disableTurns = 4
      events.push({
        type: 'status',
        message: `${attack.attacker.name}'s ${moveDef.name} was disabled!`,
        data: { target: attack.isPlayer ? 'player' : 'enemy' },
      })
    }
    if (defenderAbilityOnHit === 'cottonDown') {
      const stages = attack.attacker.statStages ?? (attack.attacker.statStages = {}),
        current = stages.speed ?? 0,
        next = clampStatStage(current - 1)
      if (next !== current && !abilityPreventsStatDrop(attack.attacker, 'speed')) {
        stages.speed = next
        events.push({
          type: 'statChange',
          message: `${attack.attacker.name}'s Speed fell!`,
          data: { target: attack.isPlayer ? 'player' : 'enemy' },
        })
      }
    }
    if (defenderAbilityOnHit === 'sandSpit' && !weatherLock) activeWeather = { type: 'sandstorm', turns: WEATHER_TURNS }
    if (defenderAbilityOnHit === 'seedSower')
      activeTerrain = {
        type: 'grassy',
        turns: TERRAIN_TURNS + heldTerrainExtenderTurns(attack.defender),
      }
    if (defenderAbilityOnHit === 'toxicDebris' && effectiveMove.category === 'physical') {
      const side = attack.isPlayer ? activeHazards.player : activeHazards.enemy
      side.toxicSpikes = Math.min(2, side.toxicSpikes + 1)
    }
    if (defenderAbilityOnHit === 'wanderingSpirit' && moveMakesContact(effectiveMove) && !abilityAvoidsContact(attack.attacker)) {
      const attackerAbility2 = abilityOf(attack.attacker)
      if (attackerAbility2 && attackerAbility2 !== 'wanderingSpirit') {
        attack.attacker.abilityOverride = defenderAbilityOnHit
        attack.attacker.abilitySuppressed = !1
        attack.defender.abilityOverride = attackerAbility2
        attack.defender.abilitySuppressed = !1
      }
    }
    if (defenderAbilityOnHit === 'perishBody' && moveMakesContact(effectiveMove) && !abilityAvoidsContact(attack.attacker)) {
      if ((attack.attacker.perishTurns ?? 0) <= 0 && (attack.defender.perishTurns ?? 0) <= 0) {
        attack.attacker.perishTurns = 3
        attack.defender.perishTurns = 3
        events.push({ type: 'status', message: 'Both battlers were afflicted by Perish Body!' })
      }
    }
    // Analytic boosts the damage when the attacker moves last.
    if (attackerAbility === 'analytic' && attackOrder[attackOrder.length - 1] === attack)
      totalDamage = Math.max(1, Math.floor(totalDamage * 1.3))
    if (attack.defender.currentHp <= 0) {
      events.push({
        type: 'faint',
        message: `${attack.defender.name} fainted!`,
        data: {
          target: attack.isPlayer ? 'enemy' : 'player',
          // For field research: the KO hit's effectiveness and move.
          effectiveness: damageResult?.effectiveness ?? 1,
          moveId: attack.moveId,
        },
      })
      // Aftermath punishes a contact KO.
      if (abilityOf(attack.defender) === 'aftermath' && moveMakesContact(effectiveMove) && !abilityAvoidsContact(attack.attacker) && attack.attacker.currentHp > 0) {
        const aftermath = Math.max(1, Math.floor(attack.attacker.maxHp / 4))
        attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - aftermath)
        events.push({
          type: 'recoil',
          message: `${attack.attacker.name} was hurt by Aftermath! (${aftermath} damage)`,
          data: {
            target: attack.isPlayer ? 'player' : 'enemy',
            damage: aftermath,
            hpAfter: attack.attacker.currentHp,
            hpMax: attack.attacker.maxHp,
          },
        })
        attack.attacker.currentHp <= 0 &&
          events.push({
            type: 'faint',
            message: `${attack.attacker.name} fainted!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
      }
      // Innards Out deals the fainted Pokemon's remaining HP to the attacker.
      if (abilityOf(attack.defender) === 'innardsOut' && attack.attacker.currentHp > 0) {
        const innards = Math.max(1, attack.defender.maxHp)
        attack.attacker.currentHp = Math.max(0, attack.attacker.currentHp - innards)
        events.push({
          type: 'recoil',
          message: `${attack.attacker.name} was hurt by Innards Out! (${innards} damage)`,
          data: {
            target: attack.isPlayer ? 'player' : 'enemy',
            damage: innards,
            hpAfter: attack.attacker.currentHp,
            hpMax: attack.attacker.maxHp,
          },
        })
        attack.attacker.currentHp <= 0 &&
          events.push({
            type: 'faint',
            message: `${attack.attacker.name} fainted!`,
            data: { target: attack.isPlayer ? 'player' : 'enemy' },
          })
      }
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
      // Moxie / Chilling Neigh / Grim Neigh / Beast Boost (and As One) reward a KO.
      const koAbility = abilityOf(attack.attacker)
      let koStat = onKoBoostStat(attack.attacker)
      if (koAbility === 'beastBoost' || koAbility === 'eelevate') {
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
      // Battle Bond turns Greninja into Ash-Greninja after a KO.
      if (koAbility === 'battleBond' && attack.attacker.speciesKey === 'greninja')
        changeBattleForm(attack.attacker, 'ash-greninja', events, attack.isPlayer)
      break
    }
    if (attack.attacker.currentHp <= 0) break
  }
  // Affection: a well-kept companion can shake off a status condition.
  if (
    !deterministic &&
    (player.statusCureChance ?? 0) > 0 &&
    player.status &&
    player.currentHp > 0 &&
    Math.random() < player.statusCureChance
  ) {
    player.status = null
    player.statusTurns = 0
    events.push({
      type: 'status',
      message: `${player.name} shook off its status condition!`,
      data: { target: 'player' },
    })
  }
  if (!skipEndOfTurn)
    applyEndOfTurn(player, enemy, events, effectiveWeather, activeTerrain, deterministic)
  // Pivoting / forced switches resolve once the turn's residuals are done.
  events.push(...switchQueue)
  reportFieldEffects(player, enemy, events, activeWeather, activeTerrain, activeHazards, weather, terrain, hazards, weatherLock)
  restoreGas()
  return events
}
