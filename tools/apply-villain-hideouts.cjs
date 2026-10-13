#!/usr/bin/env node
/**
 * Inject each villain org's hideout as a real map node (#88).
 *
 * The arc itself is built at runtime from `src/data/villain-teams.js`; this
 * pass only places the hideout on the committed map data and wires it to its
 * parent town, so the Town Map shows a hideout and the location panel can offer
 * the arc. The entrance is gated on the org's badge count plus its parent town,
 * so the normal unlock graph (and quickplay) carries it.
 *
 * Idempotent: re-running only repairs a node that drifted. Usage:
 *   node tools/apply-villain-hideouts.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const MAP_DIR = path.join(__dirname, '../public/data/map-data')
const DRY = process.argv.includes('--dry')

/** Keep a value inside the 0..100 game canvas with a small margin. */
const clamp = (value) => Math.max(2, Math.min(98, Math.round(value * 100) / 100))

/**
 * A free position for the hideout near its parent, clear of every other node.
 * Deterministic so a rerun lands on the same spot.
 * @param {Record<string, any>} nodes
 * @param {string} parentId
 * @param {string} [excludeId] the hideout itself, ignored while searching
 */
function findFreePosition(nodes, parentId, excludeId) {
  const parent = nodes[parentId],
    origin = parent?.position ?? { x: 50, y: 50 },
    others = Object.entries(nodes).filter(([id]) => id !== excludeId)
  for (let radius = 5; radius <= 14; radius += 1.5)
    for (let step = 0; step < 12; step++) {
      const angle = (step / 12) * Math.PI * 2,
        x = clamp(origin.x + Math.cos(angle) * radius),
        y = clamp(origin.y + Math.sin(angle) * radius)
      if (others.every(([, node]) => Math.hypot(node.position.x - x, node.position.y - y) >= 4.5))
        return { x, y }
    }
  return { x: clamp(origin.x + 5), y: clamp(origin.y + 5) }
}

async function main() {
  const { VILLAIN_ORGS } = await import('../src/data/villain-teams.js')
  /** @type {string[]} */
  const changed = []
  for (const org of Object.values(VILLAIN_ORGS)) {
    const region = org.region,
      file = path.join(MAP_DIR, `${region}.json`),
      nodes = JSON.parse(fs.readFileSync(file, 'utf8')),
      parent = nodes[org.hideout.parent]
    if (!parent) throw new Error(`${region}: hideout parent ${org.hideout.parent} is missing`)
    const existing = nodes[org.hideout.id],
      position = findFreePosition(nodes, org.hideout.parent, org.hideout.id),
      unlockOrder = (parent.unlockOrder ?? existing?.unlockOrder ?? 0) + 0.5,
      node = {
        id: org.hideout.id,
        name: org.hideout.name,
        type: 'hideout',
        description: org.hideout.description,
        connections: [org.hideout.parent],
        unlock: {
          badgesRequired: org.hideout.badgeGate,
          requires: [org.hideout.parent],
        },
        unlockOrder,
        position,
        region,
        biome: existing?.biome ?? parent.biome ?? 'grassland',
      }
    // Keep the parent's road mutual.
    if (!parent.connections.includes(org.hideout.id))
      parent.connections = [...parent.connections, org.hideout.id]
    const before = JSON.stringify(existing)
    nodes[org.hideout.id] = node
    if (before === JSON.stringify(node)) continue
    changed.push(org.hideout.id)
    if (!DRY) fs.writeFileSync(file, JSON.stringify(nodes, null, 1) + '\n')
  }
  console.log(
    DRY
      ? `apply-villain-hideouts: would write ${changed.length} hideout(s): ${changed.join(', ')}`
      : `apply-villain-hideouts: wrote ${changed.length} hideout(s): ${changed.join(', ') || 'all up to date'}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
