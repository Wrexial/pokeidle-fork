#!/usr/bin/env node
/**
 * Add the ordinary wild areas (caves, forests, ...) from
 * tools/lib/ordinary-areas.cjs to the committed data (#28b).
 *
 * The map scraper only keeps towns and numbered routes, so landmarks like Ilex
 * Forest or Mt. Coronet are missing. This data-only pass inserts each one as a
 * `type: 'route'` wild area wired between its connect locations, with its own
 * curated encounter table, a neighbour-averaged level band and a derived biome
 * — the same shape `POST_AREAS` builds during a regeneration (the generator
 * merges the same table into POST_AREAS).
 *
 * Idempotent: skips any area already on the map. After adding areas, re-run
 * `node tools/generate-encounter-index.cjs`.
 *
 * Usage: node tools/apply-ordinary-areas.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 1) + '\n')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')
const { deriveBiome } = require('./lib/biomes.cjs')
const { ORDINARY_AREAS } = require('./lib/ordinary-areas.cjs')

const DRY = process.argv.includes('--dry')
const clampLevel = (n) => Math.max(2, Math.min(100, n))
const encounterWeight = (index) => (index < 3 ? 20 : index < 8 ? 12 : 6)
const backgroundForBiome = (biome) =>
  ({
    cave: '/backgrounds/cave.png',
    mountain: '/backgrounds/mountain.png',
    coast: '/backgrounds/beach.png',
  })[biome] ?? '/backgrounds/grassland.png'

const species = read('pokemon-species.json')
const regions = read('regions.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))

/**
 * A battle-count gate has to name somewhere wilds actually spawn. A zone hub
 * never spawns wilds (the idle loop skips it), so a connect to a zone resolves
 * to that hub's first sub-area instead of the hub itself.
 * @param {string} node
 * @returns {string}
 */
function resolveBattlesTarget(node) {
  const location = mapData[node]
  return location?.type === 'zone' && location.routeKey ? location.routeKey : node
}

/**
 * Repair a gate that points at a zone hub (created before this rule existed).
 * @param {MapLocation} location
 * @returns {boolean} whether anything changed
 */
function repairGate(location) {
  let changed = false
  for (const rule of location.unlock?.battlesAtLocation ?? []) {
    const target = mapData[rule.locationId]
    if (target?.type === 'zone' && target.routeKey && rule.locationId !== target.routeKey) {
      rule.locationId = target.routeKey
      changed = true
    }
  }
  return changed
}

let added = 0,
  repaired = 0
for (const [regionId, areas] of Object.entries(ORDINARY_AREAS)) {
  const region = regions.find((candidate) => candidate.id === regionId)
  for (const area of areas) {
    const id = area.node.startsWith(`${regionId}-`) ? area.node : `${regionId}-${area.node}`
    if (mapData[id]) {
      if (repairGate(mapData[id])) repaired++
      continue
    }
    const connects = area.connects.filter((node) => mapData[node])
    if (connects.length === 0) {
      console.warn(`skip ${id}: none of its connects exist`)
      continue
    }
    const levels = connects
        .map((node) => mapData[node]?.routeKey && encounterData[mapData[node].routeKey]?.encounters?.[0]?.minLevel)
        .filter((level) => typeof level === 'number'),
      level = clampLevel(
        levels.length
          ? Math.round(levels.reduce((sum, value) => sum + value, 0) / levels.length)
          : (region?.startLevel ?? 5)
      ),
      encounters = area.species
        .filter((key) => species[key])
        .map((key, index) => ({
          speciesKey: key,
          weight: encounterWeight(index),
          minLevel: level,
          maxLevel: clampLevel(level + 2),
        })),
      anchor = Math.min(...connects.map((node) => mapData[node]?.unlockOrder ?? 0))
    encounterData[id] = { name: area.name, encounters }
    mapData[id] = {
      id,
      name: area.name,
      type: 'route',
      region: regionId,
      description: area.description ?? `A wild area in the ${region?.name ?? regionId} region.`,
      routeKey: id,
      connections: [...connects],
      unlock: { battlesAtLocation: [{ locationId: resolveBattlesTarget(connects[0]), count: 5 }] },
      unlockOrder: anchor + 0.25,
      position: area.position,
    }
    mapData[id].biome = deriveBiome(mapData[id], encounters, species)
    mapData[id].background = backgroundForBiome(mapData[id].biome)
    for (const node of connects)
      if (!mapData[node].connections.includes(id)) mapData[node].connections.push(id)
    added++
  }
}

if (added === 0 && repaired === 0) {
  console.log('Ordinary areas already present; nothing to do.')
  process.exit(0)
}
if (DRY) {
  console.log(`Would add ${added} ordinary area(s) and repair ${repaired} gate(s).`)
  process.exit(0)
}

writeRegionDir(path.join(DATA, 'map-data'), mapData)
writeRegionDir(
  path.join(DATA, 'encounter-data'),
  encounterData,
  (key) => mapData[key]?.region ?? 'kanto'
)
console.log(`Added ${added} ordinary area(s), repaired ${repaired} gate(s).`)
