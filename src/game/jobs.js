// Field Jobs: assign a Pokemon to keep running a route activity at a location
// while you are away, banking the finds for you to collect. Unlike the Poke
// Pelago islands (which advance per wild win), a job advances on real time, so
// it also makes progress while the tab is closed.
//
// A job key is `${locationId}:${activityId}`. Loot activities bank money and
// items; encounter activities bank the wild Pokemon that wandered in, which the
// player can still choose to battle from the location panel.

import { mapData } from '../data/gameData.js'
import { DEFAULT_ROD } from './minigames/rods.js'
import {
  ROUTE_ACTIVITIES,
  rollActivityEncounter,
  rollActivityLoot,
  rollProspectLoot,
} from './minigames/route-activities.js'

/** How many jobs can run at once. */
export const JOB_SLOTS = 4

/** Real time one job cycle takes to bank a find (at the weakest worker). */
export const JOB_CYCLE_MS = 150_000

/** The fastest a worker can cycle, before ability bonuses. */
export const JOB_MIN_CYCLE_MS = 60_000

/** How much an ability speeds a job up (fraction off the cycle time).
 * @type {Record<string, number>} */
export const JOB_ABILITY_BONUS = {
  pickup: 0.15,
  honeyGather: 0.15,
  illuminate: 0.1,
  quickFeet: 0.1,
  suctionCups: 0.08,
  stickyHold: 0.08,
  compoundEyes: 0.08,
  superLuck: 0.08,
}

/**
 * How long a worker takes per find: a higher level cycles faster, and a few
 * abilities speed it up further.
 * @param {number} level
 * @param {string | null | undefined} ability
 * @returns {number}
 */
export function jobCycleMs(level, ability) {
  const clamped = Math.max(1, Math.min(100, level ?? 5)),
    progress = Math.max(0, Math.min(1, (clamped - 5) / 95)),
    levelCycle = JOB_CYCLE_MS - (JOB_CYCLE_MS - JOB_MIN_CYCLE_MS) * progress,
    bonus = JOB_ABILITY_BONUS[ability ?? ''] ?? 0
  return Math.max(45_000, Math.round(levelCycle * (1 - bonus)))
}

/**
 * Human duration like "2m 30s" or "45s".
 * @param {number} ms
 * @returns {string}
 */
export function formatJobCycle(ms) {
  const totalSeconds = Math.max(1, Math.round(ms / 1000)),
    minutes = Math.floor(totalSeconds / 60),
    seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

/** Banked finds a single job can hold before it stops counting. */
export const JOB_MAX_READY = 8

/** Money a banked loot find pays, per activity.
 * @type {Record<string, number>} */
export const JOB_MONEY = {
  prospecting: 150,
  forage: 90,
  fishing: 75,
  diving: 85,
  bugCatch: 60,
  headbutt: 55,
  rockSmash: 65,
  climb: 65,
  kindle: 60,
  overcharge: 65,
  seance: 70,
  summit: 70,
}

/**
 * @typedef {Object} Job
 * @property {string} locationId
 * @property {string} activityId
 * @property {string} pokemonId
 * @property {number} progressMs
 * @property {number} cycleMs Cycle length for this worker (see jobCycleMs).
 * @property {number} money
 * @property {Record<string, number>} items
 * @property {{ speciesKey: string, level: number }[]} encounters
 * @property {number} cycles
 */

/** @returns {Record<string, Job>} */
export function createJobs() {
  return {}
}

/**
 * @param {string} locationId
 * @param {string} activityId
 * @returns {string}
 */
export function jobKey(locationId, activityId) {
  return `${locationId}:${activityId}`
}

/** Banked finds in a job (items + encounters), for the cap and UI. */
export function jobReadyCount(/** @type {Job} */ job) {
  return (
    Object.values(job.items ?? {}).reduce((sum, quantity) => sum + quantity, 0) +
    (job.encounters?.length ?? 0)
  )
}

/**
 * Roll the find a completed cycle banks. Encounter activities bank a wild
 * Pokemon; loot activities bank items and money.
 * @param {Job} job
 * @returns {{ kind: 'encounter', speciesKey: string, level: number } | { kind: 'loot', itemId: string, quantity: number, money: number }}
 */
export function rollJobFind(job) {
  const activity = ROUTE_ACTIVITIES[job.activityId],
    routeKey = mapData[job.locationId]?.routeKey ?? '',
    money = JOB_MONEY[job.activityId] ?? 60
  if (activity?.mode === 'encounter') {
    const encounter = rollActivityEncounter(job.activityId, routeKey, true, DEFAULT_ROD, null)
    if (encounter)
      return { kind: 'encounter', speciesKey: encounter.speciesKey, level: encounter.level }
    // Nothing of the right type to draw out: fall back to a small supply find.
    return { kind: 'loot', itemId: 'expCandyS', quantity: 1, money: Math.floor(money / 2) }
  }
  const reward =
    job.activityId === 'prospecting' ? rollProspectLoot(true) : rollActivityLoot(true)
  return { kind: 'loot', itemId: reward.itemId, quantity: reward.quantity, money }
}

/**
 * Advance every job by `elapsedMs`, banking any completed cycles (up to the
 * cap). Pure: returns the same reference when there is nothing to do.
 * @param {Record<string, Job>} jobs
 * @param {number} elapsedMs
 * @returns {Record<string, Job>}
 */
export function accrueJobs(jobs, elapsedMs) {
  if (!jobs) return jobs
  const keys = Object.keys(jobs)
  if (keys.length === 0 || elapsedMs <= 0) return jobs
  let next = null
  for (const key of keys) {
    const job = jobs[key],
      items = { ...(job.items ?? {}) },
      encounters = [...(job.encounters ?? [])]
    let progress = (job.progressMs ?? 0) + elapsedMs,
      money = job.money ?? 0,
      cycles = job.cycles ?? 0,
      ready = jobReadyCount(job),
      banked = false,
      cycle = job.cycleMs && job.cycleMs > 0 ? job.cycleMs : JOB_CYCLE_MS
    while (progress >= cycle && ready < JOB_MAX_READY) {
      progress -= cycle
      cycles += 1
      ready += 1
      const find = rollJobFind(job)
      if (find.kind === 'encounter') encounters.push({ speciesKey: find.speciesKey, level: find.level })
      else {
        items[find.itemId] = (items[find.itemId] ?? 0) + find.quantity
        money += find.money
      }
      banked = true
    }
    // At the cap, hold progress just below a cycle so nothing is lost while full.
    if (ready >= JOB_MAX_READY) progress = Math.min(progress, cycle - 1)
    if (progress === job.progressMs && !banked) continue
    if (!next) next = { ...jobs }
    next[key] = { ...job, progressMs: progress, money, items, encounters, cycles }
  }
  return next ?? jobs
}

/**
 * Summarise what a set of jobs banked over a window (used by the offline
 * report). Compares the before/after job maps and returns one entry per job
 * that changed, with its display label.
 * @param {Record<string, Job>} before
 * @param {Record<string, Job>} after
 * @returns {{ title: string, icon: string, location: string, activityId: string, cycles: number, money: number, items: Record<string, number>, encounters: number }[]}
 */
export function summarizeJobAccrual(before, after) {
  /** @type {ReturnType<typeof summarizeJobAccrual>} */
  const summary = []
  for (const [key, job] of Object.entries(after ?? {})) {
    const prior = /** @type {Job | undefined} */ (before?.[key]),
      cycles = (job.cycles ?? 0) - (prior?.cycles ?? 0),
      money = (job.money ?? 0) - (prior?.money ?? 0),
      encounters = (job.encounters?.length ?? 0) - (prior?.encounters?.length ?? 0)
    /** @type {Record<string, number>} */
    const items = {}
    let changed = cycles > 0
    for (const [itemId, quantity] of Object.entries(job.items ?? {})) {
      const delta = quantity - (prior?.items?.[itemId] ?? 0)
      if (delta > 0) {
        items[itemId] = delta
        changed = true
      }
    }
    if (!changed) continue
    summary.push({
      ...jobLabel(job),
      activityId: job.activityId,
      cycles,
      money,
      items,
      encounters,
    })
  }
  return summary
}

/**
 * Human label for a job's activity/location, for the panel.
 * @param {Job} job
 * @returns {{ title: string, icon: string, location: string }}
 */
export function jobLabel(job) {
  const activity = ROUTE_ACTIVITIES[job.activityId],
    location = mapData[job.locationId]
  return {
    title: activity?.title ?? job.activityId,
    icon: activity?.icon ?? '\u2699',
    location: location?.name ?? job.locationId,
  }
}
