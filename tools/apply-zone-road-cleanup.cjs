#!/usr/bin/env node
/**
 * Trim the long cross-map roads around zone hubs.
 *
 * Grouped zones (`GROUP_ZONES`) link adjacent hubs, and a province/island hub
 * also gets wired to every town its first area unlocked from, so the Town Map
 * ends up drawing roads across whole oceans/regions. This data-only pass removes
 * a zone hub's visible connection to another zone hub, and any visible link
 * longer than `LONG_LINK`, as long as neither end loses its last connection.
 * Hidden sub-area links are untouched.
 *
 * Idempotent.
 *
 * Usage: node tools/apply-zone-road-cleanup.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')

const DRY = process.argv.includes('--dry')
/** Roads longer than this (map units) are treated as cross-map clutter. */
const LONG_LINK = 25
const distance = (a, b) => Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y)
const keepsAConnection = (id, other) =>
  (mapData[id]?.connections ?? []).some((connection) => connection !== other)

const mapData = readRegionDir(path.join(DATA, 'map-data'))

const isZone = (id) => mapData[id]?.type === 'zone'
let removed = 0
for (const hub of Object.values(mapData)) {
  if (hub.type !== 'zone') continue
  for (const neighbour of [...(hub.connections ?? [])]) {
    const other = mapData[neighbour]
    if (!other || other.hidden) continue
    // A league or Raid Island is a lone end node: keep its one road even if long.
    if (other.type === 'raid' || neighbour.endsWith('-league')) continue
    const crossHub = isZone(neighbour),
      tooLong = distance(hub, other) > LONG_LINK
    if (!crossHub && !tooLong) continue
    if (!keepsAConnection(hub.id, neighbour) || !keepsAConnection(neighbour, hub.id)) continue
    hub.connections = hub.connections.filter((id) => id !== neighbour)
    other.connections = other.connections.filter((id) => id !== hub.id)
    removed++
    console.log(`removed ${hub.id} -- ${neighbour}${crossHub ? ' (hub link)' : ` (${distance(hub, other).toFixed(0)} units)`}`)
  }
}

if (removed === 0) {
  console.log('Zone roads already trimmed; nothing to do.')
  process.exit(0)
}
if (DRY) {
  console.log(`Would remove ${removed} zone road(s).`)
  process.exit(0)
}

writeRegionDir(path.join(DATA, 'map-data'), mapData)
console.log(`Removed ${removed} zone road(s).`)
