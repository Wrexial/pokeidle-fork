// Minigame logic entry point. The implementation lives in game/minigames/:
// mining, bug-contest, game-corner and registry. Re-exported here so callers
// keep importing from game/minigames.js.

export { MINING_COST, MINING_TILES, MINING_REWARD_TILES, MINING_DIGS, rollMiningReward, rewardItemName } from './minigames/mining.js'
export { BUG_CONTEST_COST, BUG_CONTEST_BUSHES, BUG_CONTEST_RUSTLES, BUG_CONTEST_BALL, BUG_CONTEST_POOL, contestScore, bugFleeChance, rollContestBug, bugCatchChance, throwNetBall, bugStays, buildContestResults, contestPlayerRank, bugContestPrize } from './minigames/bug-contest.js'
export { SAFARI_COST, SAFARI_BALLS, SAFARI_BALL, SAFARI_ROUTE_KEY, SAFARI_EFFECT_TURNS, rollSafariPokemon, safariCatchChance, safariFleeChance, applySafariAction, tickSafariEffects, safariThrowsBall, safariFlees } from './minigames/safari.js'
export { QUIZ_COST, QUIZ_QUESTIONS, QUIZ_SECONDS, QUIZ_LIVES, QUIZ_OPTIONS, generateQuizQuestion, quizPrize } from './minigames/academy-quiz.js'
export { SLOT_SPIN_COST, SLOT_REELS, SLOT_ROWS, SLOT_PAYLINES, SLOT_SYMBOLS, SLOT_JACKPOT, rollSlotSymbol, spinSlots } from './minigames/game-corner.js'
export { MINIGAME_LOCATIONS, MINIGAME_START_ACTION, MINIGAME_INFO, POI_LOCATIONS } from './minigames/registry.js'
export { RODS, DEFAULT_ROD, rodForId, bestRodId, rodsForRegionCount, nextRod } from './minigames/rods.js'
export { FISHING_LOCATIONS, fishingExclusiveFor, isFishingRoute, routeHasWaterSpecies, encountersWithoutFishingExclusive } from './minigames/fishing.js'
export { ACTIVITY_ATTEMPTS, ACTIVITY_SWEEP_MS, ACTIVITY_HIT_ZONE, ACTIVITY_PERFECT_ZONE, ACTIVITY_ULTRA_ZONE, ROUTE_ACTIVITIES, routeActivityIds, rollActivityEncounter, rollFishingExclusive, rollActivityLoot, activityRewardName } from './minigames/route-activities.js'
