// Deterministic layout for a zone hub's sub-areas. Sub-areas are hidden from
// the region map and only drawn in the focused area view (#60), so their stored
// coordinates are free-form; this spaces them around the hub instead of the
// small clump many of them shipped in.
//
// Shared by `generate-regions.cjs` (a pass after the zones are built) and
// `apply-zone-layout.cjs` (which rewrites the committed map data).

/** Keep every node on-canvas. */
const MARGIN = 6
/** Vertical squash so the ring reads better on the wide map. */
const Y_SCALE = 0.8

/**
 * Positions for `count` sub-areas on a ring around `hub`. A ring is used rather
 * than a grid so no area can land on the hub itself (or its neighbours); the
 * radius grows with the count to keep the spacing roughly constant. The whole
 * ring is shifted back on-canvas for hubs near an edge.
 * @param {{ x: number, y: number }} hub
 * @param {number} count
 * @returns {{ x: number, y: number }[]}
 */
function spreadSubAreaPositions(hub, count) {
  if (count <= 0) return []
  const radius = Math.max(8, count * 1.5),
    points = []
  for (let index = 0; index < count; index++) {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2
    points.push({
      x: hub.x + Math.cos(angle) * radius,
      y: hub.y + Math.sin(angle) * radius * Y_SCALE,
    })
  }
  // Shift the ring back on-canvas without moving the hub itself.
  const xs = points.map((point) => point.x),
    ys = points.map((point) => point.y),
    shift = (min, max) =>
      min < MARGIN ? MARGIN - min : max > 100 - MARGIN ? 100 - MARGIN - max : 0,
    shiftX = shift(Math.min(...xs), Math.max(...xs)),
    shiftY = shift(Math.min(...ys), Math.max(...ys)),
    clamp = (value) => Math.max(5, Math.min(95, value))
  for (const point of points) {
    point.x += shiftX
    point.y += shiftY
    // Shifting for an edge hub can drag a point back onto the hub; push it out
    // again before rounding and clamping.
    let dx = point.x - hub.x,
      dy = point.y - hub.y,
      distance = Math.hypot(dx, dy)
    if (distance < 6) {
      if (distance < 0.001) {
        dx = 0
        dy = -1
        distance = 1
      }
      point.x = hub.x + (dx / distance) * 6
      point.y = hub.y + (dy / distance) * 6
    }
    point.x = +clamp(point.x).toFixed(2)
    point.y = +clamp(point.y).toFixed(2)
  }
  return points
}

module.exports = { spreadSubAreaPositions }
