// // Town-map road drawing and cooldown formatting. Split from game/progression.js.

import { mapData } from '../../data/gameData.js'

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatCooldown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1e3)),
    minutes = Math.floor(totalSeconds / 60),
    seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// The largest corner radius a road may round with, in world units (the map is
// a 100x100 viewBox). Kept small so a short elbow still reads as a corner and
// the right-angle grid the layout is built on is preserved.
const ROAD_CORNER_RADIUS = 2.4

/**
 * Clip a rounded corner radius to the shorter leg of the elbow, so the curve
 * never overshoots past either endpoint.
 * @param {number} ax @param {number} ay @param {number} cx @param {number} cy @param {number} bx @param {number} by
 * @returns {number}
 */
function cornerRadius(ax, ay, cx, cy, bx, by) {
  const leg1 = Math.hypot(cx - ax, cy - ay),
    leg2 = Math.hypot(bx - cx, by - cy)
  return Math.max(0, Math.min(ROAD_CORNER_RADIUS, leg1 / 2, leg2 / 2))
}

/**
 * An SVG path along the three elbow points with the corner rounded by a
 * quadratic curve. A degenerate (straight) elbow stays a straight line.
 * @param {{ x: number, y: number }[]} points
 * @returns {string}
 */
function roundedElbowPath(points) {
  const [a, corner, b] = points,
    radius = cornerRadius(a.x, a.y, corner.x, corner.y, b.x, b.y)
  if (radius < 0.05)
    return `M ${a.x} ${a.y} L ${corner.x} ${corner.y} L ${b.x} ${b.y}`
  // Unit vectors along each leg, then step `radius` back from the corner.
  const leg1 = Math.hypot(corner.x - a.x, corner.y - a.y) || 1,
    leg2 = Math.hypot(b.x - corner.x, b.y - corner.y) || 1,
    entryX = corner.x - ((corner.x - a.x) / leg1) * radius,
    entryY = corner.y - ((corner.y - a.y) / leg1) * radius,
    exitX = corner.x + ((b.x - corner.x) / leg2) * radius,
    exitY = corner.y + ((b.y - corner.y) / leg2) * radius
  return `M ${a.x} ${a.y} L ${entryX} ${entryY} Q ${corner.x} ${corner.y} ${exitX} ${exitY} L ${b.x} ${b.y}`
}

/**
 * The two right-angled candidate paths between two points: one turning at
 * `(x2, y1)`, the other at `(x1, y2)`.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {{ x: number, y: number }[][]}
 */
function elbows(a, b) {
  return [
    [
      { x: a.x, y: a.y },
      { x: b.x, y: a.y },
      { x: b.x, y: b.y },
    ],
    [
      { x: a.x, y: a.y },
      { x: a.x, y: b.y },
      { x: b.x, y: b.y },
    ],
  ]
}

/**
 * Lay out every road in a view. Each edge takes the dominant-axis elbow (the
 * direction it mostly travels), matching the original map style: this keeps
 * roads reading as roads rather than a grid of detours. The alternative would be
 * to dodge overlaps by flipping elbows, but that turns a dense region into a
 * circuit board, so overlap is handled by pruning the graph instead.
 * Deterministic: edges are processed in id order.
 * @param {string[]} locationIds the locations currently drawn
 * @returns {{ from: string, to: string, key: string, d: string }[]}
 */
export function createRoadPaths(locationIds) {
  const active = new Set(locationIds),
    /** @type {{ key: string, from: string, to: string }[]} */
    edges = [],
    seen = new Set()
  for (const id of locationIds) {
    for (const connectionId of mapData[id]?.connections ?? []) {
      if (!active.has(connectionId)) continue
      const key = [id, connectionId].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ key, from: id, to: connectionId })
    }
  }
  edges.sort((left, right) => left.key.localeCompare(right.key))
  return edges.map(({ key, from, to }) => {
    const a = mapData[from].position,
      b = mapData[to].position,
      horizontalFirst = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y),
      points = elbows(a, b)[horizontalFirst ? 0 : 1]
    return {
      from,
      to,
      key,
      d: roundedElbowPath(points),
    }
  })
}
