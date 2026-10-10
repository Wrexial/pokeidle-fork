// Reducer handlers for Field Jobs (see game/jobs.js): assign a Pokemon to a
// route activity, collect what it banks, and take a banked encounter into a
// battle.

import { mapData } from '../../data/gameData.js'
import { JOB_SLOTS, accrueJobs, jobKey, jobReadyCount } from '../jobs.js'
import { routeActivityIds } from '../minigames.js'

/**
 * @param {GameState} state
 * @param {string} pokemonId
 * @returns {{ pokemon: any, isBox: boolean } | null}
 */
function findWorker(state, pokemonId) {
  const inParty = state.party?.find((member) => member.id === pokemonId)
  if (inParty) return { pokemon: inParty, isBox: false }
  const inBox = state.box?.find((member) => member.id === pokemonId)
  return inBox ? { pokemon: inBox, isBox: true } : null
}

/**
 * Handle `ASSIGN_JOB`: post a Pokemon to keep an available activity running.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function assignJob(state, action) {
  const { locationId, activityId, pokemonId } = action.payload ?? {},
    location = mapData[locationId]
  if (!locationId || !activityId || !pokemonId) return state
  if (!routeActivityIds(location).includes(activityId)) return state
  const key = jobKey(locationId, activityId),
    jobs = state.jobs ?? {}
  if (jobs[key]) return state
  if (Object.keys(jobs).length >= JOB_SLOTS) return state
  if (!findWorker(state, pokemonId)) return state
  // A Pokemon can only hold one job at a time.
  if (Object.values(jobs).some((job) => job.pokemonId === pokemonId)) return state
  return {
    ...state,
    jobs: {
      ...jobs,
      [key]: {
        locationId,
        activityId,
        pokemonId,
        progressMs: 0,
        money: 0,
        items: {},
        encounters: [],
        cycles: 0,
      },
    },
  }
}

/**
 * Handle `UNASSIGN_JOB`: send the worker home, discarding anything already
 * banked (it should have been collected first).
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function unassignJob(state, action) {
  const { locationId, activityId } = action.payload ?? {},
    key = jobKey(locationId, activityId),
    jobs = state.jobs ?? {}
  if (!jobs[key]) return state
  const next = { ...jobs }
  delete next[key]
  return { ...state, jobs: next }
}

/**
 * Handle `COLLECT_JOB`: pay the banked money and items into the bag. Banked
 * encounters are left in place to be battled separately.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function collectJob(state, action) {
  const { locationId, activityId } = action.payload ?? {},
    key = jobKey(locationId, activityId),
    job = (state.jobs ?? {})[key]
  if (!job) return state
  const money = job.money ?? 0,
    items = job.items ?? {}
  if (money <= 0 && Object.keys(items).length === 0) return state
  const inventory = { ...state.inventory }
  for (const [itemId, quantity] of Object.entries(items))
    if (quantity > 0) inventory[itemId] = (inventory[itemId] ?? 0) + quantity
  return {
    ...state,
    money: state.money + money,
    inventory,
    jobs: {
      ...state.jobs,
      [key]: { ...job, money: 0, items: {} },
    },
    battleLog: [...state.battleLog, 'Field job rewards collected.'].slice(-50),
  }
}

/**
 * Handle `TAKE_JOB_ENCOUNTER`: remove the first banked wild Pokemon so the
 * caller can start a battle against it.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function takeJobEncounter(state, action) {
  const { locationId, activityId } = action.payload ?? {},
    key = jobKey(locationId, activityId),
    job = (state.jobs ?? {})[key]
  if (!job || (job.encounters?.length ?? 0) === 0) return state
  return {
    ...state,
    jobs: {
      ...state.jobs,
      [key]: { ...job, encounters: job.encounters.slice(1) },
    },
  }
}

/**
 * Handle `ACCRUE_JOBS`: advance every job by the elapsed real time.
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
export function accrueJobFinds(state, action) {
  const elapsedMs = action.payload?.elapsedMs ?? 0
  if (elapsedMs <= 0) return state
  const jobs = accrueJobs(state.jobs ?? {}, elapsedMs)
  return jobs === state.jobs ? state : { ...state, jobs }
}

/**
 * How many finds every job is holding across the board, for a badge.
 * @param {GameState} state
 * @returns {number}
 */
export function totalJobReady(state) {
  return Object.values(state.jobs ?? {}).reduce((sum, job) => sum + jobReadyCount(job), 0)
}
