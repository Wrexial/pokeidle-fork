// Hide-and-seek spots. Unlike the fixed POIs in registry.js, any wild route can
// hide a skittish rare Pokemon behind a glyph: solve the picross reveal to
// flush it out, then battle it. The spot is seeded per route + calendar day
// (like the Dowsing Machine) and each route can only be searched once a day.

import { encounterData, pokemonSpecies } from '../../data/gameData.js'
import { todayKey } from '../../data/daily-events.js'
import { hashString, mulberry32 } from '../rng.js'
import { createPicrossPuzzle } from './unown-picross.js'

/** Shiny-odds multiplier for the Pokemon a spot flushes out. */
export const HIDE_AND_SEEK_SHINY_MULTIPLIER = 2

/** Short "how to play" steps, shown on the launch card. */
export const HIDE_AND_SEEK_TUTORIAL = [
  'Read the row and column clues and fill the cells that match the hidden glyph, then check your work.',
  'Solving the glyph flushes out a rare Pokemon hiding on the route.',
  'Each route hides one spot a day \u2014 battle the Pokemon or let it go.',
]

/**
 * The rare candidates hiding on a route: its wild species narrowed to the
 * rarest weight tiers (so the find is a genuine bonus), with legendaries and
 * form ids left out. Sorted rarest first.
 * @param {string} routeKey
 * @returns {EncounterEntry[]}
 */
export function hideAndSeekPool(routeKey) {
  const entries = (encounterData[routeKey]?.encounters ?? [])
    .filter((entry) => {
      const species = pokemonSpecies[entry.speciesKey]
      return (
        !!species &&
        species.id > 0 &&
        species.id <= 1025 &&
        !species.legendary &&
        entry.weight > 0
      )
    })
    .sort((left, right) => left.weight - right.weight)
  if (entries.length === 0) return []
  const tiers = [...new Set(entries.map((entry) => entry.weight))],
    // Keep only the rarest weight tier, so the find is a genuine bonus rather
    // than a common route spawn.
    threshold = tiers[0]
  return entries.filter((entry) => entry.weight <= threshold)
}

/**
 * The hidden spot for a route on a date: one of the route's rarest species
 * (uniform among the rare tiers), at a level from its own wild band.
 * Deterministic per route + day, so a reload gives the same find.
 * @param {string} routeKey
 * @param {string} [dateKey]
 * @returns {{ speciesKey: string, level: number } | null}
 */
export function hideAndSeekSpot(routeKey, dateKey = todayKey()) {
  const pool = hideAndSeekPool(routeKey)
  if (pool.length === 0) return null
  const random = mulberry32(hashString(`${routeKey}@${dateKey}`)),
    entry = pool[Math.floor(random() * pool.length)],
    minLevel = entry.minLevel ?? 3,
    maxLevel = Math.max(minLevel, entry.maxLevel ?? minLevel),
    level = minLevel + Math.floor(random() * (maxLevel - minLevel + 1))
  return { speciesKey: entry.speciesKey, level }
}

/**
 * The reveal puzzle for a route + day, seeded so a reload shows the same glyph.
 * Reuses the Unown Picross nonogram generator.
 * @param {string} routeKey
 * @param {string} [dateKey]
 * @returns {ReturnType<typeof createPicrossPuzzle>}
 */
export function hideAndSeekPuzzle(routeKey, dateKey = todayKey()) {
  return createPicrossPuzzle(mulberry32(hashString(`spot@${routeKey}@${dateKey}`)))
}

/**
 * Whether a route's spot is still hidden today. `searches` is the persisted
 * route-key -> date map.
 * @param {Record<string, string> | null | undefined} searches
 * @param {string} routeKey
 * @param {string} [dateKey]
 * @returns {boolean}
 */
export function hideAndSeekAvailable(searches, routeKey, dateKey = todayKey()) {
  return !routeKey || searches?.[routeKey] !== dateKey
}
