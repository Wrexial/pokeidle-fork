// Strip the ordinary Raid Island finals from each region's raid encounter
// bucket, so the island's wild table is legendary-only. The species stay in
// `regions.json#raidOrdinaryPool` as the roster that src/game/gifts.js turns
// into reachable refuge static encounters (RAID_REFUGE_LOCATIONS). Idempotent
// (`--dry` to preview); obsolete once the data is regenerated from scratch.
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const DRY = process.argv.includes('--dry')

const regions = JSON.parse(fs.readFileSync(path.join(DATA, 'regions.json'), 'utf8'))
let total = 0
for (const region of regions) {
  const ordinary = new Set((region.raidOrdinaryPool ?? []).map((entry) => entry.speciesKey))
  if (ordinary.size === 0) continue
  const map = JSON.parse(fs.readFileSync(path.join(DATA, 'map-data', `${region.id}.json`), 'utf8'))
  const raidKey = Object.values(map).find((location) => location.type === 'raid')?.routeKey
  if (!raidKey) continue
  const encFile = path.join(DATA, 'encounter-data', `${region.id}.json`)
  const encounterData = JSON.parse(fs.readFileSync(encFile, 'utf8'))
  const bucket = encounterData[raidKey]
  if (!bucket) continue
  const kept = bucket.encounters.filter((encounter) => !ordinary.has(encounter.speciesKey))
  const removed = bucket.encounters.length - kept.length
  if (removed === 0) continue
  bucket.encounters = kept
  total += removed
  console.log(`${region.id}: ${DRY ? 'would remove' : 'removed'} ${removed} from ${raidKey}`)
  if (!DRY) fs.writeFileSync(encFile, JSON.stringify(encounterData, null, 1) + '\n')
}
console.log(
  total > 0
    ? `apply-raid-refugees: ${DRY ? 'would remove' : 'removed'} ${total} ordinary encounter(s)`
    : 'apply-raid-refugees: already applied'
)
