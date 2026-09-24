#!/usr/bin/env node
/**
 * One-time sync: add missing party-level gates to the committed region data.
 *
 * `generate-regions.cjs` now runs a final pass that gives a route a
 * `partyLevel` gate when its wilds jump far above the area that unlocks it, so
 * a high-level branch (Paldea's province areas, Alola's island hubs) can't be
 * entered under-levelled. The committed `public/data` predates that pass, and
 * running the full generator today would also churn unrelated content (random
 * trainer teams, raid pools, re-levelled Kanto encounters), so this patches
 * just the affected `unlock.partyLevel` fields.
 *
 * It is idempotent: re-running only touches routes whose gate is still too low.
 * Once the data is regenerated from scratch this script is obsolete.
 *
 * Usage:
 *   node tools/apply-unlock-level-gates.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MAP_DIR = path.join(ROOT, 'public', 'data', 'map-data')
const ENC_DIR = path.join(ROOT, 'public', 'data', 'encounter-data')
const LEVEL_MIN = 5
const LEVEL_GATE_GAP = 12
const LEVEL_GATE_BUFFER = 6
const DRY = process.argv.includes('--dry')

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

let changed = 0
for (const file of fs.readdirSync(MAP_DIR).filter((f) => f.endsWith('.json'))) {
  const region = file.replace(/\.json$/, '')
  const map = read(path.join(MAP_DIR, file))
  const enc = read(path.join(ENC_DIR, file))
  const bucketLevel = (id) => {
    const owner = map[id],
      encounters = owner?.routeKey ? enc[owner.routeKey]?.encounters : null
    return encounters?.length ? Math.min(...encounters.map((entry) => entry.minLevel)) : null
  }
  /** The highest wild level reachable before `id`, through the unlock graph. */
  const prerequisiteLevel = (id, selfIds, seen = new Set()) => {
    const direct = bucketLevel(id)
    if (direct != null) return direct
    if (selfIds.has(id) || seen.has(id)) return null
    seen.add(id)
    const unlock = map[id]?.unlock ?? {},
      parentIds = [
        ...(unlock.requires ?? []),
        ...(unlock.battlesAtLocation ?? []).map((rule) => rule.locationId),
        ...(unlock.caughtOnRoute ? [unlock.caughtOnRoute.routeKey] : []),
      ]
    let best = null
    for (const parentId of parentIds) {
      const level = prerequisiteLevel(parentId, selfIds, seen)
      if (level != null && (best == null || level > best)) best = level
    }
    return best
  }
  let regionChanges = 0
  for (const location of Object.values(map)) {
    if (location.type === 'raid' || !location.routeKey) continue
    const level = bucketLevel(location.id)
    if (level == null) continue
    const selfIds = new Set([location.id, location.zone].filter(Boolean)),
      unlock = location.unlock ?? {},
      prereqIds = [
        ...(unlock.requires ?? []),
        ...(unlock.battlesAtLocation ?? []).map((rule) => rule.locationId),
        ...(unlock.caughtOnRoute ? [unlock.caughtOnRoute.routeKey] : []),
      ]
    let prereqLevel = null
    for (const id of prereqIds) {
      const reached = prerequisiteLevel(id, selfIds)
      if (reached != null && (prereqLevel == null || reached > prereqLevel)) prereqLevel = reached
    }
    if (prereqLevel == null || level - prereqLevel <= LEVEL_GATE_GAP) continue
    const gate = Math.max(LEVEL_MIN, level - LEVEL_GATE_BUFFER)
    if ((unlock.partyLevel ?? 0) >= gate) continue
    location.unlock = { ...unlock, partyLevel: gate }
    regionChanges++
    changed++
    console.log(`${region}  ${location.id} -> partyLevel ${gate} (wilds Lv${level}, unlocks from ~Lv${prereqLevel})`)
  }
  if (regionChanges && !DRY)
    fs.writeFileSync(path.join(MAP_DIR, file), JSON.stringify(map, null, 1) + '\n')
}
console.log(`${DRY ? 'would change' : 'changed'} ${changed} unlock rule(s)`)
