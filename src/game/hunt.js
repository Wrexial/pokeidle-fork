// Focus / target hunting (#61): pick one species or type to focus on. The
// target's wild and route-activity encounter rate is boosted and the hunt
// tracks its progress (encounters, catches, best activity hit quality and
// elapsed time). A hunt is a lightweight, persistent goal — it is not tied to
// a region and survives a prestige.

import { encounterData, mapData, pokemonSpecies } from '../data/gameData.js'
import { speciesHasType } from './pokemon.js'

/** How much more common a focused species becomes on routes and activities. */
export const HUNT_ENCOUNTER_MULTIPLIER = 3

/** Ranks for the activity hit qualities, for the best-quality tracker. */
export const HUNT_QUALITY_RANK = { hit: 1, perfect: 2, ultra: 3 }

/** @param {'hit' | 'perfect' | 'ultra' | null | undefined} quality */
export function huntQualityRank(quality) {
  return HUNT_QUALITY_RANK[/** @type {keyof typeof HUNT_QUALITY_RANK} */ (quality)] ?? 0
}

/**
 * A fresh hunt.
 * @param {'species' | 'type'} mode
 * @param {string} target Species key or type name.
 * @param {number} now
 * @returns {Hunt}
 */
export function createHunt(mode, target, now = Date.now()) {
  return {
    mode: mode === 'type' ? 'type' : 'species',
    target,
    startedAt: now,
    encounters: 0,
    catches: 0,
    bestQuality: null,
  }
}

/** The type names the game knows, gathered from the species data. */
const KNOWN_TYPES = new Set(
  Object.values(pokemonSpecies).flatMap((species) => species.types ?? [])
)

/** @param {string} type */
export function isKnownType(type) {
  return KNOWN_TYPES.has(type)
}

/**
 * Whether a hunt's target exists at all.
 * @param {'species' | 'type'} mode
 * @param {string} target
 * @returns {boolean}
 */
export function isValidHuntTarget(mode, target) {
  if (!target) return false
  return mode === 'type' ? isKnownType(target) : !!pokemonSpecies[target]
}

/**
 * Whether a species is the hunt's target.
 * @param {Hunt | null | undefined} hunt
 * @param {string} speciesKey
 * @returns {boolean}
 */
export function huntMatchesSpecies(hunt, speciesKey) {
  if (!hunt?.target || !speciesKey) return false
  if (hunt.mode === 'type') return speciesHasType(speciesKey, hunt.target)
  return hunt.target === speciesKey
}

/**
 * Record an encounter of `speciesKey` for the hunt (species match only), and
 * improve its best activity quality. Returns the same reference when nothing
 * changed, so the caller can skip a state update.
 * @param {Hunt | null} hunt
 * @param {string} speciesKey
 * @param {'hit' | 'perfect' | 'ultra' | null} [quality]
 * @returns {Hunt | null}
 */
export function advanceHuntEncounter(hunt, speciesKey, quality = null) {
  if (!hunt || !huntMatchesSpecies(hunt, speciesKey)) return hunt
  const nextQuality =
      huntQualityRank(quality) > huntQualityRank(hunt.bestQuality ?? null)
        ? quality
        : hunt.bestQuality ?? null,
    encounters = (hunt.encounters ?? 0) + 1
  return { ...hunt, encounters, bestQuality: nextQuality }
}

/**
 * Record a catch for the hunt (species match only). Returns the same reference
 * when nothing changed.
 * @param {Hunt | null} hunt
 * @param {string} speciesKey
 * @returns {Hunt | null}
 */
export function recordHuntCatch(hunt, speciesKey) {
  if (!hunt || !huntMatchesSpecies(hunt, speciesKey)) return hunt
  return { ...hunt, catches: (hunt.catches ?? 0) + 1 }
}

/**
 * A short label for a hunt's target: the species name, or `${type}-type`.
 * @param {Hunt | null | undefined} hunt
 * @returns {string}
 */
export function huntLabel(hunt) {
  if (!hunt?.target) return 'Nothing'
  if (hunt.mode === 'type') return `${hunt.target}-type`
  return pokemonSpecies[hunt.target]?.name ?? hunt.target
}

/**
 * The hunt's progress, derived. `elapsedMs` is 0 for a finished/absent hunt.
 * @param {Hunt | null | undefined} hunt
 * @param {number} [now]
 * @returns {{ encounters: number, catches: number, bestQuality: string | null, elapsedMs: number }}
 */
export function huntProgress(hunt, now = Date.now()) {
  if (!hunt) return { encounters: 0, catches: 0, bestQuality: null, elapsedMs: 0 }
  return {
    encounters: hunt.encounters ?? 0,
    catches: hunt.catches ?? 0,
    bestQuality: hunt.bestQuality ?? null,
    elapsedMs: Math.max(0, now - (hunt.startedAt ?? now)),
  }
}

/**
 * The locations where a hunt's target can be found, in map order (capped).
 * @param {Hunt | null | undefined} hunt
 * @param {number} [limit]
 * @returns {{ locationId: string, name: string }[]}
 */
export function routesForHunt(hunt, limit = 8) {
  if (!hunt?.target) return []
  /** @type {{ locationId: string, name: string }[]} */
  const routes = []
  for (const [locationId, location] of Object.entries(mapData ?? {})) {
    const bucket = location.routeKey ? encounterData[location.routeKey] : null
    if (
      (bucket?.encounters ?? []).some((entry) => huntMatchesSpecies(hunt, entry.speciesKey)) &&
      !routes.some((route) => route.locationId === locationId)
    )
      routes.push({ locationId, name: location.name ?? locationId })
    if (routes.length >= limit) break
  }
  return routes
}

/**
 * Human duration like "2h 15m" or "45m". Mirrors the offline report's formatter.
 * @param {number} ms
 * @returns {string}
 */
export function formatHuntDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000)),
    hours = Math.floor(totalMinutes / 60),
    minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
