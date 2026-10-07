// Achievement definitions. Each is a pure predicate over game state, so no
// extra save data is needed to *detect* one — the list is recomputed on render.
// Claimed rewards are tracked in `state.rewardedAchievements` (see
// CLAIM_ACHIEVEMENT_REWARDS in the reducer).

import { baseRegions, completedGenerations, gymLeaderData, isSpeciesRegistered, pokedexIndexes, regions } from './gameData.js'
import { isTmItem, TM_MOVE_IDS } from './tms.js'

const nationalDexSize = pokedexIndexes.filter((entry) => entry[1].id > 0 && entry[1].id <= 1025).length

/**
 * Fixed minigames that report a record. Poke Pelago is a hub scene rather than
 * a scored game, so it is left out of the "clear them all" goals.
 */
export const RECORDABLE_MINIGAMES = [
  'gameCorner',
  'bugContest',
  'mining',
  'safari',
  'academyQuiz',
  'voltorbFlip',
  'auctionHouse',
  'contest',
  'pokeathlon',
  'pokeRadar',
  'battleRoyal',
  'dynamaxAdventures',
  'lightsOut',
  'curry',
  'pokestar',
  'puzzleLeague',
  'memory',
  'whack',
  'musical',
  'picnic',
  'pokeballFactory',
  'ruinsPuzzle',
  'iceSlide',
  'mantineSurf',
  'rotomRally',
  'ogreOustin',
]

const totalBattles = (/** @type {GameState} */ state) =>
  state.wildBattlesWon + state.trainerBattlesWon

const caughtCount = (/** @type {GameState} */ state) => {
  const registered = new Set(state.pokedexCaught),
    nationalDex = pokedexIndexes.filter((entry) => entry[1].id > 0 && entry[1].id <= 1025)
  return nationalDex.filter(([speciesKey]) => isSpeciesRegistered(registered, speciesKey)).length
}

const totalPrestige = (/** @type {GameState} */ state) =>
  Object.values(state.regionPrestige).reduce((sum, level) => sum + level, 0)

const bestTowerFloor = (/** @type {GameState} */ state) =>
  Object.values(state.towerBest).reduce((max, floor) => Math.max(max, floor), 0)

const allBadgesOfARegion = (/** @type {GameState} */ state) =>
  regions.some((region) => {
    const gyms = gymLeaderData.filter((gym) => (gym.region ?? 'kanto') === region.id)
    return gyms.length > 0 && gyms.every((gym) => state.defeatedGyms.includes(gym.id))
  })

const ownedPokemon = (/** @type {GameState} */ state) =>
  state.party.length + state.box.length

const ownedTms = (/** @type {GameState} */ state) =>
  Object.keys(state.inventory ?? {}).filter(
    (itemId) => isTmItem(itemId) && (state.inventory[itemId] ?? 0) > 0
  ).length

const clearedMinigames = (/** @type {GameState} */ state) =>
  RECORDABLE_MINIGAMES.filter((id) => state.minigameRecords?.[id]?.completed).length

const hasLevel100 = (/** @type {GameState} */ state) =>
  [...state.party, ...state.box].some((pokemon) => (pokemon.level ?? 0) >= 100)

const hasMaxFriendship = (/** @type {GameState} */ state) =>
  // 255 is the maximum friendship a Pokemon can reach (see MAX_FRIENDSHIP).
  [...state.party, ...state.box].some((pokemon) => (pokemon.friendship ?? 0) >= 255)

const allRegionsPrestiged = (/** @type {GameState} */ state) =>
  baseRegions.length > 0 &&
  baseRegions.every((region) => (state.regionPrestige[region.id] ?? 0) >= 1)

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
  { id: 'rich10m', name: 'Tycoon', description: 'Hold $10,000,000', reward: { victoryTokens: 1, items: { masterball: 1 } }, check: (state) => state.money >= 1e7 },
  // Collection depth
  { id: 'owned50', name: 'Box Filler', description: 'Own 50 Pokemon at once', reward: { money: 5000 }, check: (state) => ownedPokemon(state) >= 50 },
  { id: 'owned150', name: "Professor's Aide", description: 'Own 150 Pokemon at once', reward: { victoryTokens: 1, items: { ultraball: 10 } }, check: (state) => ownedPokemon(state) >= 150 },
  { id: 'level100', name: 'Peak Performance', description: 'Raise a Pokemon to level 100', reward: { victoryTokens: 2, items: { masterball: 1 } }, check: hasLevel100 },
  { id: 'maxFriendship', name: 'Best Friends', description: 'Raise a Pokemon to maximum friendship', reward: { items: { ultraball: 5 } }, check: hasMaxFriendship },
  // TMs
  { id: 'tmFirst', name: 'Technical Machine', description: 'Find your first TM', reward: { money: 1000 }, check: (state) => ownedTms(state) >= 1 },
  { id: 'tm25', name: 'Move Tutor', description: 'Collect 25 TMs', reward: { victoryTokens: 1 }, check: (state) => ownedTms(state) >= 25 },
  { id: 'tm100', name: 'TM Collector', description: 'Collect 100 TMs', reward: { victoryTokens: 2, items: { ultraball: 20 } }, check: (state) => ownedTms(state) >= 100 },
  { id: 'tmAll', name: 'Full Set', description: `Collect all ${TM_MOVE_IDS.length} TMs`, reward: { victoryTokens: 3, items: { masterball: 1 } }, check: (state) => ownedTms(state) >= TM_MOVE_IDS.length },
  // Minigames
  { id: 'minigameFirst', name: 'Attraction Goer', description: 'Clear any minigame', reward: { money: 1500 }, check: (state) => clearedMinigames(state) >= 1 },
  { id: 'minigameFive', name: 'Minigame Regular', description: 'Clear 5 different minigames', reward: { victoryTokens: 1 }, check: (state) => clearedMinigames(state) >= 5 },
  { id: 'minigameAll', name: 'Arcade Champion', description: `Clear all ${RECORDABLE_MINIGAMES.length} minigames`, reward: { victoryTokens: 3, items: { masterball: 1 } }, check: (state) => clearedMinigames(state) >= RECORDABLE_MINIGAMES.length },
  { id: 'whack30', name: 'Lightning Reflexes', description: 'Score 30 in Whack-a-Diglett', reward: { money: 5000, items: { expCandyL: 1 } }, check: (state) => (state.minigameRecords?.whack?.best ?? 0) >= 30 },
  { id: 'voltorbCoins', name: 'Coin Rush', description: 'Bank 2,500 coins in a Voltorb Flip run', reward: { victoryTokens: 1, items: { expCandyM: 1 } }, check: (state) => (state.minigameRecords?.voltorbFlip?.best ?? 0) >= 2500 },
  { id: 'battleRoyal10', name: 'Royal Rumble', description: 'Win 10 battles in one Battle Royal run', reward: { victoryTokens: 1 }, check: (state) => (state.minigameRecords?.battleRoyal?.best ?? 0) >= 10 },
  { id: 'dynamaxClear', name: 'Max Lair Champion', description: 'Clear every stage of a Dynamax Adventure', reward: { victoryTokens: 1, items: { expCandyL: 1 } }, check: (state) => (state.minigameRecords?.dynamaxAdventures?.best ?? 0) >= 3 },
  { id: 'puzzleLeague1500', name: 'Combo Master', description: 'Score 1,500 in Pokemon Puzzle League', reward: { money: 8000 }, check: (state) => (state.minigameRecords?.puzzleLeague?.best ?? 0) >= 1500 },
  { id: 'pokestarPerfect', name: 'Box Office Smash', description: 'Score a perfect 9 at Pokestar Studios', reward: { money: 8000, items: { expCandyL: 1 } }, check: (state) => (state.minigameRecords?.pokestar?.best ?? 0) >= 9 },
  { id: 'contestStar', name: 'Rising Star', description: 'Score 30 in a Pokemon Contest', reward: { money: 6000 }, check: (state) => (state.minigameRecords?.contest?.best ?? 0) >= 30 },
  // Prestige & Tower extras
  { id: 'tower100', name: 'Tower Legend', description: 'Clear Battle Tower floor 100', reward: { victoryTokens: 3, items: { masterball: 1 } }, check: (state) => bestTowerFloor(state) >= 100 },
  { id: 'prestigeAllRegions', name: 'Seasoned Traveller', description: 'Prestige every region once', reward: { victoryTokens: 3 }, check: allRegionsPrestiged },
]
