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

/**
 * Is a location still reachable (at least one connection) without a direct
 * edge to `other`? Only the two endpoints matter: a region may legitimately be
 * several components (islands, a boat-only Battle Zone).
 */
function keepsAConnection(id, other) {
  return (mapData[id]?.connections ?? []).some((connection) => connection !== other)
}

const removed = [],
  repointed = []
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
    // Only drop it if neither end loses its last connection.
    if (!keepsAConnection(first, second) || !keepsAConnection(second, first)) continue
    mapData[first].connections = mapData[first].connections.filter((id) => id !== second)
    mapData[second].connections = mapData[second].connections.filter((id) => id !== first)
    removed.push(key.replace('|', ' -- '))
  }

  // A scraped orphan the tidy pass stitched to a distant neighbour (Unova's
  // Route Gate -> Route 18. If it has a lone, long, non-reference road, move it
  // onto the nearest visible node instead so it doesn't drag across the map.
  for (const location of visible) {
    if (location.connections.length !== 1) continue
    const neighbour = location.connections[0],
      edgeKey = [location.id, neighbour].sort().join('|'),
      // A league or Raid Island keeps its designated anchor.
      isAnchor = (id) => mapData[id]?.type === 'raid' || id.endsWith('-league')
    if (referenceEdges.has(edgeKey) || isAnchor(location.id) || isAnchor(neighbour)) continue
    const here = location.position,
      current = mapData[neighbour]?.position
    if (!current) continue
    const currentDistance = Math.hypot(here.x - current.x, here.y - current.y)
    if (currentDistance <= 25) continue
    const nearest = visible
      .filter((candidate) => candidate.id !== location.id && candidate.id !== neighbour)
      .map((candidate) => ({
        id: candidate.id,
        distance: Math.hypot(here.x - candidate.position.x, here.y - candidate.position.y),
      }))
      .sort((left, right) => left.distance - right.distance)[0]
    if (!nearest || nearest.distance >= currentDistance) continue
    location.connections = [nearest.id]
    mapData[neighbour].connections = mapData[neighbour].connections.filter((id) => id !== location.id)
    mapData[nearest.id].connections.push(location.id)
    repointed.push(`${location.id} ${neighbour} -> ${nearest.id}`)
  }
}

if (removed.length === 0 && repointed.length === 0) {
  console.log('No non-reference roads to remove; nothing to do.')
  process.exit(0)
}
for (const edge of removed) console.log(`removed ${edge}`)
for (const fix of repointed) console.log(`re-pointed ${fix}`)
if (DRY) {
  console.log(
    `Would remove ${removed.length} non-reference connection(s) and re-point ${repointed.length}.`
  )
  process.exit(0)
}

writeRegionDir(path.join(DATA, 'map-data'), mapData)
console.log(
  `Removed ${removed.length} non-reference connection(s), re-pointed ${repointed.length}.`
)
