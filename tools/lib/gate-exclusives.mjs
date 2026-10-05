// Route-exclusive species: the species a `caughtOnRoute` gate is built from.
//
// "Exclusive" means the species turns up on no other wild route in any region
// (Raid Islands don't count); legendaries and near-uncatchable finds are
// skipped. A "common" exclusive is one that isn't a starter line and doesn't
// have a weight below `MIN_WEIGHT` (a route whose only exclusives are that rare
// keeps its `caughtCount` instead). Mirrors the pass in
// `tools/generate-regions.cjs` so the committed data and a fresh generation
// agree.
const MIN_WEIGHT = 3

/**
 * Expand a set of base species through their evolutions (a whole starter line).
 * @param {string[]} baseKeys
 * @param {Record<string, any[]>} evolutionData
 */
function expandLines(baseKeys, evolutionData) {
  const lines = new Set()
  const addLine = (/** @type {string} */ key) => {
    if (lines.has(key)) return
    lines.add(key)
    for (const evolution of evolutionData[key] ?? []) addLine(evolution.into)
  }
  for (const key of baseKeys) addLine(key)
  return lines
}

/**
 * @param {object} input
 * @param {Record<string, any>} input.mapData merged map data
 * @param {Record<string, any>} input.encounterData merged encounter buckets
 * @param {Record<string, any>} input.species merged species data
 * @param {Record<string, any[]>} input.evolutionData
 * @param {string[]} input.starterBaseKeys the regional starter base species
 */
export function buildRouteExclusives({ mapData, encounterData, species, evolutionData, starterBaseKeys }) {
  const starterLines = expandLines(starterBaseKeys, evolutionData)
  /** @type {Record<string, Set<string>>} */
  const routesBySpecies = {}
  for (const [bucketKey, bucket] of Object.entries(encounterData)) {
    if (mapData[bucketKey]?.type === 'raid') continue
    for (const encounter of bucket.encounters ?? []) {
      ;(routesBySpecies[encounter.speciesKey] ??= new Set()).add(bucketKey)
    }
  }
  /** @type {Record<string, { key: string, weight: number, common: boolean }[]>} */
  const exclusiveByRoute = {}
  for (const [speciesKey, routes] of Object.entries(routesBySpecies)) {
    if (routes.size !== 1) continue
    const entry = species[speciesKey]
    if (!entry || entry.catchRate <= 3 || entry.legendary) continue
    const [routeKey] = routes
    const wild = encounterData[routeKey]?.encounters?.find((e) => e.speciesKey === speciesKey)
    if (!wild) continue
    ;(exclusiveByRoute[routeKey] ??= []).push({
      key: speciesKey,
      weight: wild.weight ?? 0,
      common: (wild.weight ?? 0) >= MIN_WEIGHT && !starterLines.has(speciesKey),
    })
  }
  for (const list of Object.values(exclusiveByRoute))
    list.sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))
  return exclusiveByRoute
}

export { MIN_WEIGHT }
