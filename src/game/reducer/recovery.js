// Reducer handlers for recovery actions. Split from game/reducer.js.

import { mapData, regions } from '../../data/gameData.js'
import { emptyBattleHazards } from '../hazards.js'
import { createVolatileState } from '../combat.js'
import { FIELD_WEATHER_TURNS } from '../weather.js'
import { prepareNextBattle } from '../progression.js'

/**
 * Handle the `START_HEALING` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startHealing(state, action) {
  return {
    ...prepareNextBattle(state),
    phase: 'healing',
    healingState: {
      step: 'place',
    },
    pendingBossBattle: action.payload?.pendingBossBattle ?? null,
  }
}

/**
 * Handle the `NUZLOCKE_GAME_OVER` action: the last party Pokemon has fainted
 * during a Nuzlocke run, so the run is over. The player starts a fresh save
 * from the game-over screen.
 * @param {GameState} state
 * @returns {GameState}
 */
export function nuzlockeGameOver(state) {
  return {
    ...state,
    phase: 'gameOver',
    nuzlockeGameOver: true,
    battleEvents: [],
    pendingEvents: [],
    battleLog: [...state.battleLog, 'Your last Pokemon fainted. The Nuzlocke run is over.'].slice(
      -50
    ),
  }
}

/**
 * Handle the `HEALING_STEP` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function healingStep(state, action) {
  return state.phase !== 'healing' || !state.healingState
    ? state
    : {
        ...state,
        healingState: {
          ...state.healingState,
          step: action.payload.step,
        },
      }
}

/**
 * Handle the `COMPLETE_HEALING` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function completeHealing(state, action) {
  if (state.phase !== 'healing' || !state.healingState) return state
  const healedParty = state.party.map((member) => ({
      ...member,
      currentHp: member.maxHp,
    })),
    playerPokemon = healedParty[0] || state.playerPokemon
  if (state.pendingBossBattle) {
    const bossBattle = state.pendingBossBattle,
      firstPokemon = bossBattle.trainerTeam[0]
    return {
      ...state,
      party: healedParty,
      playerPokemon,
      activePlayerPokemonIndex: 0,
      healingState: null,
      pendingBossBattle: null,
      phase: 'battling',
      enemyPokemon: firstPokemon,
      // Healing into a boss rematch starts a fresh battle, so drop any
      // leftover stat stages / status from the previous attempt.
      playerVolatile: createVolatileState(),
      battleEvents: [],
      pendingEvents: [
        // A rival's (or any boss's) opening lines play first.
        ...(bossBattle.dialogue ?? []).map((/** @type {string} */ line) => ({
          type: 'status',
          message: `${bossBattle.trainerName}: \u201c${line}\u201d`,
        })),
        {
          type: 'trainerAppear',
          message: `${bossBattle.trainerName} wants to battle!`,
        },
        {
          type: 'trainerSendOut',
          message: `${bossBattle.trainerName} sent out ${firstPokemon.name}!`,
        },
      ],
      currentEventIndex: 0,
      battleTurn: 0,
      // A ladder's Weather Lock starts the floor under its fixed weather.
      weather: bossBattle.weatherLock
        ? { type: bossBattle.weatherLock, turns: FIELD_WEATHER_TURNS }
        : null,
      battleHazards: emptyBattleHazards(),
      terrain: null,
      bossBattle: {
        bossId: bossBattle.bossId,
        bossType: bossBattle.bossType,
        trainerName: bossBattle.trainerName,
        trainerClass: bossBattle.trainerClass,
        trainerTeam: bossBattle.trainerTeam,
        currentTrainerPokemonIndex: 0,
        spriteKey: bossBattle.spriteKey,
        region: bossBattle.region,
        // Villain-arc bookkeeping (see game/villain-teams.js).
        villainRegion: bossBattle.villainRegion,
        villainStage: bossBattle.villainStage,
        // Battle Frontier rule variants (see game/battle-frontier.js).
        rule: bossBattle.rule,
        facilityId: bossBattle.facilityId,
        // The weekly ladder set layered on the facility (see game/ladder-modifiers.js).
        modifiers: bossBattle.modifiers,
        ladderKey: bossBattle.ladderKey,
        ladderName: bossBattle.ladderName,
        weatherLock: bossBattle.weatherLock,
      },
      bossQueue: bossBattle.bossQueue ?? [],
      battleLog: [...state.battleLog, 'Your Pokemon were healed!'].slice(-50),
    }
  }
  if (state.inRaid || mapData[state.currentLocation]?.type === 'raid') {
    const raidRegionEntry = regions.find((region) => region.id === state.raidRegion)?.entry,
      returnLocation = state.preRaidLocation || raidRegionEntry || 'palletTown',
      routeKey = mapData[returnLocation]?.routeKey || 'route1',
      locationName = mapData[returnLocation]?.name || 'Pallet Town'
    return {
      ...state,
      phase: 'idle',
      party: healedParty,
      playerPokemon,
      activePlayerPokemonIndex: 0,
      healingState: null,
      pendingBossBattle: null,
      currentLocation: returnLocation,
      currentRoute: routeKey,
      inRaid: !1,
      raidLegendary: null,
      raidRegion: null,
      raidLevel: 0,
      preRaidLocation: null,
      battleLog: [
        ...state.battleLog,
        'Your Pokemon were healed!',
        `You returned to ${locationName}.`,
      ].slice(-50),
    }
  }
  return {
    ...state,
    phase: 'idle',
    party: healedParty,
    playerPokemon,
    activePlayerPokemonIndex: 0,
    healingState: null,
    pendingBossBattle: null,
    battleLog: [...state.battleLog, 'Your Pokemon were healed!'].slice(-50),
  }
}
