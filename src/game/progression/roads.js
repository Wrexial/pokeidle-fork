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
      d: `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y}`,
    }
  })
}
