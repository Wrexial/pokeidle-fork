#!/usr/bin/env node
/**
 * Straighten Town Map nodes.
 *
 * The elbow roads read as straight only when both ends share an x or a y, so
 * near-aligned nodes are snapped onto shared lines (see lib/straighten.cjs).
 * Reads the committed map data with the current overrides applied, straightens
 * the chosen regions and writes the result into tools/map-layout-overrides.json
 * (write it through with tools/apply-map-layout.cjs). Idempotent.
 *
 * Usage:
 *   node tools/straighten-map.cjs [--regions=hoenn,johto] [--dry]
 *   node tools/straighten-map.cjs --all
 * (defaults to every region when neither is given)
 */
const fs = require('fs')
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const { readRegionDir, REGION_IDS } = require('./lib/region-data.cjs')
const { loadMapOverrides, applyMapOverrides, OVERRIDES_PATH } = require('./lib/map-overrides.cjs')
const { straightenCoords } = require('./lib/straighten.cjs')

const DRY = process.argv.includes('--dry')
const regionsArg = process.argv.find((arg) => arg.startsWith('--regions='))
const targets = regionsArg ? regionsArg.slice('--regions='.length).split(',') : REGION_IDS

const mapData = readRegionDir(path.join(DATA, 'map-data'))
applyMapOverrides(mapData)
const overrides = loadMapOverrides()

let moved = 0
for (const region of targets) {
  const ids = Object.keys(mapData).filter((id) => mapData[id].region === region && !mapData[id].hidden)
  if (!ids.length) {
    console.warn(`no nodes for region: ${region}`)
    continue
  }
  const positions = new Map(ids.map((id) => [id, { x: mapData[id].position.x, y: mapData[id].position.y }]))
  const straightened = straightenCoords(positions)
  overrides[region] = overrides[region] || {}
  const positionsOut = overrides[region].positions || (overrides[region].positions = {})
  for (const id of ids) {
    const before = positions.get(id)
    const after = straightened.get(id)
    if (before.x === after.x && before.y === after.y) continue
    positionsOut[id] = { x: after.x, y: after.y }
    moved++
  }
}

if (!moved) {
  console.log('Nodes already straight; nothing to do.')
  process.exit(0)
}
console.log(`Straightened ${moved} node(s) across ${targets.length} region(s).`)
if (DRY) process.exit(0)

fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2) + '\n')
console.log('Wrote map-layout-overrides.json; run apply-map-layout.cjs to write the data.')
