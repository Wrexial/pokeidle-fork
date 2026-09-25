#!/usr/bin/env node
/**
 * One-time sync: make every zone's sub-areas unlock in order, behind the hub.
 *
 * Grouped zones (Alola's islands, Paldea's provinces, the Wild Area and DLC)
 * each list sub-areas, but their unlock rules were generated independently, so
 * a later route could open before the hub or an earlier route (Route 6 before
 * Akala Island and Route 5). This adds a `requires` chain: each sub-area needs
 * the zone hub and the previous sub-area, on top of whatever gate it already
 * had.
 *
 * The "previous" sub-area is taken from `unlockOrder`, the derived progress key
 * the level curve is built from — not the hub's `subAreas` array order, which
 * for Paldea is plain numeric and can disagree with the levels. Following
 * `unlockOrder` keeps the chain in step with the party-level and battle gates;
 * chaining the numeric order made South Province (Area Five) demand wins in
 * (Area Six) while (Area Six) waited on (Area Five), deadlocking both.
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
    const subAreaIds = new Set(hub.subAreas.map((subArea) => subArea.id)),
      // The chain runs lowest `unlockOrder` first; the id breaks ties so the
      // order is deterministic.
      ordered = [...hub.subAreas].sort((left, right) => {
        const leftOrder = map[left.id]?.unlockOrder ?? 0,
          rightOrder = map[right.id]?.unlockOrder ?? 0
        return leftOrder - rightOrder || left.id.localeCompare(right.id)
      }),
      reordered = hub.subAreas.some((subArea, index) => subArea.id !== ordered[index]?.id)
    let previous = null
    for (const subArea of ordered) {
      const location = map[subArea.id]
      if (!location) continue
      const unlock = location.unlock ?? {},
        existing = unlock.requires ?? [],
        // Drop this hub's own chain links (the hub plus any sibling sub-area)
        // before rebuilding them, so an old, wrong order can't linger.
        external = existing.filter((id) => id !== hub.id && !subAreaIds.has(id)),
        requires = [...new Set([...external, hub.id, ...(previous ? [previous] : [])])]
      if (JSON.stringify(requires) !== JSON.stringify(existing)) {
        location.unlock = { ...unlock, requires }
        fileChanges++
      }
      previous = subArea.id
    }
    if (reordered) {
      hub.subAreas = ordered.map((subArea) => ({ id: subArea.id, name: subArea.name }))
      fileChanges++
    }
  }
  if (fileChanges) {
    changed += fileChanges
    console.log(`${file.replace(/\.json$/, '')}: ${fileChanges} change(s)`)
    if (!DRY) fs.writeFileSync(filePath, JSON.stringify(map, null, 1) + '\n')
  }
}
console.log(`${DRY ? 'would change' : 'changed'} ${changed} change(s)`)
