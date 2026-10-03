#!/usr/bin/env node
/**
 * Assign a battle/town-map `biome` to every location.
 *
 * The generated map data only records a coarse base `background`
 * (grassland / beach / mountain / cave), so the battle scene and the Town Map
 * could only ever vary between those four. This pass classifies each location
 * (name keywords + its wild table's land types, with a small curated table for
 * iconic routes) and writes the richer biome. `biomeForLocation`
 * (src/data/ui.js) prefers it: the tinted biomes (forest / autumn / desert /
 * swamp / volcanic / tundra / ruins) pick a dedicated painted battle scene, and
 * the Town Map shades every biome.
 *
 * Idempotent. Usage: node tools/apply-biomes.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const { deriveBiome } = require('./lib/biomes.cjs')

const DATA = path.join(__dirname, '../public/data')
const mapDir = path.join(DATA, 'map-data')
const encounterDir = path.join(DATA, 'encounter-data')

const species = JSON.parse(fs.readFileSync(path.join(DATA, 'pokemon-species.json'), 'utf8'))
const buckets = {}
for (const file of fs.readdirSync(encounterDir))
  Object.assign(buckets, JSON.parse(fs.readFileSync(path.join(encounterDir, file), 'utf8')))

const dry = process.argv.includes('--dry')
const counts = {}
let changed = 0

for (const file of fs.readdirSync(mapDir)) {
  const map = JSON.parse(fs.readFileSync(path.join(mapDir, file), 'utf8'))
  let dirty = false
  for (const [id, location] of Object.entries(map)) {
    const biome = deriveBiome(
      { ...location, id },
      buckets[location.routeKey]?.encounters,
      species
    )
    counts[biome] = (counts[biome] ?? 0) + 1
    if (location.biome !== biome) {
      location.biome = biome
      dirty = true
      changed++
    }
  }
  if (dirty && !dry) fs.writeFileSync(path.join(mapDir, file), JSON.stringify(map, null, 1) + '\n')
}

console.log(`${dry ? '(dry run) ' : ''}biomes: ${changed} locations changed`)
console.log(counts)
