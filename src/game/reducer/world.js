// Reducer handlers for world actions. Split from game/reducer.js.

import { RAID_LEVEL_MAX, prestigeTokenReward } from '../../data/config.js'
import { POKEMON_TYPES } from '../../data/moves.js'
import { elite4Data, gymLeaderData, mapData, regions } from '../../data/gameData.js'
import { emptyBattleHazards } from '../hazards.js'
import { createPokemon, isBattleReady } from '../pokemon.js'
import { computeUnlockedLocations, getRegionUnlockTokens, prepareNextBattle } from '../progression.js'
import { settleUnlockTokens, withNotification } from '../reducer-helpers.js'

/**
 * Handle the `SELECT_STARTER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function selectStarter(state, action) {
  const regionId = action.payload.region ?? 'kanto',
    region = regions.find((candidate) => candidate.id === regionId),
    entryTown = region?.entry,
    firstRoute =
      entryTown && mapData[entryTown]
        ? mapData[entryTown].connections.find((id) => mapData[id]?.type === 'route')
        : null,
    starterLevel = region?.startLevel ?? 5,
    starterPokemon = createPokemon(
      action.payload.speciesKey,
      starterLevel,
      state.nextPokemonId,
      action.payload.isShiny
    ),
    speciesKey = action.payload.speciesKey
  return {
    ...state,
    phase: 'idle',
    startRegion: regionId,
    challengeMonotype: POKEMON_TYPES.includes(action.payload.monotype)
      ? action.payload.monotype
      : null,
    playerPokemon: starterPokemon,
    party: [starterPokemon],
    nextPokemonId: state.nextPokemonId + 1,
    currentLocation: firstRoute ?? entryTown ?? state.currentLocation,
    currentRoute: firstRoute ?? state.currentRoute,
    unlockedRegions: [regionId],
    unlockedLocations: entryTown
      ? [...new Set([entryTown, ...(firstRoute ? [firstRoute] : [])])]
      : state.unlockedLocations,
    battleLog: [
      `You began your journey in ${region?.name ?? 'Kanto'} with ${starterPokemon.name}!`,
    ],
    pokedexSeen: state.pokedexSeen.includes(speciesKey)
      ? state.pokedexSeen
      : [...state.pokedexSeen, speciesKey],
    pokedexCaught: state.pokedexCaught.includes(speciesKey)
      ? state.pokedexCaught
      : [...state.pokedexCaught, speciesKey],
  }
}

/**
 * Handle the `UNLOCK_REGION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function unlockRegion(state, action) {
  const regionId = action.payload.regionId,
    region = regions.find((candidate) => candidate.id === regionId)
  if (!region || state.unlockedRegions.includes(regionId)) return state
  if (getRegionUnlockTokens(state) <= 0) return state
  const entryId = region.entry,
    firstRoute =
      entryId && mapData[entryId]
        ? mapData[entryId].connections.find(
            /** @param {string} id */ (id) => mapData[id]?.type === 'route'
          ) ?? null
        : null,
    unlockedState = {
      ...state,
      unlockedRegions: [...state.unlockedRegions, regionId],
      unlockedLocations: [
        ...new Set([
          ...state.unlockedLocations,
          ...(entryId ? [entryId] : []),
          ...(firstRoute ? [firstRoute] : []),
        ]),
      ],
    }
  return withNotification(
    settleUnlockTokens({
      ...unlockedState,
      unlockedLocations: computeUnlockedLocations(unlockedState),
      battleLog: [...state.battleLog, `${region.name} unlocked!`].slice(-50),
    }),
    {
      message: `A new region opened: ${region.name}!`,
      tone: 'success',
      icon: '🗺️',
      dedupeKey: `region:${regionId}`,
    }
  )
}

/**
 * Handle the `TRAVEL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function travel(state, action) {
  const { locationId } = action.payload
  if (!state.unlockedLocations.includes(locationId) || locationId === state.currentLocation) return state
  const location = mapData[locationId],
    routeKey = location.routeKey || state.currentRoute,
    unlocked = computeUnlockedLocations(state)
  return {
    ...prepareNextBattle(state),
    currentLocation: locationId,
    currentRoute: routeKey,
    unlockedLocations: unlocked,
    battleLog: [...state.battleLog, `Traveled to ${location.name}!`].slice(-50),
    inRaid: !1,
    raidLegendary: null,
    raidLevel: 0,
    preRaidLocation: null,
  }
}

/**
 * Handle the `RESET_ELITE_FOUR` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function resetEliteFour(state, action) {
  return {
    ...state,
    defeatedEliteFour: [],
  }
}

/**
 * Handle the `PRESTIGE_REGION` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function prestigeRegion(state, action) {
  // Replay a finished region: re-lock its routes, clear its battle counts and
  // badges, and drop the player back at its first route. Party, box, items,
  // money and the Pokedex are untouched. Only the region's Champion defeat is
  // kept, so the next region doesn't lock and the region can be prestiged
  // again later.
  const regionId = action.payload.regionId,
    region = regions.find((candidate) => candidate.id === regionId),
    regionEliteFourIds = new Set(
      elite4Data
        .filter((member) => (member.region ?? 'kanto') === regionId)
        .map((member) => member.id)
    )
  if (!region || !state.defeatedChampions.includes(regionId)) return state
  // Prestige only once the region's Elite Four are currently beaten. They
  // reset on each prestige, so you have to clear them again before the next
  // one (the Champion stays defeated so the region is never re-locked).
  if (![...regionEliteFourIds].every((id) => state.defeatedEliteFour.includes(id)))
    return state
  const regionLocationIds = new Set(
      Object.values(mapData)
        .filter((location) => (location.region ?? 'kanto') === regionId)
        .map((location) => location.id)
    ),
    entryId = region.entry,
    firstRoute =
      entryId && mapData[entryId]
        ? mapData[entryId].connections.find(
            /** @param {string} id */ (id) => mapData[id]?.type === 'route'
          ) ?? null
        : null,
    // Keep the entry and first route unlocked; computeUnlockedLocations
    // rebuilds the rest from the region's (now cleared) gates.
    keepUnlocked = /** @param {string} id */ (id) =>
      !regionLocationIds.has(id) || id === entryId || id === firstRoute,
    regionGymIds = new Set(
      gymLeaderData
        .filter((gym) => (gym.region ?? 'kanto') === regionId)
        .map((gym) => gym.id)
    ),
    prestigeLevel = (state.regionPrestige[regionId] ?? 0) + 1,
    prestigedState = {
      ...state,
      unlockedLocations: state.unlockedLocations.filter(keepUnlocked),
      battlesWonByLocation: Object.fromEntries(
        Object.entries(state.battlesWonByLocation).filter(
          ([locationId]) => !regionLocationIds.has(locationId)
        )
      ),
      defeatedGyms: state.defeatedGyms.filter((id) => !regionGymIds.has(id)),
      defeatedEliteFour: state.defeatedEliteFour.filter((id) => !regionEliteFourIds.has(id)),
      regionPrestige: {
        ...state.regionPrestige,
        [regionId]: prestigeLevel,
      },
      victoryTokens: state.victoryTokens + prestigeTokenReward,
      currentLocation: firstRoute ?? entryId ?? state.currentLocation,
      currentRoute: firstRoute ?? state.currentRoute,
      phase: 'idle',
      battleEvents: [],
      pendingEvents: [],
      currentEventIndex: 0,
      battleTurn: 0,
      weather: null,
      battleHazards: emptyBattleHazards(),
      terrain: null,
      enemyPokemon: null,
      playerPokemon: state.party.find((member) => isBattleReady(member)) ?? state.party[0] ?? state.playerPokemon,
      activePlayerPokemonIndex: 0,
      trainerBattle: null,
      bossBattle: null,
      bossQueue: [],
      pendingBossBattle: null,
      healingState: null,
      evolutionState: null,
      inRaid: !1,
      raidLegendary: null,
      raidRegion: null,
      raidLevel: 0,
      preRaidLocation: null,
      raidCooldownEnd: null,
      battleLog: [
        ...state.battleLog,
        `${region.name} prestiged to level ${prestigeLevel}! Its map progress has been reset.`,
        `Earned ${prestigeTokenReward} Victory Tokens!`,
      ].slice(-50),
    }
  return {
    ...prestigedState,
    unlockedLocations: computeUnlockedLocations(prestigedState),
  }
}

/**
 * Handle the `PHASE_IDLE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function phaseIdle(state, action) {
  const nextState = prepareNextBattle(state)
  return state.inRaid
    ? {
        ...nextState,
        raidLevel: Math.min(state.raidLevel + 1, RAID_LEVEL_MAX),
      }
    : nextState
}

/**
 * Handle the `LOAD_SAVE` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function loadSave(state, action) {
  return {
    ...state,
    ...action.payload.state,
  }
}
