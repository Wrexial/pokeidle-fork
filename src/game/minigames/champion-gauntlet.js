// The Champions' Gauntlet: a post-game bracket of named trainers drawn from
// every region (gym leaders, then Elite Four, then a Champion), fought one
// trainer at a time with their endgame rematch teams. Split out of
// game/minigames.js, mirroring the Battle Royal's headless-battle model.

import { championData, elite4Data, gymLeaderData, pokemonSpecies } from '../../data/gameData.js'

/** Money spent to enter the Gauntlet. */
export const CHAMPION_GAUNTLET_COST = 1200

/** Trainers in one bracket. */
export const CHAMPION_GAUNTLET_SIZE = 8

/** Fraction of max HP the party recovers between trainers (never revives). */
export const CHAMPION_GAUNTLET_HEAL = 1

/**
 * @typedef {Object} GauntletEntrant
 * @property {string} id
 * @property {string} name
 * @property {string} title
 * @property {string} region
 * @property {string | null} spriteKey
 * @property {'gym' | 'elite' | 'champion'} tier
 * @property {{ speciesKey: string, level: number }[]} team
 * @property {number} maxLevel
 */

/**
 * Normalise a trainer record into a bracket entrant, keeping only team members
 * whose species actually exist. Uses the endgame rematch team when there is one.
 * @param {any} entry
 * @param {'gym' | 'elite' | 'champion'} tier
 * @returns {GauntletEntrant}
 */
function entrantFrom(entry, tier) {
  const team = (entry.rematchTeam ?? entry.team ?? []).filter(
    (/** @type {{ speciesKey: string }} */ member) => pokemonSpecies[member.speciesKey]
  )
  return {
    id: entry.id,
    name: entry.name,
    title: entry.title ?? '',
    region: entry.region ?? 'kanto',
    spriteKey: entry.spriteKey ?? null,
    tier,
    team: team.map((/** @type {{ speciesKey: string, level: number }} */ member) => ({
      speciesKey: member.speciesKey,
      level: member.level,
    })),
    maxLevel: team.reduce(
      (/** @type {number} */ max, /** @type {{ level: number }} */ member) =>
        Math.max(max, member.level ?? 0),
      0
    ),
  }
}

/** @type {GauntletEntrant[]} */
const GYM_ENTRANTS = /** @type {any[]} */ (gymLeaderData ?? [])
  .map((entry) => entrantFrom(entry, 'gym'))
  .filter((entrant) => entrant.team.length > 0)

/** @type {GauntletEntrant[]} */
const ELITE_ENTRANTS = /** @type {any[]} */ (elite4Data ?? [])
  .map((entry) => entrantFrom(entry, 'elite'))
  .filter((entrant) => entrant.team.length > 0)

/** @type {GauntletEntrant[]} */
const CHAMPION_ENTRANTS = /** @type {any[]} */ (championData ?? [])
  .map((entry) => entrantFrom(entry, 'champion'))
  .filter((entrant) => entrant.team.length > 0)

/** How many named trainers are available for a bracket at all. */
export const CHAMPION_GAUNTLET_POOL =
  GYM_ENTRANTS.length + ELITE_ENTRANTS.length + CHAMPION_ENTRANTS.length

/**
 * Pick `count` distinct entries from a pool.
 * @template T
 * @param {T[]} pool
 * @param {number} count
 * @param {() => number} random
 * @returns {T[]}
 */
function pickUnique(pool, count, random) {
  const available = [...pool],
    picked = []
  while (picked.length < count && available.length > 0)
    picked.push(available.splice(Math.floor(random() * available.length), 1)[0])
  return picked
}

/**
 * Build a bracket of named trainers, ascending in difficulty: gym leaders first
 * (in team-level order), then Elite Four, then a Champion to close it out.
 * @param {number} [size]
 * @param {() => number} [random]
 * @returns {GauntletEntrant[]}
 */
export function buildGauntletBracket(size = CHAMPION_GAUNTLET_SIZE, random = Math.random) {
  const championCount = CHAMPION_ENTRANTS.length > 0 ? 1 : 0,
    eliteCount = Math.min(ELITE_ENTRANTS.length, Math.round(size * 0.25)),
    gymCount = Math.max(0, size - championCount - eliteCount),
    gyms = pickUnique(GYM_ENTRANTS, gymCount, random).sort(
      (left, right) => left.maxLevel - right.maxLevel
    ),
    elites = pickUnique(ELITE_ENTRANTS, eliteCount, random).sort(
      (left, right) => left.maxLevel - right.maxLevel
    ),
    champions = pickUnique(CHAMPION_ENTRANTS, championCount, random)
  return [...gyms, ...elites, ...champions]
}

/**
 * The human label for a bracket entrant's tier.
 * @param {GauntletEntrant['tier']} tier
 * @returns {string}
 */
export function gauntletTierLabel(tier) {
  return tier === 'champion' ? 'Champion' : tier === 'elite' ? 'Elite Four' : 'Gym Leader'
}

/** Prize tiers by how many trainers were beaten, out of {@link CHAMPION_GAUNTLET_SIZE}. */
const GAUNTLET_PRIZES = [
  {
    min: CHAMPION_GAUNTLET_SIZE,
    money: 30000,
    items: [
      { itemId: 'masterball', quantity: 1 },
      { itemId: 'goldBottleCap', quantity: 1 },
    ],
    label: 'Gauntlet conquered!',
  },
  { min: 6, money: 18000, items: [{ itemId: 'rareCandy', quantity: 2 }], label: 'Finalist' },
  { min: 4, money: 9000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Semi-finalist' },
  { min: 2, money: 4000, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Made the bracket' },
  { min: 0, money: 800, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Knocked out early' },
]

/**
 * Prize for the number of trainers beaten.
 * @param {number} trainersBeaten
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function gauntletPrize(trainersBeaten) {
  const tier =
    GAUNTLET_PRIZES.find((entry) => trainersBeaten >= entry.min) ??
    GAUNTLET_PRIZES[GAUNTLET_PRIZES.length - 1]
  return { money: tier.money, items: tier.items, label: tier.label }
}
