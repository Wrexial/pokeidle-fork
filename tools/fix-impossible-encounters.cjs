#!/usr/bin/env node
/**
 * One-time sync: step wild encounters back to a form that could exist at the
 * route's level.
 *
 * Every region is compressed onto a Lv. 5-75 curve, which can pull an evolved
 * species below the level it could actually evolve at (a Lv. 3 Chesnaught, a
 * Lv. 17 Salamence, a Lv. 9 Pelipper). This walks each encounter to the
 * most-evolved form valid at its level (see lib/evolution-levels.cjs), merges
 * any entries that collapse onto the same species, and updates the
 * `caughtOnRoute` unlock rules that named a replaced species.
 *
 * Idempotent: re-running changes nothing. Once the data is regenerated from
 * scratch this script is obsolete (generate-regions.cjs does the same pass).
 *
 * Usage:
 *   node tools/fix-impossible-encounters.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')
const { buildEvolutionLevels, stageForLevel } = require('./lib/evolution-levels.cjs')

const DATA = path.join(__dirname, '..', 'public', 'data')
const MAP_DIR = path.join(DATA, 'map-data')
const ENC_DIR = path.join(DATA, 'encounter-data')
const DRY = process.argv.includes('--dry')

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const levels = buildEvolutionLevels(read(path.join(DATA, 'evolution-data.json')), read(path.join(DATA, 'pokemon-species.json')))

let changed = 0
for (const file of fs.readdirSync(ENC_DIR).filter((f) => f.endsWith('.json'))) {
  const encPath = path.join(ENC_DIR, file),
    mapPath = path.join(MAP_DIR, file),
    enc = read(encPath),
    map = read(mapPath)
  let fileChanges = 0

  for (const bucket of Object.values(enc)) {
    /** @type {Map<string, any>} */
    const merged = new Map()
    for (const entry of bucket.encounters ?? []) {
      const next = stageForLevel(entry.speciesKey, entry.minLevel, levels)
      if (next !== entry.speciesKey) fileChanges++
      const existing = merged.get(next)
      if (existing) {
        existing.weight += entry.weight
        existing.minLevel = Math.min(existing.minLevel, entry.minLevel)
        existing.maxLevel = Math.max(existing.maxLevel, entry.maxLevel)
      } else merged.set(next, { ...entry, speciesKey: next })
    }
    bucket.encounters = [...merged.values()]
  }

  // A gate that named a replaced species would become unsatisfiable.
  for (const location of Object.values(map)) {
    const gate = location.unlock?.caughtOnRoute
    if (!gate) continue
    const bucket = enc[gate.routeKey],
      routeLevel = bucket?.encounters?.length
        ? Math.min(...bucket.encounters.map((entry) => entry.minLevel))
        : 1,
      species = [...new Set(gate.species.map((key) => stageForLevel(key, routeLevel, levels)))]
    if (
      species.length !== gate.species.length ||
      species.some((key, index) => key !== gate.species[index])
    ) {
      gate.species = species
      gate.count = species.length
      fileChanges++
    }
  }

  if (fileChanges) {
    changed += fileChanges
    console.log(`${file.replace(/\.json$/, '')}: ${fileChanges} change(s)`)
    if (!DRY) {
      fs.writeFileSync(encPath, JSON.stringify(enc, null, 1) + '\n')
      fs.writeFileSync(mapPath, JSON.stringify(map, null, 1) + '\n')
    }
  }
}
console.log(`${DRY ? 'would change' : 'changed'} ${changed} item(s)`)
