#!/usr/bin/env node
/**
 * Apply the hand-tuned Town Map layout in tools/map-layout-overrides.json.
 *
 * Positions and road add/remove edits from the map editor
 * (tools/map-editor.html) are stored in tools/map-layout-overrides.json; this
 * data-only pass writes them onto the committed public/data/map-data files. Run
 * it last, after any regenerate (generate-regions.cjs) and the automatic road
 * passes (apply-road-cleanup / apply-road-reference / apply-zone-road-cleanup),
 * which would otherwise re-lay the graph.
 *
 * Idempotent.
 *
 * Usage: node tools/apply-map-layout.cjs [--dry]
 */
const path = require('path')

const DATA = path.join(__dirname, '../public/data')
const { readRegionDir, writeRegionDir } = require('./lib/region-data.cjs')
const { applyMapOverrides } = require('./lib/map-overrides.cjs')

const DRY = process.argv.includes('--dry')

const mapData = readRegionDir(path.join(DATA, 'map-data'))
const { positions, removed, added, missing } = applyMapOverrides(mapData)

for (const id of missing) console.warn(`override references unknown location: ${id}`)
if (positions + removed + added === 0) {
  console.log('Map layout overrides already applied; nothing to do.')
  process.exit(0)
}
console.log(`Applied ${positions} position(s), removed ${removed} road(s), added ${added} road(s).`)

if (DRY) process.exit(0)

writeRegionDir(path.join(DATA, 'map-data'), mapData)
