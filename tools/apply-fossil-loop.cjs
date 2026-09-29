// One-off data patch for the fossil loop (#50): the fossil final evolutions are
// no longer ordinary Raid Island finals, because the fossils (and the Pokemon
// they revive) are now sourced from the region gifts and the Sinnoh Underground
// mining minigame. The finals stay obtainable by evolving a revived fossil, and
// their refuge statics disappear automatically (those derive from
// `raidOrdinaryPool`). The committed public/data is not idempotent with the
// generator, so this edits it directly.
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))
const write = (p, data, indent) =>
  fs.writeFileSync(path.join(root, p), JSON.stringify(data, null, indent) + '\n')

const FOSSIL_FINALS = [
  'omastar',
  'kabutops',
  'aerodactyl',
  'cradily',
  'armaldo',
  'rampardos',
  'bastiodon',
  'carracosta',
  'archeops',
  'tyrantrum',
  'aurorus',
  'dracozolt',
  'arctozolt',
  'dracovish',
  'arctovish',
]

const regions = read('public/data/regions.json')
let removed = 0
for (const region of regions) {
  if (!Array.isArray(region.raidOrdinaryPool)) continue
  const before = region.raidOrdinaryPool.length
  region.raidOrdinaryPool = region.raidOrdinaryPool.filter(
    (entry) => !FOSSIL_FINALS.includes(entry.speciesKey)
  )
  removed += before - region.raidOrdinaryPool.length
}
console.log(`removed ${removed} fossil finals from raidOrdinaryPool`)
write('public/data/regions.json', regions, 1)
