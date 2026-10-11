/**
 * One-off data pass (#75): add Lumiose City's Wild Zones to Kalos as a
 * post-game `type: 'zone'` hub gated on the Kalos Champion and reached from
 * Lumiose City, with the Wild Zones as hidden sub-areas (each with its own
 * wild table). Mirrors the generator's zone shape.
 *
 * Idempotent: no-op once the `lumiose-wild-zones` hub exists. Re-run
 * `tools/generate-encounter-index.cjs` after.
 *
 * Usage: node tools/add-lumiose-zone.cjs [--dry]
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MAP_PATH = path.join(ROOT, 'public', 'data', 'map-data', 'kalos.json')
const ENCOUNTER_PATH = path.join(ROOT, 'public', 'data', 'encounter-data', 'kalos.json')
const SPECIES_PATH = path.join(ROOT, 'public', 'data', 'pokemon-species.json')

const DRY = process.argv.includes('--dry')

const HUB_ID = 'lumiose-wild-zones'
const HUB_LINK = 'kalos-lumiose-city'
const HUB_POSITION = { x: 53, y: 20 }
const LEVEL_MIN = 68
const LEVEL_MAX = 72

/** The five Wild Zones, in unlock order, ringed around the hub. */
const AREAS = [
  {
    id: 'lumiose-wild-zone-1',
    name: 'Wild Zone 1',
    biome: 'grassland',
    background: '/backgrounds/grassland.webp',
    position: { x: 48, y: 13 },
    description: 'A grassy plaza overrun by city Pokemon.',
    land: ['fletchling', 'bunnelby', 'scatterbug', 'litleo', 'pikachu', 'pancham', 'dedenne', 'eevee', 'skiddo', 'furfrou'],
  },
  {
    id: 'lumiose-wild-zone-2',
    name: 'Wild Zone 2',
    biome: 'forest',
    background: '/backgrounds/grassland.webp',
    position: { x: 58, y: 12 },
    description: 'A wooded park in the heart of the city.',
    land: ['budew', 'seedot', 'cottonee', 'petilil', 'foongus', 'phantump', 'swirlix', 'spritzee', 'espurr', 'pansage'],
  },
  {
    id: 'lumiose-wild-zone-3',
    name: 'Wild Zone 3',
    biome: 'coast',
    background: '/backgrounds/beach.webp',
    position: { x: 62, y: 20 },
    description: 'A canal-side zone where water Pokemon gather.',
    land: ['magikarp', 'finneon', 'buizel', 'wooper', 'corphish', 'binacle', 'skrelp', 'clauncher', 'shellos', 'seaking'],
  },
  {
    id: 'lumiose-wild-zone-4',
    name: 'Wild Zone 4',
    biome: 'ruins',
    background: '/backgrounds/mountain.webp',
    position: { x: 58, y: 28 },
    description: 'Construction tunnels and old foundations below the streets.',
    land: ['roggenrola', 'woobat', 'gible', 'noibat', 'honedge', 'carbink', 'klefki', 'onix', 'geodude', 'bronzor'],
  },
  {
    id: 'lumiose-wild-zone-5',
    name: 'Wild Zone 5',
    biome: 'volcanic',
    background: '/backgrounds/mountain.webp',
    position: { x: 48, y: 28 },
    description: 'The power plant quarter, humming with heat and sparks.',
    land: ['magnemite', 'voltorb', 'grimer', 'koffing', 'trubbish', 'houndour', 'growlithe', 'klefki', 'pansear', 'slugma'],
  },
]

/** @param {string[]} table */
function toEncounters(table) {
  return table.map((speciesKey) => ({
    speciesKey,
    weight: 10,
    minLevel: LEVEL_MIN,
    maxLevel: LEVEL_MAX,
  }))
}

function main() {
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))
  if (map[HUB_ID]) {
    console.log('lumiose wild zones already present — nothing to do')
    return
  }
  const species = JSON.parse(fs.readFileSync(SPECIES_PATH, 'utf8'))
  const encounters = JSON.parse(fs.readFileSync(ENCOUNTER_PATH, 'utf8'))

  const missing = AREAS.flatMap((area) => area.land.filter((key) => !species[key]))
  if (missing.length) throw new Error(`unknown species: ${[...new Set(missing)].join(', ')}`)
  if (!map[HUB_LINK]) throw new Error(`missing connection target ${HUB_LINK}`)

  map[HUB_ID] = {
    id: HUB_ID,
    name: 'Lumiose Wild Zones',
    type: 'zone',
    region: 'kalos',
    description: 'The Wild Zones carved out of Lumiose City, open once the Kalos Champion is beaten.',
    routeKey: AREAS[0].id,
    background: '/backgrounds/grassland.webp',
    biome: 'grassland',
    connections: [HUB_LINK, ...AREAS.map((area) => area.id)],
    unlock: { championDefeated: 'kalos' },
    unlockOrder: 900200,
    position: HUB_POSITION,
    subAreas: AREAS.map((area) => ({ id: area.id, name: area.name })),
  }
  if (!map[HUB_LINK].connections.includes(HUB_ID)) map[HUB_LINK].connections.push(HUB_ID)

  AREAS.forEach((area, index) => {
    map[area.id] = {
      id: area.id,
      name: area.name,
      type: 'route',
      region: 'kalos',
      description: area.description,
      routeKey: area.id,
      background: area.background,
      biome: area.biome,
      connections: [HUB_ID],
      unlock: { requires: index === 0 ? [HUB_ID] : [HUB_ID, AREAS[index - 1].id] },
      unlockOrder: 900201 + index,
      position: area.position,
      hidden: true,
      zone: HUB_ID,
    }
    encounters[area.id] = {
      name: area.name,
      encounters: toEncounters(area.land),
    }
  })

  if (DRY) {
    console.log(`[dry] would add the Lumiose Wild Zones hub + ${AREAS.length} areas`)
    return
  }
  fs.writeFileSync(MAP_PATH, `${JSON.stringify(map, null, 1)}\n`)
  fs.writeFileSync(ENCOUNTER_PATH, `${JSON.stringify(encounters, null, 1)}\n`)
  console.log(`added the Lumiose Wild Zones with ${AREAS.length} areas`)
}

main()
