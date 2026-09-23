// // Volatile state updates and consumable effect items. Split from game/reducer/battle.js.

import { activeItems } from '../../../data/items.js'

/**
 * Handle the `UPDATE_VOLATILE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function updateVolatile(state, action) {
  const { player: playerVolatile, enemy: enemyVolatile } = action.payload
  let enemyPokemon = state.enemyPokemon
  return (
    enemyPokemon &&
      (enemyPokemon = {
        ...enemyPokemon,
        statStages: enemyVolatile.statStages,
        mustRecharge: enemyVolatile.mustRecharge,
        lockedMove: enemyVolatile.lockedMove,
        lockTurnsRemaining: enemyVolatile.lockTurnsRemaining,
        status: enemyVolatile.status,
        statusTurns: enemyVolatile.statusTurns,
        flinch: enemyVolatile.flinch,
        confusionTurns: enemyVolatile.confusionTurns ?? 0,
        leechSeeded: enemyVolatile.leechSeeded ?? !1,
        heldItemUsed: enemyVolatile.heldItemUsed ?? !1,
        tauntTurns: enemyVolatile.tauntTurns ?? 0,
        substituteHp: enemyVolatile.substituteHp ?? 0,
        infatuated: enemyVolatile.infatuated ?? !1,
        cursed: enemyVolatile.cursed ?? !1,
        screens: enemyVolatile.screens ?? { reflect: 0, lightScreen: 0 },
        focusEnergy: enemyVolatile.focusEnergy ?? !1,
        aquaRing: enemyVolatile.aquaRing ?? !1,
        yawnTurns: enemyVolatile.yawnTurns ?? 0,
        wishTurns: enemyVolatile.wishTurns ?? 0,
        wishHeal: enemyVolatile.wishHeal ?? 0,
        lastMove: enemyVolatile.lastMove ?? null,
        encoreTurns: enemyVolatile.encoreTurns ?? 0,
        encoreMove: enemyVolatile.encoreMove ?? null,
        disableTurns: enemyVolatile.disableTurns ?? 0,
        disabledMove: enemyVolatile.disabledMove ?? null,
        safeguardTurns: enemyVolatile.safeguardTurns ?? 0,
        mistTurns: enemyVolatile.mistTurns ?? 0,
        perishTurns: enemyVolatile.perishTurns ?? 0,
        tailwindTurns: enemyVolatile.tailwindTurns ?? 0,
        trickRoomTurns: enemyVolatile.trickRoomTurns ?? 0,
        destinyBondTurns: enemyVolatile.destinyBondTurns ?? 0,
        ingrained: enemyVolatile.ingrained ?? !1,
        laserFocus: enemyVolatile.laserFocus ?? !1,
        lockOnTurns: enemyVolatile.lockOnTurns ?? 0,
        abilityOverride: enemyVolatile.abilityOverride ?? null,
        abilitySuppressed: enemyVolatile.abilitySuppressed ?? !1,
        typesOverride: enemyVolatile.typesOverride ?? null,
        disguiseBroken: enemyVolatile.disguiseBroken ?? !1,
        iceFaceBroken: enemyVolatile.iceFaceBroken ?? !1,
      }),
    {
      ...state,
      playerVolatile,
      enemyPokemon,
    }
  )
}

/**
 * Handle the `USE_EFFECT_ITEM` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function useEffectItem(state, action) {
  const { itemId, routeKey, speciesKey } = action.payload,
    owned = state.inventory[itemId] ?? 0
  if (owned <= 0) return state
  const item = activeItems[itemId]
  if (!item) return state
  const existingIndex = /** @type {ActiveEffect[]} */ (state.activeEffects).findIndex(
    (existingEffect) => existingEffect.type === itemId && existingEffect.routeKey === routeKey && existingEffect.speciesKey === speciesKey
  )
  let activeEffects
  if (existingIndex >= 0)
    ((activeEffects = [...state.activeEffects]),
      (activeEffects[existingIndex] = {
        ...activeEffects[existingIndex],
        battlesRemaining: activeEffects[existingIndex].battlesRemaining + item.duration,
      }))
  else {
    const newEffect = {
      type: itemId,
      battlesRemaining: item.duration,
      routeKey,
      speciesKey,
    }
    activeEffects = [...state.activeEffects, newEffect]
  }
  return {
    ...state,
    inventory: {
      ...state.inventory,
      [itemId]: owned - 1,
    },
    activeEffects,
    battleLog: [...state.battleLog, `Used ${item.name}!`].slice(-50),
  }
}
