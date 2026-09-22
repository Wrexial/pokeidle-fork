// Experience curves and level-up/EXP-yield maths. Split from game/pokemon.js.

import { moveLearnsets } from '../../data/gameData.js'

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
