#!/usr/bin/env node
/**
 * One-time sync: require each Alola town / facility behind its island hub.
 *
 * Towns were generated with only their battle/level gate, so a town could open
 * before the island it sits on (Paniola Town, Heahea City and Po Town all gate
 * on an earlier island's route). This adds the town's island hub to its
 * `requires`, on top of whatever gate it already had.
 *
 * The islands are the canonical ones (Heahea and Konikoni are Akala towns, Po
 * Town is Ula'ula), which also keeps the Ula'ula hub — itself gated on Heahea
 * City — from becoming circular.
 *
 * Idempotent: re-running changes nothing. Regenerating the data would undo it,
 * so re-run this after `generate-regions.cjs` if that is ever done.
 *
 * Usage:
 *   node tools/gate-alola-towns-by-zone.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const MAP_PATH = path.join(__dirname, '..', 'public', 'data', 'map-data', 'alola.json')
const DRY = process.argv.includes('--dry')
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

/** Alola town / facility -> the island hub it must sit behind. */
const TOWN_ZONES = {
  'alola-hauoli-city': 'alola-melemele-island',
  'alola-paniola-town': 'alola-akala-island',
  'alola-heahea-city': 'alola-akala-island',
  'alola-konikoni-city': 'alola-akala-island',
  'alola-malie-city': 'alola-ulaula-island',
  'alola-po-town': 'alola-ulaula-island',
  'alola-poke-pelago': 'alola-melemele-island',
  'alola-league': 'alola-poni-island',
  'alola-raid': 'alola-poni-island',
}

const map = read(MAP_PATH)
let changed = 0
for (const [locationId, hubId] of Object.entries(TOWN_ZONES)) {
  const location = map[locationId],
    hub = map[hubId]
  if (!location || !hub) {
    console.warn(`missing ${locationId} or ${hubId}`)
    continue
  }
  const unlock = location.unlock ?? {},
    requires = [...new Set([...(unlock.requires ?? []), hubId])]
  if (JSON.stringify(requires) === JSON.stringify(unlock.requires ?? [])) continue
  location.unlock = { ...unlock, requires }
  changed++
  console.log(`${locationId} now requires ${hubId}`)
}
if (changed && !DRY) fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 1) + '\n')
console.log(`${DRY ? 'would change' : 'changed'} ${changed} area(s)`)
