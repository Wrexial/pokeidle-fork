#!/usr/bin/env node
/**
 * Align Town Map roads by nudging route nodes.
 *
 * Towns, zones, the league and raids are hand-measured from the reference maps,
 * but route nodes are interpolated from the connection graph, so their stored
 * coordinates are approximate. The elbow roads only read as straight when the
 * two ends share an x or a y, and many routes sit a hair (0.5-2 units) off
 * their neighbour's line, so every such edge draws a shallow little step.
 *
 * This pass leaves the anchors fixed and locally searches each route's x/y
 * (within `TOL`) for the placement that aligns the most of its edges, then
 * pushes overlapping nodes apart. The result is written into
 * tools/map-layout-overrides.json (write it through with
 * tools/apply-map-layout.cjs). Idempotent.
 *
 * Usage:
 *   node tools/align-map-roads.cjs [--regions=unova,sinnoh] [--dry]
 * (defaults to every region).
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const { readRegionDir, REGION_IDS } = require('./lib/region-data.cjs')
const { loadMapOverrides, OVERRIDES_PATH } = require('./lib/map-overrides.cjs')

const DRY = process.argv.includes('--dry')
const regionsArg = process.argv.find((arg) => arg.startsWith('--regions='))
const targets = regionsArg ? regionsArg.slice('--regions='.length).split(',') : REGION_IDS

/** How far a route may move on one axis while aligning (units). */
const TOL = 2.0
/** Coordinates closer than this count as sharing a line. */
const EPS = 0.01

/** Minimum centre distance by location type so dots/labels never collide. */
function minSeparation(a, b) {
  const pair = [a, b].sort()
  if (pair.includes('zone')) return 2.6
  if (pair[0] === 'town' && pair[1] === 'town') return 2.6
  if (pair.includes('town')) return 2.2
  return 1.5
}

const clamp = (value) => Math.max(3, Math.min(97, value))
const sharesLine = (p, q) => Math.abs(p.x - q.x) < EPS || Math.abs(p.y - q.y) < EPS

/** Distance from point p to segment ab. */
function distanceToSegment(p, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/**
 * Penalty for a candidate position: overlaps (heavy) and sitting on top of a
 * road the node isn't part of (light).
 */
function positionPenalty(id, position, ids, edges) {
  let penalty = 0
  const location = mapData[id]
  for (const other of ids) {
    if (other === id) continue
    const target = mapData[other].position
    const separation = minSeparation(location.type, mapData[other].type)
    const distance = Math.hypot(position.x - target.x, position.y - target.y)
    if (distance < separation) penalty += (separation - distance) * 10
  }
  for (const [a, b] of edges) {
    if (a === id || b === id) continue
    const distance = distanceToSegment(position, mapData[a].position, mapData[b].position)
    if (distance < 1.4) penalty += (1.4 - distance) * 2
  }
  return penalty
}

const mapData = readRegionDir(path.join(DATA, 'map-data'))
const overrides = loadMapOverrides()
const start = {}
for (const id of Object.keys(mapData)) start[id] = { ...mapData[id].position }

let totalMoved = 0
for (const region of targets) {
  const ids = Object.keys(mapData).filter(
    (id) => mapData[id].region === region && !mapData[id].hidden
  )
  const idSet = new Set(ids)
  const edges = []
  for (const id of ids) {
    for (const neighbour of mapData[id].connections) {
      if (!idSet.has(neighbour) || neighbour < id) continue
      edges.push([id, neighbour])
    }
  }
  const routes = ids.filter((id) => mapData[id].type === 'route')

  // Separate overlaps and align roads together to a fixpoint: the resolver can
  // nudge a route off its line, and the Pareto-safe search (which never
  // reintroduces an overlap) puts it back.
  for (let round = 0; round < 8; round++) {
    let resolved = false
    for (let iteration = 0; iteration < 60; iteration++) {
      let moved = false
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = mapData[ids[i]]
          const b = mapData[ids[j]]
          const distance = Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y)
          const separation = minSeparation(a.type, b.type)
          if (distance >= separation) continue
          const push = separation - distance + 0.01
          // Exactly coincident nodes have no direction; split them on x.
          const ux = distance < 1e-6 ? 1 : (a.position.x - b.position.x) / distance
          const uy = distance < 1e-6 ? 0 : (a.position.y - b.position.y) / distance
          const aMoves = a.type === 'route'
          const bMoves = b.type === 'route'
          if (!aMoves && !bMoves) continue
          if (aMoves && bMoves) {
            a.position.x += (ux * push) / 2
            a.position.y += (uy * push) / 2
            b.position.x -= (ux * push) / 2
            b.position.y -= (uy * push) / 2
          } else if (aMoves) {
            a.position.x += ux * push
            a.position.y += uy * push
          } else {
            b.position.x -= ux * push
            b.position.y -= uy * push
          }
          moved = true
        }
      }
      resolved = moved
      if (!moved) break
    }

    // Local search: pick the route x/y (within TOL of its own) that lines up
    // the most neighbour edges.
    let aligned = false
    for (let sweep = 0; sweep < 12; sweep++) {
      let changed = false
      for (const id of routes) {
        const neighbours = mapData[id].connections.filter((neighbour) => idSet.has(neighbour))
        const current = mapData[id].position
        const xs = [current.x]
        const ys = [current.y]
        for (const neighbour of neighbours) {
          const target = mapData[neighbour].position
          if (Math.abs(target.x - current.x) <= TOL) xs.push(target.x)
          if (Math.abs(target.y - current.y) <= TOL) ys.push(target.y)
        }
        const scoreAt = (position) =>
          neighbours.reduce((count, neighbour) => count + (sharesLine(position, mapData[neighbour].position) ? 1 : 0), 0)
        let best = { score: scoreAt(current), penalty: positionPenalty(id, current, ids, edges), position: current }
        for (const x of xs) {
          for (const y of ys) {
            if (Math.abs(x - current.x) > TOL || Math.abs(y - current.y) > TOL) continue
            const position = { x: clamp(x), y: clamp(y) }
            const score = scoreAt(position)
            const penalty = positionPenalty(id, position, ids, edges)
            const move = Math.abs(position.x - current.x) + Math.abs(position.y - current.y)
            const bestMove = Math.abs(best.position.x - current.x) + Math.abs(best.position.y - current.y)
            // Pareto-safe: never trade a new overlap or a road the node sits on
            // for a straighter edge.
            const better =
              (score > best.score && penalty <= best.penalty + 1e-9) ||
              (score === best.score && penalty < best.penalty - 1e-9) ||
              (score === best.score && Math.abs(penalty - best.penalty) < 1e-9 && move < bestMove - 1e-9)
            if (better) best = { score, penalty, position }
          }
        }
        if (Math.abs(best.position.x - current.x) < EPS && Math.abs(best.position.y - current.y) < EPS) continue
        mapData[id].position = best.position
        changed = true
      }
      if (changed) aligned = true
      else break
    }
    if (!resolved && !aligned) break
  }

  overrides[region] = overrides[region] || {}
  const positions = overrides[region].positions || (overrides[region].positions = {})
  let regionMoved = 0
  for (const id of ids) {
    const before = start[id]
    const after = mapData[id].position
    if (Math.abs(before.x - after.x) < EPS && Math.abs(before.y - after.y) < EPS) continue
    overrides[region].positions[id] = { x: +after.x.toFixed(2), y: +after.y.toFixed(2) }
    regionMoved++
  }
  totalMoved += regionMoved
  if (regionMoved) console.log(`${region}: adjusted ${regionMoved} route node(s)`)
}

if (!totalMoved) {
  console.log('Roads already aligned; nothing to do.')
  process.exit(0)
}
console.log(`Adjusted ${totalMoved} route node(s) across ${targets.length} region(s).`)
if (DRY) process.exit(0)
fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2) + '\n')
console.log('Wrote map-layout-overrides.json; run apply-map-layout.cjs to write the data.')
