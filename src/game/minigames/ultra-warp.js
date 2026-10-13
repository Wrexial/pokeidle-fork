// Alola's Ultra Warp Ride: ride a legendary through a wormhole tunnel, collect
// rings and dodge debris. The cleaner and further the run, the rarer the
// wormhole it can reach; the player then picks one destination drawn from
// Alola's Raid Island pool (the Ultra Beasts and the regional legends) instead
// of leaving the catch to the raid's weighted roll.

import { pokemonSpecies, regions } from '../../data/gameData.js'
import { withoutLockedLegendary, withoutQuestLegendary } from '../../data/legendary-quests.js'

/** Money spent per ride. */
export const ULTRA_WARP_COST = 600

/** How long a ride lasts. */
export const ULTRA_WARP_SECONDS = 30

/** The scene ticks this often. */
export const ULTRA_WARP_TICK_MS = 40

/** The most time a ride can run. */
export const ULTRA_WARP_TIME_MS = ULTRA_WARP_SECONDS * 1000

/** The level a warped-in legendary arrives at. */
export const ULTRA_WARP_LEVEL = 70

/** An object takes this long to cross the tunnel at the start of a ride. */
export const ULTRA_WARP_FALL_MS = 2600

/** ...and this long once the ride is at its fastest. */
export const ULTRA_WARP_MIN_FALL_MS = 1350

/** An object spawns this often at the start of a ride. */
export const ULTRA_WARP_SPAWN_MS = 460

/** ...and this often once the ride is at its fastest. */
export const ULTRA_WARP_MIN_SPAWN_MS = 270

/** The height (0 = far, 1 = near) the rider flies at in the tunnel. */
export const ULTRA_WARP_RIDER_Y = 0.84

/** How far either side of the rider a ring can still be caught, in field units. */
export const ULTRA_WARP_CATCH_X = 0.12

/**
 * What can drift down the tunnel: a ring scores, a gold ring scores more, and
 * debris costs you if you clip it.
 * @type {{ kind: string, weight: number, points: number }[]}
 */
export const ULTRA_WARP_OBJECTS = [
  { kind: 'ring', weight: 10, points: 1 },
  { kind: 'gold', weight: 1, points: 3 },
  { kind: 'debris', weight: 5, points: -2 },
]

const ULTRA_WARP_TOTAL_WEIGHT = ULTRA_WARP_OBJECTS.reduce((sum, object) => sum + object.weight, 0)

/** Roll the next tunnel object. */
export function rollWarpObject() {
  let roll = Math.random() * ULTRA_WARP_TOTAL_WEIGHT
  for (const object of ULTRA_WARP_OBJECTS) {
    roll -= object.weight
    if (roll <= 0) return object
  }
  return ULTRA_WARP_OBJECTS[0]
}

/**
 * The crossing time for an object released `elapsedMs` into the ride.
 * Everything speeds up as the ride runs on.
 * @param {number} elapsedMs
 * @returns {number}
 */
export function warpFallMs(elapsedMs) {
  const progress = Math.min(1, Math.max(0, elapsedMs / ULTRA_WARP_TIME_MS))
  return Math.round(
    ULTRA_WARP_FALL_MS - (ULTRA_WARP_FALL_MS - ULTRA_WARP_MIN_FALL_MS) * progress
  )
}

/**
 * The gap between objects `elapsedMs` into the ride.
 * @param {number} elapsedMs
 * @returns {number}
 */
export function warpSpawnMs(elapsedMs) {
  const progress = Math.min(1, Math.max(0, elapsedMs / ULTRA_WARP_TIME_MS))
  return Math.round(
    ULTRA_WARP_SPAWN_MS - (ULTRA_WARP_SPAWN_MS - ULTRA_WARP_MIN_SPAWN_MS) * progress
  )
}

/** The score a stable, clean ride needs to reach each wormhole tier. */
export const ULTRA_WARP_TIER_SCORES = [25, 55]

/**
 * The deepest wormhole tier a score reaches (0 common, 1 rare, 2 legendary).
 * @param {number} score
 * @returns {0 | 1 | 2}
 */
export function warpTierForScore(score) {
  const safe = Math.max(0, Math.floor(score || 0))
  if (safe >= ULTRA_WARP_TIER_SCORES[1]) return 2
  if (safe >= ULTRA_WARP_TIER_SCORES[0]) return 1
  return 0
}

/**
 * The destination pools. Each is intersected at load with Alola's real Raid
 * Island pool, so a renamed or removed species can never strand the ride.
 * @type {{ id: string, label: string, species: string[] }[]}
 */
export const ULTRA_WARP_TIERS = [
  {
    id: 'common',
    label: 'Faint Wormhole',
    // The Ultra Beasts.
    species: [
      'nihilego',
      'buzzwole',
      'pheromosa',
      'xurkitree',
      'celesteela',
      'kartana',
      'guzzlord',
      'poipole',
      'naganadel',
      'stakataka',
      'blacephalon',
    ],
  },
  {
    id: 'rare',
    label: 'Rare Wormhole',
    // Alola's guardian deities, mythicals and the Type: Full line.
    species: [
      'tapu koko',
      'tapu lele',
      'tapu bulu',
      'tapu fini',
      'type: null',
      'silvally',
      'magearna',
      'marshadow',
      'zeraora',
      'meltan',
      'melmetal',
    ],
  },
  {
    id: 'legendary',
    label: 'Legendary Wormhole',
    // The Cosmog line and the box legendaries.
    species: ['cosmog', 'cosmoem', 'solgaleo', 'lunala', 'necrozma'],
  },
]

const alolaRaidPool = new Set(
  withoutQuestLegendary(
    'alola',
    regions.find((region) => region.id === 'alola')?.raidPool ?? []
  ).map((entry) => entry.speciesKey)
)

/**
 * The real, warp-reachable species for a wormhole tier. Pass `state` so a
 * villain boss's legendary stays out of the ride until its arc is cleared.
 * @param {number} tier
 * @param {{ villainProgress?: Record<string, number> } | null} [state]
 */
export function ultraWarpSpeciesForTier(tier, state = null) {
  const pool = ULTRA_WARP_TIERS[tier]?.species ?? [],
    valid = pool.filter(
      (speciesKey) => pokemonSpecies[speciesKey] && alolaRaidPool.has(speciesKey)
    )
  return withoutLockedLegendary('alola', state, valid, (speciesKey) => speciesKey)
}

/**
 * Roll one species from a tier, preferring one the player has not caught yet so
 * a ride is a real chance at something new. Falls back to the whole tier once
 * every species in it is registered.
 * @param {number} tier
 * @param {string[]} caught
 * @param {() => number} [rng]
 * @param {{ villainProgress?: Record<string, number> } | null} [state]
 * @returns {string | null}
 */
export function rollWarpSpecies(tier, caught = [], rng = Math.random, state = null) {
  const pool = ultraWarpSpeciesForTier(tier, state)
  if (pool.length === 0) return null
  const caughtSet = new Set(caught),
    uncaught = pool.filter((speciesKey) => !caughtSet.has(speciesKey)),
    source = uncaught.length > 0 ? uncaught : pool
  return source[Math.floor(rng() * source.length)] ?? source[0]
}

/**
 * The destinations offered after a ride: one wormhole per tier up to the one
 * the run reached, so a better ride offers a rarer choice.
 * @param {{ pokedexCaught?: string[], villainProgress?: Record<string, number> }} state
 * @param {number} reachedTier
 * @param {() => number} [rng]
 */
export function ultraWarpDestinations(state, reachedTier, rng = Math.random) {
  const caught = state.pokedexCaught ?? [],
    capped = Math.max(0, Math.min(ULTRA_WARP_TIERS.length - 1, Math.floor(reachedTier))),
    /** @type {{ speciesKey: string, name: string, tier: number, tierLabel: string, level: number }[]} */
    destinations = []
  for (let tier = 0; tier <= capped; tier++) {
    const speciesKey = rollWarpSpecies(tier, caught, rng, state)
    if (!speciesKey) continue
    destinations.push({
      speciesKey,
      name: pokemonSpecies[speciesKey].name,
      tier,
      tierLabel: ULTRA_WARP_TIERS[tier].label,
      level: ULTRA_WARP_LEVEL,
    })
  }
  return destinations
}

/**
 * The reward for a chosen wormhole: the legendary itself plus a payout scaled
 * by the ride's score and the rarity of the destination.
 * @param {number} score
 * @param {{ speciesKey: string, tier: number, tierLabel: string, level: number } | null} destination
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], pokemon: { speciesKey: string, level: number } | null, label: string }}
 */
export function ultraWarpPrize(score, destination) {
  const safeScore = Math.max(0, Math.floor(score || 0)),
    tier = destination?.tier ?? 0,
    money = 600 + safeScore * 40,
    items =
      tier >= 2
        ? [
            { itemId: 'expCandyXL', quantity: 1 },
            { itemId: 'rareCandy', quantity: 1 },
          ]
        : tier === 1
          ? [{ itemId: 'expCandyL', quantity: 1 }]
          : [{ itemId: 'expCandyM', quantity: 1 }]
  return {
    money,
    items,
    pokemon: destination ? { speciesKey: destination.speciesKey, level: destination.level } : null,
    label: destination ? destination.tierLabel : 'Warp Ride',
  }
}
