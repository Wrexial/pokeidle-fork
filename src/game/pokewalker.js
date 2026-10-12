// Pokewalker: an idle "steps" currency that banks from real time away (like
// the offline catch replay) and is spent on small quality-of-life rewards —
// hatching eggs, finding items, or drawing out a route's rarest wild. Accrual
// and the spend options are pure, so the reducer, the save loader and the
// tests can share them.

import { pokewalkerDailyCap, pokewalkerEggCost, pokewalkerItemCost, pokewalkerRevealCost, pokewalkerStepsPerHour } from '../data/config.js'
import { todayKey } from '../data/daily-events.js'
import { encounterData, pokemonSpecies } from '../data/gameData.js'
import { consumableItems, pokeBalls } from '../data/items.js'

/** @returns {Pokewalker} */
export function createPokewalker() {
  return { steps: 0, dailySteps: 0, dailyDate: '', totalSteps: 0 }
}

/**
 * The spend options, cheapest first. `cost` is in steps.
 * @type {{ id: 'egg' | 'item' | 'reveal', label: string, description: string, icon: string, cost: number }[]}
 */
export const POKEWALKER_OPTIONS = [
  {
    id: 'egg',
    label: 'Egg Warmer',
    icon: '\u{1f95a}',
    cost: pokewalkerEggCost,
    description: 'Walk your eggs warm: advance the Day-Care egg and shave steps off every egg in your party.',
  },
  {
    id: 'item',
    label: 'Item Finder',
    icon: '\u{1f392}',
    cost: pokewalkerItemCost,
    description: 'Stumble across a useful item out on your walk.',
  },
  {
    id: 'reveal',
    label: 'Rare Radar',
    icon: '\u{1f4e1}',
    cost: pokewalkerRevealCost,
    description: 'Scent out the rarest wild on your current route, drawing it out of hiding.',
  },
]

/** The cheapest option's cost, for the "spendable" badge. */
export const POKEWALKER_MIN_COST = Math.min(...POKEWALKER_OPTIONS.map((option) => option.cost))

/**
 * Steps earned over an elapsed window at the configured walking rate.
 * @param {number} elapsedMs
 * @returns {number}
 */
export function stepsForElapsed(elapsedMs) {
  return Math.max(0, Math.floor((Math.max(0, elapsedMs) / 3_600_000) * pokewalkerStepsPerHour))
}

/**
 * Bank the steps earned over an elapsed window, resetting the daily counter at
 * local midnight and capping the day's take. Returns a fresh Pokewalker and
 * how many steps were actually gained (0 when the cap is reached).
 * @param {Pokewalker | null | undefined} pokewalker
 * @param {number} elapsedMs
 * @param {number} [now]
 * @returns {{ pokewalker: Pokewalker, gained: number }}
 */
export function accruePokewalker(pokewalker, elapsedMs, now = Date.now()) {
  const current = pokewalker && typeof pokewalker === 'object' ? pokewalker : createPokewalker(),
    dateKey = todayKey(new Date(now)),
    dailySteps = current.dailyDate === dateKey ? current.dailySteps ?? 0 : 0,
    gained = Math.min(stepsForElapsed(elapsedMs), Math.max(0, pokewalkerDailyCap - dailySteps))
  if (gained <= 0 && current.dailyDate === dateKey && current.dailySteps === dailySteps)
    return { pokewalker: current, gained: 0 }
  return {
    pokewalker: {
      steps: (current.steps ?? 0) + gained,
      dailySteps: dailySteps + gained,
      dailyDate: dateKey,
      totalSteps: (current.totalSteps ?? 0) + gained,
    },
    gained,
  }
}

/**
 * The rarest wild on a route: the lowest-weight, non-legendary species (a
 * legendary fallback keeps a legendary-only route from returning nothing).
 * @param {string} routeKey
 * @returns {string | null}
 */
export function rarestRouteSpecies(routeKey) {
  const encounters = encounterData[routeKey]?.encounters
  if (!encounters?.length) return null
  const ordinary = encounters.filter(
    (encounter) => !pokemonSpecies[encounter.speciesKey]?.legendary
  )
  const pool = ordinary.length > 0 ? ordinary : encounters
  return pool.reduce(
    (rarest, entry) => ((entry.weight ?? 1) < (rarest.weight ?? 1) ? entry : rarest),
    pool[0]
  ).speciesKey
}

/** Common finds the Item Finder can turn up, with a weight and a quantity range. */
const POKEWALKER_FINDS = [
  { itemId: 'potion', weight: 8, min: 1, max: 3 },
  { itemId: 'superPotion', weight: 6, min: 1, max: 2 },
  { itemId: 'hyperPotion', weight: 3, min: 1, max: 1 },
  { itemId: 'revive', weight: 3, min: 1, max: 1 },
  { itemId: 'pokeball', weight: 8, min: 1, max: 5 },
  { itemId: 'greatball', weight: 5, min: 1, max: 3 },
  { itemId: 'ultraball', weight: 3, min: 1, max: 2 },
  { itemId: 'expCandyS', weight: 6, min: 1, max: 3 },
  { itemId: 'expCandyM', weight: 4, min: 1, max: 2 },
  { itemId: 'rareCandy', weight: 2, min: 1, max: 1 },
  { itemId: 'stardust', weight: 3, min: 1, max: 2 },
  { itemId: 'nugget', weight: 1, min: 1, max: 1 },
  { itemId: 'apricornRed', weight: 3, min: 1, max: 2 },
]

/**
 * Roll the Item Finder's reward.
 * @param {() => number} [random]
 * @returns {{ itemId: string, quantity: number }}
 */
export function rollPokewalkerItem(random = Math.random) {
  const total = POKEWALKER_FINDS.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = random() * total
  for (const entry of POKEWALKER_FINDS) {
    roll -= entry.weight
    if (roll <= 0)
      return {
        itemId: entry.itemId,
        quantity: entry.min + Math.floor(random() * (entry.max - entry.min + 1)),
      }
  }
  const fallback = POKEWALKER_FINDS[POKEWALKER_FINDS.length - 1]
  return { itemId: fallback.itemId, quantity: fallback.min }
}

/**
 * A readable item name for the roll (falls back to the id).
 * @param {string} itemId
 * @returns {string}
 */
export function pokewalkerItemName(itemId) {
  return consumableItems[itemId]?.name ?? pokeBalls[itemId]?.name ?? itemId
}
