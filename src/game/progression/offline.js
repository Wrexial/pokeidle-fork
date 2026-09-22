// // Offline-progress calculation and the "while you were away" summary. Split from game/progression.js.

import { offlineCapMs, offlineMinMs, offlineMoneyPerHourPerLevel } from '../../data/config.js'

/**
 * Summarise what happened while the tab was hidden, or null when nothing worth
 * reporting changed. Used by the "welcome back" away alert.
 * @param {{ wildBattlesWon: number, trainerBattlesWon: number, money: number, pokedexCaught: string[], shinyCaught: string[] }} before
 * @param {{ wildBattlesWon: number, trainerBattlesWon: number, money: number, pokedexCaught: string[], shinyCaught: string[] }} after
 * @returns {string | null}
 */
export function awaySummary(before, after) {
  const battles =
      after.wildBattlesWon + after.trainerBattlesWon - (before.wildBattlesWon + before.trainerBattlesWon),
    caught = after.pokedexCaught.length - before.pokedexCaught.length,
    shinies = after.shinyCaught.length - before.shinyCaught.length,
    money = after.money - before.money,
    parts = []
  if (battles > 0) parts.push(`${battles.toLocaleString()} battle${battles === 1 ? '' : 's'}`)
  if (caught > 0) parts.push(`${caught} new species`)
  if (shinies > 0) parts.push(`${shinies} shin${shinies === 1 ? 'y' : 'ies'}`)
  if (money !== 0) parts.push(`${money > 0 ? '+' : '-'}$${Math.abs(money).toLocaleString()}`)
  return parts.length > 0 ? `While you were away: ${parts.join(', ')}.` : null
}

/**
 * Reward for time spent away from the game (offline). Scales with the highest
 * party level so it stays relevant, and pays Exp. Candy alongside money.
 * @param {GameState} state
 * @param {number} awayMs
 * @returns {{ awayMs: number, money: number, items: Record<string, number> } | null}
 */
export function computeOfflineReward(state, awayMs) {
  const capped = Math.min(Math.max(0, awayMs), offlineCapMs)
  if (capped < offlineMinMs) return null
  const hours = capped / 3_600_000,
    highestLevel = (state.party ?? []).reduce((max, member) => Math.max(max, member.level), 5),
    money = Math.floor(hours * highestLevel * offlineMoneyPerHourPerLevel),
    candyId =
      highestLevel >= 75
        ? 'expCandyXL'
        : highestLevel >= 50
          ? 'expCandyL'
          : highestLevel >= 25
            ? 'expCandyM'
            : 'expCandyS',
    candyCount = Math.max(1, Math.floor(hours))
  return { awayMs: capped, money, items: { [candyId]: candyCount } }
}

/**
 * Human duration like "2h 15m" or "45m".
 * @param {number} ms
 * @returns {string}
 */
export function formatAwayDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000)),
    hours = Math.floor(totalMinutes / 60),
    minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

/**
 * Advance the eggs in a party by one won wild battle. Only eggs carried in the
 * party progress, and at most one hatches per battle.
 * @param {Pokemon[]} party
 * @returns {{ party: Pokemon[], hatched: Pokemon | null }}
 */
