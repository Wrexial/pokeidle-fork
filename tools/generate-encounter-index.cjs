#!/usr/bin/env node
/**
 * Generate public/encounter-index.html — a self-contained, offline overview of
 * what spawns where in every region (location, species, level range, rate).
 *
 * It reads the split region data plus the species table, inlines a compact
 * payload into tools/encounter-index-template.html and writes the static page.
 * Re-run it whenever the region/encounter data changes.
 *
 * Usage: node tools/generate-encounter-index.cjs
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const TEMPLATE = path.join(__dirname, 'encounter-index-template.html')
const OUT = path.join(ROOT, 'public', 'encounter-index.html')

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

const species = read(path.join(DATA, 'pokemon-species.json'))
const regionMeta = read(path.join(DATA, 'regions.json'))

/** @type {Record<string, { id: number, name: string, types: string[] }>} */
const usedSpecies = {}
const speciesSeen = new Set()
/** @type {any[]} */
const regionsOut = []
let locationCount = 0

for (const region of [...regionMeta].sort((a, b) => a.order - b.order)) {
  const map = read(path.join(DATA, 'map-data', `${region.id}.json`))
  const encounters = read(path.join(DATA, 'encounter-data', `${region.id}.json`))
  const raidPool = region.raidPool ?? []

  const locations = []
  const ordered = Object.values(map).sort((a, b) => (a.unlockOrder ?? 0) - (b.unlockOrder ?? 0))
  for (const location of ordered) {
    // Raid islands keep their legendary pool in regions.json, everything else
    // points at an encounter bucket through routeKey.
    const bucket =
      location.type === 'raid'
        ? raidPool.map((entry) => ({
            speciesKey: entry.speciesKey,
            weight: 1,
            minLevel: entry.level,
            maxLevel: entry.level,
          }))
        : location.routeKey
          ? encounters[location.routeKey]?.encounters
          : null
    if (!bucket || bucket.length === 0) continue

    const entries = []
    for (const entry of bucket) {
      const info = species[entry.speciesKey]
      if (!info) continue
      usedSpecies[entry.speciesKey] = { id: info.id, name: info.name, types: info.types }
      speciesSeen.add(entry.speciesKey)
      entries.push({
        key: entry.speciesKey,
        weight: entry.weight,
        minLevel: entry.minLevel,
        maxLevel: entry.maxLevel,
      })
    }
    if (entries.length === 0) continue

    locations.push({
      id: location.id,
      name: location.name,
      type: location.type ?? 'route',
      encounters: entries,
    })
  }

  locationCount += locations.length
  regionsOut.push({
    id: region.id,
    name: region.name,
    generation: region.generation,
    locations,
  })
}

const payload = {
  generatedAt: new Date().toISOString(),
  totals: { regions: regionsOut.length, locations: locationCount, species: speciesSeen.size },
  species: usedSpecies,
  regions: regionsOut,
}

const template = fs.readFileSync(TEMPLATE, 'utf8')
const html = template
  .replace('__GENERATED_AT__', payload.generatedAt)
  // `<` is escaped so a stray "</script>" can never break out of the data block.
  .replace('__ENCOUNTER_DATA__', JSON.stringify(payload).replace(/</g, '\\u003c'))

fs.writeFileSync(OUT, html)
console.log(
  `wrote ${path.relative(ROOT, OUT)} — ${payload.totals.regions} regions, ` +
    `${payload.totals.locations} locations, ${payload.totals.species} species`
)
