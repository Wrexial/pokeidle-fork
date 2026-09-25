#!/usr/bin/env node
/**
 * One-time sync: make every zone's sub-areas unlock in order, behind the hub.
 *
 * Grouped zones (Alola's islands, Paldea's provinces, the Wild Area and DLC)
 * each list sub-areas, but their unlock rules were generated independently, so
 * a later route could open before the hub or an earlier route (Route 6 before
 * Akala Island and Route 5). This adds a `requires` chain: each sub-area needs
 * the zone hub and the previous sub-area in the hub's list, on top of whatever
 * gate it already had.
 *
 * Idempotent: re-running changes nothing. Once the data is regenerated from
 * scratch this is obsolete (generate-regions.cjs chains them too).
 *
 * Usage:
 *   node tools/enforce-zone-chains.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const MAP_DIR = path.join(__dirname, '..', 'public', 'data', 'map-data')
const DRY = process.argv.includes('--dry')
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

let changed = 0
for (const file of fs.readdirSync(MAP_DIR).filter((f) => f.endsWith('.json'))) {
  const filePath = path.join(MAP_DIR, file),
    map = read(filePath)
  let fileChanges = 0
  for (const hub of Object.values(map)) {
    if (hub.type !== 'zone' || !Array.isArray(hub.subAreas)) continue
    let previous = null
    for (const subArea of hub.subAreas) {
      const location = map[subArea.id]
      if (!location) continue
      const unlock = location.unlock ?? {},
        existing = unlock.requires ?? [],
        requires = [...new Set([...existing, hub.id, ...(previous ? [previous] : [])])]
      if (JSON.stringify(requires) !== JSON.stringify(existing)) {
        location.unlock = { ...unlock, requires }
        fileChanges++
      }
      previous = subArea.id
    }
  }
  if (fileChanges) {
    changed += fileChanges
    console.log(`${file.replace(/\.json$/, '')}: ${fileChanges} sub-area(s)`)
    if (!DRY) fs.writeFileSync(filePath, JSON.stringify(map, null, 1) + '\n')
  }
}
console.log(`${DRY ? 'would change' : 'changed'} ${changed} sub-area(s)`)
