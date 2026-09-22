// // Location unlocking: resolve the unlock graph and spend Region Unlock Tokens. Split from game/progression.js.

import { gymLeaderData, mapData } from '../../data/gameData.js'

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
