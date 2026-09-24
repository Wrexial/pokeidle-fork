// Alola's Battle Royal. Split out of game/minigames.js. An endless wave
// gauntlet: the party fights one opponent at a time, healing a little between
// wins, until the whole party faints. The reward scales with how deep you get.

import { pokemonSpecies } from '../../data/gameData.js'

/** Money spent to enter the Royal. */
export const BATTLE_ROYAL_COST = 400

/** Fraction of max HP the party recovers between waves. */
export const BATTLE_ROYAL_HEAL = 0.25

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
  if (waves >= 15)
    return { money: 12000, items: [{ itemId: 'rareCandy', quantity: 2 }], label: 'Royal legend!' }
  if (waves >= 10)
    return { money: 7000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Royal champion' }
  if (waves >= 6)
    return { money: 3500, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Crowd favourite' }
  if (waves >= 3)
    return { money: 1500, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Made a run' }
  return { money: 300, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Knocked out early' }
}
