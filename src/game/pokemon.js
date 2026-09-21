// Split from src/game/logic.js — see tools/decompile/split-logic.mjs

import { evValue } from '../data/config.js'
import { animatedSprites, moveLearnsets, pokemonSpecies, preEvolutionMap, trainerClasses } from '../data/gameData.js'
import { BOX_SORT_OPTIONS } from '../data/ui.js'

/**
 * Animated sprite directory. It is a merged set: the official Gen V
 * Black/White gifs for national dex ids 1-649, and Pokemon Showdown's
 * animated sprites for every later species/form (PokeAPI has no Gen 6+
 * animation). Anything missing here falls back to the static png — the
 * manifest from download_pokemon_sprites.cjs lets us skip the 404 request.
 * @param {number | string} spriteId
 * @param {boolean} [isBack]
 * @param {boolean} [isShiny]
 */
export function getPokemonSpriteUrl(spriteId, isBack = !1, isShiny = !1) {
  const key = Number(spriteId),
    missing = isShiny
      ? isBack
        ? animatedSprites.backShiny
        : animatedSprites.shiny
      : isBack
        ? animatedSprites.back
        : animatedSprites.front
  if (!Number.isFinite(key) || key === 0 || missing.includes(key))
    return getPokemonSpriteFallbackUrl(spriteId, isBack, isShiny)
  const baseUrl = '/sprites/pokemon/versions/generation-v/black-white/animated'
  return isShiny && isBack
    ? `${baseUrl}/back/shiny/${spriteId}.gif`
    : isShiny
      ? `${baseUrl}/shiny/${spriteId}.gif`
      : isBack
        ? `${baseUrl}/back/${spriteId}.gif`
        : `${baseUrl}/${spriteId}.gif`
}

/**
 * @param {number | string} spriteId
 * @param {boolean} [isBack]
 * @param {boolean} [isShiny]
 */
export function getPokemonSpriteFallbackUrl(spriteId, isBack = !1, isShiny = !1){
  const baseUrl = '/sprites/pokemon'
  return isShiny && isBack
    ? `${baseUrl}/back/shiny/${spriteId}.png`
    : isShiny
      ? `${baseUrl}/shiny/${spriteId}.png`
      : isBack
        ? `${baseUrl}/back/${spriteId}.png`
        : `${baseUrl}/${spriteId}.png`

}

/**
 * @param {number} baseStat
 * @param {number} level
 * @param {number} iv
 */
export function calculateHpStat(baseStat, level, iv) {
  return Math.floor(((2 * baseStat + iv + Math.floor(evValue / 4)) * level) / 100) + level + 10
}

/**
 * @param {number} baseStat
 * @param {number} level
 * @param {number} iv
 */
export function calculateOtherStat(baseStat, level, iv) {
  return Math.floor(
    (Math.floor(((2 * baseStat + iv + Math.floor(evValue / 4)) * level) / 100) + 5) * 1
  )
}

/**
 * @param {Species} species
 * @param {number} level
 * @param {Record<string, number>} ivs
 * @returns {StatBlock}
 */
export function calculatePokemonStats(species, level, ivs) {
  return {
    hp: calculateHpStat(species.baseStats.hp, level, ivs.hp),
    attack: calculateOtherStat(species.baseStats.attack, level, ivs.attack),
    defense: calculateOtherStat(species.baseStats.defense, level, ivs.defense),
    spAttack: calculateOtherStat(species.baseStats.spAttack, level, ivs.spAttack),
    spDefense: calculateOtherStat(species.baseStats.spDefense, level, ivs.spDefense),
    speed: calculateOtherStat(species.baseStats.speed, level, ivs.speed),
  }
}

/** @returns {StatBlock} */
export function generateIVs() {
  return {
    hp: Math.floor(Math.random() * 32),
    attack: Math.floor(Math.random() * 32),
    defense: Math.floor(Math.random() * 32),
    spAttack: Math.floor(Math.random() * 32),
    spDefense: Math.floor(Math.random() * 32),
    speed: Math.floor(Math.random() * 32),
  }
}

/** @returns {StatBlock} */
export function getPerfectIVs() {
  return {
    hp: 31,
    attack: 31,
    defense: 31,
    spAttack: 31,
    spDefense: 31,
    speed: 31,
  }
}

/**
 * @param {number} currentLevel
 * @param {string} growthRate
 * @returns {number}
 */
export function calculateRequiredExperience(currentLevel, growthRate) {
  if (currentLevel <= 1) return 0
  const level = currentLevel
  let value

  switch (growthRate) {
    case 'fast':
      value = (4 * level * level * level) / 5
      break
    case 'mediumFast':
      value = level * level * level
      break
    case 'slow':
      value = (5 * level * level * level) / 4
      break
    case 'mediumSlow':
    default:
      value = (6 / 5) * level * level * level - 15 * level * level + 100 * level - 140
  }
  return Math.floor(value)
}

/**
 * @param {Species} species
 * @param {number} level
 * @returns {number}
 */
export function calculateExpYield(species, level) {
  return Math.floor((species.baseExpYield * level) / 7)
}

/**
 * @param {string} speciesKey
 * @param {string} growthRate
 * @param {number} currentLevel
 * @param {number} totalExp
 * @returns {{ newLevel: number, newMoves: string[] }[]}
 */
export function getLevelUpResults(speciesKey, growthRate, currentLevel, totalExp) {
  const levelUps = []
  let level = currentLevel
  for (; level < 100; ) {
    const requiredExp = calculateRequiredExperience(level + 1, growthRate)
    if (totalExp >= requiredExp) {
      level++
      const learnedMoves = (moveLearnsets[speciesKey] || [])
        .filter(([learnLevel]) => learnLevel === level)
        .map(([, moveId]) => moveId)
      levelUps.push({
        newLevel: level,
        newMoves: learnedMoves,
      })
    } else break
  }
  return levelUps
}

/**
 * @param {string} speciesKey
 * @returns {string[]}
 */
export function getPreEvolutionChain(speciesKey) {
  const chain = [speciesKey],
    seen = new Set([speciesKey])
  let current = speciesKey
  // Special forms (e.g. darmanitan <-> darmanitan-z) make `preEvolutionMap`
  // cyclic, so stop once we revisit a species instead of looping forever.
  for (let next = preEvolutionMap[current]; next && !seen.has(next); next = preEvolutionMap[current]) {
    current = next
    seen.add(current)
    chain.unshift(current)
  }
  return chain
}

/**
 * @param {string} speciesKey
 * @param {number} level
 * @returns {{ moveId: string, learnLevel: number, fromSpecies: string }[]}
 */
export function getFamilyLearnset(speciesKey, level) {
  const chain = getPreEvolutionChain(speciesKey),
    seen = new Set(),
    moves = []
  for (const chainSpeciesKey of chain) {
    const learnset = moveLearnsets[chainSpeciesKey] || []
    for (const [learnLevel, moveId] of learnset)
      learnLevel <= level &&
        !seen.has(moveId) &&
        (seen.add(moveId),
        moves.push({
          moveId,
          learnLevel,
          fromSpecies: chainSpeciesKey,
        }))
  }
  return moves
}

/**
 * @param {string} speciesKey
 * @param {number} level
 * @returns {string[]}
 */
export function resolvePokemonMoves(speciesKey, level) {
  return (moveLearnsets[speciesKey] || [])
    .filter(([learnLevel]) => learnLevel <= level)
    .map(([, moveId]) => moveId)
    .slice(-4)
}

/**
 * @param {string} speciesKey
 * @param {number} level
 * @param {number | string} id
 * @param {boolean} [isShiny]
 * @returns {Pokemon}
 */
export function createPokemon(speciesKey, level, id, isShiny = !1) {
  const species = pokemonSpecies[speciesKey],
    ivs = generateIVs(),
    stats = calculatePokemonStats(species, level, ivs),
    moves = resolvePokemonMoves(speciesKey, level)
  return {
    id: String(id),
    speciesKey,
    name: species.name,
    types: species.types,
    level,
    totalExp: calculateRequiredExperience(level, species.growthRate),
    moves,
    currentHp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    spAttack: stats.spAttack,
    spDefense: stats.spDefense,
    speed: stats.speed,
    ivs,
    isShiny,
  }
}

/**
 * Sort a box by the chosen mode. Dex keeps the original order (dex number,
 * then highest level, then shiny first); the others lead with their own key.
 * @param {Pokemon[]} box
 * @param {string} [mode]
 * @returns {Pokemon[]}
 */
export function sortBoxMembers(box, mode = 'dex') {
  /** @type {(pokemon: Pokemon) => number} */
  const dexId = (pokemon) => pokemonSpecies[pokemon.speciesKey]?.id ?? 0
  /** @type {(pokemon: Pokemon) => string} */
  const speciesName = (pokemon) => pokemonSpecies[pokemon.speciesKey]?.name ?? pokemon.name
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byDex = (left, right) => dexId(left) - dexId(right)
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byLevelDesc = (left, right) => right.level - left.level
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byLevelAsc = (left, right) => left.level - right.level
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byName = (left, right) => speciesName(left).localeCompare(speciesName(right))
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byShiny = (left, right) => (left.isShiny === right.isShiny ? 0 : left.isShiny ? -1 : 1)
  /** @type {(left: Pokemon, right: Pokemon) => number} */
  const byNewest = (left, right) => Number(right.id) - Number(left.id)
  /** @type {Record<string, (left: Pokemon, right: Pokemon) => number>} */
  const comparators = {
    dex: (left, right) => byDex(left, right) || byLevelDesc(left, right) || byShiny(left, right),
    level_desc: (left, right) => byLevelDesc(left, right) || byDex(left, right),
    level_asc: (left, right) => byLevelAsc(left, right) || byDex(left, right),
    name: (left, right) => byName(left, right) || byDex(left, right),
    shiny: (left, right) => byShiny(left, right) || byDex(left, right),
    newest: (left, right) => byNewest(left, right) || byDex(left, right),
  }
  return [...box].sort(comparators[mode] ?? comparators.dex)
}

/**
 * The next box sort mode in the cycle. `BOX_SORT_OPTIONS` is the source of
 * truth for the order; keep this tolerant of unknown values.
 * @param {string} [mode]
 * @returns {string}
 */
export function nextBoxSortMode(mode = 'dex') {
  const index = BOX_SORT_OPTIONS.findIndex((option) => option.value === mode)
  return BOX_SORT_OPTIONS[(index + 1) % BOX_SORT_OPTIONS.length].value
}

/** @param {string} trainerClass */
export function getTrainerSpriteUrl(trainerClass) {
  return `/sprites/trainers/${trainerClasses[trainerClass]}.png`
}

/** @param {string} spriteKey */
export function getBossTrainerSpriteUrl(spriteKey) {
  return spriteKey ? `/sprites/trainers/${spriteKey}.png` : '/sprites/trainers/acetrainer.png'
}
