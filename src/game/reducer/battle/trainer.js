// // Trainer battle lifecycle: start, switch, next Pokemon, end-of-battle. Split from game/reducer/battle.js.

import { abilityOf } from '../../abilities.js'
import { createVolatileState } from '../../combat.js'
import { applyEntryHazards, emptyBattleHazards } from '../../hazards.js'
import { computeUnlockedLocations, prepareNextBattle, tickBattleCounters } from '../../progression.js'

/**
 * Handle the `START_TRAINER_BATTLE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startTrainerBattle(state, action) {
  const {
      trainerId,
      trainerName,
      trainerClass,
      trainerTeam,
    } = action.payload,
    firstPokemon = trainerTeam[0]
  return {
    ...state,
    phase: 'battling',
    enemyPokemon: firstPokemon,
    battleEvents: [],
    pendingEvents: [
      {
        type: 'trainerAppear',
        message: `${trainerName} wants to battle!`,
      },
      {
        type: 'trainerSendOut',
        message: `${trainerName} sent out ${firstPokemon.name}!`,
      },
    ],
    currentEventIndex: 0,
    battleTurn: 0,
    weather: null,
    battleHazards: emptyBattleHazards(),
    terrain: null,
    activePlayerPokemonIndex: 0,
    battleParticipants: (state.party[0]?.id ?? state.playerPokemon?.id)
      ? [state.party[0]?.id ?? state.playerPokemon?.id]
      : [],
    playerTurnSpent: !1,
    trainerBattle: {
      trainerId,
      trainerName,
      trainerClass,
      trainerTeam,
      currentTrainerPokemonIndex: 0,
    },
    playerVolatile: createVolatileState(),
  }
}

/**
 * Handle the `SWITCH_PLAYER_POKEMON` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function switchPlayerPokemon(state, action) {
  const { newPokemonIndex: newIndex } = action.payload,
    party = [...state.party],
    oldIndex = state.activePlayerPokemonIndex
  state.playerPokemon &&
    party[oldIndex] &&
    (party[oldIndex] = {
      ...party[oldIndex],
      currentHp: state.playerPokemon.currentHp,
      // Natural Cure clears status and Regenerator heals on the way out.
      ...(abilityOf(state.playerPokemon) === 'naturalCure' && state.playerPokemon.status
        ? { status: null, statusTurns: 0 }
        : {}),
      ...(abilityOf(state.playerPokemon) === 'regenerator'
        ? {
            currentHp: Math.min(
              party[oldIndex].maxHp,
              state.playerPokemon.currentHp + Math.max(1, Math.floor(party[oldIndex].maxHp / 3))
            ),
          }
        : {}),
    })
  const nextPokemon = party[newIndex]
  if (!nextPokemon) return state
  const entry = applyEntryHazards(state.battleHazards?.player, nextPokemon),
    switchedIn =
      entry.damage > 0 || entry.status || entry.speedStage
        ? {
            ...nextPokemon,
            // Hazards can't KO on switch-in in this implementation.
            currentHp: Math.max(1, nextPokemon.currentHp - entry.damage),
            ...(entry.status ? { status: entry.status } : {}),
            ...(entry.speedStage
              ? { statStages: { ...(nextPokemon.statStages ?? {}), speed: entry.speedStage } }
              : {}),
          }
        : nextPokemon
  party[newIndex] = switchedIn
  return nextPokemon
    ? {
        ...state,
        phase: 'battling',
        playerPokemon: switchedIn,
        battleEvents: [],
        party,
        activePlayerPokemonIndex: newIndex,
        battleParticipants: [...new Set([...(state.battleParticipants ?? []), nextPokemon.id])],
        // A deliberate switch costs the turn; a forced switch after a faint
        // does not (the foe already acted this turn).
        playerTurnSpent: !!action.payload.costsTurn || !!state.playerTurnSpent,
        pendingEvents: [
          ...state.pendingEvents,
          {
            type: 'playerSwitch',
            message: `Go! ${nextPokemon.name}!`,
          },
          ...(entry.damage > 0
            ? [
                {
                  type: 'hazard',
                  message: `${nextPokemon.name} was hurt by the entry hazards!`,
                },
              ]
            : []),
        ],
        playerVolatile: createVolatileState(),
      }
    : state
}

/**
 * Handle the `TRAINER_SEND_NEXT_POKEMON` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function trainerSendNextPokemon(state, action) {
  const { newPokemonIndex: newIndex } = action.payload,
    battle = state.bossBattle ?? state.trainerBattle
  if (!battle) return state
  const nextPokemon = battle.trainerTeam[newIndex]
  if (!nextPokemon) return state
  const team = [...battle.trainerTeam],
    oldIndex = battle.currentTrainerPokemonIndex
  state.enemyPokemon &&
    (team[oldIndex] = {
      ...team[oldIndex],
      currentHp: state.enemyPokemon.currentHp,
    })
  const updatedBattle = {
    ...battle,
    trainerTeam: team,
    currentTrainerPokemonIndex: newIndex,
  }
  const enemyEntry = applyEntryHazards(state.battleHazards?.enemy, nextPokemon),
    switchedInEnemy =
      enemyEntry.damage > 0 || enemyEntry.status || enemyEntry.speedStage
        ? {
            ...nextPokemon,
            // Hazards can't KO on switch-in in this implementation.
            currentHp: Math.max(1, nextPokemon.currentHp - enemyEntry.damage),
            ...(enemyEntry.status ? { status: enemyEntry.status } : {}),
            ...(enemyEntry.speedStage
              ? { statStages: { ...(nextPokemon.statStages ?? {}), speed: enemyEntry.speedStage } }
              : {}),
          }
        : nextPokemon
  return {
    ...state,
    phase: 'battling',
    enemyPokemon: switchedInEnemy,
    battleEvents: [],
    trainerBattle: state.trainerBattle ? updatedBattle : null,
    bossBattle: state.bossBattle ? updatedBattle : null,
    pendingEvents: [
      ...state.pendingEvents,
      {
        type: 'trainerAppear',
        message: `${battle.trainerName} is about to send out ${nextPokemon.name}!`,
      },
      ...(enemyEntry.damage > 0
        ? [
            {
              type: 'hazard',
              message: `${nextPokemon.name} was hurt by the entry hazards!`,
            },
          ]
        : []),
      {
        type: 'trainerSendOut',
        message: `${battle.trainerName} sent out ${nextPokemon.name}!`,
      },
    ],
  }
}

/**
 * Handle the `TRAINER_BATTLE_END` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function trainerBattleEnd(state, action) {
  const { won, moneyDelta } = action.payload,
    newMoney = Math.max(0, state.money + moneyDelta),
    eventType = won ? 'moneyGain' : 'moneyLoss',
    message = won ? `Got $${moneyDelta} for winning!` : `Lost $${Math.abs(moneyDelta)}...`,
    trainerBattlesWon = won ? state.trainerBattlesWon + 1 : state.trainerBattlesWon,
    locationWins = state.battlesWonByLocation[state.currentLocation] ?? 0,
    battlesWonByLocation = won
      ? {
          ...state.battlesWonByLocation,
          [state.currentLocation]: locationWins + 1,
        }
      : state.battlesWonByLocation,
    activeEffects = won ? tickBattleCounters(state.activeEffects) : state.activeEffects,
    nextState = {
      ...prepareNextBattle(state),
      money: newMoney,
      trainerBattlesWon,
      battlesWonByLocation,
      activeEffects,
      pendingEvents: [
        {
          type: eventType,
          message,
        },
      ],
    }
  return {
    ...nextState,
    unlockedLocations: computeUnlockedLocations(nextState),
  }
}
