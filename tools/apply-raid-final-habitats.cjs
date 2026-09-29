// One-off data patch for #61: the former ordinary Raid Island finals were
// parked as one-off refuge statics on each region's last route, which made them
// feel bolted on. Give each line a real, thematically fitting wild home instead,
// then drop the now-redundant `raidOrdinaryPool` roster that fed those statics.
//
// The committed public/data is not idempotent with the generator, so this edits
// it directly; generate-regions.cjs mirrors the same table on regeneration.
// Idempotent (`--dry` to preview).
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'public', 'data')
const DRY = process.argv.includes('--dry')

const read = (p) => JSON.parse(fs.readFileSync(path.join(DATA, p), 'utf8'))
const write = (p, data) => fs.writeFileSync(path.join(DATA, p), JSON.stringify(data, null, 1) + '\n')

// Where each former raid-only line belongs. Base stages are placed so the
// evolution chain (and its learnset) stays native and the species is
// repeatable; the finals then evolve from the route catch. Baby lines and
// Pokemon with a canonical gift / minigame source (Togepi, Cleffa, Smoochum,
// Magby, Beldum, Porygon) are deliberately left out: they come from breeding or
// their gift, so validate-data counts those sources instead.
/** @type {Record<string, Record<string, [string, number][]>>} */
const HABITATS = {
  kanto: {
    // Ice/Psychic, canonically in the Seafoam Islands ice cave.
    seafoamIslands: [['jynx', 2]],
  },
  johto: {
    // Natu/Unown live in and around the Ruins of Alph, just off Route 32.
    'johto-route-32': [
      ['natu', 3],
      ['unown', 1],
    ],
  },
  hoenn: {
    // Mawile is a Granite Cave native, reached from Route 106.
    'hoenn-route-106': [['mawile', 3]],
  },
  sinnoh: {
    // Aipom drops out of the honey trees on Route 205.
    'sinnoh-route-205': [['aipom', 2]],
    // Spiritomb still haunts the Hallowed Tower on Route 209.
    'sinnoh-route-209': [['spiritomb', 1]],
  },
  unova: {
    // The elemental monkey trio and Woobat belong to the Striaton / Pinwheel
    // Forest stretch.
    'unova-route-3': [
      ['pansage', 2],
      ['pansear', 2],
      ['panpour', 2],
      ['woobat', 2],
    ],
    // Drilbur and Yamask in the Desert Resort / Relic Castle sands.
    'unova-route-4': [
      ['drilbur', 2],
      ['yamask', 2],
    ],
    // Munna by the Dreamyard and the forested Route 6 for Cottonee.
    'unova-route-5': [['munna', 2]],
    'unova-route-6': [['cottonee', 2]],
    // Cryogonal on the Twist Mountain approach, Druddigon at Dragonspiral.
    'unova-route-8': [['cryogonal', 1]],
    'unova-route-15': [['druddigon', 1]],
    // Frillish in the late sea lanes.
    'unova-route-17': [['frillish', 2]],
  },
  kalos: {
    // Carbink in Reflection Cave, Pumpkaboo on the Melancolie Path.
    'kalos-route-11': [['carbink', 2]],
    'kalos-route-16': [['pumpkaboo', 2]],
  },
  galar: {
    // Indeedee-F is a Wild Area spawn before Glimwood Tangle.
    'galar-wild-area-rolling-fields': [['indeedee-f', 2]],
  },
}

let added = 0
for (const [regionId, routes] of Object.entries(HABITATS)) {
  const file = path.join('encounter-data', `${regionId}.json`)
  const encounterData = read(file)
  for (const [routeKey, species] of Object.entries(routes)) {
    const bucket = encounterData[routeKey]
    if (!bucket) {
      console.warn(`apply-raid-final-habitats: no encounter bucket for ${routeKey}`)
      continue
    }
    const minLevel = Math.min(...bucket.encounters.map((entry) => entry.minLevel))
    const maxLevel = Math.max(...bucket.encounters.map((entry) => entry.maxLevel))
    for (const [speciesKey, weight] of species) {
      if (bucket.encounters.some((entry) => entry.speciesKey === speciesKey)) continue
      bucket.encounters.push({ speciesKey, weight, minLevel, maxLevel })
      added++
      console.log(`${DRY ? 'would add' : 'added'} ${speciesKey} to ${routeKey} (Lv.${minLevel}-${maxLevel})`)
    }
  }
  if (!DRY) write(file, encounterData)
}

const regions = read('regions.json')
let dropped = 0
for (const region of regions) {
  if (!Array.isArray(region.raidOrdinaryPool)) continue
  dropped += region.raidOrdinaryPool.length
  delete region.raidOrdinaryPool
}
if (!DRY) write('regions.json', regions)

console.log(
  `apply-raid-final-habitats: ${DRY ? 'would add' : 'added'} ${added} encounter(s), ` +
    `${DRY ? 'would drop' : 'dropped'} ${dropped} ordinary raid pool entry(s)`
)
