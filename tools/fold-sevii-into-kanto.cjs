#!/usr/bin/env node
/**
 * One-off migration: fold Kanto's Sevii Islands into a single Kanto zone.
 *
 * The Sevii Islands were a hand-authored `isDlc` subregion with its own map
 * file, entry and Town Map subregion (`tools/add-sevii-islands.mjs`). This
 * folds them into Kanto the same way the Galar/Paldea DLC sit on their parent
 * map: a `type: 'zone'` hub at the port (Vermilion City) whose `subAreas` are
 * the twenty areas, `championDefeated`-gated on Kanto.
 *
 * The sub-areas keep their hand-authored positions and the roads *within* each
 * island, so the focused zone view still reads as the archipelago's island
 * shapes; the long roads that chained one island to the next are dropped (the
 * zone picker travels between islands directly), and the hub links only to One
 * Island. The areas keep unlocking in `unlockOrder`, each behind the hub and
 * the one before it (the usual zone chain).
 *
 * Idempotent: does nothing once the hub exists or the region is gone.
 *
 * Usage: node tools/fold-sevii-into-kanto.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')
const { readRegionDir } = require('./lib/region-data.cjs')

const DATA = path.join(__dirname, '../public/data')
const DRY = process.argv.includes('--dry')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))

const HUB_ID = 'sevii-islands'
const REGION_ID = 'sevii-islands'

/**
 * The long roads that joined one island to the next. Dropping them leaves each
 * island as its own shape in the focused zone map (the picker travels between
 * islands directly, so no road is needed).
 */
const INTER_ISLAND_LINKS = [
  ['sevii-islands-one-island', 'sevii-islands-two-island'],
  ['sevii-islands-two-island', 'sevii-islands-three-island'],
  ['sevii-islands-three-island', 'sevii-islands-four-island'],
  ['sevii-islands-four-island', 'sevii-islands-five-island'],
  ['sevii-islands-five-island', 'sevii-islands-six-island'],
  ['sevii-islands-six-island', 'sevii-islands-seven-island'],
]

const regions = read('regions.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))

const regionIndex = regions.findIndex((region) => region.id === REGION_ID),
  areas = Object.values(mapData).filter(
    (location) => (location.region ?? 'kanto') === REGION_ID && location.type !== 'raid'
  )
if (regionIndex === -1 || mapData[HUB_ID] || areas.length === 0) {
  console.log('Sevii Islands already folded into Kanto; nothing to do.')
  process.exit(0)
}
if (DRY) {
  console.log(`Would fold ${areas.length} Sevii area(s) into a Kanto zone.`)
  process.exit(0)
}

// The sub-area list must follow unlockOrder (the zone-chain invariant).
const ordered = [...areas].sort((left, right) => left.unlockOrder - right.unlockOrder)

mapData[HUB_ID] = {
  id: HUB_ID,
  name: 'Sevii Islands',
  type: 'zone',
  region: 'kanto',
  description: 'The Sevii Islands, a post-game archipelago reached from Vermilion City.',
  routeKey: 'sevii-islands-kindle-road',
  background: '/backgrounds/beach.png',
  biome: 'coast',
  connections: ['vermilionCity', 'sevii-islands-one-island'],
  unlock: { championDefeated: 'kanto' },
  unlockOrder: 899999,
  position: { x: 84, y: 86 },
  subAreas: ordered.map((location) => ({ id: location.id, name: location.name })),
}

ordered.forEach((location, index) => {
  location.region = 'kanto'
  location.hidden = true
  location.zone = HUB_ID
  const unlock = {
    ...location.unlock,
    requires: [HUB_ID, ...(index > 0 ? [ordered[index - 1].id] : [])],
  }
  // The hub carries the Champion gate; the first area just waits on the hub.
  if (index === 0) delete unlock.championDefeated
  location.unlock = unlock
})

for (const [left, right] of INTER_ISLAND_LINKS) {
  if (mapData[left]) mapData[left].connections = mapData[left].connections.filter((id) => id !== right)
  if (mapData[right]) mapData[right].connections = mapData[right].connections.filter((id) => id !== left)
}

// The port now enters the hub, and the hub the first island.
const oneIsland = mapData['sevii-islands-one-island']
oneIsland.connections = oneIsland.connections.filter(
  (id) => id !== 'vermilionCity' && id !== 'sevii-islands-two-island'
)
if (!oneIsland.connections.includes(HUB_ID)) oneIsland.connections.unshift(HUB_ID)
const vermilion = mapData['vermilionCity']
if (vermilion) {
  vermilion.connections = vermilion.connections.filter((id) => id !== 'sevii-islands-one-island')
  if (!vermilion.connections.includes(HUB_ID)) vermilion.connections.push(HUB_ID)
}

regions.splice(regionIndex, 1)

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
console.log(`Folded ${areas.length} Sevii area(s) into a Kanto zone.`)
