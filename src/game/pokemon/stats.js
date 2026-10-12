// Base-stat maths, stat calculation and IV judging. Split from game/pokemon.js.

import { natureStatModifiers } from '../../data/natures.js'

/**
 * @param {number} baseStat
 * @param {number} level
 * @param {number} iv
 * @param {number} [ev] Effort Values for the stat (0-252).
 */
export function calculateHpStat(baseStat, level, iv, ev = 0) {
  return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + level + 10
}

/**
 * @param {number} baseStat
 * @param {number} level
 * @param {number} iv
 * @param {number} [ev] Effort Values for the stat (0-252).
 */
export function calculateOtherStat(baseStat, level, iv, ev = 0) {
  return Math.floor(
    (Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + 5) * 1
  )
}

/**
 * @param {Species} species
 * @param {number} level
 * @param {Record<string, number>} ivs
 * @param {string} [nature]
 * @param {Record<string, number>} [evs] Effort Values per stat (vitamin-trained).
 * @returns {StatBlock}
 */
export function calculatePokemonStats(species, level, ivs, nature, evs) {
  // A nature raises one non-HP stat by 10% and lowers another by 10%. HP is
  // never affected. Unknown/neutral natures leave every stat untouched.
  const modifiers = natureStatModifiers(nature),
    applyNature = /** @param {string} statKey @param {number} value */ (statKey, value) =>
      modifiers[statKey] ? Math.floor(value * modifiers[statKey]) : value,
    ev = /** @param {string} statKey */ (statKey) => evs?.[statKey] ?? 0
  return {
    hp: calculateHpStat(species.baseStats.hp, level, ivs.hp, ev('hp')),
    attack: applyNature(
      'attack',
      calculateOtherStat(species.baseStats.attack, level, ivs.attack, ev('attack'))
    ),
    defense: applyNature(
      'defense',
      calculateOtherStat(species.baseStats.defense, level, ivs.defense, ev('defense'))
    ),
    spAttack: applyNature(
      'spAttack',
      calculateOtherStat(species.baseStats.spAttack, level, ivs.spAttack, ev('spAttack'))
    ),
    spDefense: applyNature(
      'spDefense',
      calculateOtherStat(species.baseStats.spDefense, level, ivs.spDefense, ev('spDefense'))
    ),
    speed: applyNature(
      'speed',
      calculateOtherStat(species.baseStats.speed, level, ivs.speed, ev('speed'))
    ),
  }
}

/** The six EV stat keys, in the order the stat panel shows them. */
export const EV_STAT_ORDER = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed']

/** A blank (all-zero) EV block. @returns {Record<string, number>} */
export function createEmptyEvs() {
  return { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }
}

/**
 * Total EVs a Pokemon has been trained with.
 * @param {Record<string, number> | null | undefined} evs
 * @returns {number}
 */
export function totalEvs(evs) {
  return EV_STAT_ORDER.reduce((sum, stat) => sum + (evs?.[stat] ?? 0), 0)
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

/** Stat keys in the order the IV judge shows them. */
export const IV_STAT_ORDER = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed']

/** Short labels for the IV chips (HP/Atk/Def/SpA/SpD/Spd). @type {Record<string, string>} */
export const IV_STAT_LABELS = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  spAttack: 'SpA',
  spDefense: 'SpD',
  speed: 'Spd',
}

/**
 * In-game-style individual-value rating for a single stat (0-31).
 * @param {number} value
 * @returns {string}
 */
export function ivStatLabel(value) {
  if (value >= 31) return 'Best'
  if (value >= 30) return 'Fantastic'
  if (value >= 26) return 'Very Good'
  if (value >= 16) return 'Pretty Good'
  if (value >= 1) return 'Decent'
  return 'No Good'
}

/**
 * Overall judging summary ("Superior", "Best", ...) from the IV total.
 * @param {number} total
 * @returns {string}
 */
export function ivVerdict(total) {
  if (total >= 151) return 'Wonderful'
  if (total >= 121) return 'Superior'
  if (total >= 91) return 'Above Average'
  return 'Decent'
}

/**
 * Judge a Pokemon's IVs: its total, an overall verdict and a label per stat.
 * @param {Record<string, number>} ivs
 * @returns {{ total: number, verdict: string, perStat: Record<string, { value: number, label: string, key: string }> }}
 */
export function judgeIVs(ivs) {
  /** @type {Record<string, { value: number, label: string, key: string }>} */
  const perStat = {}
  let total = 0
  for (const key of IV_STAT_ORDER) {
    const value = ivs?.[key] ?? 0
    total += value
    perStat[key] = { value, label: ivStatLabel(value), key }
  }
  return { total, verdict: ivVerdict(total), perStat }
}
