// Volatile battle state, turn-order speed and screens. Split from game/combat.js.

import { abilityOf, abilityPreventsStatDrop } from '../abilities.js'
import { heldStatMultiplier } from '../held-items.js'
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
export function effectiveSpeed(pokemon, weather) {
  const speed =
      pokemon.speed *
      heldStatMultiplier(pokemon, 'speed') *
      weatherSpeedMultiplier(weather, pokemon) *
      // Tailwind doubles the holder's side Speed.
      ((pokemon.tailwindTurns ?? 0) > 0 ? 2 : 1),
    effective = pokemon.status === 'paralysis' ? Math.max(1, Math.floor(speed / 2)) : speed
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
 * Intimidate lowers the opposing Pokemon's Attack by one stage on entry.
 * @param {BattlePokemon} source
 * @param {BattlePokemon} target
 * @param {any[]} events
 * @param {boolean} sourceIsPlayer
 */
export function applyIntimidate(source, target, events, sourceIsPlayer) {
  if (abilityOf(source) !== 'intimidate' || target.currentHp <= 0) return
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
