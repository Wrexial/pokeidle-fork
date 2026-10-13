// // Offline-progress calculation and the "while you were away" summary. Split from game/progression.js.

import { canBreed } from '../breeding.js'
import { tickGarden } from '../garden.js'
import { tickKurtCrafts } from '../kurt.js'
import { tickPelago } from '../pelago.js'
import { tickSecretBase } from '../secret-base.js'
import { daycareEggBattles, offlineBattlesPerHour, offlineCapMs, offlineMinMs, offlineMoneyPerHourPerLevel } from '../../data/config.js'

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
 * Estimate the wild wins an away window would have produced.
 * @param {number} cappedMs
 * @returns {number}
 */
export function offlineWildWinEstimate(cappedMs) {
  return Math.floor((cappedMs / 3_600_000) * offlineBattlesPerHour)
}

/**
 * Replay the per-wild-win systems — Poke Pelago, the Berry Garden, Kurt's
 * crafting and the Day-Care — across an away window so they don't stand still
 * while the tab is closed. Only the pure tick functions run, so this is
 * deterministic; random drops, eggs and battles stay online. Returns null when
 * there is nothing to advance.
 * @param {GameState} state
 * @param {number} cappedMs
 * @returns {{ pelago: any, garden: any, kurtCrafts: any, daycare: any, secretBase: any, battles: number, summary: { id: string, label: string }[] } | null}
 */
export function simulateOfflineWildWins(state, cappedMs) {
  const battles = offlineWildWinEstimate(cappedMs)
  if (battles <= 0) return null
  let pelago = state.pelago,
    garden = state.garden,
    kurtCrafts = state.kurtCrafts,
    daycare = state.daycare,
    secretBase = state.secretBase,
    secretBaseProgressed = false,
    pelagoBanked = 0,
    gardenChanged = false,
    kurtCompleted = 0,
    daycareAdvanced = false
  /** @param {any} banked */
  const bankedCount = (banked) =>
    banked ? Object.values(banked).reduce((sum, island) => sum + (island?.ready ?? 0), 0) : 0
  for (let index = 0; index < battles; index++) {
    if (pelago) {
      const before = bankedCount(pelago),
        next = tickPelago(pelago)
      if (next !== pelago) {
        pelago = next
        pelagoBanked += bankedCount(pelago) - before
      }
    }
    if (garden?.plots?.some((/** @type {any} */ plot) => plot && plot.battlesRemaining > 0)) {
      const next = tickGarden(garden)
      gardenChanged = gardenChanged || next !== garden
      garden = next
    }
    if (kurtCrafts?.length) {
      const readyBefore = kurtCrafts.filter(
          (/** @type {any} */ craft) => craft.battlesRemaining <= 0
        ).length,
        next = tickKurtCrafts(kurtCrafts)
      kurtCompleted +=
        next.filter((/** @type {any} */ craft) => craft.battlesRemaining <= 0).length - readyBefore
      kurtCrafts = next
    }
    if (secretBase) {
      const next = tickSecretBase(secretBase) ?? secretBase
      secretBaseProgressed = secretBaseProgressed || next !== secretBase
      secretBase = next
    }
    if (
      daycare?.parents?.length === 2 &&
      canBreed(daycare.parents) &&
      daycare.progress < daycareEggBattles
    ) {
      daycare = { ...daycare, progress: daycare.progress + 1 }
      daycareAdvanced = true
    }
  }
  const summary = []
  if (pelagoBanked > 0)
    summary.push({
      id: 'pelago',
      label: `Poke Pelago banked ${pelagoBanked} cycle${pelagoBanked === 1 ? '' : 's'}`,
    })
  if (gardenChanged) summary.push({ id: 'garden', label: 'The Berry Garden ripened' })
  if (kurtCompleted > 0)
    summary.push({
      id: 'kurt',
      label: `Kurt finished ${kurtCompleted} Apricorn Ball${kurtCompleted === 1 ? '' : 's'}`,
    })
  if (daycareAdvanced) summary.push({ id: 'daycare', label: 'The Day-Care made progress' })
  if (secretBaseProgressed)
    summary.push({ id: 'secretBase', label: 'Your Secret Base banked its daily yield' })
  if (summary.length === 0) return null
  return { pelago, garden, kurtCrafts, daycare, secretBase, battles, summary }
}

/**
 * Advance the eggs in a party by one won wild battle. Only eggs carried in the
 * party progress, and at most one hatches per battle.
 * @param {Pokemon[]} party
 * @returns {{ party: Pokemon[], hatched: Pokemon | null }}
 */
