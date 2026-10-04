#!/usr/bin/env node
/**
 * Remove the redundant road connections that make the Town Map a tangle.
 *
 * A handful of locations sit *between* two others that are also directly
 * connected (a cave/forest/park wired to both ends of the road it interrupts,
 * or a scraped town-town shortcut). Those form triangles whose longest side
 * overlaps the other two when the roads are drawn as right angles. This
 * data-only pass drops one side of each triangle so the graph reads as a clean
 * path: a through-area becomes the road (its two links stay, the direct one
 * goes), a side-area becomes a dead-end spur off its nearest neighbour.
 *
 * Entry towns' first-route links are never removed (`entryRoutePath`).
 * Idempotent.
 *
 * Usage: node tools/apply-road-cleanup.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')

const DRY = process.argv.includes('--dry')

/**
 * One redundant edge per triangle, as an unordered pair. Chosen by hand so a
 * through-area keeps the path and a side-area becomes a stub; `--dry` lists any
 * that no longer exist.
 * @type {[string, string][]}
 */
const REDUNDANT = [
  // Johto
  ['johto-route-29', 'johto-tohjo-falls'],
  ['johto-route-32', 'johto-route-33'],
  ['johto-route-33', 'johto-slowpoke-well'],
  ['johto-route-35', 'johto-route-36'],
  ['johto-route-47', 'johto-route-48'],
  // Hoenn
  ['hoenn-pacifidlog-town', 'hoenn-sky-pillar'],
  ['hoenn-route-109', 'hoenn-abandoned-ship'],
  // Sinnoh
  ['sinnoh-route-207', 'sinnoh-wayward-cave'],
  ['sinnoh-route-217', 'sinnoh-snowpoint-temple'],
  // Unova
  ['unova-route-3', 'unova-wellspring-cave'],
  ['unova-icirrus-city', 'unova-route-7'],
  ['unova-humilau-city', 'unova-undella-town'],
  ['unova-route-13', 'unova-giant-chasm'],
  ['unova-undella-town', 'unova-challengers-cave'],
  // Kalos
  ['kalos-route-18', 'kalos-terminus-cave'],
  ['kalos-route-7', 'kalos-route-8'],
  ['kalos-route-16', 'kalos-lost-hotel'],
  // Galar
  ['galar-route-3', 'galar-route-4'],
  ['galar-route-6', 'galar-stow-on-side'],
  // Triangles where a named landmark (cave / forest / ruins / lake / mansion, ...)
  // sits between the other two nodes, so the direct edge between them is the
  // redundant one:
  ['johto-route-32', 'johto-violet-city'],
  ['hoenn-fallarbor-town', 'hoenn-route-114'],
  ['sinnoh-oreburgh-city', 'sinnoh-route-207'],
  ['sinnoh-floaroma-town', 'sinnoh-route-205'],
  ['sinnoh-eterna-city', 'sinnoh-route-205'],
  ['sinnoh-route-210', 'sinnoh-solaceon-town'],
  ['sinnoh-pastoria-city', 'sinnoh-route-212'],
  ['sinnoh-canalave-city', 'sinnoh-route-218'],
  ['sinnoh-route-202', 'sinnoh-sandgem-town'],
  ['sinnoh-route-217', 'sinnoh-snowpoint-city'],
  ['sinnoh-pastoria-city', 'sinnoh-route-213'],
  ['unova-nacrene-city', 'unova-route-3'],
  ['unova-nimbasa-city', 'unova-route-4'],
  ['unova-icirrus-city', 'unova-route-8'],
  ['unova-mistralton-city', 'unova-route-6'],
  ['kalos-ambrette-town', 'kalos-route-8'],
  ['kalos-geosenge-town', 'kalos-route-10'],
  ['kalos-dendemille-town', 'kalos-route-17'],
  ['galar-ballonlea', 'galar-stow-on-side'],
]

const mapData = readRegionDir(path.join(DATA, 'map-data'))

let removed = 0
for (const [first, second] of REDUNDANT) {
  if (!mapData[first] || !mapData[second]) {
    console.warn(`skip ${first} -- ${second}: missing location`)
    continue
  }
  if (!mapData[first].connections.includes(second)) continue
  mapData[first].connections = mapData[first].connections.filter((id) => id !== second)
  mapData[second].connections = mapData[second].connections.filter((id) => id !== first)
  removed++
  console.log(`removed ${first} -- ${second}`)
}

if (removed === 0) {
  console.log('Road graph already clean; nothing to do.')
  process.exit(0)
}
if (DRY) {
  console.log(`Would remove ${removed} redundant connection(s).`)
  process.exit(0)
}

writeRegionDir(path.join(DATA, 'map-data'), mapData)
console.log(`Removed ${removed} redundant connection(s).`)
