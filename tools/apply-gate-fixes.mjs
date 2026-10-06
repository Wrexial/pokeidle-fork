#!/usr/bin/env node
/**
 * Data-only gate repairs (idempotent).
 *
 * 1. Alola's Poni Island hub was gated on `alola-gym-8` (Hapu), but Hapu stands
 *    *on* Poni Island — a deadlock the region could never open. Re-point the hub
 *    at the last trial before Poni (Nanu, the Ula'ula grand trial).
 * 2. `caughtOnRoute` "route exclusive" gates were generated from the encounter
 *    tables at the time, but later passes (route variety, ordinary areas, raid
 *    habitats, DLC/zone adds) spread several of those species onto other routes.
 *    Refresh every gate to the species that are still exclusive to its route (or
 *    drop the gate when the route no longer has a common exclusive), keeping the
 *    "catch the route exclusives" intent honest.
 *
 * Usage:
 *   node tools/apply-gate-fixes.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { readRegionDir } from './lib/region-data.cjs'
import { buildRouteExclusives } from './lib/gate-exclusives.mjs'
import { installGameData } from './lib/game-data.mjs'

const DATA = path.join(import.meta.dirname, '../public/data')
const DRY = process.argv.includes('--dry')
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))

installGameData()
const { regionalStarters } = await import('../src/data/config.js')

const species = read('pokemon-species.json')
const evolutionData = read('evolution-data.json')
const mapData = readRegionDir(path.join(DATA, 'map-data'))
const encounterData = readRegionDir(path.join(DATA, 'encounter-data'))

const starterBaseKeys = [...new Set(Object.values(regionalStarters).flat())]
const exclusiveByRoute = buildRouteExclusives({
  mapData,
  encounterData,
  species,
  evolutionData,
  starterBaseKeys,
})

/** @type {Set<string>} */
const changedRegions = new Set()
/** @param {string} locationId */
const regionOf = (locationId) => mapData[locationId]?.region ?? 'kanto'

// 1. Poni Island's deadlock: its gate named a trial that stands on the island.
const poni = mapData['alola-poni-island']
if (poni?.unlock) {
  const current = poni.unlock.gymsRequired ?? []
  if (JSON.stringify(current) !== JSON.stringify(['alola-grand-nanu'])) {
    poni.unlock.gymsRequired = ['alola-grand-nanu']
    changedRegions.add(regionOf('alola-poni-island'))
    console.log(`alola-poni-island: gymsRequired ${JSON.stringify(current)} -> ["alola-grand-nanu"]`)
  }
}

// 2. Refresh every route-exclusive catch gate to the current exclusives.
let refreshed = 0
let dropped = 0
for (const [locationId, location] of Object.entries(mapData)) {
  const gate = location.unlock?.caughtOnRoute
  if (!gate) continue
  const exclusives = exclusiveByRoute[gate.routeKey] ?? []
  const common = exclusives.filter((entry) => entry.common)
  const region = regionOf(locationId)
  if (common.length === 0) {
    delete location.unlock.caughtOnRoute
    changedRegions.add(region)
    dropped++
    console.log(`${locationId}: dropped caughtOnRoute (no route-exclusive species left on ${gate.routeKey})`)
    continue
  }
  const keys = exclusives.map((entry) => entry.key)
  // Keep the gate's hand-tuned ask (some gates deliberately want only one of
  // two forms), but never ask for more than the route's common exclusives:
  // a rare or night-only find should be a bonus, not a requirement.
  const count = Math.max(1, Math.min(gate.count ?? keys.length, common.length))
  if (JSON.stringify(gate.species) !== JSON.stringify(keys) || gate.count !== count) {
    location.unlock.caughtOnRoute = { routeKey: gate.routeKey, species: keys, count }
    changedRegions.add(region)
    refreshed++
    console.log(`${locationId}: exotics -> [${keys.join(', ')}] (count ${count})`)
  }
}

if (!DRY)
  for (const region of changedRegions) {
    const regionMap = Object.fromEntries(
      Object.entries(mapData).filter(([, location]) => (location.region ?? 'kanto') === region)
    )
    fs.writeFileSync(
      path.join(DATA, 'map-data', `${region}.json`),
      JSON.stringify(regionMap, null, 1) + '\n'
    )
  }
console.log(
  `${DRY ? 'would change' : 'changed'} ${changedRegions.size} region file(s): ${refreshed} gate(s) refreshed, ${dropped} dropped`
)
