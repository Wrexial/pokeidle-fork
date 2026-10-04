// Hand-tuned Town Map layout overrides.
//
// The generator derives each region's node positions from the reference maps
// (REGION_MAP_LAYOUTS in generate-regions.cjs) and its added areas
// (lib/ordinary-areas.cjs), and its connections from the scraped
// region-maps.json. tools/map-editor.html lets a human nudge those around and
// remove extra roads; this module applies the resulting
// `{ region: { positions, roads } }` edits on top of either the generated or
// the committed data, so the tuning lives in one place
// (tools/map-layout-overrides.json) instead of in the generator tables.
const fs = require('fs')
const path = require('path')

const OVERRIDES_PATH = path.join(__dirname, '..', 'map-layout-overrides.json')

/** Read tools/map-layout-overrides.json (empty object when absent). */
function loadMapOverrides() {
  if (!fs.existsSync(OVERRIDES_PATH)) return {}
  return JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'))
}

/**
 * Apply the overrides to a merged `mapData` object in place.
 * @param {Record<string, any>} mapData location id -> MapLocation
 * @param {Record<string, any>} [overrides]
 * @returns {{ positions: number, removed: number, added: number, missing: string[] }}
 */
function applyMapOverrides(mapData, overrides = loadMapOverrides()) {
  let positions = 0
  let removed = 0
  let added = 0
  const missing = []
  for (const [, entry] of Object.entries(overrides)) {
    for (const [id, pos] of Object.entries(entry.positions || {})) {
      if (!mapData[id]) {
        missing.push(id)
        continue
      }
      if (mapData[id].position.x === pos.x && mapData[id].position.y === pos.y) continue
      mapData[id].position = { x: pos.x, y: pos.y }
      positions++
    }
    for (const [a, b] of entry.roads?.remove || []) {
      if (!mapData[a] || !mapData[b]) {
        missing.push(`${a}|${b}`)
        continue
      }
      if (!mapData[a].connections.includes(b)) continue
      mapData[a].connections = mapData[a].connections.filter((id) => id !== b)
      mapData[b].connections = mapData[b].connections.filter((id) => id !== a)
      removed++
    }
    for (const [a, b] of entry.roads?.add || []) {
      if (!mapData[a] || !mapData[b]) {
        missing.push(`${a}|${b}`)
        continue
      }
      if (mapData[a].connections.includes(b)) continue
      mapData[a].connections.push(b)
      mapData[b].connections.push(a)
      added++
    }
  }
  return { positions, removed, added, missing }
}

module.exports = { OVERRIDES_PATH, loadMapOverrides, applyMapOverrides }
