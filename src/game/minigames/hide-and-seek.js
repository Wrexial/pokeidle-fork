// Hide-and-seek spots. Unlike the fixed POIs in registry.js, any wild route can
// hide a skittish rare Pokemon behind a trail of rustled grass: follow the
// footprint counts to flush it out, then battle it. The spot is seeded per
// route + calendar day (like the Dowsing Machine) and each route can only be
// searched once a day. The tracking grid is its own thing, not a Unown glyph.

import { encounterData, pokemonSpecies } from '../../data/gameData.js'
import { todayKey } from '../../data/daily-events.js'
import { hashString, mulberry32 } from '../rng.js'
import { picrossClues } from './unown-picross.js'

/** Shiny-odds multiplier for the Pokemon a spot flushes out. */
export const HIDE_AND_SEEK_SHINY_MULTIPLIER = 2

/** The tracking grid is size x size. */
export const HIDE_AND_SEEK_SIZE = 5

/**
 * The 5x5 trail patterns a spot can leave: 1 marks a patch of rustled grass.
 * These are footprint trails and paw tracks rather than Unown glyphs, so the
 * reveal reads as tracking a Pokemon and not as a second Picross.
 * @type {number[][][]}
 */
export const HIDE_AND_SEEK_TRACKS = [
  [
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  [
    [1, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 1],
  ],
  [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  [
    [1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1],
    [0, 0, 1, 0, 0],
    [1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1],
  ],
  [
    [1, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [1, 1, 1, 1, 0],
  ],
  [
    [1, 1, 0, 0, 1],
    [1, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 1, 1],
  ],
]

/** Short "how to play" steps, shown on the launch card. */
export const HIDE_AND_SEEK_TUTORIAL = [
  'Read the trail counts along each row and column and mark every patch of rustled grass, then follow the trail.',
  'Completing the trail flushes out a rare Pokemon hiding on the route.',
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
 * The trail puzzle for a route + day, seeded so a reload shows the same
 * tracks. Uses the same run-length clue maths as the Unown nonogram, but on
 * the hide-and-seek trail patterns.
 * @param {string} routeKey
 * @param {string} [dateKey]
 * @returns {{ solution: number[][], rowClues: number[][], colClues: number[][] }}
 */
export function hideAndSeekPuzzle(routeKey, dateKey = todayKey()) {
  const random = mulberry32(hashString(`trail@${routeKey}@${dateKey}`)),
    solution = HIDE_AND_SEEK_TRACKS[Math.floor(random() * HIDE_AND_SEEK_TRACKS.length)],
    size = solution.length,
    rowClues = solution.map((row) => picrossClues(row)),
    colClues = Array.from({ length: size }, (_, column) =>
      picrossClues(solution.map((row) => row[column]))
    )
  return { solution: solution.map((row) => [...row]), rowClues, colClues }
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
