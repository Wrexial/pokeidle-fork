// Offline auto-catching: replay the wild wins an away window would have
// produced on the route the player left off on, respecting their own catch
// rules, so the "while you were away" report can name what was caught. It only
// mirrors what the live idle loop would auto-catch — a route with auto-catch
// off changes nothing — so it can't surprise a player who never set a rule.

import { encounterData, mapData, pokemonSpecies } from '../data/gameData.js'
import { attemptCatch, isCaveLocation, isNightTime, isWaterLocation, selectAutoCatchBall, shouldAutoCatch } from './catching.js'
import { offlineWildWinEstimate, encountersForPhase } from './progression.js'
import { currentSeason } from './seasons.js'
import { prestigeMultipliers } from './prestige.js'
import { professorStoryCatchBonus } from './quests.js'

/** Hard cap on catch rolls replayed offline, so a long away window stays cheap. */
export const MAX_OFFLINE_CATCHES = 500

/**
 * A weighted pick from a route's encounter table.
 * @param {{ speciesKey: string, weight: number, minLevel: number, maxLevel: number }[]} encounters
 * @param {() => number} random
 * @returns {{ speciesKey: string, weight: number, minLevel: number, maxLevel: number }}
 */
function pickEncounter(encounters, random) {
  const total = encounters.reduce((sum, entry) => sum + (entry.weight ?? 1), 0)
  let roll = random() * total
  for (const entry of encounters) {
    roll -= entry.weight ?? 1
    if (roll <= 0) return entry
  }
  return encounters[encounters.length - 1]
}

/**
 * Replay the away window's wild encounters on the current route and auto-catch
 * them by the player's own catch rules. Returns the updated inventory/Pokedex
 * and what was caught, or null when there is nothing to report.
 * @param {GameState} state
 * @param {number} awayMs
 * @param {() => number} [random]
 * @returns {{ caught: string[], ballsUsed: Record<string, number>, pokedexSeen: string[], pokedexCaught: string[], inventory: Record<string, number> } | null}
 */
export function simulateOfflineCatches(state, awayMs, random = Math.random) {
  const routeKey = state.currentRoute,
    bucket = encounterData[routeKey]
  if (!bucket?.encounters?.length) return null
  const encounters = encountersForPhase(bucket.encounters, isNightTime(), currentSeason()),
    battles = Math.min(MAX_OFFLINE_CATCHES, offlineWildWinEstimate(awayMs))
  if (battles <= 0) return null
  const location = mapData[state.currentLocation] ?? mapData[routeKey],
    baseContext = {
      isWater: isWaterLocation(location),
      isCave: isCaveLocation(location),
      isNight: isNightTime(),
      leadLevel: state.playerPokemon?.level ?? 0,
      leadGender: state.playerPokemon?.gender ?? undefined,
      catchMultiplier: prestigeMultipliers(state).capture * (1 + professorStoryCatchBonus(state)),
    }
  let inventory = state.inventory,
    pokedexSeen = [...state.pokedexSeen],
    pokedexCaught = [...state.pokedexCaught]
  const caught = new Set(),
    ballsUsed = /** @type {Record<string, number>} */ ({})
  for (let index = 0; index < battles; index++) {
    const encounter = pickEncounter(encounters, random),
      speciesKey = encounter.speciesKey,
      level =
        encounter.minLevel +
        Math.floor(random() * Math.max(1, encounter.maxLevel - encounter.minLevel + 1))
    if (!pokedexSeen.includes(speciesKey)) pokedexSeen.push(speciesKey)
    const liveState = { ...state, inventory, pokedexSeen, pokedexCaught }
    if (!shouldAutoCatch(liveState, routeKey, speciesKey, level, false)) continue
    const context = { ...baseContext, speciesKey, level, alreadyCaught: pokedexCaught.includes(speciesKey) },
      ballId = selectAutoCatchBall(liveState, routeKey, speciesKey, context)
    if (!ballId || (inventory[ballId] ?? 0) <= 0) continue
    inventory = { ...inventory, [ballId]: inventory[ballId] - 1 }
    ballsUsed[ballId] = (ballsUsed[ballId] ?? 0) + 1
    if (attemptCatch(speciesKey, ballId, context)) {
      caught.add(speciesKey)
      if (!pokedexCaught.includes(speciesKey)) pokedexCaught.push(speciesKey)
      if (!pokedexSeen.includes(speciesKey)) pokedexSeen.push(speciesKey)
    }
  }
  if (caught.size === 0 && Object.keys(ballsUsed).length === 0) return null
  return { caught: [...caught], ballsUsed, pokedexSeen, pokedexCaught, inventory }
}

/**
 * A short, readable summary of an offline catch list ("Pidgey, Rattata and 2
 * more"), or an empty string.
 * @param {string[]} speciesKeys
 * @returns {string}
 */
export function describeOfflineCatches(speciesKeys) {
  const names = speciesKeys.map((key) => pokemonSpecies[key]?.name ?? key)
  if (names.length === 0) return ''
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`
}
