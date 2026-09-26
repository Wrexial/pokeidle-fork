// Sinnoh's Poke Radar. Split out of game/minigames.js. A memory/risk chain:
// watch a sequence of grass patches light up, then repeat it. Each round adds
// one more patch; a wrong tap breaks the chain. Banking a chain boosts the
// shiny odds of a route's rarest species.

import { encounterData, mapData } from '../../data/gameData.js'

/** Money spent to start a radar run. */
export const POKE_RADAR_COST = 300

/** The grass field is 4x4. */
export const POKE_RADAR_SIZE = 4

/** The first round shows this many patches. */
export const POKE_RADAR_START_LENGTH = 2

/** Shiny-chain points added per successfully completed round. */
export const POKE_RADAR_CHAIN_STEP = 10

/**
 * A random sequence of distinct patch indexes.
 * @param {number} length
 * @returns {number[]}
 */
export function radarSequence(length) {
  const pool = Array.from({ length: POKE_RADAR_SIZE * POKE_RADAR_SIZE }, (_, index) => index),
    sequence = [],
    target = Math.min(length, pool.length)
  while (sequence.length < target) {
    const pick = Math.floor(Math.random() * pool.length)
    sequence.push(pool[pick])
    pool.splice(pick, 1)
  }
  return sequence
}

/**
 * A face for each grass patch: the route's wild species, repeated across the
 * grid and shuffled so the repeats are not laid out in order. Returns nulls
 * when the route has no encounters.
 * @param {string} routeKey
 * @param {number} [size]
 * @returns {(string | null)[]}
 */
export function radarFaces(routeKey, size = POKE_RADAR_SIZE * POKE_RADAR_SIZE) {
  const pool = (encounterData[routeKey]?.encounters ?? []).map((entry) => entry.speciesKey)
  if (pool.length === 0) return Array.from({ length: size }, () => null)
  const faces = Array.from({ length: size }, (_, index) => pool[index % pool.length])
  for (let index = faces.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[faces[index], faces[swap]] = [faces[swap], faces[index]]
  }
  return faces
}

/**
 * The species a radar chain should target: the rarest wild on the current
 * route, or the most recently unlocked route with encounters.
 * @param {{ currentRoute?: string, unlockedLocations?: string[] }} state
 * @returns {{ speciesKey: string, routeKey: string } | null}
 */
export function pickRadarTarget(state) {
  const routeKeys = (state.unlockedLocations ?? []).filter(
      (locationId) =>
        mapData[locationId]?.type === 'route' && encounterData[locationId]?.encounters?.length
    ),
    routeKey =
      encounterData[state.currentRoute ?? '']?.encounters?.length
        ? state.currentRoute
        : routeKeys[routeKeys.length - 1]
  if (!routeKey) return null
  const encounters = encounterData[routeKey].encounters,
    rarest = encounters.reduce(
      (best, encounter) => (encounter.weight < best.weight ? encounter : best),
      encounters[0]
    )
  return { speciesKey: rarest.speciesKey, routeKey }
}

/**
 * Shiny-chain points a run banks for its target species.
 * @param {number} rounds
 * @returns {number}
 */
export function radarChainPoints(rounds) {
  return rounds * POKE_RADAR_CHAIN_STEP
}

/**
 * Prize for the chain length reached.
 * @param {number} rounds
 * @returns {{ money: number, items: { itemId: string, quantity: number }[], label: string }}
 */
export function pokeRadarPrize(rounds) {
  if (rounds >= 10)
    return { money: 4000, items: [{ itemId: 'rareCandy', quantity: 1 }], label: 'Brilliant chain!' }
  if (rounds >= 6)
    return { money: 2500, items: [{ itemId: 'expCandyL', quantity: 1 }], label: 'Great chain' }
  if (rounds >= 3)
    return { money: 1200, items: [{ itemId: 'expCandyM', quantity: 1 }], label: 'Good chain' }
  return { money: 300, items: [{ itemId: 'expCandyS', quantity: 1 }], label: 'Chain broken' }
}
