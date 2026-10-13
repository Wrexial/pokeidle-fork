// Paldea's Tera Raid. Split out of game/minigames.js. A single crystal boss with
// a Tera type: your healthy party chips away at its inflated HP, each Pokemon
// fighting until it faints. Break the crystal and you catch the boss.

import { pokemonSpecies } from '../../data/gameData.js'
import { RAID_EVENT_ROTATION, raidEventByKey } from '../../data/daily-events.js'
import { gmaxFormFor } from '../../data/mega-evolution.js'
import { createOpponent, simulateBattle } from './gauntlet.js'

/** Money spent to enter a raid. */
export const TERA_RAID_COST = 600

/** Hard cap on the whole raid so a stall war can never hang the scene. */
export const TERA_RAID_MAX_TURNS = 160

/** Extra HP a Gigantamax event boss carries over a normal Tera boss. */
export const GMAX_RAID_HP_MULTIPLIER = 1.25

/**
 * The species a Tera Raid can hide. Any base-species Pokemon in the national dex
 * can turn up, so a crystal is as likely to hold a common route find as a
 * legendary; the star rating (from base-stat total) decides how hard it is.
 * Alternate forms (the 10000+ ids) are left out so a raid never spawns a Mega or
 * a Gigantamax.
 * @type {string[]}
 */
export const TERA_RAID_POOL = Object.entries(pokemonSpecies)
  .filter(([, species]) => species.id > 0 && species.id <= 1025)
  .map(([speciesKey]) => speciesKey)

/**
 * The 18 Tera types a crystal can carry.
 * @type {string[]}
 */
export const TERA_TYPES = [
  'Normal',
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
]

/**
 * The star rating for a species, from its base-stat total.
 * @param {string} speciesKey
 * @returns {number}
 */
export function teraRaidStars(speciesKey) {
  const stats = pokemonSpecies[speciesKey]?.baseStats ?? {},
    total = Object.values(stats).reduce((sum, value) => sum + value, 0)
  if (total >= 600) return 5
  if (total >= 580) return 4
  if (total >= 540) return 3
  if (total >= 480) return 2
  return 1
}

/**
 * The boss for a raid: any species from the Tera Raid pool, with a Tera type and
 * a star rating from its base-stat total. Its level scales above the party's
 * best so it stays a boss.
 * @param {number} baseLevel The party's best level.
 * @returns {{ speciesKey: string, name: string, level: number, stars: number, teraType: string }}
 */
export function teraRaidBoss(baseLevel) {
  const pool = TERA_RAID_POOL.length > 0 ? TERA_RAID_POOL : ['garganacl'],
    speciesKey = pool[Math.floor(Math.random() * pool.length)],
    stars = teraRaidStars(speciesKey),
    species = pokemonSpecies[speciesKey],
    // Prefer one of the boss's own types for a STAB-style crystal.
    ownTypes = species?.types ?? [],
    teraType =
      ownTypes.length > 0 && Math.random() < 0.6
        ? ownTypes[Math.floor(Math.random() * ownTypes.length)]
        : TERA_TYPES[Math.floor(Math.random() * TERA_TYPES.length)]
  return {
    speciesKey,
    name: species?.name ?? speciesKey,
    level: Math.max(5, Math.min(100, Math.round(baseLevel + stars * 3))),
    stars,
    teraType,
  }
}

/**
 * How much extra HP a raid boss has at each star rating.
 * @param {number} stars
 * @returns {number}
 */
export function teraRaidHpMultiplier(stars) {
  return 1.5 + Math.max(1, stars) * 0.55
}

/**
 * Build the raid boss as a battle-ready Pokemon with inflated HP.
 * @param {{ speciesKey: string, level: number, stars: number }} info
 * @returns {any}
 */
export function createTeraRaidBoss(info) {
  const boss = createOpponent(info.speciesKey, info.level),
    maxHp = Math.max(1, Math.round(boss.maxHp * teraRaidHpMultiplier(info.stars)))
  return { ...boss, maxHp, currentHp: maxHp }
}

/**
 * Run the whole raid: every healthy party member fights the boss in turn until
 * one side runs out. Mutates both the squad and the boss.
 * @param {any[]} squad
 * @param {any} boss
 * @param {number} [maxTurns]
 * @returns {{ won: boolean, turns: number, fainted: number }}
 */
export function simulateTeraRaid(squad, boss, maxTurns = TERA_RAID_MAX_TURNS) {
  let turns = 0,
    fainted = 0,
    won = false
  for (const member of squad) {
    if (boss.currentHp <= 0) {
      won = true
      break
    }
    if (member.currentHp <= 0) continue
    const outcome = simulateBattle(member, boss, { maxTurns: Math.max(1, maxTurns - turns) })
    turns += outcome.turns
    if (outcome.won || boss.currentHp <= 0) {
      won = true
      break
    }
    fainted++
  }
  return { won, turns, fainted }
}

/**
 * The record score for a raid: the star rating when cleared, one less otherwise.
 * @param {number} stars
 * @param {boolean} won
 * @returns {number}
 */
export function teraRaidScore(stars, won) {
  return won ? stars : Math.max(0, stars - 1)
}

/**
 * Prize for a raid.
 * @param {number} stars
 * @param {boolean} won
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string, pokemon?: { speciesKey: string, level: number } | null }}
 */
export function teraRaidPrize(stars, won, speciesKey = '', level = 60) {
  if (!won)
    return {
      money: 800,
      items: [{ itemId: 'expCandyS', quantity: 1 }],
      label: 'The crystal held',
      pokemon: null,
    }
  if (stars >= 5)
    return {
      money: 9000,
      items: [
        { itemId: 'rareCandy', quantity: 2 },
        { itemId: 'cometShard', quantity: 1 },
      ],
      label: '5\u2605 crystal shattered!',
      pokemon: { speciesKey, level },
    }
  if (stars >= 4)
    return {
      money: 6500,
      items: [
        { itemId: 'rareCandy', quantity: 1 },
        { itemId: 'starPiece', quantity: 1 },
      ],
      label: '4\u2605 crystal shattered!',
      pokemon: { speciesKey, level },
    }
  if (stars >= 3)
    return {
      money: 4500,
      items: [{ itemId: 'expCandyL', quantity: 1 }],
      label: '3\u2605 crystal shattered!',
      pokemon: { speciesKey, level },
    }
  return {
    money: 2500,
    items: [{ itemId: 'expCandyM', quantity: 1 }],
    label: 'Crystal shattered!',
    pokemon: { speciesKey, level },
  }
}

/**
 * The Gigantamax boss for a rotation entry: the boss's `gx-` form, a fixed
 * Tera type from the day's rotation and a level above the party. Event bosses
 * are five-star and always drop the Gigantamax Factor.
 * @param {{ key: string, teraType: string }} rotation
 * @param {number} baseLevel The party's best level.
 * @returns {{ eventKey: string, eventName: string, speciesKey: string, baseSpeciesKey: string, name: string, level: number, stars: number, teraType: string, gmax: boolean }}
 */
export function gmaxRaidBoss(rotation, baseLevel) {
  const event = raidEventByKey[rotation?.key] ?? RAID_EVENT_ROTATION[0],
    speciesKey = gmaxFormFor(event.boss) ?? event.boss,
    species = pokemonSpecies[speciesKey]
  return {
    eventKey: event.key,
    eventName: event.name,
    speciesKey,
    baseSpeciesKey: event.boss,
    name: species?.name ?? speciesKey,
    level: Math.max(5, Math.min(100, Math.round(baseLevel + 8))),
    stars: 5,
    teraType: rotation?.teraType ?? event.teraTypes[0],
    gmax: true,
  }
}

/**
 * The simulated ally that joins a Gigantamax raid: one of the event's partners,
 * levelled just above the party so it can hold its own.
 * @param {{ ally: string }} event
 * @param {number} baseLevel
 * @returns {any}
 */
export function gmaxRaidAlly(event, baseLevel) {
  const level = Math.max(5, Math.min(100, Math.round((baseLevel ?? 5) + 3))),
    ally = createOpponent(event.ally, level)
  return { ...ally, isPlayer: true, isAlly: true }
}

/**
 * Build the Gigantamax event boss with its extra shield of HP.
 * @param {{ speciesKey: string, level: number, stars: number }} info
 * @returns {any}
 */
export function createGmaxRaidBoss(info) {
  const boss = createTeraRaidBoss(info),
    maxHp = Math.max(1, Math.round(boss.maxHp * GMAX_RAID_HP_MULTIPLIER))
  return { ...boss, maxHp, currentHp: maxHp }
}

/**
 * Prize for a Gigantamax raid event. A win hands over the base species carrying
 * the Gigantamax Factor (so it can Gigantamax) plus the event's exclusive drop
 * and a guaranteed Max Mushroom.
 * @param {{ boss: string, name: string, drops?: { itemId: string, quantity: number }[] }} event
 * @param {boolean} won
 * @param {number} level
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string, pokemon?: { speciesKey: string, level: number, gmax: boolean } | null }}
 */
export function gmaxRaidPrize(event, won, level = 60) {
  if (!won)
    return {
      money: 1500,
      items: [{ itemId: 'expCandyL', quantity: 1 }],
      label: `${event.name} repelled the raid`,
      pokemon: null,
    }
  return {
    money: 15000,
    items: [
      { itemId: 'maxMushroom', quantity: 1 },
      { itemId: 'expCandyXL', quantity: 1 },
      ...(event.drops ?? []),
    ],
    label: `${event.name} subdued!`,
    pokemon: { speciesKey: event.boss, level, gmax: true },
  }
}
