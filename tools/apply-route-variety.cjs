// Top up every route's wild encounter table so more Pokemon can show up there.
// The committed public/data is not idempotent with the region generator, so this
// edits the split encounter files directly; generate-regions.cjs runs the same
// pass (tools/lib/route-variety.cjs) on regeneration.
//
// Route-exclusive catch gates, starter lines, baby Pokemon and each region's
// Raid Island roster are left alone: this only spreads species that are already
// wild in the region onto more of its routes, matched by level.
//
// Idempotent: a table already at the target size is left as-is. Run with
// `--dry` to preview.
const fs = require('fs')
const path = require('path')

const { readRegionDir } = require('./lib/region-data.cjs')
const { buildEvolutionLevels } = require('./lib/evolution-levels.cjs')
const {
  buildWildPool,
  collectProtectedSpecies,
  enrichEncounters,
  MIN_ROUTE_SPECIES,
} = require('./lib/route-variety.cjs')

const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const read = (p) => JSON.parse(fs.readFileSync(path.join(DATA, p), 'utf8'))
const write = (p, value) =>
  fs.writeFileSync(path.join(DATA, p), `${JSON.stringify(value, null, 1)}\n`)

const DRY = process.argv.includes('--dry')

const GEN_STARTERS = {
  1: ['bulbasaur', 'charmander', 'squirtle'],
  2: ['chikorita', 'cyndaquil', 'totodile'],
  3: ['treecko', 'torchic', 'mudkip'],
  4: ['turtwig', 'chimchar', 'piplup'],
  5: ['snivy', 'tepig', 'oshawott'],
  6: ['chespin', 'fennekin', 'froakie'],
  7: ['rowlet', 'litten', 'popplio'],
  8: ['grookey', 'scorbunny', 'sobble'],
  9: ['sprigatito', 'fuecoco', 'quaxly'],
}

const species = read('pokemon-species.json')
const evolutionData = read('evolution-data.json')
const levels = buildEvolutionLevels(evolutionData, species)
const regions = read('regions.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))

/** Species that should never be seeded onto an ordinary route. */
const protectedSpecies = collectProtectedSpecies(
  evolutionData,
  Object.values(GEN_STARTERS).flat(),
  mapData
)

let totalRoutes = 0,
  totalAdded = 0
for (const region of regions) {
  const file = `encounter-data/${region.id}.json`
  if (!fs.existsSync(path.join(DATA, file))) continue
  const buckets = read(file),
    exclude = new Set(protectedSpecies)
  for (const entry of region.raidPool ?? []) exclude.add(entry.speciesKey)
  const pool = buildWildPool(buckets, mapData, exclude)
  let routes = 0,
    added = 0
  for (const [key, bucket] of Object.entries(buckets)) {
    if (mapData[key]?.type !== 'route') continue
    const result = enrichEncounters(bucket.encounters, pool, species, levels)
    if (result.added.length === 0) continue
    bucket.encounters = result.encounters
    routes++
    added += result.added.length
  }
  if (routes && !DRY) write(file, buckets)
  totalRoutes += routes
  totalAdded += added
  console.log(`${region.id}: ${routes} routes topped up, +${added} species`)
}
console.log(
  `${DRY ? '(dry run) ' : ''}route variety: ${totalRoutes} routes, +${totalAdded} encounters (target ${MIN_ROUTE_SPECIES} per route)`
)
