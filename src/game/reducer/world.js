// Reducer handlers for world actions. Split from game/reducer.js.

import { RAID_LEVEL_MAX, prestigeTokenReward } from '../../data/config.js'
import { POKEMON_TYPES } from '../../data/moves.js'
import { elite4Data, gymLeaderData, mapData, regions } from '../../data/gameData.js'
import { emptyBattleHazards } from '../hazards.js'
import { createPokemon, isBattleReady } from '../pokemon.js'
import { PRESTIGE_PERKS, PRESTIGE_POINT_REWARD, perkCost, totalPrestigeInvested } from '../prestige.js'
import {
  computeUnlockedLocations,
  entryRoutePath,
  getRegionUnlockTokens,
  prepareNextBattle,
} from '../progression.js'
import { rodForId, rodsForRegionCount } from '../minigames.js'
import { settleUnlockTokens, withNotification } from '../reducer-helpers.js'

/**
 * Handle the `SELECT_STARTER` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function selectStarter(state, action) {
  const requestedRegion = regions.find(
      (candidate) => candidate.id === (action.payload.region ?? 'kanto')
    ),
    // DLC sub-regions are post-game expansions opened by beating their parent's
    // Champion, so they can never start a run. A stale/forged request for one
    // falls back to Kanto rather than stranding the player in a region with no
    // league track.
    region =
      requestedRegion && !requestedRegion.isDlc
        ? requestedRegion
        : regions.find((candidate) => candidate.id === 'kanto'),
    regionId = region?.id ?? 'kanto',
    entryTown = region?.entry,
    entryPath = entryRoutePath(entryTown),
    firstRoute = entryPath.route,
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
    starterSpeciesKey: speciesKey,
    challengeMonotype: POKEMON_TYPES.includes(action.payload.monotype)
      ? action.payload.monotype
      : null,
    nuzlockeGameOver: !1,
    playerPokemon: starterPokemon,
    party: [starterPokemon],
    nextPokemonId: state.nextPokemonId + 1,
    currentLocation: firstRoute ?? entryTown ?? state.currentLocation,
    currentRoute: firstRoute ? mapData[firstRoute]?.routeKey ?? firstRoute : state.currentRoute,
    unlockedRegions: [regionId],
    unlockedLocations: entryTown
      ? [...new Set([entryTown, ...entryPath.path])]
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
  if (!region || region.isDlc || state.unlockedRegions.includes(regionId)) return state
  if (getRegionUnlockTokens(state) <= 0) return state
  const entryId = region.entry,
    entryPath = entryRoutePath(entryId),
    unlockedState = {
      ...state,
      unlockedRegions: [...state.unlockedRegions, regionId],
      unlockedLocations: [
        ...new Set([
          ...state.unlockedLocations,
          ...(entryId ? [entryId] : []),
          ...entryPath.path,
        ]),
      ],
    },
    // Better rods are found as more regions open, so fishing deepens with the
    // world rather than being tied to one place.
    newRods = rodsForRegionCount(unlockedState.unlockedRegions.length).filter(
      (rodId) => !(state.rods ?? []).includes(rodId)
    ),
    withRods =
      newRods.length > 0
        ? { ...unlockedState, rods: [...(state.rods ?? []), ...newRods] }
        : unlockedState,
    settled = settleUnlockTokens({
      ...withRods,
      unlockedLocations: computeUnlockedLocations(withRods),
      battleLog: [
        ...state.battleLog,
        `${region.name} unlocked!`,
        ...newRods.map((rodId) => `Obtained the ${rodForId(rodId).name}!`),
      ].slice(-50),
    })
  let next = settled
  for (const rodId of newRods)
    next = withNotification(next, {
      message: `You obtained the ${rodForId(rodId).name}! Fishing just got better.`,
      tone: 'success',
      icon: '🎣',
      dedupeKey: `rod:${rodId}`,
    })
  return withNotification(next, {
    message: `A new region opened: ${region.name}!`,
    tone: 'success',
    icon: '🗺️',
    dedupeKey: `region:${regionId}`,
  })
}

/**
 * Handle the `TRAVEL` action.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function travel(state, action) {
  const { locationId } = action.payload
  if (locationId === state.currentLocation) return state
  // Check the freshly-computed set, not just the saved list: a loaded save can
  // meet a gate without having recomputed its unlocked locations yet.
  const location = mapData[locationId],
    unlocked = computeUnlockedLocations(state)
  if (!location || !unlocked.includes(locationId)) return state
  const routeKey = location.routeKey || state.currentRoute
  return {
    ...prepareNextBattle(state),
    currentLocation: locationId,
    currentRoute: routeKey,
    // Leaving a route breaks the SOS chain (its per-route record is kept).
    sosChain: { routeKey, count: 0 },
    unlockedLocations: unlocked,
    battleLog: [...state.battleLog, `Traveled to ${location.name}!`].slice(-50),
    inRaid: !1,
    raidLegendary: null,
    raidRegion: null,
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
    entryPath = entryRoutePath(entryId),
    firstRoute = entryPath.route,
    // Keep the entry, its zone hub (when there is one) and the first sub-area
    // unlocked; computeUnlockedLocations rebuilds the rest from the region's
    // (now cleared) gates.
    keepUnlocked = /** @param {string} id */ (id) =>
      !regionLocationIds.has(id) || id === entryId || entryPath.path.includes(id),
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
      prestigePoints: (state.prestigePoints ?? 0) + PRESTIGE_POINT_REWARD,
      currentLocation: firstRoute ?? entryId ?? state.currentLocation,
      currentRoute: firstRoute ?? state.currentRoute,
      // Prestiging resets the map, so the SOS chain starts over too.
      sosChain: { routeKey: firstRoute ?? entryId ?? state.currentRoute, count: 0 },
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
        `Earned ${prestigeTokenReward} Victory Tokens and ${PRESTIGE_POINT_REWARD} Prestige Points!`,
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
 * Handle the `BUY_PRESTIGE_PERK` action: spend Prestige Points on the next
 * rank of a perk.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function buyPrestigePerk(state, action) {
  const perkId = action.payload?.perkId,
    perk = PRESTIGE_PERKS.find((entry) => entry.id === perkId),
    rank = state.prestigePerks?.[perkId] ?? 0,
    cost = perkCost(perkId, rank)
  if (!perk || cost == null || (state.prestigePoints ?? 0) < cost) return state
  return withNotification(
    {
      ...state,
      prestigePoints: state.prestigePoints - cost,
      prestigePerks: { ...state.prestigePerks, [perkId]: rank + 1 },
      battleLog: [...state.battleLog, `${perk.name} reached rank ${rank + 1}!`].slice(-50),
    },
    {
      message: `Prestige perk: ${perk.name} rank ${rank + 1}!`,
      tone: 'success',
      icon: '\u2605',
      dedupeKey: `prestigeperk:${perkId}:${rank + 1}`,
    }
  )
}

/**
 * Handle the `RESET_PRESTIGE_PERKS` action: refund every spent Prestige Point
 * and clear the perk tree, so a player can re-spec without losing progress.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function resetPrestigePerks(state, action) {
  const refund = totalPrestigeInvested(state)
  if (refund <= 0) return state
  return withNotification(
    {
      ...state,
      prestigePoints: (state.prestigePoints ?? 0) + refund,
      prestigePerks: {},
      battleLog: [
        ...state.battleLog,
        `Prestige perks reset \u2014 refunded ${refund} Prestige Point${refund === 1 ? '' : 's'}.`,
      ].slice(-50),
    },
    {
      message: `Prestige perks reset \u2014 refunded ${refund} PP.`,
      tone: 'info',
      icon: '\u21ba',
      dedupeKey: 'prestige:respec',
    }
  )
}
