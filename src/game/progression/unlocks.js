// // Location unlocking: resolve the unlock graph and spend Region Unlock Tokens. Split from game/progression.js.

import { baseRegions, gymLeaderData, mapData, regions } from '../../data/gameData.js'

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
        (unlockRule.minigame && !minigameRequirementMet(state, unlockRule)) ||
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
 * Whether a location's `unlock.minigame` requirement is met: clear the minigame,
 * or score at least `minScore` in it.
 * @param {GameState} state
 * @param {{ minigame?: string, minScore?: number }} rule
 * @returns {boolean}
 */
export function minigameRequirementMet(state, rule) {
  if (!rule.minigame) return true
  const record = state.minigameRecords?.[rule.minigame]
  if (rule.minScore) return (record?.best ?? 0) >= rule.minScore
  return !!record?.completed
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
  // A DLC expansion has no Champion to beat: once every area is open, point at
  // its Raid Island (the endgame), not a nonexistent league.
  if (region?.isDlc) {
    const raidId = `${region.id}-raid`
    return {
      title: `${region.name} cleared`,
      detail: 'Every area is open \u2014 explore at your own pace.',
      locationId: mapData[raidId] ? raidId : null,
    }
  }
  if ((state.unlockedRegions ?? []).length >= baseRegions.length)
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

/**
 * The locked locations on the player's frontier *within one region*: the places
 * adjacent to somewhere already open that the panel's "Next Unlocks" list shows.
 * Scoping to the region the player is standing in matters because `unlockOrder`
 * is generation-prefixed, so a map-wide list let an earlier region crowd the
 * region the player is actually in (Sinnoh, Alola, Paldea) out of the panel.
 * Sorted by `unlockOrder`, the soonest first; nothing is truncated, so a gate
 * can never be hidden from the player.
 * @param {string[]} unlocked the current `computeUnlockedLocations` result
 * @param {string} regionId
 * @returns {MapLocation[]}
 */
export function frontierUnlocks(unlocked, regionId) {
  const unlockedSet = new Set(unlocked)
  return Object.values(mapData)
    .filter((location) => {
      if (unlockedSet.has(location.id)) return false
      if ((location.region ?? 'kanto') !== regionId) return false
      // Zone sub-areas are hidden from the map but are the real next step in
      // Alola / Paldea; show them once their zone hub is open.
      if (location.hidden && !unlockedSet.has(location.zone)) return false
      const unlockRule = location.unlock
      return (
        unlockRule.battlesAtLocation !== void 0 ||
        unlockRule.badgesRequired !== void 0 ||
        unlockRule.gymsRequired !== void 0 ||
        unlockRule.championDefeated ||
        unlockRule.requires !== void 0 ||
        unlockRule.entry !== void 0
      )
    })
    .filter((location) => location.connections.some((id) => unlockedSet.has(id)))
    .sort((left, right) => left.unlockOrder - right.unlockOrder)
}
