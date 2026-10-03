#!/usr/bin/env node
/**
 * Re-space every zone hub's sub-areas into a tidy grid (#36/#60).
 *
 * Sub-areas are hidden from the region map and only show in the focused area
 * view, and a lot of them shipped clumped together (several exactly on top of
 * each other). This data-only pass lays each hub's sub-areas out around it using
 * tools/lib/zone-layout.cjs — the same helper the generator runs — so the
 * focused map is readable. Idempotent.
 *
 * Usage: node tools/apply-zone-layout.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')
const { spreadSubAreaPositions } = require('./lib/zone-layout.cjs')

const DRY = process.argv.includes('--dry')
const mapData = readRegionDir(path.join(DATA, 'map-data'))

let changed = 0
for (const hub of Object.values(mapData)) {
  if (hub.type !== 'zone' || !Array.isArray(hub.subAreas)) continue
  const ids = hub.subAreas.map((subArea) => subArea.id),
    positions = spreadSubAreaPositions(hub.position, ids.length)
  ids.forEach((id, index) => {
    const location = mapData[id]
    if (!location || !positions[index]) return
    if (location.position.x !== positions[index].x || location.position.y !== positions[index].y) {
      location.position = positions[index]
      changed++
    }
  })
}

if (changed === 0) {
  console.log('Zone sub-areas already spaced; nothing to do.')
  process.exit(0)
}
if (DRY) {
  console.log(`Would re-space ${changed} zone sub-area(s).`)
  process.exit(0)
}

writeRegionDir(path.join(DATA, 'map-data'), mapData)
console.log(`Re-spaced ${changed} zone sub-area(s).`)
