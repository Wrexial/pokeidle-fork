// Town Map node straightening.
//
// Elbow roads read as straight only when their two ends share an x or a y, so
// near-aligned nodes are snapped onto a common line. Coordinates are clustered
// per axis (values within TOLERANCE of a cluster centre join it) and each
// cluster collapses to its rounded mean. TOLERANCE is kept below the 0.5 grid
// step so the pass is idempotent: once values sit on the grid, distinct ones no
// longer merge.
const TOLERANCE = 0.4

/** @param {number[]} values @returns {Map<number, number>} */
function clusterAxis(values) {
  const sorted = [...values].sort((a, b) => a - b)
  /** @type {{ members: number[], centre: number }[]} */
  const clusters = []
  for (const value of sorted) {
    let best = null
    let bestDistance = Infinity
    for (const cluster of clusters) {
      const distance = Math.abs(cluster.centre - value)
      if (distance <= TOLERANCE && distance < bestDistance) {
        best = cluster
        bestDistance = distance
      }
    }
    if (best) {
      best.members.push(value)
      best.centre = best.members.reduce((sum, member) => sum + member, 0) / best.members.length
    } else {
      clusters.push({ members: [value], centre: value })
    }
  }
  const lookup = new Map()
  for (const cluster of clusters) {
    const target = Math.round(cluster.centre * 2) / 2
    for (const member of cluster.members) lookup.set(member, target)
  }
  return lookup
}

/**
 * Snap a region's node positions onto shared lines.
 * @param {Map<string, {x: number, y: number}>} positions
 * @returns {Map<string, {x: number, y: number}>}
 */
function straightenCoords(positions) {
  const entries = [...positions]
  const xs = clusterAxis(entries.map(([, p]) => p.x))
  const ys = clusterAxis(entries.map(([, p]) => p.y))
  return new Map(entries.map(([id, p]) => [id, { x: xs.get(p.x), y: ys.get(p.y) }]))
}

module.exports = { straightenCoords, TOLERANCE }
