// Volatile battle state, turn-order speed and screens. Split from game/combat.js.

import { abilityOf, abilityPreventsStatDrop } from '../abilities.js'
import { heldStatMultiplier } from '../held-items.js'
import { changeBattleForm } from './setup.js'
import { weatherSpeedMultiplier } from '../weather.js'

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
    heldItemUsed: !1,
    tauntTurns: 0,
    substituteHp: 0,
    infatuated: !1,
    cursed: !1,
    screens: { reflect: 0, lightScreen: 0 },
    focusEnergy: !1,
    aquaRing: !1,
    yawnTurns: 0,
    wishTurns: 0,
    wishHeal: 0,
    lastMove: null,
    encoreTurns: 0,
    encoreMove: null,
    disableTurns: 0,
    disabledMove: null,
    safeguardTurns: 0,
    mistTurns: 0,
    perishTurns: 0,
    tailwindTurns: 0,
    trickRoomTurns: 0,
    destinyBondTurns: 0,
    ingrained: !1,
    laserFocus: !1,
    lockOnTurns: 0,
    abilityOverride: null,
    abilitySuppressed: !1,
    typesOverride: null,
    disguiseBroken: !1,
    iceFaceBroken: !1,
    heldItemOverride: null,
    heldItemOverridden: !1,
    formKey: null,
  }
}

/**
 * Read the volatile battle fields back off a BattlePokemon after a turn, in the
 * shape the reducer persists (matches `createVolatileState`).
 * @param {BattlePokemon} pokemon
 * @returns {ReturnType<typeof createVolatileState>}
 */
export function volatileStateFromBattle(pokemon) {
  return {
    statStages: pokemon.statStages ?? { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    mustRecharge: pokemon.mustRecharge ?? !1,
    lockedMove: pokemon.lockedMove ?? null,
    lockTurnsRemaining: pokemon.lockTurnsRemaining ?? 0,
    status: pokemon.status ?? null,
    statusTurns: pokemon.statusTurns ?? 0,
    flinch: pokemon.flinch ?? !1,
    confusionTurns: pokemon.confusionTurns ?? 0,
    leechSeeded: pokemon.leechSeeded ?? !1,
    heldItemUsed: pokemon.heldItemUsed ?? !1,
    tauntTurns: pokemon.tauntTurns ?? 0,
    substituteHp: pokemon.substituteHp ?? 0,
    infatuated: pokemon.infatuated ?? !1,
    cursed: pokemon.cursed ?? !1,
    screens: pokemon.screens ?? { reflect: 0, lightScreen: 0 },
    focusEnergy: pokemon.focusEnergy ?? !1,
    aquaRing: pokemon.aquaRing ?? !1,
    yawnTurns: pokemon.yawnTurns ?? 0,
    wishTurns: pokemon.wishTurns ?? 0,
    wishHeal: pokemon.wishHeal ?? 0,
    lastMove: pokemon.lastMove ?? null,
    encoreTurns: pokemon.encoreTurns ?? 0,
    encoreMove: pokemon.encoreMove ?? null,
    disableTurns: pokemon.disableTurns ?? 0,
    disabledMove: pokemon.disabledMove ?? null,
    safeguardTurns: pokemon.safeguardTurns ?? 0,
    mistTurns: pokemon.mistTurns ?? 0,
    perishTurns: pokemon.perishTurns ?? 0,
    tailwindTurns: pokemon.tailwindTurns ?? 0,
    trickRoomTurns: pokemon.trickRoomTurns ?? 0,
    destinyBondTurns: pokemon.destinyBondTurns ?? 0,
    ingrained: pokemon.ingrained ?? !1,
    laserFocus: pokemon.laserFocus ?? !1,
    lockOnTurns: pokemon.lockOnTurns ?? 0,
    abilityOverride: pokemon.abilityOverride ?? null,
    abilitySuppressed: pokemon.abilitySuppressed ?? !1,
    typesOverride: pokemon.typesOverride ?? null,
    disguiseBroken: pokemon.disguiseBroken ?? !1,
    iceFaceBroken: pokemon.iceFaceBroken ?? !1,
    heldItemOverride: pokemon.heldItemOverride ?? null,
    heldItemOverridden: pokemon.heldItemOverridden ?? !1,
    formKey: pokemon.formKey ?? null,
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
export function screenApplies(defender, moveDef) {
  const screens = defender.screens
  if (!screens) return !1
  return moveDef.category === 'physical'
    ? (screens.reflect ?? 0) > 0
    : moveDef.category === 'special'
      ? (screens.lightScreen ?? 0) > 0
      : !1
}

/**
 * Speed used for turn order: weather abilities can double it, then paralysis halves it.
 * @param {BattlePokemon} pokemon
 * @param {{ type: string } | null} [weather]
 * @returns {number}
 */
/**
 * Speed used for turn order: abilities (Weather, terrain, Quick Feet,
 * Unburden), then paralysis halves it.
 * @param {BattlePokemon} pokemon
 * @param {{ type: string } | null} [weather]
 * @param {{ type: string } | null} [terrain]
 * @returns {number}
 */
export function effectiveSpeed(pokemon, weather, terrain = null) {
  const ability = abilityOf(pokemon)
  let speed =
    pokemon.speed *
    heldStatMultiplier(pokemon, 'speed') *
    weatherSpeedMultiplier(weather, pokemon) *
    // Tailwind doubles the holder's side Speed.
    ((pokemon.tailwindTurns ?? 0) > 0 ? 2 : 1)
  if (ability === 'quickFeet' && pokemon.status) speed *= 1.5
  if (ability === 'unburden' && pokemon.heldItemUsed) speed *= 2
  if (ability === 'defeatist' && pokemon.currentHp <= pokemon.maxHp / 2) speed *= 0.5
  if (ability === 'surgeSurfer' && terrain?.type === 'electric') speed *= 2
  if (ability === 'protosynthesis' && weather?.type === 'sun') speed *= 1.5
  if (ability === 'quarkDrive' && terrain?.type === 'electric') speed *= 1.5
  const effective = pokemon.status === 'paralysis' ? Math.max(1, Math.floor(speed / 2)) : speed
  return effective
}

/**
 * Reset a Pokemon's stat stages to zero (Haze / Clear Smog).
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} targetIsPlayer
 */
export function resetStatStages(target, events, targetIsPlayer) {
  const stages = target.statStages
  if (!stages || Object.values(stages).every((value) => value === 0)) return
  for (const key of Object.keys(stages)) stages[key] = 0
  events.push({
    type: 'statChange',
    message: `${target.name}'s stat changes were removed!`,
    data: {
      target: targetIsPlayer ? 'player' : 'enemy',
    },
  })
}

/**
 * Entry stat abilities: Intrepid Sword / Dauntless Shield raise a stat on switch
 * in, and Download raises the better attacking stat against the foe's defenses.
 * @param {BattlePokemon} source
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} sourceIsPlayer
 */
export function applyEntryAbility(source, target, events, sourceIsPlayer) {
  const ability = abilityOf(source)
  if (!ability) return
  /** @param {string} statKey @param {string} label */
  const raise = (statKey, label) => {
    const stages = source.statStages ?? (source.statStages = {}),
      current = stages[statKey] ?? 0,
      next = clampStatStage(current + 1)
    if (next === current) return
    stages[statKey] = next
    events.push({
      type: 'statChange',
      message: `${source.name}'s ${label} rose!`,
      data: { target: sourceIsPlayer ? 'player' : 'enemy' },
    })
  }
  if (ability === 'intrepidSword') raise('attack', 'Attack')
  else if (ability === 'dauntlessShield') raise('defense', 'Defense')
  else if (ability === 'download')
    raise(target.defense <= target.spDefense ? 'attack' : 'spAttack', target.defense <= target.spDefense ? 'Attack' : 'Sp. Atk')
  else if (ability === 'trace') {
    const copied = abilityOf(target)
    if (copied && copied !== 'trace') {
      source.abilityOverride = copied
      source.abilitySuppressed = !1
      events.push({
        type: 'status',
        message: `${source.name} traced ${target.name}'s ${copied}!`,
        data: { target: sourceIsPlayer ? 'player' : 'enemy' },
      })
    }
  } else if (ability === 'zeroToHero' && source.speciesKey === 'palafin') {
    changeBattleForm(source, 'palafin-h', events, sourceIsPlayer)
  } else if (
    ability === 'schooling' &&
    source.speciesKey === 'wishiwashi' &&
    source.level >= 20 &&
    source.currentHp > source.maxHp / 4
  ) {
    changeBattleForm(source, 'wishiwashi-s', events, sourceIsPlayer)
  } else if (ability === 'imposter' && target) {
    // Imposter copies the foe's types and stats (but not HP).
    source.types = [...target.types]
    source.typesOverride = [...target.types]
    for (const stat of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'])
      source[stat] = target[stat]
    events.push({
      type: 'status',
      message: `${source.name} transformed into ${target.name}!`,
      data: { target: sourceIsPlayer ? 'player' : 'enemy' },
    })
  }
}

/**
 * Intimidate lowers the opposing Pokemon's Attack by one stage on entry.
 * @param {BattlePokemon} source
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} sourceIsPlayer
 */
export function applyIntimidate(source, target, events, sourceIsPlayer) {
  if (abilityOf(source) !== 'intimidate' || target.currentHp <= 0) return
  if (abilityOf(target) === 'oblivious') return
  if (abilityPreventsStatDrop(target, 'attack')) return
  if ((target.mistTurns ?? 0) > 0) return
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
