// Shared helpers for the reducer handlers (toast queue, minigame entry,
// leftover unlock tokens and swarm rolls). Split from game/reducer.js.

import { swarmBattleCount } from '../data/config.js'
import { encounterData, mapData, regions } from '../data/gameData.js'
import { getRegionUnlockTokens, prepareNextBattle } from './progression.js'

/**
 * Once every region is open, leftover Region Unlock Tokens have nothing left
 * to spend on, so convert them to Victory Tokens. Only called when a new
 * Champion is beaten or the last region is opened, so a given surplus is
 * settled exactly once.
 * @param {GameState} state
 * @returns {GameState}
 */
export function settleUnlockTokens(state) {
  if ((state.unlockedRegions ?? []).length < regions.length) return state
  const leftover = getRegionUnlockTokens(state)
  if (leftover <= 0) return state
  return {
    ...state,
    victoryTokens: state.victoryTokens + leftover,
    battleLog: [
      ...state.battleLog,
      `${leftover} leftover Region Unlock Token${leftover > 1 ? 's' : ''} converted to Victory Token${leftover > 1 ? 's' : ''}.`,
    ].slice(-50),
  }
}

/**
 * Abandon whatever battle is in progress and hand the phase to a minigame
 * scene. The start actions used to refuse unless the state happened to be
 * `idle`/`victory`, so the entry buttons had to be spammed while the idle loop
 * was mid-battle. Stopping the battle first makes one click enough.
 * @param {GameState} state
 * @param {string} phase
 * @param {number} [cost]
 * @param {string} [log]
 * @returns {GameState}
 */
export function enterMinigame(state, phase, cost = 0, log) {
  // Never interrupt a transition that is already mid-animation or already in a
  // minigame scene.
  if (
    state.phase === 'evolving' ||
    state.phase === 'healing' ||
    state.phase === 'catching' ||
    state.phase === 'bugCatching' ||
    state.phase === 'safari' ||
    state.phase === 'academyQuiz' ||
    state.phase === 'mining' ||
    state.phase === 'gameCorner' ||
    state.phase === 'voltorbFlip' ||
    state.phase === 'auctionHouse' ||
    state.phase === 'contest' ||
    state.phase === 'pokeathlon' ||
    state.phase === 'pokeRadar' ||
    state.phase === 'battleRoyal' ||
    state.phase === 'dynamaxAdventures' ||
    state.phase === 'lightsOut' ||
    state.phase === 'curry' ||
    state.phase === 'pokestar' ||
    state.phase === 'puzzleLeague' ||
    state.phase === 'memory' ||
    state.phase === 'whack' ||
    state.phase === 'musical' ||
    state.phase === 'picnic' ||
    state.phase === 'pokeballFactory' ||
    state.phase === 'ruinsPuzzle' ||
    state.phase === 'iceSlide' ||
    state.phase === 'pelago' ||
    state.phase === 'routeActivity' ||
    state.phase === 'wonderTrade'
  )
    return state
  if (cost > 0 && state.money < cost) return state
  const base = prepareNextBattle(state)
  return {
    ...base,
    phase,
    money: state.money - cost,
    ...(log ? { battleLog: [...state.battleLog, log].slice(-50) } : {}),
  }
}

/** Most toasts shown at once; older ones drop off the top. */
const NOTIFICATION_CAP = 4
/** Repeat events with the same dedupe key are dropped inside this window. */
const NOTIFICATION_COOLDOWN_MS = 6000

/**
 * Add a toast to the queue, collapsing repeats (same `dedupeKey`) inside the
 * cooldown so idle events can't spam the screen.
 * @param {GameState} state
 * @param {{ message: string, tone?: string, icon?: string | null, dedupeKey?: string, cooldown?: number }} notification
 * @returns {GameState}
 */
export function withNotification(state, notification) {
  const now = Date.now(),
    dedupeKey = notification.dedupeKey ?? notification.message,
    cooldown = notification.cooldown ?? NOTIFICATION_COOLDOWN_MS,
    active = state.notifications.filter(
      (entry) => now - entry.createdAt <= NOTIFICATION_COOLDOWN_MS
    )
  if (active.some((entry) => entry.dedupeKey === dedupeKey && now - entry.createdAt <= cooldown))
    return {
      ...state,
      notifications: active,
    }
  const nextId = state.nextNotificationId ?? 1
  return {
    ...state,
    notifications: [
      ...active,
      {
        id: nextId,
        message: notification.message,
        tone: notification.tone ?? 'info',
        icon: notification.icon ?? null,
        dedupeKey,
        createdAt: now,
      },
    ].slice(-NOTIFICATION_CAP),
    nextNotificationId: nextId + 1,
  }
}

/**
 * Pick a random unlocked route and one of its rarer species for a new swarm.
 * @param {GameState} state
 * @returns {{ routeKey: string, speciesKey: string, battlesRemaining: number } | null}
 */
export function rollSwarm(state) {
  const routes = state.unlockedLocations.filter(
    (id) => mapData[id]?.type === 'route' && encounterData[id]?.encounters?.length
  )
  if (routes.length === 0) return null
  const routeKey = routes[Math.floor(Math.random() * routes.length)],
    encounters = encounterData[routeKey].encounters,
    rarest = [...encounters].sort((left, right) => left.weight - right.weight)[0]
  return rarest
    ? { routeKey, speciesKey: rarest.speciesKey, battlesRemaining: swarmBattleCount }
    : null
}
