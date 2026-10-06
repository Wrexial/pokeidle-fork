#!/usr/bin/env node
/**
 * Turn Johto's Whirl Islands into a `type: 'zone'` hub with cave sub-areas
 * (#36/#28b). The landmark shipped as a single route node, so its rooms had
 * nowhere to live; this splits it into an Entrance plus four caves, re-homes the
 * original encounter table across them, and wires the hub the same way the
 * generated zones are wired.
 *
 * Idempotent: skips once the hub is already a zone. After running it, run
 * `enforce-zone-chains.cjs`, `apply-zone-layout.cjs` and
 * `generate-encounter-index.cjs`.
 *
 * Usage: node tools/make-whirl-islands-zone.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'

const DATA = path.join(import.meta.dirname, '../public/data')
const DRY = process.argv.includes('--dry')
const HUB = 'johto-whirl-islands'
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))
const write = (file, value) =>
  fs.writeFileSync(path.join(DATA, file), JSON.stringify(value, null, 1) + '\n')

const BACKGROUND_BY_BIOME = {
  cave: '/backgrounds/cave.png',
  coast: '/backgrounds/beach.png',
}

/** Sub-areas, in travel order. Levels match the original route (48-50). */
const AREAS = [
  { node: 'entrance', name: 'Whirl Islands Entrance', biome: 'coast', species: ['krabby', 'horsea', 'tentacool', 'seel', 'qwilfish'] },
  { node: 'northeast-cave', name: 'Northeast Cave', biome: 'cave', species: ['zubat', 'ekans', 'arbok', 'nidoranF', 'nidoranM'] },
  { node: 'northwest-cave', name: 'Northwest Cave', biome: 'coast', species: ['krabby', 'kingler', 'horsea', 'seadra', 'tentacool'] },
  { node: 'southeast-cave', name: 'Southeast Cave', biome: 'cave', species: ['zubat', 'golbat', 'ekans', 'arbok'] },
  { node: 'southwest-cave', name: 'Southwest Cave', biome: 'coast', species: ['seel', 'dewgong', 'tentacruel', 'qwilfish', 'tentacool'] },
]

const map = read(path.join('map-data', 'johto.json'))
const hub = map[HUB]
if (!hub) throw new Error(`${HUB} not found`)
if (hub.type === 'zone') {
  console.log('Whirl Islands is already a zone; nothing to do.')
  process.exit(0)
}
const encounter = read(path.join('encounter-data', 'johto.json'))
if (DRY) {
  console.log(`Would split ${HUB} into ${AREAS.length} sub-areas.`)
  process.exit(0)
}

const idOf = (/** @type {string} */ node) => `${HUB}--${node}`
const subAreaIds = AREAS.map((area) => idOf(area.node))

AREAS.forEach((area, index) => {
  const id = idOf(area.node)
  map[id] = {
    id,
    name: area.name,
    type: 'route',
    region: 'johto',
    description: `${area.name}, one of the Whirl Islands' caves.`,
    routeKey: id,
    background: BACKGROUND_BY_BIOME[area.biome] ?? '/backgrounds/grassland.png',
    connections: [HUB],
    // `enforce-zone-chains.cjs` will add the previous sub-area to `requires`.
    unlock: { requires: [HUB] },
    unlockOrder: +(hub.unlockOrder + 0.0001 * (index + 1)).toFixed(4),
    position: { x: hub.position.x, y: hub.position.y },
    hidden: true,
    zone: HUB,
    biome: area.biome,
  }
  encounter[id] = {
    name: area.name,
    encounters: area.species.map((speciesKey, speciesIndex) => ({
      speciesKey,
      weight: speciesIndex < 3 ? 20 : 12,
      minLevel: 48,
      maxLevel: 50,
    })),
  }
})

// The hub keeps its gate but becomes a picker with no wilds of its own.
hub.type = 'zone'
hub.description = "The Whirl Islands are a cluster of caverns in the sea off Cianwood City."
hub.routeKey = subAreaIds[0]
hub.subAreas = AREAS.map((area, index) => ({ id: subAreaIds[index], name: area.name }))
hub.connections = ['johto-sea-route-41', ...subAreaIds]
delete encounter[HUB]

write(path.join('map-data', 'johto.json'), map)
write(path.join('encounter-data', 'johto.json'), encounter)
console.log(`Split ${HUB} into ${AREAS.length} sub-areas.`)
