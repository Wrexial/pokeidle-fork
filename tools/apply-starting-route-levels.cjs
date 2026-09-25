#!/usr/bin/env node
/**
 * One-time sync: put every region's opening route on a gentle Lv. 3-5 band.
 *
 * `generate-regions.cjs` now lowers the first route of every region (it used to
 * only do Galar, at Lv. 2-3). The committed `public/data` predates that change
 * and running the full generator would churn unrelated content (random trainer
 * teams, raid pools, Kanto's encounters), so this patches just the entry
 * route's encounter levels (and the Lv. x-y in its description).
 *
 * The entry route is the one the region's entry town leads to: a direct route
 * connection, or — for zone-wrapped regions like Alola / Paldea — the entry
 * zone hub's `routeKey`. Kanto's Route 1 has a hand-written description with no
 * level band, so only the encounters change there.
 *
 * Idempotent: re-running only touches routes still on a different band. Once
 * the data is regenerated from scratch this script is obsolete.
 *
 * Usage:
 *   node tools/apply-starting-route-levels.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const MAP_DIR = path.join(DATA, 'map-data')
const ENC_DIR = path.join(DATA, 'encounter-data')
const MIN_LEVEL = 3
const MAX_LEVEL = 5
const DRY = process.argv.includes('--dry')

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const regions = read(path.join(DATA, 'regions.json'))

/** The first wild route a region's entry town leads to. */
function entryRouteId(entry, map) {
  const entryLocation = entry && map[entry]
  if (!entryLocation) return null
  const direct = (entryLocation.connections ?? []).find((id) => map[id]?.type === 'route')
  if (direct) return direct
  const zone = (entryLocation.connections ?? []).find((id) => map[id]?.type === 'zone')
  if (!zone) return null
  return map[zone]?.routeKey ?? map[zone]?.subAreas?.[0]?.id ?? null
}

let changed = 0
for (const region of regions) {
  const mapPath = path.join(MAP_DIR, `${region.id}.json`),
    encPath = path.join(ENC_DIR, `${region.id}.json`)
  if (!fs.existsSync(mapPath) || !fs.existsSync(encPath)) continue
  const map = read(mapPath),
    enc = read(encPath),
    routeId = entryRouteId(region.entry, map),
    location = routeId ? map[routeId] : null
  if (!location?.routeKey) continue
  // The entry route, plus any starting area gated on it that currently sits
  // below the band (Galar's Slumbering Weald, which inherited Lv. 2-3 from the
  // old Galar-only pass). Alola's later Route 3 is also gated on Route 1 but
  // already sits far above the band, so it is left alone.
  const startingIds = [routeId]
  for (const candidate of Object.values(map))
    if (
      candidate.type === 'route' &&
      candidate.id !== routeId &&
      (candidate.unlock?.battlesAtLocation ?? []).some((rule) => rule.locationId === routeId) &&
      (enc[candidate.routeKey]?.encounters?.[0]?.minLevel ?? MIN_LEVEL) < MIN_LEVEL
    )
      startingIds.push(candidate.id)
  let regionChanges = 0,
    descriptionChanged = false
  for (const startId of startingIds) {
    const startLocation = map[startId],
      bucket = startLocation.routeKey ? enc[startLocation.routeKey] : null
    if (!bucket?.encounters?.length) continue
    for (const entry of bucket.encounters)
      if (entry.minLevel !== MIN_LEVEL || entry.maxLevel !== MAX_LEVEL) {
        entry.minLevel = MIN_LEVEL
        entry.maxLevel = MAX_LEVEL
        regionChanges++
      }
    // Keep the "roam around Lv. x-y" description in step (Kanto has no band).
    if (startLocation.description) {
      const next = startLocation.description.replace(
        /Lv\. \d+-\d+/,
        `Lv. ${MIN_LEVEL}-${MAX_LEVEL}`
      )
      if (next !== startLocation.description) {
        startLocation.description = next
        descriptionChanged = true
      }
    }
  }
  if (regionChanges) {
    changed += regionChanges
    console.log(`${region.id}  ${startingIds.join(', ')} -> Lv. ${MIN_LEVEL}-${MAX_LEVEL}`)
    if (!DRY) {
      fs.writeFileSync(encPath, JSON.stringify(enc, null, 1) + '\n')
      if (descriptionChanged) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1) + '\n')
    }
  }
}
console.log(`${DRY ? 'would change' : 'changed'} ${changed} encounter(s)`)
