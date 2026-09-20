// Split from src/game/logic.js — see tools/decompile/split-logic.mjs

import { evValue } from '../data/config.js'
import { moveLearnsets, pokemonSpecies, preEvolutionMap, trainerClasses } from '../data/gameData.js'

export function getPokemonSpriteUrl(spriteId, isBack = !1, isShiny = !1) {
  const baseUrl = '/sprites/pokemon/versions/generation-v/black-white/animated'
  return isShiny && isBack
    ? `${baseUrl}/back/shiny/${spriteId}.gif`
    : isShiny
      ? `${baseUrl}/shiny/${spriteId}.gif`
      : isBack
        ? `${baseUrl}/back/${spriteId}.gif`
        : `${baseUrl}/${spriteId}.gif`
}

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

export function calculateHpStat(baseStat, level, iv) {
  return Math.floor(((2 * baseStat + iv + Math.floor(evValue / 4)) * level) / 100) + level + 10
}

export function calculateOtherStat(baseStat, level, iv) {
  return Math.floor(
    (Math.floor(((2 * baseStat + iv + Math.floor(evValue / 4)) * level) / 100) + 5) * 1
  )
}

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

export function calculateExpYield(species, level) {
  return Math.floor((species.baseExpYield * level) / 7)
}

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

export function getPreEvolutionChain(speciesKey) {
  const chain = [speciesKey]
  let current = speciesKey
  for (; preEvolutionMap[current]; )
    (chain.unshift(preEvolutionMap[current]), (current = preEvolutionMap[current]))
  return chain
}

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

export function resolvePokemonMoves(speciesKey, level) {
  return (moveLearnsets[speciesKey] || [])
    .filter(([learnLevel]) => learnLevel <= level)
    .map(([, moveId]) => moveId)
    .slice(-4)
}

export function createPokemon(speciesKey, level, id, isShiny = !1) {
  const species = pokemonSpecies[speciesKey],
    ivs = generateIVs(),
    stats = calculatePokemonStats(species, level, ivs),
    moves = resolvePokemonMoves(speciesKey, level)
  return {
    id: String(id),
    speciesKey,
    name: species.name,
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

export function getTrainerSpriteUrl(trainerClass) {
  return `/sprites/trainers/${trainerClasses[trainerClass]}.png`
}

export function getBossTrainerSpriteUrl(spriteKey) {
  return spriteKey ? `/sprites/trainers/${spriteKey}.png` : '/sprites/trainers/acetrainer.png'
}
