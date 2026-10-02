// Alola's Battle Royal. Split out of game/minigames.js. An endless wave
// gauntlet: the party fights one opponent at a time, healing a little between
// wins, until the whole party faints. The reward scales with how deep you get.

import { pokemonSpecies } from '../../data/gameData.js'

/** Money spent to enter the Royal. */
export const BATTLE_ROYAL_COST = 400

/** Opponents faced in one 4-way round (the other three participants). */
export const BATTLE_ROYAL_ROUND_SIZE = 3

/** Fraction of max HP the party recovers between waves. */
const BATTLE_ROYAL_HEAL = 0.25

/** Opponents are drawn from the strongest non-legendary species. */
export const BATTLE_ROYAL_POOL = Object.entries(pokemonSpecies)
  .filter(
    ([, species]) =>
      species.id > 0 &&
      species.id <= 1025 &&
      !species.legendary &&
      Object.values(species.baseStats ?? {}).reduce((sum, value) => sum + value, 0) >= 500
  )
  .map(([speciesKey]) => speciesKey)

/**
 * Roll the opponent for a wave, escalating above the party level.
 * @param {number} wave 1-based.
 * @param {number} baseLevel The party's best level.
 * @returns {{ speciesKey: string, level: number, name: string }}
 */
export function battleRoyalOpponent(wave, baseLevel) {
  const pool = BATTLE_ROYAL_POOL.length > 0 ? BATTLE_ROYAL_POOL : ['magikarp'],
    speciesKey = pool[Math.floor(Math.random() * pool.length)],
    level = Math.max(5, Math.min(100, Math.round(baseLevel + wave * 2)))
  return { speciesKey, level, name: pokemonSpecies[speciesKey]?.name ?? speciesKey }
}

/**
 * Placement (1st-4th) from how many of the round's opponents were defeated:
 * clearing all three wins the round.
 * @param {number} opponentsDefeated
 * @returns {number}
 */
export function battleRoyalPlacement(opponentsDefeated) {
  return Math.max(1, Math.min(4, 4 - opponentsDefeated))
}

/**
 * Rank ladder by total opponents defeated.
 * @type {{ id: string, label: string, minWins: number }[]}
 */
export const BATTLE_ROYAL_RANKS = [
  { id: 'normal', label: 'Normal Rank', minWins: 0 },
  { id: 'great', label: 'Great Rank', minWins: 3 },
  { id: 'ultra', label: 'Ultra Rank', minWins: 6 },
  { id: 'master', label: 'Master Rank', minWins: 10 },
  { id: 'royal', label: 'Royal Rank', minWins: 15 },
]

/**
 * The rank for a number of opponents defeated.
 * @param {number} wins
 * @returns {{ id: string, label: string, minWins: number }}
 */
export function battleRoyalRank(wins) {
  let rank = BATTLE_ROYAL_RANKS[0]
  for (const candidate of BATTLE_ROYAL_RANKS) if (wins >= candidate.minWins) rank = candidate
  return rank
}

/**
 * Heal a squad of battlers between waves (never above max, never revives a
 * fainted one).
 * @param {any[]} squad
 * @param {number} [fraction]
 * @returns {any[]}
 */
export function healSquad(squad, fraction = BATTLE_ROYAL_HEAL) {
  return squad.map((member) =>
    member.currentHp <= 0
      ? member
      : { ...member, currentHp: Math.min(member.maxHp, member.currentHp + Math.round(member.maxHp * fraction)) }
  )
}

/**
 * Prize for the number of waves cleared.
 * @param {number} waves
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function battleRoyalPrize(waves) {
  if (waves >= 25)
    return {
      money: 26000,
      items: [
        { itemId: 'natureMint', quantity: 1 },
        { itemId: 'goldBottleCap', quantity: 1 },
      ],
      label: 'Royal legend!',
    }
  if (waves >= 20)
    return {
      money: 20000,
      items: [
        { itemId: 'rareCandy', quantity: 2 },
        { itemId: 'goldBottleCap', quantity: 1 },
      ],
      label: 'Royal legend!',
    }
  if (waves >= 15)
    return {
      money: 12000,
      items: [
        { itemId: 'rareCandy', quantity: 2 },
        { itemId: 'bottleCap', quantity: 1 },
      ],
      label: 'Royal champion',
    }
  if (waves >= 10)
    return { money: 7000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Royal favourite' }
  if (waves >= 6)
    return { money: 3500, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Crowd favourite' }
  if (waves >= 3)
    return { money: 1500, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Made a run' }
  return { money: 300, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Knocked out early' }
}
