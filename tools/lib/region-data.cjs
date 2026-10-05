// Shared helpers for the split per-region data files.
//
// The map and encounter databases used to be single monolithic JSON files
// (map-data.json / encounter-data.json). They are now one file per region:
//
//   public/data/map-data/<region>.json       { locationId: MapLocation }
//   public/data/encounter-data/<region>.json { routeKey: EncounterData }
//
// Keeping them split makes a region's content editable in isolation. These
// helpers read the directory back into a single object (the shape the game
// consumes) and write it back out grouped by region.
const fs = require('fs')
const path = require('path')

/** Region ids in playable order — also the write order of the split files. */
const REGION_IDS = [
  'kanto',
  'johto',
  'hoenn',
  'sinnoh',
  'unova',
  'kalos',
  'alola',
  'galar',
  'paldea',
  // Post-game DLC expansions, promoted from Galar/Paldea zones to first-class
  // regions (see tools/apply-dlc-regions.cjs). They share their parent's
  // generation and sit after it in order.
  'isle-of-armor',
  'crown-tundra',
  'kitakami',
  'terarium',
  'sevii-islands',
]

/**
 * Read every `<region>.json` in a split data directory and merge them, in
 * region order, into one object.
 * @param {string} dir directory holding the split files
 */
function readRegionDir(dir) {
  const merged = {}
  for (const region of REGION_IDS) {
    const file = path.join(dir, `${region}.json`)
    if (!fs.existsSync(file)) continue
    Object.assign(merged, JSON.parse(fs.readFileSync(file, 'utf8')))
  }
  return merged
}

/**
 * Split an object into per-region files under `dir`.
 * @param {string} dir destination directory
 * @param {Record<string, any>} data the merged object
 * @param {(key: string, value: any) => string} [regionOf] resolves a key's
 *   region; defaults to `value.region ?? 'kanto'` (encounter buckets have no
 *   `region`, so pass a callback that looks it up via map data).
 */
function writeRegionDir(dir, data, regionOf) {
  fs.mkdirSync(dir, { recursive: true })
  /** @type {Record<string, Record<string, any>>} */
  const groups = Object.fromEntries(REGION_IDS.map((id) => [id, {}]))
  for (const [key, value] of Object.entries(data)) {
    const region = regionOf ? regionOf(key, value) : value.region ?? 'kanto'
    ;(groups[region] || (groups[region] = {}))[key] = value
  }
  for (const [region, group] of Object.entries(groups)) {
    fs.writeFileSync(path.join(dir, `${region}.json`), JSON.stringify(group, null, 1) + '\n')
  }
}

module.exports = { REGION_IDS, readRegionDir, writeRegionDir }
