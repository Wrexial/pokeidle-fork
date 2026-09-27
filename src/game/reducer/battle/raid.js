// // Raids and the Battle Tower. Split from game/reducer/battle.js.

import { BATTLE_TOWER_REGION, RAID_COOLDOWN_MS } from '../../../data/config.js'
import { mapData, pokemonSpecies } from '../../../data/gameData.js'
import { prepareNextBattle } from '../../progression.js'
import { withNotification } from '../../reducer-helpers.js'

/**
 * Handle the `START_RAID` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startRaid(state, action) {
  const healedParty = state.party.map((member) => ({
      ...member,
      currentHp: member.maxHp,
    })),
    playerPokemon = healedParty[0] || state.playerPokemon,
    raidLevel = action.payload.level ?? 60,
    raidLocation = action.payload.location ?? 'raidIsland'
  return withNotification(
    {
      ...prepareNextBattle(state),
      raidCooldownEnd: Date.now() + RAID_COOLDOWN_MS,
      raidLegendary: action.payload.legendary,
      raidRegion: action.payload.region ?? 'kanto',
      inRaid: !0,
      raidLevel,
      preRaidLocation: state.currentLocation,
      currentLocation: raidLocation,
      currentRoute: raidLocation,
      party: healedParty,
      playerPokemon,
      activePlayerPokemonIndex: 0,
      battleLog: [
        ...state.battleLog,
        `Arrived at ${mapData[raidLocation]?.name ?? 'Raid Island'}! A legendary Pokemon awaits...`,
      ].slice(-50),
    },
    {
      message: `Raid: ${pokemonSpecies[action.payload.legendary]?.name ?? 'a legendary Pokemon'} awaits!`,
      tone: 'warn',
      icon: '⚡',
      kind: 'rare',
      dedupeKey: `raid:${action.payload.legendary}`,
    }
  )
}

/**
 * Handle the `END_RAID` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function endRaid(state, action) {
  return {
    ...state,
    inRaid: !1,
    raidLegendary: null,
    raidRegion: null,
    raidLevel: 0,
    preRaidLocation: null,
  }
}

/**
 * Handle the `START_TOWER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function startTower(state, action) {
  // Only Hoenn runs a Battle Tower.
  if (mapData[state.currentLocation]?.region !== BATTLE_TOWER_REGION) return state
  return {
    ...state,
    towerFloor: action.payload?.floor ?? 1,
  }
}
