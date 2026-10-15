#!/usr/bin/env node
/**
 * Align Town Map roads by nudging nodes.
 *
 * The elbow roads only read as straight when their two ends share an x or a y.
 * Route nodes are interpolated from the connection graph (so they are the most
 * approximate and move first), but towns, zones, facilities, the league and
 * raids can also sit a hair off a neighbour's line, or on top of an unrelated
 * road. This pass nudges every visible node's x/y (within `TOL`) for the spot
 * that lines up the most of its edges, and separates overlapping nodes.
 *
 * It works in tiers so cheap moves happen first: routes, then the minor
 * anchors, then towns and zones. A move is only taken if it improves alignment
 * without creating a new overlap or parking the node on a road (Pareto-safe),
 * so an anchor is only ever nudged when a route cannot fix the edge. Moving a
 * zone hub re-lays its hidden sub-area ring around it.
 *
 * Reads the committed data and writes tools/map-layout-overrides.json (write it
 * through with tools/apply-map-layout.cjs). Idempotent.
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
const { spreadSubAreaPositions } = require('./lib/zone-layout.cjs')

const DRY = process.argv.includes('--dry')
const regionsArg = process.argv.find((arg) => arg.startsWith('--regions='))
const targets = regionsArg ? regionsArg.slice('--regions='.length).split(',') : REGION_IDS

/** How far a node may move on one axis while aligning (units). */
const TOL = 2.0
/** Coordinates closer than this count as sharing a line. */
const EPS = 0.01

/** Movement tiers, cheapest first. Each tier may move its own types. */
const TIERS = [
  ['route'],
  ['hideout', 'facility', 'league', 'raid'],
  ['town', 'zone'],
]

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
const samePoint = (p, q) => Math.abs(p.x - q.x) < EPS && Math.abs(p.y - q.y) < EPS

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

  // A zone hub whose sub-areas already sit on a ring is a generated zone: it
  // may move like anything else, and its sub-areas are re-laid around it. A hub
  // with a hand-authored layout (the Sevii Islands' island shapes, the Lumiose
  // plaza) is pinned so that layout survives.
  const ringZones = new Set()
  for (const id of ids) {
    const hub = mapData[id]
    if (hub.type !== 'zone' || !Array.isArray(hub.subAreas)) continue
    const subIds = hub.subAreas.map((subArea) => subArea.id).filter((subId) => mapData[subId])
    if (!subIds.length) continue
    const ring = spreadSubAreaPositions(hub.position, subIds.length)
    const offset = Math.max(
      ...subIds.map((subId, index) =>
        Math.hypot(
          mapData[subId].position.x - ring[index].x,
          mapData[subId].position.y - ring[index].y
        )
      )
    )
    if (offset <= 1) ringZones.add(id)
  }

  const movableIn = (tier) => {
    const types = new Set(TIERS.slice(0, tier + 1).flat())
    return (id) =>
      types.has(mapData[id].type) && (mapData[id].type !== 'zone' || ringZones.has(id))
  }

  // Separate overlaps and align roads together to a fixpoint: the resolver can
  // nudge a node off its line, and the Pareto-safe search puts it back. Each
  // tier may move its own types plus every cheaper one.
  for (let tier = 0; tier < TIERS.length; tier++) {
    const movable = movableIn(tier)
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
            const aMoves = movable(ids[i])
            const bMoves = movable(ids[j])
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

      // Local search: pick the node x/y (within TOL of its own) that lines up
      // the most neighbour edges.
      let aligned = false
      for (let sweep = 0; sweep < 12; sweep++) {
        let changed = false
        for (const id of ids) {
          if (!movable(id)) continue
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
            neighbours.reduce(
              (count, neighbour) => count + (sharesLine(position, mapData[neighbour].position) ? 1 : 0),
              0
            )
          let best = {
            score: scoreAt(current),
            penalty: positionPenalty(id, current, ids, edges),
            position: current,
          }
          for (const x of xs) {
            for (const y of ys) {
              if (Math.abs(x - current.x) > TOL || Math.abs(y - current.y) > TOL) continue
              const position = { x: clamp(x), y: clamp(y) }
              const score = scoreAt(position)
              const penalty = positionPenalty(id, position, ids, edges)
              const move = Math.abs(position.x - current.x) + Math.abs(position.y - current.y)
              const bestMove =
                Math.abs(best.position.x - current.x) + Math.abs(best.position.y - current.y)
              // Pareto-safe: never trade a new overlap or a road the node sits
              // on for a straighter edge.
              const better =
                (score > best.score && penalty <= best.penalty + 1e-9) ||
                (score === best.score && penalty < best.penalty - 1e-9) ||
                (score === best.score &&
                  Math.abs(penalty - best.penalty) < 1e-9 &&
                  move < bestMove - 1e-9)
              if (better) best = { score, penalty, position }
            }
          }
          if (samePoint(best.position, current)) continue
          mapData[id].position = best.position
          changed = true
        }
        if (changed) aligned = true
        else break
      }
      if (!resolved && !aligned) break
    }
  }

  overrides[region] = overrides[region] || {}
  const positions = overrides[region].positions || (overrides[region].positions = {})
  let regionMoved = 0
  const record = (id, position) => {
    if (samePoint(start[id], position)) return
    positions[id] = { x: +position.x.toFixed(2), y: +position.y.toFixed(2) }
    regionMoved++
  }
  for (const id of ids) record(id, mapData[id].position)
  // A moved zone hub drags its hidden sub-area ring with it.
  for (const id of ids) {
    const hub = mapData[id]
    if (hub.type !== 'zone' || !ringZones.has(id) || !Array.isArray(hub.subAreas)) continue
    const subIds = hub.subAreas.map((subArea) => subArea.id).filter((subId) => mapData[subId])
    const ring = spreadSubAreaPositions(hub.position, subIds.length)
    subIds.forEach((subId, index) => {
      if (!ring[index]) return
      mapData[subId].position = ring[index]
      if (!samePoint(start[subId], ring[index])) {
        positions[subId] = { x: +ring[index].x.toFixed(2), y: +ring[index].y.toFixed(2) }
        regionMoved++
      }
    })
  }
  totalMoved += regionMoved
  if (regionMoved) console.log(`${region}: adjusted ${regionMoved} node(s)`)
}

if (!totalMoved) {
  console.log('Roads already aligned; nothing to do.')
  process.exit(0)
}
console.log(`Adjusted ${totalMoved} node(s) across ${targets.length} region(s).`)
if (DRY) process.exit(0)
fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2) + '\n')
console.log('Wrote map-layout-overrides.json; run apply-map-layout.cjs to write the data.')
