// Pokemon data entry point. The implementation lives in game/pokemon/:
// sprites, stats, evolution, friendship, exp and creation. Re-exported here so
// callers keep importing from game/pokemon.js.

export { getPokemonSpriteUrl, getPokemonSpriteFallbackUrl, getEggSpriteUrl, getTrainerSpriteUrl, getBossTrainerSpriteUrl } from './pokemon/sprites.js'
export { calculateHpStat, calculateOtherStat, calculatePokemonStats, generateIVs, getPerfectIVs, IV_STAT_ORDER, IV_STAT_LABELS, ivStatLabel, ivVerdict, judgeIVs } from './pokemon/stats.js'
export { getPreEvolutionChain, getFamilyLearnset, resolvePokemonMoves, getTutorMoves, isTutorMove, applyMoveLearning, canEvolveFurther, getThreeStageBaseSpecies } from './pokemon/evolution.js'
export { speciesHasType, challengeEligibleSpecies, monotypeSpeciesPool } from './pokemon/monotype.js'
export { BASE_FRIENDSHIP, MAX_FRIENDSHIP, gainFriendship } from './pokemon/friendship.js'
export { SIZE_RATINGS, SIZE_RATING_HINTS, ALPHA_SIZE, rollSize, sizeRating, isAlphaPokemon, sizeTooltip } from './pokemon/sizes.js'
export { RIBBONS, awardRibbon, awardRibbonToParty, syncMilestoneRibbons, pokemonRibbons } from './ribbons.js'
export { calculateRequiredExperience, calculateExpYield, getLevelUpResults } from './pokemon/exp.js'
export { pokemonDisplayName, isBattleReady, createEgg, createPokemon, rollAbility, abilityDisplayName, sortBoxMembers, insertIntoBox, parseBoxSort, formatBoxSort, nextBoxSortField, toggleBoxSortDirection } from './pokemon/creation.js'
