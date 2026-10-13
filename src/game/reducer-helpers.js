// Shared helpers for the reducer handlers (toast queue, minigame entry,
// leftover unlock tokens and swarm rolls). Split from game/reducer.js.

import { spaceTimeDistortionChance, swarmBattleCount } from '../data/config.js'
import { encounterData, mapData, pokemonSpecies, baseRegions } from '../data/gameData.js'
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
  if ((state.unlockedRegions ?? []).length < baseRegions.length) return state
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
    state.phase === 'dowsing' ||
    state.phase === 'gameCorner' ||
    state.phase === 'voltorbFlip' ||
    state.phase === 'auctionHouse' ||
    state.phase === 'contest' ||
    state.phase === 'pokeathlon' ||
    state.phase === 'pokeRadar' ||
    state.phase === 'battleRoyal' ||
    state.phase === 'championGauntlet' ||
    state.phase === 'doubles' ||
    state.phase === 'triples' ||
    state.phase === 'rotation' ||
    state.phase === 'freeForAll' ||
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
    state.phase === 'secretBase' ||
    state.phase === 'mantineSurf' ||
    state.phase === 'rotomRally' ||
    state.phase === 'ogreOustin' ||
    state.phase === 'typeFusion' ||
    state.phase === 'unownPicross' ||
    state.phase === 'pokeshot' ||
    state.phase === 'teraRaid' ||
    state.phase === 'pokeword' ||
    state.phase === 'berryBlender' ||
    state.phase === 'ultraWarp' ||
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
 * @param {{ message: string, tone?: string, icon?: string | null, dedupeKey?: string, cooldown?: number, kind?: string | null, locationId?: string | null }} notification
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
        // The browser-notification filters key off this; shiny toasts are
        // tagged from their tone so every shiny call site is covered.
        kind: notification.kind ?? (notification.tone === 'shiny' ? 'shiny' : null),
        // When set, the toast gets a GO button that travels to the location.
        locationId: notification.locationId ?? null,
        dedupeKey,
        createdAt: now,
      },
    ].slice(-NOTIFICATION_CAP),
    nextNotificationId: nextId + 1,
  }
}

/**
 * Record that the player has seen a battle Pokemon, so a trainer's team fills
 * the Pokedex's "seen" (and "shiny seen") entries the same way a wild
 * encounter does. Returns the unchanged state when nothing is new.
 * @param {GameState} state
 * @param {{ speciesKey?: string, isShiny?: boolean }} pokemon
 * @returns {GameState}
 */
export function recordSeenPokemon(state, pokemon) {
  const speciesKey = pokemon?.speciesKey
  if (!speciesKey) return state
  const pokedexSeen = state.pokedexSeen.includes(speciesKey)
      ? state.pokedexSeen
      : [...state.pokedexSeen, speciesKey],
    shinySeen =
      pokemon.isShiny && !state.shinySeen.includes(speciesKey)
        ? [...state.shinySeen, speciesKey]
        : state.shinySeen
  if (pokedexSeen === state.pokedexSeen && shinySeen === state.shinySeen) return state
  const next = { ...state, pokedexSeen, shinySeen }
  return shinySeen !== state.shinySeen
    ? withNotification(next, {
        message: `A shiny ${pokemonSpecies[speciesKey]?.name ?? speciesKey} appeared!`,
        tone: 'shiny',
        icon: '✨',
        dedupeKey: `shinyseen:${speciesKey}`,
      })
    : next
}

/**
 * Pick a random unlocked route and one of its rarer species for a new swarm.
 * In Hisui, a space-time distortion sometimes forms instead: the same boosted
 * rare-species event, themed to the zone.
 * @param {GameState} state
 * @returns {{ routeKey: string, speciesKey: string, battlesRemaining: number, distortion: boolean } | null}
 */
export function rollSwarm(state) {
  const routes = state.unlockedLocations.filter(
    (id) => mapData[id]?.type === 'route' && encounterData[id]?.encounters?.length
  )
  if (routes.length === 0) return null
  const hisuiRoutes = routes.filter((id) => mapData[id]?.zone === 'hisui'),
    distortion = hisuiRoutes.length > 0 && Math.random() < spaceTimeDistortionChance,
    pool = distortion ? hisuiRoutes : routes,
    routeKey = pool[Math.floor(Math.random() * pool.length)],
    encounters = encounterData[routeKey].encounters,
    rarest = [...encounters].sort((left, right) => left.weight - right.weight)[0]
  return rarest
    ? { routeKey, speciesKey: rarest.speciesKey, battlesRemaining: swarmBattleCount, distortion }
    : null
}
