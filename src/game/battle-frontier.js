// Hoenn's Battle Frontier (#66): rule-variant battle facilities built on the
// Battle Tower's deterministic floor puzzle. Each facility is a single floor
// against a seeded six-Pokemon team, but with a different rule:
//   - Battle Factory rents you a fresh team (your own party sits out).
//   - Battle Arena flips the type chart (inverse battles).
//   - Battle Palace ignores every held item.
// The Tower itself stays on Route 111; the Frontier is the post-game complex
// next door that hosts the three variants.

import { pokemonSpecies } from '../data/gameData.js'
import { NATURES } from '../data/natures.js'
import { BASE_FRIENDSHIP } from './pokemon/friendship.js'
import { resolvePokemonMoves } from './pokemon/evolution.js'
import { calculateRequiredExperience } from './pokemon/exp.js'
import { rollAbility } from './pokemon/creation.js'
import { rollSize } from './pokemon/sizes.js'
import { calculatePokemonStats } from './pokemon/stats.js'
import { buildTowerFloor, towerFloorLevel } from './progression.js'
import { activeLadderRuleSet, ladderBattleFields } from './ladder-modifiers.js'
import { hashString, mulberry32 } from './rng.js'

/** The four Battle Frontier facilities, Tower aside, and the rule each runs. */
export const FRONTIER_FACILITIES = [
  {
    id: 'factory',
    name: 'Battle Factory',
    rule: 'rental',
    icon: '\u{1f3ed}',
    tagline: 'Rental team',
    hint: 'Fight the floor with a freshly rented team instead of your own party. Your Pokemon are safe and waiting when you return.',
  },
  {
    id: 'arena',
    name: 'Battle Arena',
    rule: 'inverse',
    icon: '\u{1f504}',
    tagline: 'Inverse battles',
    hint: 'The type chart is flipped: resistances become weaknesses and immunities become 2\u00d7 hits. Both sides play by the same reversed rules.',
  },
  {
    id: 'palace',
    name: 'Battle Palace',
    rule: 'noItems',
    icon: '\u{1f3db}\ufe0f',
    tagline: 'No held items',
    hint: 'Every held item is ignored for both sides \u2014 only stats, moves, abilities and the matchup decide it.',
  },
]

/** @param {string} facilityId */
export function frontierFacility(facilityId) {
  return FRONTIER_FACILITIES.find((facility) => facility.id === facilityId) ?? null
}

/**
 * Prize for clearing a floor: one Victory Token every ten floors.
 * @param {number} floor
 * @returns {number}
 */
export function frontierTokenReward(floor) {
  return Math.floor(Math.max(0, floor) / 10)
}

/** Fully evolved, non-legendary species strong enough to rent. */
const RENTAL_POOL = Object.entries(pokemonSpecies)
  .filter(
    ([, species]) =>
      species.id > 0 &&
      species.id <= 1025 &&
      !species.legendary &&
      Object.values(species.baseStats ?? {}).reduce((sum, value) => sum + value, 0) >= 480
  )
  .map(([speciesKey]) => speciesKey)

/**
 * A deterministic rental Pokemon, built like `createPokemon` but from a seeded
 * rng so the same floor always rents the same team.
 * @param {string} speciesKey
 * @param {number} level
 * @param {string} id
 * @param {() => number} rng
 * @returns {Pokemon}
 */
function buildRentalPokemon(speciesKey, level, id, rng) {
  const species = pokemonSpecies[speciesKey],
    /** @type {Record<string, number>} */
    ivs = {},
    statKeys = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed']
  for (const key of statKeys) ivs[key] = Math.floor(rng() * 32)
  const nature = NATURES[Math.floor(rng() * NATURES.length)].key,
    stats = calculatePokemonStats(species, level, ivs, nature)
  return {
    id,
    speciesKey,
    name: species.name,
    types: species.types,
    level,
    totalExp: calculateRequiredExperience(level, species.growthRate),
    moves: resolvePokemonMoves(speciesKey, level),
    currentHp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    spAttack: stats.spAttack,
    spDefense: stats.spDefense,
    speed: stats.speed,
    ivs,
    nature,
    friendship: BASE_FRIENDSHIP,
    ability: rollAbility(speciesKey, rng),
    heldItem: null,
    isShiny: false,
    gmax: false,
    size: rollSize(rng),
  }
}

/**
 * The six Pokemon the Battle Factory rents for a floor. Deterministic, so the
 * panel preview is exactly what you fight with.
 * @param {number} floor
 * @returns {Pokemon[]}
 */
export function buildRentalParty(floor) {
  const safeFloor = Math.max(1, Math.floor(floor || 1)),
    rng = mulberry32(hashString(`frontier-rental-${safeFloor}`)),
    level = towerFloorLevel(safeFloor),
    used = new Set(),
    /** @type {Pokemon[]} */
    party = []
  while (party.length < 6 && party.length < RENTAL_POOL.length) {
    const speciesKey = RENTAL_POOL[Math.floor(rng() * RENTAL_POOL.length)]
    if (used.has(speciesKey)) continue
    used.add(speciesKey)
    party.push(buildRentalPokemon(speciesKey, level, `rental-${safeFloor}-${party.length}`, rng))
  }
  return party
}

/**
 * The `pendingBossBattle` payload for a Frontier floor. `rule` and `facilityId`
 * ride along so the battle engine and the end handler know which variant ran;
 * the weekly ladder modifiers ride on top of that fixed rule.
 * @param {string} facilityId
 * @param {number} floor
 * @param {ReturnType<typeof activeLadderRuleSet>} [ladder]
 * @returns {{ bossId: string, bossType: string, trainerName: string, trainerClass: string, trainerTeam: BattlePokemon[], spriteKey: string, region: string, rule: string, facilityId: string, modifiers: string[], ladderKey: string, ladderName: string, weatherLock: string | null, bossQueue: any[] }}
 */
export function frontierBossBattle(facilityId, floor, ladder = activeLadderRuleSet()) {
  const facility = frontierFacility(facilityId) ?? FRONTIER_FACILITIES[0],
    safeFloor = Math.max(1, Math.floor(floor || 1))
  return {
    bossId: `frontier-${facility.id}`,
    bossType: 'frontier',
    trainerName: `${facility.name} Attendant (Floor ${safeFloor})`,
    trainerClass: 'ace',
    trainerTeam: buildTowerFloor(safeFloor, `frontier-${facility.id}`),
    spriteKey: 'acetrainer',
    region: 'hoenn',
    rule: facility.rule,
    facilityId: facility.id,
    ...ladderBattleFields(ladder),
    bossQueue: [],
  }
}
