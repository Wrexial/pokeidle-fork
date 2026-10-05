#!/usr/bin/env node
/**
 * Add Kanto's Sevii Islands as a post-game subregion (#28a).
 *
 * The Sevii Islands are a FireRed/LeafGreen post-game area with no scraper
 * source, so they are hand-authored here as a first-class `isDlc` region
 * (`parentRegion: kanto`, generation 1) that opens once the Kanto Champion is
 * beaten and shows on Kanto's Town Map, exactly like the Galar/Paldea DLC.
 *
 * Idempotent: skips if `sevii-islands` is already in regions.json. Run it once,
 * then `node tools/generate-encounter-index.cjs`.
 *
 * Usage: node tools/add-sevii-islands.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { readRegionDir } from './lib/region-data.cjs'

const DATA = path.join(import.meta.dirname, '../public/data')
const DRY = process.argv.includes('--dry')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))
const write = (file, value) =>
  fs.writeFileSync(path.join(DATA, file), JSON.stringify(value, null, 1) + '\n')

const REGION_ID = 'sevii-islands'
const ENTRY = `${REGION_ID}-one-island`

/** Weight a route's first few species higher than its tail. */
const weight = (index) => (index < 3 ? 20 : index < 8 ? 12 : 6)
const idOf = (/** @type {string} */ node) => `${REGION_ID}-${node}`
const BACKGROUND_BY_BIOME = {
  cave: '/backgrounds/cave.png',
  mountain: '/backgrounds/mountain.png',
  coast: '/backgrounds/beach.png',
}

/**
 * The islands, in travel order. `connects` are neighbour suffixes (a Kanto id
 * stays as-is); towns carry no wild table.
 * @type {any[]}
 */
const AREAS = [
  { node: 'one-island', name: 'One Island', type: 'town', x: 84, y: 92, biome: 'coast', connects: ['vermilionCity', 'kindle-road', 'two-island'], unlock: { championDefeated: 'kanto' } },
  { node: 'kindle-road', name: 'Kindle Road', type: 'route', x: 90, y: 90, biome: 'coast', connects: ['one-island', 'mt-ember'], species: ['ponyta', 'rapidash', 'growlithe', 'machop', 'mankey', 'spearow'], minLevel: 63, maxLevel: 66, unlock: { requires: [idOf('one-island')] } },
  { node: 'mt-ember', name: 'Mt. Ember', type: 'route', x: 95, y: 93, biome: 'volcanic', connects: ['kindle-road'], species: ['ponyta', 'rapidash', 'magmar', 'slugma', 'machop', 'geodude', 'onix'], minLevel: 66, maxLevel: 69, unlock: { requires: [idOf('kindle-road')], battlesAtLocation: [{ locationId: idOf('kindle-road'), count: 3 }] } },
  { node: 'two-island', name: 'Two Island', type: 'town', x: 78, y: 95, biome: 'coast', connects: ['one-island', 'three-island'], unlock: { requires: [idOf('one-island')] } },
  { node: 'three-island', name: 'Three Island', type: 'town', x: 72, y: 94, biome: 'coast', connects: ['two-island', 'bond-bridge'], unlock: { requires: [idOf('two-island')] } },
  { node: 'bond-bridge', name: 'Bond Bridge', type: 'route', x: 67, y: 92, biome: 'coast', connects: ['three-island', 'berry-forest'], species: ['pidgey', 'pidgeotto', 'spearow', 'fearow', 'venonat', 'oddish'], minLevel: 63, maxLevel: 66, unlock: { requires: [idOf('three-island')] } },
  { node: 'berry-forest', name: 'Berry Forest', type: 'route', x: 62, y: 95, biome: 'forest', connects: ['bond-bridge'], species: ['caterpie', 'metapod', 'butterfree', 'weedle', 'kakuna', 'beedrill', 'oddish', 'gloom', 'venonat', 'exeggcute'], minLevel: 66, maxLevel: 69, unlock: { requires: [idOf('bond-bridge')], battlesAtLocation: [{ locationId: idOf('bond-bridge'), count: 3 }] } },
  { node: 'four-island', name: 'Four Island', type: 'town', x: 57, y: 93, biome: 'coast', connects: ['three-island', 'icefall-cave'], unlock: { requires: [idOf('three-island')] } },
  { node: 'icefall-cave', name: 'Icefall Cave', type: 'route', x: 52, y: 96, biome: 'tundra', connects: ['four-island'], species: ['zubat', 'golbat', 'seel', 'psyduck', 'slowpoke', 'swinub', 'sneasel', 'lapras'], minLevel: 68, maxLevel: 71, unlock: { requires: [idOf('four-island')], partyLevel: 60 } },
  { node: 'five-island', name: 'Five Island', type: 'town', x: 47, y: 94, biome: 'coast', connects: ['four-island', 'five-isle-meadow'], unlock: { requires: [idOf('four-island')] } },
  { node: 'five-isle-meadow', name: 'Five Isle Meadow', type: 'route', x: 42, y: 96, biome: 'grassland', connects: ['five-island', 'memorial-pillar', 'lost-cave'], species: ['pidgey', 'pidgeotto', 'sentret', 'furret', 'meowth', 'hoppip', 'sunkern'], minLevel: 65, maxLevel: 68, unlock: { requires: [idOf('five-island')] } },
  { node: 'memorial-pillar', name: 'Memorial Pillar', type: 'route', x: 37, y: 98, biome: 'ruins', connects: ['five-isle-meadow'], species: ['hoppip', 'skiploom', 'sunkern', 'sunflora', 'pidgeotto', 'sentret'], minLevel: 67, maxLevel: 70, unlock: { requires: [idOf('five-isle-meadow')], battlesAtLocation: [{ locationId: idOf('five-isle-meadow'), count: 5 }] } },
  { node: 'lost-cave', name: 'Lost Cave', type: 'route', x: 48, y: 98, biome: 'cave', connects: ['five-isle-meadow'], species: ['zubat', 'golbat', 'gastly', 'haunter', 'cubone', 'marowak'], minLevel: 65, maxLevel: 69, unlock: { requires: [idOf('five-isle-meadow')] } },
  { node: 'six-island', name: 'Six Island', type: 'town', x: 32, y: 94, biome: 'coast', connects: ['five-island', 'pattern-bush', 'ruin-valley'], unlock: { requires: [idOf('five-island')] } },
  { node: 'pattern-bush', name: 'Pattern Bush', type: 'route', x: 32, y: 97, biome: 'forest', connects: ['six-island'], species: ['caterpie', 'metapod', 'weedle', 'kakuna', 'heracross', 'ledyba', 'spinarak', 'beedrill'], minLevel: 66, maxLevel: 69, unlock: { requires: [idOf('six-island')] } },
  { node: 'ruin-valley', name: 'Ruin Valley', type: 'route', x: 26, y: 96, biome: 'ruins', connects: ['six-island', 'dotted-hole'], species: ['natu', 'xatu', 'phanpy', 'donphan', 'machop', 'geodude', 'cubone'], minLevel: 68, maxLevel: 71, unlock: { requires: [idOf('six-island')] } },
  { node: 'dotted-hole', name: 'Dotted Hole', type: 'route', x: 21, y: 98, biome: 'ruins', connects: ['ruin-valley'], species: ['unown', 'natu'], minLevel: 70, maxLevel: 72, unlock: { requires: [idOf('ruin-valley')], battlesAtLocation: [{ locationId: idOf('ruin-valley'), count: 4 }] } },
  { node: 'seven-island', name: 'Seven Island', type: 'town', x: 16, y: 93, biome: 'coast', connects: ['six-island', 'sevault-canyon'], unlock: { requires: [idOf('six-island')] } },
  { node: 'sevault-canyon', name: 'Sevault Canyon', type: 'route', x: 11, y: 96, biome: 'mountain', connects: ['seven-island', 'tanoby-ruins'], species: ['phanpy', 'donphan', 'skarmory', 'gligar', 'rhyhorn', 'cubone', 'geodude', 'onix'], minLevel: 70, maxLevel: 73, unlock: { requires: [idOf('seven-island')] } },
  { node: 'tanoby-ruins', name: 'Tanoby Ruins', type: 'route', x: 6, y: 98, biome: 'ruins', connects: ['sevault-canyon'], species: ['unown', 'natu'], minLevel: 72, maxLevel: 75, unlock: { requires: [idOf('sevault-canyon')], battlesAtLocation: [{ locationId: idOf('sevault-canyon'), count: 5 }] } },
]

const regions = read('regions.json')
if (regions.some((region) => region.id === REGION_ID)) {
  console.log('Sevii Islands already present; nothing to do.')
  process.exit(0)
}

const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))

// Moltres lives at Mt. Ember in the Sevii Islands, so it headlines the region's
// Raid Island and leaves Kanto's pool.
const RAID_POOL = [{ speciesKey: 'moltres', level: 75 }]
/** Resolve a connect suffix: a real Kanto id stays, anything else is a Sevii id. */
const resolveConnect = (/** @type {string} */ node) =>
  mapData[node] ? node : idOf(node)

/** @type {Record<string, any>} */
const regionMap = {}
/** @type {Record<string, any>} */
const regionEncounters = {}
AREAS.forEach((area, index) => {
  const id = idOf(area.node),
    location = {
      id,
      name: area.name,
      type: area.type,
      region: REGION_ID,
      description: `${area.name} in the Sevii Islands.`,
      connections: area.connects.map(resolveConnect),
      unlock: area.unlock,
      unlockOrder: 900000 + index,
      position: { x: area.x, y: area.y },
      biome: area.biome,
      background: BACKGROUND_BY_BIOME[area.biome] ?? '/backgrounds/grassland.png',
    }
  if (area.type === 'route') {
    location.routeKey = id
    regionEncounters[id] = {
      name: area.name,
      encounters: area.species.map((/** @type {string} */ speciesKey, /** @type {number} */ speciesIndex) => ({
        speciesKey,
        weight: weight(speciesIndex),
        minLevel: area.minLevel,
        maxLevel: area.maxLevel,
      })),
    }
  }
  regionMap[id] = location
})

// The region's legendary Raid Island hangs off One Island, gated on the last
// area.
const RAID_ID = `${REGION_ID}-raid`
regionMap[RAID_ID] = {
  id: RAID_ID,
  name: 'Sevii Islands Raid Island',
  type: 'raid',
  region: REGION_ID,
  description: "A mysterious island where the Sevii Islands' rarest Pokemon dwell.",
  routeKey: RAID_ID,
  background: '/backgrounds/cave.png',
  connections: [ENTRY],
  unlock: {
    requires: [ENTRY],
    battlesAtLocation: [{ locationId: idOf('tanoby-ruins'), count: 10 }],
  },
  unlockOrder: 900020,
  position: { x: 90, y: 97 },
  biome: 'cave',
}
regionMap[ENTRY].connections.push(RAID_ID)
regionEncounters[RAID_ID] = {
  name: regionMap[RAID_ID].name,
  encounters: RAID_POOL.map((entry) => ({
    speciesKey: entry.speciesKey,
    weight: 1,
    minLevel: entry.level,
    maxLevel: entry.level,
  })),
}

// Add the reverse link from every Kanto neighbour (the port back to One Island).
for (const area of AREAS)
  for (const connect of area.connects.map(resolveConnect))
    if (mapData[connect] && !mapData[connect].connections.includes(idOf(area.node)))
      mapData[connect].connections.push(idOf(area.node))

// Make every Sevii <-> Sevii edge mutual (the source lists name the previous
// island but not always the next).
for (const [id, location] of Object.entries(regionMap))
  for (const connect of location.connections) {
    const target = regionMap[connect]
    if (target && !target.connections.includes(id)) target.connections.push(id)
  }

regions.push({
  id: REGION_ID,
  name: 'Sevii Islands',
  generation: 1,
  order: 1.1,
  entry: ENTRY,
  startLevel: 63,
  isDlc: true,
  parentRegion: 'kanto',
  raidPool: RAID_POOL,
})
// Moltres now belongs to the Sevii Islands.
const kanto = regions.find((region) => region.id === 'kanto')
if (kanto)
  kanto.raidPool = (kanto.raidPool ?? []).filter((entry) => entry.speciesKey !== 'moltres')
if (encounterData.raidIsland)
  encounterData.raidIsland.encounters = encounterData.raidIsland.encounters.filter(
    (entry) => entry.speciesKey !== 'moltres'
  )

if (DRY) {
  console.log(`Would add ${AREAS.length} Sevii area(s) to ${REGION_ID}.`)
  process.exit(0)
}

write('regions.json', regions)
write(path.join('map-data', `${REGION_ID}.json`), regionMap)
write(path.join('encounter-data', `${REGION_ID}.json`), regionEncounters)
// Persist the reverse link on the Kanto side (Vermilion City's port).
const kantoMap = Object.fromEntries(
  Object.entries(mapData).filter(([, value]) => (value.region ?? 'kanto') === 'kanto')
)
write(path.join('map-data', 'kanto.json'), kantoMap)
// Persist Kanto's raid bucket with Moltres removed.
const kantoEncounters = Object.fromEntries(
  Object.entries(encounterData).filter(([key]) => (mapData[key]?.region ?? 'kanto') === 'kanto')
)
write(path.join('encounter-data', 'kanto.json'), kantoEncounters)
console.log(`Added ${AREAS.length} Sevii area(s).`)
