#!/usr/bin/env node
/**
 * Promote the Galar / Paldea DLC zones to first-class regions (#39, option B).
 *
 * The DLC areas ship as `type: 'zone'` hubs inside their parent region (see
 * `ZONES` in tools/generate-regions.cjs). This data-only pass lifts each one
 * out into its own region so it gets a Town Map tab, its own entry/map and its
 * own legendary Raid Island — without re-running the (non-idempotent)
 * generator.
 *
 * DLC regions are marked `isDlc: true` + `parentRegion`, share their parent's
 * `generation`, and never cost an Unlock Token: their hub keeps its
 * `championDefeated` gate. They have no league, so their Raid Island is the
 * endgame. See `baseRegions` / `dlcParentRegion` in src/data/gameData.js.
 *
 * Idempotent: skips any DLC region already present in regions.json, so it is
 * safe to run after every regeneration (which recreates the zones).
 *
 * Usage: node tools/apply-dlc-regions.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 1) + '\n')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')

const DRY = process.argv.includes('--dry')
const clampLevel = (n) => Math.max(2, Math.min(100, n))
// Mirrors generate-regions.cjs: catchRate <= 3 is a box legendary (Lv. 75),
// everything else a minor one (Lv. 70).
const raidLevel = (species) => clampLevel((species.catchRate ?? 45) <= 3 ? 75 : 70)

/** Post-game expansions to lift out of their parent region's zone list. */
const DLC_REGIONS = [
  {
    id: 'isle-of-armor',
    name: 'Isle of Armor',
    generation: 8,
    parentRegion: 'galar',
    order: 8.1,
    hub: 'galar-isle-of-armor',
    parentConnect: 'galar-hulbury',
    raidPool: ['kubfu', 'urshifu-sss'],
  },
  {
    id: 'crown-tundra',
    name: 'Crown Tundra',
    generation: 8,
    parentRegion: 'galar',
    order: 8.2,
    hub: 'galar-crown-tundra',
    parentConnect: 'galar-wyndon',
    raidPool: [
      'regieleki',
      'regidrago',
      'glastrier',
      'spectrier',
      'calyrex',
      'enamorus',
      'g-articuno',
      'g-zapdos',
      'g-moltres',
    ],
  },
  {
    id: 'kitakami',
    name: 'Kitakami',
    generation: 9,
    parentRegion: 'paldea',
    order: 9.1,
    hub: 'paldea-kitakami',
    parentConnect: 'paldea-mossui-town',
    raidPool: ['okidogi', 'munkidori', 'fezandipiti', 'ogerpon'],
  },
  {
    id: 'terarium',
    name: 'Terarium',
    generation: 9,
    parentRegion: 'paldea',
    order: 9.2,
    hub: 'paldea-terarium',
    parentConnect: 'paldea-league',
    raidPool: ['terapagos', 'pecharunt'],
  },
]

const species = read('pokemon-species.json')
const regions = read('regions.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))

let promoted = 0,
  repaired = 0
for (const config of DLC_REGIONS) {
  // A promoted region is shown as a subregion on its parent's map, so it needs
  // a road back into the parent for travel (and for the Town Map to draw it).
  const alreadyPromoted = regions.some((region) => region.id === config.id)
  if (alreadyPromoted) {
    const hub = mapData[config.hub],
      anchor = config.parentConnect ? mapData[config.parentConnect] : null
    if (hub && anchor) {
      if (!hub.connections.includes(config.parentConnect)) {
        hub.connections.push(config.parentConnect)
        repaired++
      }
      if (!anchor.connections.includes(config.hub)) {
        anchor.connections.push(config.hub)
        repaired++
      }
    }
    continue
  }
  const hub = mapData[config.hub]
  if (!hub) {
    console.warn(`skip ${config.id}: hub ${config.hub} not found`)
    continue
  }
  const parent = regions.find((region) => region.id === config.parentRegion)
  if (!parent) {
    console.warn(`skip ${config.id}: parent ${config.parentRegion} not found`)
    continue
  }

  const subAreaIds = (hub.subAreas ?? []).map((subArea) => subArea.id),
    lastSubArea = subAreaIds[subAreaIds.length - 1] ?? hub.routeKey,
    entryLevel = subAreaIds
      .map((id) => encounterData[id]?.encounters?.[0]?.minLevel)
      .filter((level) => typeof level === 'number')
      .reduce((max, level) => Math.max(max, level), 65),
    maxOrder = Math.max(
      ...[config.hub, ...subAreaIds].map((id) => mapData[id]?.unlockOrder ?? 0)
    ),
    raidId = `${config.id}-raid`

  // Re-home the hub and its sub-areas under the new region id, and strip the
  // old cross-region road back into the parent map.
  hub.region = config.id
  hub.connections = [...subAreaIds, raidId]
  for (const id of subAreaIds) {
    if (!mapData[id]) continue
    mapData[id].region = config.id
    mapData[id].connections = [config.hub]
  }
  // Drop any parent-region road that still pointed at the hub/sub-areas, then
  // link the hub back to the parent so the subregion sits on the parent map.
  for (const location of Object.values(mapData)) {
    if ((location.region ?? 'kanto') === config.id) continue
    location.connections = location.connections.filter(
      (id) => id !== config.hub && !subAreaIds.includes(id)
    )
  }
  if (config.parentConnect && mapData[config.parentConnect]) {
    hub.connections.push(config.parentConnect)
    if (!mapData[config.parentConnect].connections.includes(config.hub))
      mapData[config.parentConnect].connections.push(config.hub)
  }

  // Each DLC region gets a legendary Raid Island hanging off its last area.
  const pool = config.raidPool
    .filter((key) => species[key])
    .map((key) => ({ speciesKey: key, level: raidLevel(species[key]) }))
  mapData[raidId] = {
    id: raidId,
    name: `${config.name} Raid Island`,
    type: 'raid',
    region: config.id,
    description: `A mysterious island where ${config.name}'s rarest Pokemon dwell.`,
    routeKey: raidId,
    background: '/backgrounds/cave.png',
    connections: [config.hub],
    unlock: {
      requires: [config.hub],
      battlesAtLocation: [{ locationId: lastSubArea, count: 10 }],
    },
    unlockOrder: maxOrder + 1,
    position: {
      x: clampLevel((hub.position?.x ?? 50) + 8),
      y: clampLevel((hub.position?.y ?? 50) - 10),
    },
    biome: 'cave',
  }
  encounterData[raidId] = {
    name: mapData[raidId].name,
    encounters: pool.map((entry) => ({
      speciesKey: entry.speciesKey,
      weight: 1,
      minLevel: entry.level,
      maxLevel: entry.level,
    })),
  }

  regions.push({
    id: config.id,
    name: config.name,
    generation: config.generation,
    order: config.order,
    entry: config.hub,
    startLevel: entryLevel,
    isDlc: true,
    parentRegion: config.parentRegion,
    raidPool: pool,
  })

  // Those legendaries now belong to the expansion, not the base region.
  const moved = new Set(config.raidPool)
  parent.raidPool = (parent.raidPool ?? []).filter((entry) => !moved.has(entry.speciesKey))
  promoted++
}

if (promoted === 0 && repaired === 0) {
  console.log('DLC regions already promoted; nothing to do.')
  process.exit(0)
}

if (DRY) {
  console.log(`Would promote ${promoted} DLC region(s) and repair ${repaired} link(s).`)
  process.exit(0)
}

write('regions.json', regions)
writeRegionDir(path.join(DATA, 'map-data'), mapData)
writeRegionDir(
  path.join(DATA, 'encounter-data'),
  encounterData,
  (key) => mapData[key]?.region ?? 'kanto'
)
console.log(`Promoted ${promoted} DLC region(s), repaired ${repaired} link(s).`)
