// // Trainer and Battle Tower team construction from the species data. Split from game/progression.js.

import { evolutionData, pokemonSpecies } from '../../data/gameData.js'
import { checkShinyOdds } from './encounters.js'
import { rollHeldItem, trainerHeldItemPool } from '../held-items.js'
import { calculatePokemonStats, getPerfectIVs, resolvePokemonMoves, rollAbility } from '../pokemon.js'
import { hashString, mulberry32 } from '../rng.js'

/**
 * @param {any[]} team
 * @param {() => number} [rng] Deterministic source for ability/item/shiny rolls.
 * @returns {BattlePokemon[]}
 */
export function buildTrainerTeam(team, rng = Math.random) {
  return team.map((member) => {
    const species = pokemonSpecies[member.speciesKey],
      stats = calculatePokemonStats(species, member.level, getPerfectIVs()),
      moves = resolvePokemonMoves(member.speciesKey, member.level),
      // Battle Tower uses this to keep scaling past the level 100 cap.
      multiplier = member.statMultiplier ?? 1,
      scale = (/** @type {number} */ value) => Math.max(1, Math.floor(value * multiplier))
    return {
      speciesKey: member.speciesKey,
      name: species.name,
      types: species.types,
      level: member.level,
      currentHp: scale(stats.hp),
      maxHp: scale(stats.hp),
      attack: scale(stats.attack),
      defense: scale(stats.defense),
      spAttack: scale(stats.spAttack),
      spDefense: scale(stats.spDefense),
      speed: scale(stats.speed),
      moves,
      ability: rollAbility(member.speciesKey, rng),
      heldItem: rollHeldItem(0.15, rng, trainerHeldItemPool(species.types)),
      isPlayer: !1,
      isShiny: checkShinyOdds(),
    }
  })
}

/** Battle Tower floors start at this level and climb three per floor. */
const TOWER_BASE_LEVEL = 55

/** Every floor past this one multiplies the team's stats, so scaling is endless. */
const TOWER_MULTIPLIER_FLOOR = 15

/** Floors at or past this one may field legendary Pokemon. */
const TOWER_LEGENDARY_FLOOR = 40

/**
 * The level a Battle Tower / Battle Frontier floor's teams are built at, so a
 * rental team lines up with the floor's opponents.
 * @param {number} floor
 * @returns {number}
 */
export function towerFloorLevel(floor) {
  return Math.min(100, TOWER_BASE_LEVEL + floor * 3)
}

/** @param {Species} species */
export function totalBaseStats(species) {
  return Object.values(species.baseStats).reduce((sum, value) => sum + value, 0)
}

/**
 * Evolution targets that are ordinary growth stages (ignoring Megas/Gigantamax
 * alternate forms and ids above the national dex).
 * @param {string} key
 * @returns {any[]}
 */
export function realEvolutions(key) {
  return (evolutionData[key] || []).filter(
    (evolution) =>
      !evolution.form && pokemonSpecies[evolution.into] && pokemonSpecies[evolution.into].id <= 1025
  )
}

/**
 * Whether `target` can evolve (directly or through a chain) into `from`.
 * @param {string} from
 * @param {string} target
 * @param {Set<string>} [seen]
 * @returns {boolean}
 */
export function canReachByEvolution(from, target, seen = new Set()) {
  if (from === target) return true
  if (seen.has(from)) return false
  seen.add(from)
  return realEvolutions(from).some((evolution) =>
    canReachByEvolution(evolution.into, target, seen)
  )
}

/**
 * A species counts as a final stage when none of its ordinary evolutions can
 * lead back to it (ignoring Megas/Gigantamax, which are alternate battle
 * forms). Mirrors the stricter check `tools/generate-regions.cjs` uses for
 * raid pools.
 * @param {string} speciesKey
 * @returns {boolean}
 */
export function isFinalEvolution(speciesKey) {
  return !realEvolutions(speciesKey).some(
    (evolution) => !canReachByEvolution(evolution.into, speciesKey)
  )
}

/**
 * Build a Battle Tower trainer's roster for a floor. Every floor fields six
 * fully evolved Pokemon, at least one of them genuinely strong. Deeper floors
 * scale faster, begin multiplying stats at floor 15 and allow legendaries from
 * floor 40, so the tower stays a real climb rather than a walk.
 * @param {number} floor
 * @param {() => number} [rng] Deterministic source; defaults to a floor-seeded PRNG.
 * @returns {{ speciesKey: string, level: number, statMultiplier: number }[]}
 */
export function buildTowerTeam(floor, rng = mulberry32(hashString(`tower-${floor}`))) {
  const level = towerFloorLevel(floor),
    statMultiplier = 1 + Math.max(0, floor - TOWER_MULTIPLIER_FLOOR) * 0.05,
    includeLegendaries = floor >= TOWER_LEGENDARY_FLOOR
  /** @param {string} key @returns {boolean} */
  function isEligible(key) {
    const species = pokemonSpecies[key]
    return (
      species.id > 0 &&
      species.id <= 1025 &&
      isFinalEvolution(key) &&
      (species.legendary ? includeLegendaries : (species.catchRate ?? 0) > 3)
    )
  }
  const pool = Object.keys(pokemonSpecies).filter(isEligible),
    strongPool = pool.filter(
      (key) => pokemonSpecies[key].legendary || totalBaseStats(pokemonSpecies[key]) >= 520
    )
  if (pool.length === 0) return []
  const used = new Set()
  /** @param {string[]} candidates @returns {string} */
  function pick(candidates) {
    const options = candidates.filter((key) => !used.has(key)),
      list = options.length > 0 ? options : candidates,
      key = list[Math.floor(rng() * list.length)]
    used.add(key)
    return key
  }
  const picks = [pick(strongPool.length > 0 ? strongPool : pool)]
  while (picks.length < 6 && picks.length < pool.length) picks.push(pick(pool))
  return picks.map((speciesKey, index) => ({
    speciesKey,
    level: Math.min(100, level + index),
    statMultiplier,
  }))
}

/**
 * The built Battle Tower roster for a floor. Seeded from the floor number, so a
 * given floor is always the same puzzle for the player to plan against. A
 * `seedTag` lets the Battle Frontier facilities build their own distinct teams
 * on the same difficulty curve.
 * @param {number} floor
 * @param {string} [seedTag]
 * @returns {BattlePokemon[]}
 */
export function buildTowerFloor(floor, seedTag = 'tower') {
  const rng = mulberry32(hashString(`${seedTag}-${floor}`))
  return buildTrainerTeam(buildTowerTeam(floor, rng), rng)
}
