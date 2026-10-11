/**
 * One-off data pass (#78): add Alola's "Ultra Space" as a post-game
 * `type: 'facility'` location beside the Raid Island. It hosts the Ultra Warp
 * Ride minigame (registered in `src/game/minigames/`), opens once the Alola
 * Champion is beaten and the Raid Island is unlocked, and has its own empty
 * route bucket so idle wild encounters never leak the raid pool onto it.
 *
 * Idempotent: no-op once the location exists. Re-run
 * `tools/generate-encounter-index.cjs` after (it lists locations).
 *
 * Usage: node tools/add-ultra-space.cjs [--dry]
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MAP_PATH = path.join(ROOT, 'public', 'data', 'map-data', 'alola.json')

const DRY = process.argv.includes('--dry')

const LOCATION_ID = 'alola-ultra-space'
const RAID_ID = 'alola-raid'

const LOCATION = {
  id: LOCATION_ID,
  name: 'Ultra Space',
  type: 'facility',
  region: 'alola',
  description:
    'A shifting pocket of Ultra Space reached through the wormhole, where the Ultra Beasts and Alola\u2019s legends wait beyond the doors.',
  routeKey: LOCATION_ID,
  connections: [RAID_ID],
  unlock: {
    championDefeated: 'alola',
    // The lesion to the wormhole opens through Poni Island's hub (the Raid
    // Island it sits beside), matching every other Alola facility.
    requires: [RAID_ID, 'alola-poni-island'],
  },
  unlockOrder: 700020,
  position: { x: 14, y: 95 },
  background: '/backgrounds/cave.webp',
  biome: 'cave',
}

const maps = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))

if (maps[LOCATION_ID]) {
  console.log('add-ultra-space: already present, nothing to do')
  process.exit(0)
}

if (!maps[RAID_ID]) {
  console.error(`add-ultra-space: ${RAID_ID} is missing from the Alola map`)
  process.exit(1)
}

// The connection has to be mutual or validate-data rejects the graph.
maps[LOCATION_ID] = LOCATION
maps[RAID_ID].connections = [...new Set([...(maps[RAID_ID].connections ?? []), LOCATION_ID])]

if (DRY) {
  console.log('add-ultra-space: would add', LOCATION_ID, 'and link it to', RAID_ID)
  process.exit(0)
}

fs.writeFileSync(MAP_PATH, `${JSON.stringify(maps, null, 1)}\n`)
console.log('add-ultra-space: added', LOCATION_ID, 'and linked it to', RAID_ID)
