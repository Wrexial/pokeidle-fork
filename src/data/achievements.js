// Achievement definitions. Each is a pure predicate over game state, so no
// extra save data is needed to *detect* one — the list is recomputed on render.
// Claimed rewards are tracked in `state.rewardedAchievements` (see
// CLAIM_ACHIEVEMENT_REWARDS in the reducer).

import { baseRegions, completedGenerations, gymLeaderData, pokedexIndexes, pokemonSpecies, regions } from './gameData.js'

const nationalDexSize = pokedexIndexes.filter((entry) => entry[1].id > 0 && entry[1].id <= 1025).length

const totalBattles = (/** @type {GameState} */ state) =>
  state.wildBattlesWon + state.trainerBattlesWon

const caughtCount = (/** @type {GameState} */ state) =>
  state.pokedexCaught.filter((speciesKey) => {
    const species = pokemonSpecies[speciesKey]
    return species && species.id > 0 && species.id <= 1025
  }).length

const totalPrestige = (/** @type {GameState} */ state) =>
  Object.values(state.regionPrestige).reduce((sum, level) => sum + level, 0)

const bestTowerFloor = (/** @type {GameState} */ state) =>
  Object.values(state.towerBest).reduce((max, floor) => Math.max(max, floor), 0)

const allBadgesOfARegion = (/** @type {GameState} */ state) =>
  regions.some((region) => {
    const gyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === region.id)
    return gyms.length > 0 && gyms.every((gym) => state.defeatedGyms.includes(gym.id))
  })

/**
 * @typedef {{ money?: number, victoryTokens?: number, items?: Record<string, number> }} AchievementReward
 */

/**
 * @type {{ id: string, name: string, description: string, reward: AchievementReward, check: (state: GameState) => boolean }[]}
 */
export const ACHIEVEMENTS = [
  // Battles
  { id: 'firstBlood', name: 'First Blood', description: 'Win your first battle', reward: { money: 500 }, check: (state) => totalBattles(state) >= 1 },
  { id: 'trainer100', name: 'Rising Trainer', description: 'Win 100 battles', reward: { victoryTokens: 1 }, check: (state) => totalBattles(state) >= 100 },
  { id: 'trainer1000', name: 'Veteran', description: 'Win 1,000 battles', reward: { victoryTokens: 2, items: { greatball: 10 } }, check: (state) => totalBattles(state) >= 1000 },
  { id: 'trainer10000', name: 'Battle Hardened', description: 'Win 10,000 battles', reward: { victoryTokens: 3, items: { masterball: 1 } }, check: (state) => totalBattles(state) >= 10000 },
  // Pokedex
  { id: 'catch10', name: 'Collector', description: 'Catch 10 species', reward: { items: { greatball: 5 } }, check: (state) => caughtCount(state) >= 10 },
  { id: 'catch100', name: 'Zoologist', description: 'Catch 100 species', reward: { victoryTokens: 1, items: { ultraball: 10, 'tm:toxic': 1 } }, check: (state) => caughtCount(state) >= 100 },
  { id: 'catch500', name: 'Living Dex', description: 'Catch 500 species', reward: { victoryTokens: 2, money: 10000 }, check: (state) => caughtCount(state) >= 500 },
  { id: 'catchAll', name: 'Dex Complete', description: `Catch all ${nationalDexSize} national dex species`, reward: { victoryTokens: 3, items: { masterball: 1 } }, check: (state) => caughtCount(state) >= nationalDexSize },
  { id: 'gen1', name: 'Kanto Native', description: 'Complete the Generation 1 Pokedex', reward: { victoryTokens: 1 }, check: (state) => completedGenerations(state.pokedexCaught).has(0) },
  // Shinies
  { id: 'shinyFirst', name: 'Shiny!', description: 'Catch your first shiny', reward: { items: { ultraball: 5 } }, check: (state) => state.shinyCaught.length >= 1 },
  { id: 'shiny10', name: 'Sparkling', description: 'Catch 10 shiny forms', reward: { victoryTokens: 1, items: { ultraball: 10 } }, check: (state) => state.shinyCaught.length >= 10 },
  { id: 'shiny50', name: 'Shiny Hunter', description: 'Catch 50 shiny forms', reward: { victoryTokens: 2, items: { masterball: 1 } }, check: (state) => state.shinyCaught.length >= 50 },
  // League
  { id: 'badgeFirst', name: 'First Badge', description: 'Earn a gym badge', reward: { money: 1000, items: { 'tm:protect': 1 } }, check: (state) => state.defeatedGyms.length >= 1 },
  { id: 'badgeFull', name: 'Gym Challenger', description: 'Earn every badge of a region', reward: { victoryTokens: 2, items: { 'tm:swordsDance': 1 } }, check: allBadgesOfARegion },
  { id: 'championFirst', name: 'Champion', description: 'Beat a region Champion', reward: { victoryTokens: 2, items: { 'tm:earthquake': 1 } }, check: (state) => state.defeatedChampions.length >= 1 },
  { id: 'championAll', name: 'World Tour', description: `Conquer all ${baseRegions.length} regions`, reward: { victoryTokens: 3, items: { masterball: 1 } }, check: (state) => state.defeatedChampions.length >= baseRegions.length },
  // Prestige & Tower
  { id: 'prestigeFirst', name: 'New Game+', description: 'Prestige a region', reward: { victoryTokens: 2, items: { 'tm:thunderbolt': 1 } }, check: (state) => totalPrestige(state) >= 1 },
  { id: 'prestige10', name: 'Serial Prestiger', description: 'Prestige regions 10 times', reward: { victoryTokens: 3 }, check: (state) => totalPrestige(state) >= 10 },
  { id: 'tower10', name: 'Tower Climber', description: 'Clear Battle Tower floor 10', reward: { victoryTokens: 1, items: { 'tm:substitute': 1 } }, check: (state) => bestTowerFloor(state) >= 10 },
  { id: 'tower50', name: 'Tower Master', description: 'Clear Battle Tower floor 50', reward: { victoryTokens: 3, items: { masterball: 1 } }, check: (state) => bestTowerFloor(state) >= 50 },
  // Wealth
  { id: 'rich', name: 'Money Bags', description: 'Hold $1,000,000', reward: { items: { masterball: 1 } }, check: (state) => state.money >= 1e6 },
]
