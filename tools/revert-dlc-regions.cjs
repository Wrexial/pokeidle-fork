#!/usr/bin/env node
/**
 * One-off migration: fold the promoted Galar / Paldea DLC regions back into
 * their parent regions as ordinary zones (like Galar's Wild Area), and remove
 * every DLC Raid Island so each base region keeps its single raid.
 *
 * `tools/apply-dlc-regions.cjs` promoted the DLC zones to first-class `isDlc`
 * regions with their own entry, tab and legendary Raid Island. That is being
 * reverted: the DLC hubs stay `type: 'zone'` nodes on the parent map (still
 * `championDefeated`-gated, sub-areas chained behind them), but their locations
 * belong to the parent region and their legendaries join the parent's raid
 * pool. Kanto's hand-authored Sevii Islands stay a subregion; only its raid is
 * removed, with Moltres moving back into Kanto's pool.
 *
 * Idempotent: if no promoted DLC region is present it does nothing.
 *
 * Usage: node tools/revert-dlc-regions.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')
const { readRegionDir } = require('./lib/region-data.cjs')

const DATA = path.join(__dirname, '../public/data')
const DRY = process.argv.includes('--dry')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))

/** The promoted regions to fold back, mirroring tools/apply-dlc-regions.cjs. */
const DLC_REGIONS = [
  { id: 'isle-of-armor', hub: 'galar-isle-of-armor', parentRegion: 'galar', parentConnect: 'galar-hulbury' },
  { id: 'crown-tundra', hub: 'galar-crown-tundra', parentRegion: 'galar', parentConnect: 'galar-wyndon' },
  { id: 'kitakami', hub: 'paldea-kitakami', parentRegion: 'paldea', parentConnect: 'paldea-mossui-town' },
  { id: 'terarium', hub: 'paldea-terarium', parentRegion: 'paldea', parentConnect: 'paldea-league' },
]

const regions = read('regions.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))
const removedIds = new Set()
let changed = 0

/** @param {string} regionId @param {{speciesKey: string, level: number}[]} moved */
function mergeRaidPool(regionId, moved) {
  const region = regions.find((candidate) => candidate.id === regionId)
  if (!region || moved.length === 0) return
  const existing = new Set((region.raidPool ?? []).map((entry) => entry.speciesKey))
  region.raidPool = [...(region.raidPool ?? []), ...moved.filter((entry) => !existing.has(entry.speciesKey))]
}

for (const config of DLC_REGIONS) {
  const index = regions.findIndex((region) => region.id === config.id)
  if (index === -1) continue
  const hub = mapData[config.hub]
  if (!hub) {
    console.warn(`skip ${config.id}: hub ${config.hub} not found`)
    continue
  }
  const subAreaIds = (hub.subAreas ?? []).map((subArea) => subArea.id),
    raidId = `${config.id}-raid`,
    movedRaids = regions[index].raidPool ?? []
  // Re-home the hub and its sub-areas under the parent region.
  hub.region = config.parentRegion
  for (const id of subAreaIds) if (mapData[id]) mapData[id].region = config.parentRegion
  // Rebuild the hub's roads: sub-areas plus the single parent entry, no raid.
  hub.connections = [
    ...new Set([...subAreaIds, config.parentConnect].filter((id) => mapData[id])),
  ]
  for (const id of subAreaIds) if (mapData[id]) mapData[id].connections = [config.hub]
  // Drop the DLC Raid Island and give its legendaries to the parent's raid.
  delete mapData[raidId]
  delete encounterData[raidId]
  removedIds.add(raidId)
  mergeRaidPool(config.parentRegion, movedRaids)
  regions.splice(index, 1)
  changed++
}

// The Sevii Islands stay a Kanto subregion, but their raid goes with the DLC
// raids; Moltres returns to Kanto's pool.
if (mapData['sevii-islands-raid']) {
  const sevii = regions.find((region) => region.id === 'sevii-islands'),
    movedRaids = sevii?.raidPool ?? []
  delete mapData['sevii-islands-raid']
  delete encounterData['sevii-islands-raid']
  removedIds.add('sevii-islands-raid')
  mergeRaidPool('kanto', movedRaids)
  if (sevii) delete sevii.raidPool
  changed++
}

/**
 * Keep each base region's single Raid Island encounter bucket in step with its
 * `raidPool` (adding newly merged DLC legendaries, dropping removed ones)
 * without needlessly reordering what is already listed.
 */
function syncRaidBuckets() {
  for (const region of regions) {
    const pool = region.raidPool ?? [],
      raidLocation = Object.values(mapData).find(
        (location) => location.type === 'raid' && (location.region ?? 'kanto') === region.id
      )
    if (!raidLocation) continue
    const routeKey = raidLocation.routeKey ?? raidLocation.id,
      bucket = encounterData[routeKey] ?? { name: raidLocation.name, encounters: [] },
      keys = new Set(pool.map((entry) => entry.speciesKey)),
      existing = bucket.encounters ?? [],
      kept = existing.filter((entry) => keys.has(entry.speciesKey)),
      present = new Set(kept.map((entry) => entry.speciesKey)),
      added = pool
        .filter((entry) => !present.has(entry.speciesKey))
        .map((entry) => ({
          speciesKey: entry.speciesKey,
          weight: 1,
          minLevel: entry.level,
          maxLevel: entry.level,
        })),
      next = [...kept, ...added]
    if (JSON.stringify(next) !== JSON.stringify(existing)) {
      encounterData[routeKey] = { ...bucket, encounters: next }
      changed++
    }
  }
}
syncRaidBuckets()

if (changed === 0) {
  console.log('DLC regions already reverted; nothing to do.')
  process.exit(0)
}
if (DRY) {
  console.log(`Would revert ${changed} DLC region(s)/raid(s).`)
  process.exit(0)
}

// Nothing may still point at a removed raid.
for (const location of Object.values(mapData))
  location.connections = location.connections.filter((id) => !removedIds.has(id))

/** Regroup a merged object into its per-region files, deleting stale ones. */
const writeDir = (dir, data, regionOf) => {
  const dirPath = path.join(DATA, dir)
  for (const file of fs.readdirSync(dirPath))
    if (file.endsWith('.json')) fs.unlinkSync(path.join(dirPath, file))
  /** @type {Record<string, Record<string, any>>} */
  const groups = {}
  for (const [key, value] of Object.entries(data)) {
    const region = regionOf ? regionOf(key, value) : value.region ?? 'kanto'
    ;(groups[region] ??= {})[key] = value
  }
  for (const [region, group] of Object.entries(groups))
    fs.writeFileSync(path.join(dirPath, `${region}.json`), JSON.stringify(group, null, 1) + '\n')
}

writeDir('map-data', mapData)
writeDir('encounter-data', encounterData, (key) => mapData[key]?.region ?? 'kanto')
fs.writeFileSync(path.join(DATA, 'regions.json'), JSON.stringify(regions, null, 1) + '\n')
console.log(`Reverted ${changed} DLC region(s)/raid(s).`)
