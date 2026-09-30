/**
 * Route encounter variety: top up sparse wild tables so a route can roll more
 * different Pokemon.
 *
 * The scraped per-route encounters are faithful but thin (Kanto Route 1 is just
 * Pidgey + Rattata, and roughly a third of routes list fewer than eight
 * species), which makes routes feel repetitive once the common two or three
 * have been caught. This helper seeds each route with more of the region's own
 * wild species, preferring ones that fit the route's dominant types and are
 * already found at a similar level, at a modest weight so it adds variety
 * without taking over the table.
 *
 * It only ever redistributes species that are *already wild somewhere in the
 * region*, so it never makes a rare/gift/raid Pokemon common, never strands a
 * route-exclusive species and never needs new art. Shared by
 * `tools/generate-regions.cjs` and `tools/apply-route-variety.cjs` so the two
 * stay in step.
 *
 * Idempotent: an added find is flagged (`variety: true`) and the pool ignores
 * flagged entries, so a re-run sees the same original level bands and a table
 * already at (or above) the target is returned unchanged.
 */

const { stageForLevel } = require('./evolution-levels.cjs')

/** How many species a route's wild table is topped up to. */
const MIN_ROUTE_SPECIES = 16
/** Marks an entry this pass added, so the pool ignores it on later runs. */
const VARIETY_FLAG = 'variety'
/** The weight given to an added find (the scraped common species sit at 20-50). */
const ADDED_ENCOUNTER_WEIGHT = 8
/**
 * How far above a route's top level a species may still appear, so a route can
 * gain a neighbour's Pokemon without pulling a Safari-Zone rare onto Route 1.
 */
const LEVEL_SLACK = 4
/**
 * A species with at most this base-stat total counts as a common, early-route
 * find, so it can join a route even without a matching type (Caterpie beside
 * Route 1's Pidgey). Stronger species must share the route's dominant type.
 */
const COMMON_BST = 420

/** @param {any} species */
function totalBaseStats(species) {
  return Object.values(species?.baseStats ?? {}).reduce(
    (sum, stat) => sum + (typeof stat === 'number' ? stat : 0),
    0
  )
}

/**
 * The canonical baby Pokemon: breed-only lines that should not be spread onto
 * ordinary routes.
 * @type {Set<string>}
 */
const BABY_SPECIES = new Set([
  'pichu',
  'cleffa',
  'igglybuff',
  'togepi',
  'tyrogue',
  'smoochum',
  'elekid',
  'magby',
  'azurill',
  'wynaut',
  'budew',
  'chingling',
  'bonsly',
  'mimeJr',
  'happiny',
  'munchlax',
  'riolu',
  'mantyke',
  'toxel',
])

/**
 * The regional wild pool: every species currently on one of the region's route
 * buckets, with the level band it is found at. Raid buckets are ignored.
 * @param {Record<string, { encounters?: any[] }>} buckets
 * @param {Record<string, any>} mapData merged map data
 * @param {Set<string>} [exclude]
 * @returns {Map<string, { minLevel: number, maxLevel: number }>}
 */
function buildWildPool(buckets, mapData, exclude = new Set()) {
  const pool = new Map()
  for (const [key, bucket] of Object.entries(buckets)) {
    if (mapData[key]?.type !== 'route') continue
    for (const encounter of bucket.encounters ?? []) {
      if (encounter[VARIETY_FLAG]) continue
      if (exclude.has(encounter.speciesKey)) continue
      const band = pool.get(encounter.speciesKey) ?? { minLevel: Infinity, maxLevel: 0 }
      band.minLevel = Math.min(band.minLevel, encounter.minLevel ?? 1)
      band.maxLevel = Math.max(band.maxLevel, encounter.maxLevel ?? band.minLevel)
      pool.set(encounter.speciesKey, band)
    }
  }
  return pool
}

/**
 * Append level- and theme-appropriate species from the regional pool to an
 * encounter table until it reaches `target`. Existing entries are untouched.
 * @param {{ speciesKey: string, weight: number, minLevel: number, maxLevel: number }[]} encounters
 * @param {Map<string, { minLevel: number, maxLevel: number }>} pool
 * @param {Record<string, any>} speciesByKey
 * @param {{ minLevel: Record<string, number>, preEvolutionOf: Record<string, string> }} levels
 * @param {{ target?: number }} [options]
 * @returns {{ encounters: any[], added: string[] }}
 */
function enrichEncounters(encounters, pool, speciesByKey, levels, options = {}) {
  const target = options.target ?? MIN_ROUTE_SPECIES
  if (!Array.isArray(encounters) || encounters.length === 0 || encounters.length >= target)
    return { encounters, added: [] }
  const present = new Set(encounters.map((encounter) => encounter.speciesKey)),
    routeMin = Math.min(...encounters.map((encounter) => encounter.minLevel ?? 1)),
    routeMax = Math.max(...encounters.map((encounter) => encounter.maxLevel ?? routeMin))
  // Weight the route's dominant types so a water route gains water Pokemon and
  // a forest route gains bugs rather than a random slice of the dex. Only the
  // original (unflagged) finds count, so the theme is stable across re-runs.
  const typeWeights = {}
  for (const encounter of encounters) {
    if (encounter[VARIETY_FLAG]) continue
    for (const type of speciesByKey[encounter.speciesKey]?.types ?? [])
      typeWeights[type] = (typeWeights[type] ?? 0) + (encounter.weight ?? 1)
  }
  const dominantTypes = Object.entries(typeWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => type)
  const scored = []
  for (const [key, band] of pool) {
    if (present.has(key)) continue
    const entry = speciesByKey[key]
    if (!entry) continue
    // Only use species already found at a comparable level elsewhere, and never
    // below their evolution floor (a Lv. 5 route gains no Machoke).
    if (band.minLevel > routeMax + LEVEL_SLACK) continue
    if (stageForLevel(key, routeMin, levels) !== key) continue
    const types = entry.types ?? [],
      sharesTheme = types.some((type) => dominantTypes.includes(type))
    if (!sharesTheme) {
      // Off-theme additions must be ordinary low-tier finds that are also seen
      // around this level, so a strong Safari rare (or a fish on a forest
      // route) never leaks in.
      if (totalBaseStats(entry) > COMMON_BST) continue
      if (band.maxLevel < routeMin - LEVEL_SLACK) continue
      if (types.includes('Water')) continue
    }
    scored.push({
      key,
      id: entry.id ?? 0,
      score: types.filter((type) => dominantTypes.includes(type)).length,
    })
  }
  scored.sort((a, b) => b.score - a.score || a.id - b.id)
  const added = []
  for (const candidate of scored) {
    if (encounters.length + added.length >= target) break
    added.push({
      speciesKey: candidate.key,
      weight: ADDED_ENCOUNTER_WEIGHT,
      minLevel: routeMin,
      maxLevel: routeMax,
      [VARIETY_FLAG]: true,
    })
  }
  return {
    encounters: added.length ? [...encounters, ...added] : encounters,
    added: added.map((entry) => entry.speciesKey),
  }
}

/**
 * Species that must never be seeded onto an ordinary route: every starter line
 * (so starters stay a first-route find rather than a random route spawn), the
 * breed-only babies, and any species a route-exclusive catch gate
 * (`unlock.caughtOnRoute`) already asks for, so the gate's target stays
 * exclusive to its own route.
 * @param {Record<string, any[]>} evolutionData
 * @param {string[]} starterKeys
 * @param {Record<string, any>} mapData
 * @returns {Set<string>}
 */
function collectProtectedSpecies(evolutionData, starterKeys, mapData) {
  const protectedSpecies = new Set(BABY_SPECIES)
  const seen = new Set()
  const addLine = (key) => {
    if (seen.has(key)) return
    seen.add(key)
    protectedSpecies.add(key)
    for (const evolution of evolutionData[key] ?? []) addLine(evolution.into)
  }
  for (const key of starterKeys) addLine(key)
  for (const location of Object.values(mapData)) {
    const gate = location?.unlock?.caughtOnRoute
    if (gate) for (const key of gate.species ?? []) protectedSpecies.add(key)
  }
  return protectedSpecies
}

module.exports = {
  MIN_ROUTE_SPECIES,
  ADDED_ENCOUNTER_WEIGHT,
  LEVEL_SLACK,
  VARIETY_FLAG,
  BABY_SPECIES,
  buildWildPool,
  enrichEncounters,
  collectProtectedSpecies,
}
