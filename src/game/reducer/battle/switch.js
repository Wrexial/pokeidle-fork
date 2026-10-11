// Switch requests emitted by the battle engine: pivoting moves (Baton Pass,
// Teleport, U-turn, ...), forced switches (Roar, Whirlwind, Dragon Tail) and
// Emergency Exit / Wimp Out. The reducer resolves them when the event is
// consumed (so the turn's damage has already been applied), picks a
// replacement and performs the swap. The move already spent the turn, so the
// switch itself does not cost another one.

import { matchupScore } from '../../combat.js'
import { switchPlayerPokemon, trainerSendNextPokemon } from './trainer.js'

/**
 * The best battle-ready party index to send in, or -1.
 * @param {GameState} state
 * @returns {number}
 */
function pickPlayerSwitchIndex(state) {
  const foe = state.enemyPokemon,
    inverse = state.bossBattle?.rule === 'inverse'
  let bestIndex = -1,
    bestScore = -Infinity
  ;(state.party ?? []).forEach((member, index) => {
    if (index === state.activePlayerPokemonIndex) return
    if (!member || member.isEgg || (member.currentHp ?? 0) <= 0) return
    const score = matchupScore(member, foe, inverse)
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })
  return bestIndex
}

/**
 * The best battle-ready bench index for the foe's trainer, or -1.
 * @param {GameState} state
 * @returns {number}
 */
function pickEnemySwitchIndex(state) {
  const battle = state.bossBattle ?? state.trainerBattle,
    inverse = state.bossBattle?.rule === 'inverse'
  if (!battle) return -1
  const active = state.playerPokemon
  if (!active) return -1
  let bestIndex = -1,
    bestScore = -Infinity
  battle.trainerTeam.forEach((member, index) => {
    if (index === battle.currentTrainerPokemonIndex) return
    if (!member || (member.currentHp ?? 0) <= 0) return
    const score = matchupScore(member, active, inverse)
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })
  return bestIndex
}

/**
 * Resolve a `switchRequest` event. `remainingEvents` are the events still
 * queued after this one.
 * @param {GameState} state
 * @param {any} event
 * @param {any[]} remainingEvents
 * @returns {GameState}
 */
export function resolveSwitchRequest(state, event, remainingEvents) {
  const target = event.data?.target,
    base = { ...state, pendingEvents: remainingEvents }
  if (state.phase !== 'battling') return base
  if (target === 'player') {
    if ((state.playerPokemon?.currentHp ?? 0) <= 0) return base
    const index = pickPlayerSwitchIndex(state)
    if (index < 0) return base
    const switched = switchPlayerPokemon(base, {
      type: 'SWITCH_PLAYER_POKEMON',
      payload: { newPokemonIndex: index, costsTurn: !1 },
    })
    // Baton Pass carries the user's stat boosts to the replacement.
    const passBoosts = event.data?.passBoosts
    if (passBoosts && switched.playerVolatile)
      switched.playerVolatile = {
        ...switched.playerVolatile,
        statStages: { ...switched.playerVolatile.statStages, ...passBoosts },
      }
    return switched
  }
  if (target === 'enemy') {
    if ((state.enemyPokemon?.currentHp ?? 0) <= 0) return base
    const index = pickEnemySwitchIndex(state)
    if (index >= 0)
      return trainerSendNextPokemon(base, {
        type: 'TRAINER_SEND_NEXT_POKEMON',
        payload: { newPokemonIndex: index },
      })
    // A wild foe has no bench: it flees and the encounter ends.
    return {
      ...base,
      phase: 'idle',
      enemyPokemon: null,
      pendingEvents: [
        ...remainingEvents,
        { type: 'flee', message: `Wild ${state.enemyPokemon?.name ?? 'Pokemon'} fled!` },
      ],
    }
  }
  return base
}

/**
 * Resolve a `revive` event (Revival Blessing): bring back a fainted party
 * member at half HP.
 * @param {GameState} state
 * @param {any} event
 * @param {any[]} remainingEvents
 * @returns {GameState}
 */
export function resolveRevive(state, event, remainingEvents) {
  const index = state.party.findIndex(
    (member) => member && !member.isEgg && (member.currentHp ?? 0) <= 0
  )
  if (index < 0)
    return {
      ...state,
      pendingEvents: [...remainingEvents, { type: 'status', message: 'But there was nothing to revive!' }],
    }
  const revived = state.party[index],
    party = state.party.map((member, memberIndex) =>
      memberIndex === index
        ? {
            ...member,
            currentHp: Math.max(1, Math.floor(member.maxHp / 2)),
            status: null,
            statusTurns: 0,
          }
        : member
    )
  return {
    ...state,
    party,
    pendingEvents: [
      ...remainingEvents,
      { type: 'status', message: `${revived.name} was revived!` },
    ],
  }
}
