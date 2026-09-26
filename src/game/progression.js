// Progression entry point. The implementation lives in game/progression/:
// items, offline, party, unlocks, encounters, teams, exp and roads. Re-exported
// here so callers keep importing from game/progression.js.

export { getItemCategory, isHeldItem, getItemSellPrice, isUsableConsumable, rollValuableDrop, rollCandyDrop, isActiveEffectItem, getItemInfo, itemTooltip, formatReward, releaseReward } from './progression/items.js'
export { awaySummary, computeOfflineReward, formatAwayDuration } from './progression/offline.js'
export { tickPokerus, pokerusExpMultiplier, tickPartyEggs, getActivePartyIndex, syncActivePokemonIntoParty, loadActivePokemonFromParty, createIdleBattleState, prepareNextBattle, tickBattleCounters } from './progression/party.js'
export { computeUnlockedLocations, getRegionUnlockTokens, regionProgressionGoal, entryRoutePath } from './progression/unlocks.js'
export { getCatchRule, checkShinyOdds, shinyOddsForCompletedGenerations, shinyOddsForSpecies, HONEY_CHAIN_THRESHOLD, applyEncounterModifiers, resolveActiveModifiers, shinyChainMultiplier, pickRaidLegendary, resolveRoamer, resolvePokemonEncounter, minLevelForSpecies } from './progression/encounters.js'
export { buildTrainerTeam, buildTowerTeam, buildTowerFloor } from './progression/teams.js'
export { awardExperience } from './progression/exp.js'
export { formatCooldown, createRoads } from './progression/roads.js'
