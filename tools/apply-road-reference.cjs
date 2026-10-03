#!/usr/bin/env node
/**
 * Drop Town Map roads that the reference maps don't actually connect.
 *
 * `tools/region-maps.json` is the scraped real adjacency (Bulbapedia compass
 * links, connector-contracted) for every region except Kanto. The generator
 * adds extra links on top — town-to-town shortcuts, and the tidy/stitch passes.
 * This data-only pass removes a visible town/route edge that is **not** in the
 * reference, but only when its two ends stay connected by another path: a node
 * must keep at least one road, and no component may be split (a boat-only area
 * like Sinnoh's Battle Zone keeps its one link).
 *
 * Edges involving added areas (caves/forests/zones/raid/league) are left alone;
 * their links are curated in the ordinary/zone tables. Idempotent.
 *
 * Usage: node tools/apply-road-reference.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')

const DRY = process.argv.includes('--dry')
const reference = JSON.parse(fs.readFileSync(path.join(__dirname, 'region-maps.json'), 'utf8'))
const regions = JSON.parse(fs.readFileSync(path.join(DATA, 'regions.json'), 'utf8'))
const mapData = readRegionDir(path.join(DATA, 'map-data'))

const prefix = (regionId, node) =>
  node.startsWith(`${regionId}-`) ? node : `${regionId}-${node}`

/** Are two locations still linked without a direct edge between them? */
function connectedWithout(first, second) {
  const seen = new Set([first]),
    queue = [first]
  while (queue.length) {
    const current = queue.shift()
    for (const next of mapData[current]?.connections ?? []) {
      if ((current === first && next === second) || (current === second && next === first)) continue
      if (seen.has(next)) continue
      if (next === second) return true
      seen.add(next)
      queue.push(next)
    }
  }
  return false
}

const removed = []
for (const region of regions) {
  const data = reference[region.id]
  if (!data) continue
  const baseNodes = new Set(data.nodes.map((node) => prefix(region.id, node))),
    referenceEdges = new Set(
      (data.edges ?? []).map((edge) => [prefix(region.id, edge.from), prefix(region.id, edge.to)].sort().join('|'))
    ),
    visible = Object.values(mapData).filter(
      (location) => (location.region ?? 'kanto') === region.id && !location.hidden
    ),
    visibleIds = new Set(visible.map((location) => location.id)),
    candidates = new Set()
  for (const location of visible) {
    if (!baseNodes.has(location.id)) continue
    for (const neighbour of location.connections ?? []) {
      if (!visibleIds.has(neighbour) || !baseNodes.has(neighbour)) continue
      const key = [location.id, neighbour].sort().join('|')
      if (!referenceEdges.has(key)) candidates.add(key)
    }
  }
  for (const key of [...candidates].sort()) {
    const [first, second] = key.split('|')
    if (!mapData[first]?.connections.includes(second)) continue
    // Only drop it if the two ends stay connected another way (no split, no
    // isolated node).
    if (!connectedWithout(first, second)) continue
    mapData[first].connections = mapData[first].connections.filter((id) => id !== second)
    mapData[second].connections = mapData[second].connections.filter((id) => id !== first)
    removed.push(key.replace('|', ' -- '))
  }
}

if (removed.length === 0) {
  console.log('No non-reference roads to remove; nothing to do.')
  process.exit(0)
}
for (const edge of removed) console.log(`removed ${edge}`)
if (DRY) {
  console.log(`Would remove ${removed.length} non-reference connection(s).`)
  process.exit(0)
}

writeRegionDir(path.join(DATA, 'map-data'), mapData)
console.log(`Removed ${removed.length} non-reference connection(s).`)
