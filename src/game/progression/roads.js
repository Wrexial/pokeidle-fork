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
 * How much two axis-aligned segments overlap (in map units). Perpendicular
 * segments, or segments on different lines, score 0.
 * @param {{ x: number, y: number }} a1 @param {{ x: number, y: number }} a2
 * @param {{ x: number, y: number }} b1 @param {{ x: number, y: number }} b2
 * @returns {number}
 */
function overlap(a1, a2, b1, b2) {
  const aHorizontal = Math.abs(a1.y - a2.y) < 0.01,
    bHorizontal = Math.abs(b1.y - b2.y) < 0.01
  if (aHorizontal !== bHorizontal) return 0
  if (aHorizontal) {
    if (Math.abs(a1.y - b1.y) > 0.01) return 0
    return Math.max(0, Math.min(Math.max(a1.x, a2.x), Math.max(b1.x, b2.x)) - Math.max(Math.min(a1.x, a2.x), Math.min(b1.x, b2.x)))
  }
  if (Math.abs(a1.x - b1.x) > 0.01) return 0
  return Math.max(0, Math.min(Math.max(a1.y, a2.y), Math.max(b1.y, b2.y)) - Math.max(Math.min(a1.y, a2.y), Math.min(b1.y, b2.y)))
}

/**
 * Lay out every road in a view, choosing each elbow to overlap the roads
 * already placed as little as possible. A single fixed rule (dominant axis
 * first) made several roads from one town share their first leg and read as one;
 * this breaks them apart without leaving the grid. Deterministic: edges are
 * processed in id order, so the same map always draws the same way.
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
  /** @type {{ x: number, y: number }[][]} */
  const placed = []
  return edges.map(({ key, from, to }) => {
    const a = mapData[from].position,
      b = mapData[to].position,
      candidates = elbows(a, b)
    let bestIndex = 0,
      bestScore = Infinity
    candidates.forEach((points, index) => {
      let score = 0
      for (let segment = 0; segment < points.length - 1; segment++)
        for (const other of placed)
          for (let otherSegment = 0; otherSegment < other.length - 1; otherSegment++)
            score += overlap(points[segment], points[segment + 1], other[otherSegment], other[otherSegment + 1])
      if (score < bestScore) {
        bestScore = score
        bestIndex = index
      }
    })
    const points = candidates[bestIndex]
    placed.push(points)
    return {
      from,
      to,
      key,
      d: `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y}`,
    }
  })
}
