#!/usr/bin/env node
/**
 * Add extra sub-areas to existing `type: 'zone'` hubs (#36).
 *
 * The zone hub routes are hidden sub-areas with their own encounter bucket.
 * This data-only pass inserts the extras from tools/lib/zone-areas.cjs into the
 * named hub (appended after its current sub-areas and chained behind them),
 * then tops each new table up with the region's wider pool so it matches the
 * existing sub-areas. The generator merges the same table into its `ZONES`
 * config, so a regeneration agrees.
 *
 * Idempotent: skips any sub-area already on the map. After adding, re-run
 * `node tools/generate-encounter-index.cjs`.
 *
 * Usage: node tools/apply-zone-areas.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 1) + '\n')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')
const { deriveBiome } = require('./lib/biomes.cjs')
const { ZONE_AREAS } = require('./lib/zone-areas.cjs')
const { spreadSubAreaPositions } = require('./lib/zone-layout.cjs')
const { buildEvolutionLevels } = require('./lib/evolution-levels.cjs')
const { buildWildPool, collectProtectedSpecies, enrichEncounters } = require('./lib/route-variety.cjs')

const DRY = process.argv.includes('--dry')
const clampLevel = (n) => Math.max(2, Math.min(100, n))
const encounterWeight = (index) => (index < 3 ? 20 : index < 8 ? 12 : 6)
const backgroundForBiome = (biome) =>
  ({
    cave: '/backgrounds/cave.webp',
    mountain: '/backgrounds/mountain.webp',
    coast: '/backgrounds/beach.webp',
  })[biome] ?? '/backgrounds/grassland.webp'

const GEN_STARTERS = {
  1: ['bulbasaur', 'charmander', 'squirtle'],
  2: ['chikorita', 'cyndaquil', 'totodile'],
  3: ['treecko', 'torchic', 'mudkip'],
  4: ['turtwig', 'chimchar', 'piplup'],
  5: ['snivy', 'tepig', 'oshawott'],
  6: ['chespin', 'fennekin', 'froakie'],
  7: ['rowlet', 'litten', 'popplio'],
  8: ['grookey', 'scorbunny', 'sobble'],
  9: ['sprigatito', 'fuecoco', 'quaxly'],
}

const species = read('pokemon-species.json')
const evolutionData = read('evolution-data.json')
const evolutionLevels = buildEvolutionLevels(evolutionData, species)
const regions = read('regions.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))

/** @type {Map<string, string[]>} region id -> new sub-area ids to enrich */
const newByRegion = new Map()
let added = 0
for (const [hubId, extras] of Object.entries(ZONE_AREAS)) {
  const hub = mapData[hubId]
  if (!hub) {
    console.warn(`skip ${hubId}: hub not found`)
    continue
  }
  const regionId = hub.region ?? 'kanto',
    baseEncounters = hub.routeKey ? encounterData[hub.routeKey]?.encounters : null,
    level = clampLevel(baseEncounters?.[0]?.minLevel ?? 5),
    maxLevel = clampLevel(level + 2)
  let previous = hub.subAreas?.[hub.subAreas.length - 1]?.id ?? null,
    maxOrder = Math.max(
      hub.unlockOrder ?? 0,
      ...(hub.subAreas ?? []).map((subArea) => mapData[subArea.id]?.unlockOrder ?? 0)
    )
  for (const extra of extras) {
    const id = extra.node.startsWith(`${regionId}-`) ? extra.node : `${regionId}-${extra.node}`
    if (mapData[id]) {
      previous = id
      continue
    }
    const encounters = extra.species
        .filter((key) => species[key])
        .map((key, index) => ({
          speciesKey: key,
          weight: encounterWeight(index),
          minLevel: level,
          maxLevel,
        })),
      order = +(maxOrder + (added + 1) * 0.001).toFixed(4)
    encounterData[id] = { name: extra.name, encounters }
    mapData[id] = {
      id,
      name: extra.name,
      type: 'route',
      region: regionId,
      description: `A sub-area of the ${hub.name}.`,
      routeKey: id,
      connections: [hubId],
      hidden: true,
      zone: hubId,
      unlock: { requires: [hubId, ...(previous ? [previous] : [])] },
      unlockOrder: order,
      position: extra.position,
    }
    mapData[id].biome = deriveBiome(mapData[id], encounters, species)
    mapData[id].background = backgroundForBiome(mapData[id].biome)
    ;(hub.subAreas ??= []).push({ id, name: extra.name })
    if (!hub.connections.includes(id)) hub.connections.push(id)
    if (!newByRegion.has(regionId)) newByRegion.set(regionId, [])
    newByRegion.get(regionId).push(id)
    previous = id
    added++
  }
}

if (added === 0) {
  console.log('Zone sub-areas already present; nothing to do.')
  process.exit(0)
}
if (DRY) {
  console.log(`Would add ${added} zone sub-area(s).`)
  process.exit(0)
}

// Space every hub's sub-areas into a tidy ring around it (see zone-layout.cjs),
// so a newly added batch doesn't pile up with its neighbours.
let spaced = 0
for (const hub of Object.values(mapData)) {
  if (hub.type !== 'zone' || !Array.isArray(hub.subAreas)) continue
  const ids = hub.subAreas.map((subArea) => subArea.id),
    positions = spreadSubAreaPositions(hub.position, ids.length)
  ids.forEach((id, index) => {
    const location = mapData[id]
    if (!location || !positions[index]) return
    if (location.position.x !== positions[index].x || location.position.y !== positions[index].y) {
      location.position = positions[index]
      spaced++
    }
  })
}

// Top the new tables up with the region's wider pool, mirroring the
// route-variety pass generate-regions.cjs runs after every route exists.
const protectedSpecies = collectProtectedSpecies(
  evolutionData,
  Object.values(GEN_STARTERS).flat(),
  mapData
)
for (const [regionId, newIds] of newByRegion) {
  const region = regions.find((candidate) => candidate.id === regionId),
    regionBuckets = {}
  for (const [key, bucket] of Object.entries(encounterData))
    if ((mapData[key]?.region ?? 'kanto') === regionId) regionBuckets[key] = bucket
  const exclude = new Set(protectedSpecies)
  for (const entry of region?.raidPool ?? []) exclude.add(entry.speciesKey)
  const pool = buildWildPool(regionBuckets, mapData, exclude)
  for (const id of newIds) {
    const bucket = encounterData[id]
    if (!bucket) continue
    const result = enrichEncounters(bucket.encounters, pool, species, evolutionLevels)
    if (result.added.length) bucket.encounters = result.encounters
  }
}

writeRegionDir(path.join(DATA, 'map-data'), mapData)
writeRegionDir(
  path.join(DATA, 'encounter-data'),
  encounterData,
  (key) => mapData[key]?.region ?? 'kanto'
)
console.log(`Added ${added} zone sub-area(s), spaced ${spaced}.`)
