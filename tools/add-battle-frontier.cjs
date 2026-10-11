/**
 * One-off data pass (#66): add Hoenn's "Battle Frontier" as a post-game
 * `type: 'facility'` location next to the Battle Tower on Route 111. It hosts
 * the rule-variant facilities (see src/game/battle-frontier.js), opened once
 * the Hoenn Champion is beaten.
 *
 * Idempotent: no-op once the location exists. Re-run
 * `tools/generate-encounter-index.cjs` after (it lists locations).
 *
 * Usage: node tools/add-battle-frontier.cjs [--dry]
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MAP_PATH = path.join(ROOT, 'public', 'data', 'map-data', 'hoenn.json')

const DRY = process.argv.includes('--dry')

const LOCATION_ID = 'hoenn-battle-frontier'
const TOWER_ID = 'hoenn-route-111'

const LOCATION = {
  id: LOCATION_ID,
  name: 'Battle Frontier',
  type: 'facility',
  region: 'hoenn',
  description:
    'A grand complex beside the Battle Tower where trainers test themselves under strange rules.',
  routeKey: LOCATION_ID,
  connections: [TOWER_ID],
  unlock: {
    championDefeated: 'hoenn',
    battlesAtLocation: [{ locationId: TOWER_ID, count: 20 }],
    requires: [TOWER_ID],
  },
  unlockOrder: 300140,
  position: { x: 37, y: 31 },
  background: '/backgrounds/mountain.webp',
  biome: 'mountain',
}

const maps = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))

if (maps[LOCATION_ID]) {
  console.log('add-battle-frontier: already present, nothing to do')
  process.exit(0)
}

if (!maps[TOWER_ID]) {
  console.error(`add-battle-frontier: ${TOWER_ID} is missing from the Hoenn map`)
  process.exit(1)
}

// The connection has to be mutual or validate-data rejects the graph.
maps[LOCATION_ID] = LOCATION
maps[TOWER_ID].connections = [...new Set([...(maps[TOWER_ID].connections ?? []), LOCATION_ID])]

if (DRY) {
  console.log('add-battle-frontier: would add', LOCATION_ID, 'and link it to', TOWER_ID)
  process.exit(0)
}

fs.writeFileSync(MAP_PATH, `${JSON.stringify(maps, null, 1)}\n`)
console.log('add-battle-frontier: added', LOCATION_ID, 'and linked it to', TOWER_ID)
