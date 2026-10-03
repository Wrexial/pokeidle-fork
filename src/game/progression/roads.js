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
 * A small stable hash of an unordered pair of ids, used to give each road its
 * own bow direction. The sign must not depend on the order the edge is drawn in
 * (the canvas draws each edge once, but either endpoint can be `from`).
 * @param {string} fromId
 * @param {string} toId
 * @returns {number}
 */
function pairHash(fromId, toId) {
  const key = [fromId, toId].sort().join('|')
  let hash = 2166136261
  for (let index = 0; index < key.length; index++) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * The road path between two locations, as SVG path data on the 0-100 map grid.
 *
 * A quadratic curve rather than an L-shaped elbow: nearby roads used to stack on
 * the same horizontal/vertical lines and read as one. Each edge gets a small,
 * deterministic perpendicular bow (opposite-signed for different edges, mirrored
 * for the two ends via the unordered-pair hash) so parallel roads stay apart
 * while still starting and ending exactly on their nodes.
 * @param {string} fromId
 * @param {string} toId
 * @returns {{ d: string }[]}
 */
export function createRoads(fromId, toId) {
  const fromLocation = mapData[fromId],
    toLocation = mapData[toId]
  if (!fromLocation || !toLocation) return []
  const x1 = fromLocation.position.x,
    y1 = fromLocation.position.y,
    x2 = toLocation.position.x,
    y2 = toLocation.position.y,
    dx = x2 - x1,
    dy = y2 - y1,
    distance = Math.hypot(dx, dy) || 0.001,
    // Bow sideways, capped so long roads don't wander into other nodes.
    bow = Math.min(3, distance * 0.16) * (pairHash(fromId, toId) % 2 === 0 ? 1 : -1),
    cx = (x1 + x2) / 2 + (-dy / distance) * bow,
    cy = (y1 + y2) / 2 + (dx / distance) * bow
  return [{ d: `M ${x1} ${y1} Q ${cx.toFixed(3)} ${cy.toFixed(3)} ${x2} ${y2}` }]
}
