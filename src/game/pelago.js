// Poké Pelago: the Alola island hub. Companion care and the Berry Garden live
// here as active panels, and three passive islands (bean farm, training, caves)
// run while you battle. Assign boxed Pokemon to an island, come back later and
// collect what they produced.

import { pokemonSpecies } from '../data/gameData.js'
import { calculatePokemonStats, getLevelUpResults, applyMoveLearning } from './pokemon.js'

/** Pokemon that can be assigned to one island. */
export const PELAGO_SLOTS = 3

/** Banked completions an island can hold before it stops counting. */
export const PELAGO_MAX_READY = 10

/** EXP each assigned Pokemon gains per completed Training Isle cycle. */
export const PELAGO_TRAINING_EXP = 1500

/** Poke Beans each assigned Pokemon grows per completed Bean Farm cycle. */
export const PELAGO_BEANS_PER_POKEMON = 2

/**
 * The passive islands.
 * @type {Record<string, { id: string, name: string, icon: string, goal: number, description: string }>}
 */
export const PELAGO_ISLANDS = {
  beans: {
    id: 'beans',
    name: 'Bean Farm',
    icon: '\u{1fab4}',
    goal: 25,
    description: 'Your Pokemon grow sweet Poke Beans you can use or sell.',
  },
  training: {
    id: 'training',
    name: 'Training Isle',
    icon: '\u{1f94a}',
    goal: 40,
    description: 'Your Pokemon train and gain EXP while you are away.',
  },
  caves: {
    id: 'caves',
    name: 'Isle Caves',
    icon: '\u26cf\ufe0f',
    goal: 50,
    description: 'Your Pokemon dig up stones, treasures and battle items.',
  },
}

/** A fresh Pelago state with every island empty. */
export function createPelago() {
  return Object.fromEntries(
    Object.keys(PELAGO_ISLANDS).map((islandId) => [
      islandId,
      { assigned: /** @type {string[]} */ ([]), progress: 0, ready: 0 },
    ])
  )
}

/**
 * Advance every staffed island by one wild win. A completed cycle banks a
 * reward (up to the cap) and starts again.
 * @param {Pelago} pelago
 * @returns {Pelago}
 */
export function tickPelago(pelago) {
  if (!pelago) return pelago
  let changed = false
  const next = { ...pelago }
  for (const islandId of Object.keys(PELAGO_ISLANDS)) {
    const island = pelago[islandId]
    if (!island || island.assigned.length === 0) continue
    changed = true
    const progress = island.progress + 1
    if (progress >= PELAGO_ISLANDS[islandId].goal)
      next[islandId] = {
        ...island,
        progress: 0,
        ready: Math.min(PELAGO_MAX_READY, island.ready + 1),
      }
    else next[islandId] = { ...island, progress }
  }
  return changed ? next : pelago
}

/**
 * Grant flat EXP to a Pokemon (used by the Training Isle), levelling it up and
 * learning moves as needed. Returns the same object when nothing changed.
 * @param {Pokemon} pokemon
 * @param {number} expGained
 * @returns {Pokemon}
 */
export function grantExperience(pokemon, expGained) {
  const species = pokemonSpecies[pokemon.speciesKey]
  if (!species || expGained <= 0) return pokemon
  const newTotalExp = (pokemon.totalExp ?? 0) + expGained,
    levelUps = getLevelUpResults(
      pokemon.speciesKey,
      species.growthRate,
      pokemon.level,
      newTotalExp
    )
  if (levelUps.length === 0) return { ...pokemon, totalExp: newTotalExp }
  const lastLevelUp = levelUps[levelUps.length - 1],
    stats = calculatePokemonStats(
      species,
      lastLevelUp.newLevel,
      pokemon.ivs,
      pokemon.nature,
      pokemon.evs
    ),
    { moves } = applyMoveLearning(
      pokemon.speciesKey,
      pokemon.moves,
      levelUps.flatMap((levelUp) => levelUp.newMoves),
      pokemon.eggMoves
    )
  return {
    ...pokemon,
    totalExp: newTotalExp,
    level: lastLevelUp.newLevel,
    maxHp: stats.hp,
    currentHp: Math.min(pokemon.currentHp + Math.max(0, stats.hp - pokemon.maxHp), stats.hp),
    attack: stats.attack,
    defense: stats.defense,
    spAttack: stats.spAttack,
    spDefense: stats.spDefense,
    speed: stats.speed,
    moves,
  }
}
