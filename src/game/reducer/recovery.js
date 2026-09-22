// Reducer handlers for recovery actions. Split from game/reducer.js.

import { mapData, regions } from '../../data/gameData.js'
import { emptyBattleHazards } from '../hazards.js'
import { prepareNextBattle, syncActivePokemonIntoParty } from '../progression.js'

/**
 * Handle the `HEAL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function heal(state, action) {
  return state.playerPokemon
    ? syncActivePokemonIntoParty({
        ...state,
        playerPokemon: {
          ...state.playerPokemon,
          currentHp: state.playerPokemon.maxHp,
        },
        battleLog: [
          ...state.battleLog,
          `${state.playerPokemon.name} was healed to full HP!`,
        ].slice(-50),
      })
    : state
}

/**
 * Handle the `HEAL_PARTY` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function healParty(state, action) {
  const healedParty = state.party.map((member) => ({
      ...member,
      currentHp: member.maxHp,
    })),
    playerPokemon = healedParty[0] || state.playerPokemon
  return {
    ...state,
    party: healedParty,
    playerPokemon,
    battleLog: [...state.battleLog, 'Your Pokemon were healed!'].slice(-50),
  }
}

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
      battleEvents: [],
      pendingEvents: [
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
      weather: null,
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
