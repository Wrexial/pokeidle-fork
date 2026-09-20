// Split from src/game/logic.js — see tools/decompile/split-logic.mjs

import { ballOrder, pokeBalls } from '../data/items.js'
import { pokemonSpecies } from '../data/gameData.js'
import { getCatchRule } from './progression.js'

export function getCatchRate(speciesKey) {
  return pokemonSpecies[speciesKey].catchRate ?? 255
}

export function calculateCatchChance(speciesKey, ballId) {
  const catchRate = getCatchRate(speciesKey),
    ball = pokeBalls[ballId]
  return ball ? Math.min(1, (catchRate * ball.ballModifier) / 255) : 0
}

export function attemptCatch(speciesKey, ballId) {
  const chance = calculateCatchChance(speciesKey, ballId)
  return Math.random() < chance
}

export function selectBestBall(speciesKey, enabledBalls, inventory) {
  const usableBalls = ballOrder.filter((ballId) => enabledBalls.includes(ballId) && (inventory[ballId] ?? 0) > 0)
  if (usableBalls.length === 0) return null
  const catchRate = getCatchRate(speciesKey)
  for (const ballId of usableBalls) if ((catchRate * pokeBalls[ballId].ballModifier) / 255 >= 1) return ballId
  return usableBalls[usableBalls.length - 1]
}

export function shouldAutoCatch(state, routeKey, speciesKey, level, isShiny) {
  const rule = getCatchRule(state, routeKey, speciesKey)
  if (!rule.enabled || rule.enabledBalls.length === 0) return !1
  switch (rule.mode) {
    case 'always':
      return !0
    case 'shiny_only':
      return isShiny
    case 'level_threshold':
      return level >= rule.levelThreshold
    case 'pokedex_new':
      return !state.pokedexCaught.includes(speciesKey)
    default:
      return !0
  }
}

export function selectAutoCatchBall(state, routeKey, speciesKey) {
  const rule = getCatchRule(state, routeKey, speciesKey)
  return selectBestBall(speciesKey, rule.enabledBalls, state.inventory)
}

export function getRarityFromRate(rate) {
  return rate >= 20
    ? 'common'
    : rate >= 10
      ? 'uncommon'
      : rate >= 5
        ? 'rare'
        : rate >= 1
          ? 'very_rare'
          : 'ultra_rare'
}
