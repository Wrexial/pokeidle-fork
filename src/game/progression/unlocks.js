// // Location unlocking: resolve the unlock graph and spend Region Unlock Tokens. Split from game/progression.js.

import { gymLeaderData, mapData, regions } from '../../data/gameData.js'

/** @type {Record<string, string[]>} */
const gymIdsByRegion = {}
for (const gym of gymLeaderData) {
  const regionId = gym.region ?? 'kanto'
  ;(gymIdsByRegion[regionId] ??= []).push(gym.id)
}

/**
 * @param {GameState} state
 * @returns {string[]}
 */
export function computeUnlockedLocations(state) {
  const unlocked = new Set(state.unlockedLocations),
    defeatedGyms = new Set(state.defeatedGyms),
    caughtSpecies = new Set(state.pokedexCaught),
    caughtCount = state.pokedexCaught.length,
    highestPartyLevel = state.party.reduce((max, member) => Math.max(max, member.level), 0)
  let changed = true
  while (changed) {
    changed = false
    for (const [locationId, location] of Object.entries(mapData)) {
      if (unlocked.has(locationId)) continue
      const unlockRule = location.unlock,
        locationRegion = location.region ?? 'kanto',
        // `badgesRequired` counts only this region's badges, so prestiging a
        // region re-locks its badge gates even when other regions are complete.
        badgeCount = (gymIdsByRegion[locationRegion] ?? []).filter(
          /** @param {string} gymId */ (gymId) => defeatedGyms.has(gymId)
        ).length
      const blocked =
        (unlockRule.battlesAtLocation &&
          unlockRule.battlesAtLocation.some(
            (requiredBattles) => (state.battlesWonByLocation[requiredBattles.locationId] ?? 0) < requiredBattles.count
          )) ||
        (unlockRule.caughtCount && caughtCount < unlockRule.caughtCount) ||
        (unlockRule.caughtOnRoute &&
          unlockRule.caughtOnRoute.species.filter((speciesKey) => caughtSpecies.has(speciesKey)).length <
            unlockRule.caughtOnRoute.count) ||
        (unlockRule.partyLevel && highestPartyLevel < unlockRule.partyLevel) ||
        (unlockRule.badgesRequired && badgeCount < unlockRule.badgesRequired) ||
        (unlockRule.gymsRequired &&
          unlockRule.gymsRequired.some((gymId) => !defeatedGyms.has(gymId))) ||
        (unlockRule.championDefeated &&
          !state.defeatedChampions.includes(
            unlockRule.championDefeated === true ? 'kanto' : unlockRule.championDefeated
          )) ||
        (unlockRule.requires && unlockRule.requires.some((id) => !unlocked.has(id))) ||
        (unlockRule.entry &&
          !(
            state.startRegion === (location.region ?? 'kanto') ||
            state.unlockedRegions.includes(location.region ?? 'kanto')
          ))
      if (!blocked) {
        unlocked.add(locationId)
        changed = true
      }
    }
  }
  return Array.from(unlocked)
}

/**
 * The first wild route a region's entry leads to. Normally that is the entry
 * town's first route connection, but Alola and Paldea connect their entry town
 * to a zone hub (an island / province) whose sub-areas hold the wilds, so the
 * search walks into the hub and takes its first sub-area. `path` lists every
 * location that has to be unlocked for the player to actually reach a wild
 * area (the hub included, because a zone hub itself never spawns wilds).
 * @param {string | undefined | null} entryId
 * @returns {{ route: string | null, path: string[] }}
 */
export function entryRoutePath(entryId) {
  const entry = entryId ? mapData[entryId] : null
  if (!entry) return { route: null, path: [] }
  const route = (entry.connections ?? []).find((id) => mapData[id]?.type === 'route')
  if (route) return { route, path: [route] }
  const zone = (entry.connections ?? []).find((id) => mapData[id]?.type === 'zone')
  if (!zone) return { route: null, path: [] }
  const subArea = mapData[zone]?.routeKey ?? mapData[zone]?.subAreas?.[0]?.id ?? null
  return {
    route: subArea && mapData[subArea]?.type === 'route' ? subArea : null,
    path: [zone, ...(subArea ? [subArea] : [])],
  }
}

/**
 * Region Unlock Tokens available to spend: one per region Champion beaten,
 * minus the regions already opened beyond the starting one. Once every region
 * is open there is nothing left to spend them on; the leftover is converted to
 * Victory Tokens (see `settleUnlockTokens` in the reducer) and the Town Map
 * hides the banner.
 * @param {GameState} state
 * @returns {number}
 */
export function getRegionUnlockTokens(state) {
  const openedRegions = Math.max(0, (state.unlockedRegions ?? []).length - 1)
  return Math.max(0, state.defeatedChampions.length - openedRegions)
}

/**
 * The goal to show when a region has no locations left to unlock (so there is
 * no next route to point at): beat its Champion for the Unlock Token, spend a
 * token that is already banked, or, with nothing left, a completion message.
 * @param {GameState} state
 * @param {string} regionId
 * @returns {{ title: string, detail: string, locationId: string | null }}
 */
export function regionProgressionGoal(state, regionId) {
  const region = regions.find((candidate) => candidate.id === regionId)
  if ((state.unlockedRegions ?? []).length >= regions.length)
    return {
      title: 'Every region is open',
      detail: 'The whole world is yours to explore.',
      locationId: null,
    }
  if (!state.defeatedChampions.includes(regionId))
    return {
      title: `Beat the ${region?.name ?? regionId} Champion`,
      detail: 'Beating a region Champion earns a Region Unlock Token to open a new region.',
      locationId: region?.leagueLocationKey ?? null,
    }
  const tokens = getRegionUnlockTokens(state)
  if (tokens > 0)
    return {
      title: `${tokens} Region Unlock Token${tokens > 1 ? 's' : ''} ready`,
      detail: 'Open the Town Map and pick a locked region to spend it.',
      locationId: null,
    }
  return {
    title: 'Beat another region Champion',
    detail: 'Any region Champion earns a new Region Unlock Token.',
    locationId: null,
  }
}
