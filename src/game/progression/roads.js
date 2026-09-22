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
 * @param {string} fromId
 * @param {string} toId
 * @returns {{ x1: number, y1: number, x2: number, y2: number }[]}
 */
export function createRoads(fromId, toId) {
  const fromLocation = mapData[fromId],
    toLocation = mapData[toId],
    deltaX = Math.abs(toLocation.position.x - fromLocation.position.x),
    deltaY = Math.abs(toLocation.position.y - fromLocation.position.y)
  return deltaX >= deltaY
    ? [
        {
          x1: fromLocation.position.x,
          y1: fromLocation.position.y,
          x2: toLocation.position.x,
          y2: fromLocation.position.y,
        },
        {
          x1: toLocation.position.x,
          y1: fromLocation.position.y,
          x2: toLocation.position.x,
          y2: toLocation.position.y,
        },
      ]
    : [
        {
          x1: fromLocation.position.x,
          y1: fromLocation.position.y,
          x2: fromLocation.position.x,
          y2: toLocation.position.y,
        },
        {
          x1: fromLocation.position.x,
          y1: toLocation.position.y,
          x2: toLocation.position.x,
          y2: toLocation.position.y,
        },
      ]
}
