// Pokemon data entry point. The implementation lives in game/pokemon/:
// sprites, stats, evolution, friendship, exp and creation. Re-exported here so
// callers keep importing from game/pokemon.js.

export { getPokemonSpriteUrl, getPokemonSpriteFallbackUrl, getEggSpriteUrl, getTrainerSpriteUrl, getBossTrainerSpriteUrl } from './pokemon/sprites.js'
export { calculateHpStat, calculateOtherStat, calculatePokemonStats, generateIVs, getPerfectIVs, IV_STAT_ORDER, IV_STAT_LABELS, ivStatLabel, ivVerdict, judgeIVs } from './pokemon/stats.js'
export { getPreEvolutionChain, getFamilyLearnset, resolvePokemonMoves, getTutorMoves, isTutorMove, canEvolveFurther, getThreeStageBaseSpecies } from './pokemon/evolution.js'
export { speciesHasType, challengeEligibleSpecies, monotypeSpeciesPool, randomMonotypeSpecies } from './pokemon/monotype.js'
export { BASE_FRIENDSHIP, MAX_FRIENDSHIP, gainFriendship } from './pokemon/friendship.js'
export { calculateRequiredExperience, calculateExpYield, getLevelUpResults } from './pokemon/exp.js'
export { pokemonDisplayName, isBattleReady, createEgg, createPokemon, rollAbility, abilityDisplayName, sortBoxMembers, insertIntoBox, nextBoxSortMode } from './pokemon/creation.js'
