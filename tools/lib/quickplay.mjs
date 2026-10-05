// Headless "quickplay" solver: prove the unlock graph is completable by driving
// the real `computeUnlockedLocations` with an optimistic-but-honest player.
//
// Every newly opened route is fully caught and ground for battles, any gym /
// trial / Champion whose town is open is treated as beaten, and every minigame
// whose home is open is cleared. Party levels aren't capped by wild levels
// (EXP from repeatable battles is unlimited), so `partyLevel` gates are treated
// as always met once anything can be fought. If a location still refuses to
// open, something it asks for is genuinely behind it — or it asks for more than
// the region can supply.
//
// Shared by `tools/quickplay.mjs` and `tests/gates.test.mjs`.
import fs from 'node:fs'
import path from 'node:path'
import { installGameData } from './game-data.mjs'

const DATA = path.join(import.meta.dirname, '../../public/data')

installGameData()
const { computeUnlockedLocations } = await import('../../src/game/progression.js')
const { mapData, encounterData, trainerData } = await import('../../src/data/gameData.js')
const { MINIGAME_AREAS } = await import('../../src/game/minigames/registry.js')
const { GIFTS, STATIC_ENCOUNTERS } = await import('../../src/game/gifts.js')
const { regionalStarters } = await import('../../src/data/config.js')

const read = /** @param {string} file */ (file) =>
  JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))

const speciesData = read('pokemon-species.json')
const evolutionData = read('evolution-data.json')
const breedingData = read('breeding-data.json')
const gyms = read('gym-leader-data.json')
const regions = read('regions.json')

/** @type {Record<string, any[]>} */
const gymsByRegion = {}
for (const gym of gyms) (gymsByRegion[gym.region ?? 'kanto'] ??= []).push(gym)

const isFormRevert = /** @param {string} from @param {string} into */ (from, into) =>
  Number(speciesData[from]?.id) > 1025 &&
  (evolutionData[into] ?? []).some((evolution) => evolution.into === from)
/** @type {Record<string, string>} */
const preEvolutionMap = Object.fromEntries(
  Object.entries(evolutionData).flatMap(([from, evolutions]) =>
    evolutions
      .filter((evolution) => !isFormRevert(from, evolution.into))
      .map((evolution) => [evolution.into, from])
  )
)
/** @param {string} key */
const chainRoot = (key) => {
  const seen = new Set([key])
  let current = key
  for (let next = preEvolutionMap[current]; next && !seen.has(next); next = preEvolutionMap[current]) {
    current = next
    seen.add(current)
  }
  return current
}

/** Every gift/static source, indexed by the location that hands it over. */
const giftSources = [...GIFTS, ...STATIC_ENCOUNTERS].map((source) => {
  const locationId = source.locationId ?? source.location ?? source.unlockLocation
  /** @type {string[]} */
  const speciesKeys = []
  if (source.pokemon) speciesKeys.push(source.pokemon.speciesKey)
  if (source.egg) speciesKeys.push(source.egg.speciesKey)
  if (source.randomStarter) speciesKeys.push(...(regionalStarters[source.randomStarter] ?? []))
  return { locationId, speciesKeys }
})

/**
 * The species pool obtainable with a set of unlocked locations (wild finds,
 * reachable gifts, then evolutions and breeding to a fixpoint).
 * @param {Set<string>} unlockedSet
 * @param {string[]} seed
 */
function obtainablePool(unlockedSet, seed) {
  const pool = new Set(seed)
  for (const id of unlockedSet) {
    const loc = mapData[id]
    if (!loc || loc.type === 'zone') continue
    for (const entry of encounterData[loc.routeKey]?.encounters ?? []) pool.add(entry.speciesKey)
  }
  for (const gift of giftSources)
    if (gift.locationId && unlockedSet.has(gift.locationId))
      for (const key of gift.speciesKeys) pool.add(key)
  let changed = true
  while (changed) {
    changed = false
    for (const key of [...pool]) {
      const breed = breedingData[key]
      if (breed && !breed.undiscovered) {
        const root = chainRoot(key)
        if (!pool.has(root)) (pool.add(root), (changed = true))
      }
      for (const evolution of evolutionData[key] ?? [])
        if (!pool.has(evolution.into)) (pool.add(evolution.into), (changed = true))
    }
  }
  return pool
}

/** @param {string} id */
function isBattleable(id) {
  const loc = mapData[id]
  return (
    !!encounterData[loc?.routeKey]?.encounters?.length ||
    !!trainerData[id]?.length ||
    loc?.type === 'raid' ||
    regions.some((region) => region.leagueLocationKey === id) ||
    gyms.some((gym) => gym.locationKey === id)
  )
}

/**
 * Explain why a location stayed locked.
 * @param {string} id
 * @param {Set<string>} unlockedSet
 * @returns {string[]}
 */
export function explainBlocker(id, unlockedSet) {
  const unlock = mapData[id]?.unlock ?? {}
  /** @type {string[]} */
  const reasons = []
  const locked = (/** @type {string} */ other) => !unlockedSet.has(other)
  for (const required of unlock.requires ?? [])
    if (locked(required)) reasons.push(`requires ${required} (locked)`)
  for (const rule of unlock.battlesAtLocation ?? [])
    if (locked(rule.locationId)) reasons.push(`battles at ${rule.locationId} (locked)`)
  for (const gymId of unlock.gymsRequired ?? []) {
    const gym = gyms.find((candidate) => candidate.id === gymId)
    if (gym?.locationKey && locked(gym.locationKey))
      reasons.push(`gym ${gymId} @ ${gym.locationKey} (locked)`)
  }
  if (unlock.championDefeated) {
    const regionId = unlock.championDefeated === true ? 'kanto' : unlock.championDefeated
    const league = regions.find((region) => region.id === regionId)?.leagueLocationKey
    if (league && locked(league)) reasons.push(`Champion of ${regionId} (league locked)`)
  }
  const minigameHome = unlock.minigame ? MINIGAME_AREAS[unlock.minigame] : null
  if (minigameHome && locked(minigameHome))
    reasons.push(`minigame ${unlock.minigame} @ ${minigameHome} (locked)`)
  if (unlock.caughtOnRoute && locked(unlock.caughtOnRoute.routeKey))
    reasons.push(`route ${unlock.caughtOnRoute.routeKey} (locked)`)
  return reasons
}

/**
 * Quickplay one region from a fresh save. Returns the unlocked locations, the
 * still-locked ones and why.
 * @param {string} regionId
 * @param {{ beatenChampions?: string[], extraRegions?: string[] }} [options]
 */
export function quickplayRegion(regionId, options = {}) {
  const region = regions.find((candidate) => candidate.id === regionId)
  const unlockedRegions = [regionId, ...(options.extraRegions ?? [])]
  const beatenChampions = new Set(options.beatenChampions ?? [])

  /** @type {any} */
  const state = {
    startRegion: regionId,
    unlockedRegions,
    unlockedLocations: [region.entry],
    currentLocation: region.entry,
    currentRoute: mapData[region.entry]?.routeKey ?? null,
    pokedexCaught: [...(regionalStarters[regionId] ?? [])],
    pokedexSeen: [],
    party: [{ level: 5 }],
    defeatedGyms: [],
    defeatedEliteFour: [],
    defeatedChampions: [...beatenChampions],
    battlesWonByLocation: {},
    minigameRecords: {},
  }

  let rounds = 0
  for (;;) {
    rounds++
    if (rounds > 200) break
    const unlocked = computeUnlockedLocations(state)
    const unlockedSet = new Set(unlocked)
    let changed = false

    // Ground every open route/town. A gate whose target is still locked can't
    // be ground around.
    for (const id of unlocked)
      if (isBattleable(id) && (state.battlesWonByLocation[id] ?? 0) < 999) {
        state.battlesWonByLocation[id] = 999
        changed = true
      }

    // A gym / trial whose town is open is treated as beaten. A gym on a locked
    // location stays unbeaten, which is what exposes a self-gating island.
    for (const gym of gymsByRegion[regionId] ?? [])
      if (gym.locationKey && unlockedSet.has(gym.locationKey) && !state.defeatedGyms.includes(gym.id)) {
        state.defeatedGyms = [...state.defeatedGyms, gym.id]
        changed = true
      }

    // The region's Champion falls once its league is open.
    if (region.leagueLocationKey && unlockedSet.has(region.leagueLocationKey) && !beatenChampions.has(regionId)) {
      beatenChampions.add(regionId)
      state.defeatedChampions = [...beatenChampions]
      changed = true
    }

    // Clear any minigame whose home area is open.
    for (const [minigame, home] of Object.entries(MINIGAME_AREAS))
      if (unlockedSet.has(home) && !state.minigameRecords[minigame]) {
        state.minigameRecords[minigame] = { best: 999, completed: true }
        changed = true
      }

    // Party levels aren't capped by wild levels: unlimited EXP from repeatable
    // battles means any level is reachable once anything can be fought.
    if (state.party[0].level < 100 && Object.keys(state.battlesWonByLocation).length > 0) {
      state.party = [{ level: 100 }]
      changed = true
    }

    // Catch everything the open world can supply.
    const pool = obtainablePool(unlockedSet, state.pokedexCaught)
    if (pool.size !== state.pokedexCaught.length) {
      state.pokedexCaught = [...pool]
      changed = true
    }

    state.unlockedLocations = unlocked
    if (!changed) {
      const stuck = Object.keys(mapData)
        .filter((id) => (mapData[id].region ?? 'kanto') === regionId)
        .filter((id) => !unlocked.includes(id))
        .map((id) => ({ id, reasons: explainBlocker(id, unlockedSet) }))
      return { regionId, unlocked, stuck, pool: [...new Set(state.pokedexCaught)] }
    }
  }
  return { regionId, unlocked: state.unlockedLocations, stuck: [], pool: [], loop: true }
}

/**
 * Quickplay every region. Base regions start fresh; DLC expansions get their
 * parent's Champion beaten (their hubs gate on it).
 * @param {string} [onlyRegion]
 */
export function quickplayAll(onlyRegion) {
  const targets = onlyRegion
    ? regions.filter((region) => region.id === onlyRegion)
    : regions
  return targets.map((region) =>
    quickplayRegion(
      region.id,
      region.isDlc
        ? { beatenChampions: [region.parentRegion], extraRegions: [region.parentRegion] }
        : {}
    )
  )
}

export { mapData, regions }
