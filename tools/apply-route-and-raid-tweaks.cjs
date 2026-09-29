// One-off data patch for TODO #72 (Slakoth on Route 102) and #59 (Galarian
// birds back in Galar's legendary raid pool). The committed public/data is not
// idempotent with the generator, so this edits it directly.
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))
const write = (p, data, indent) =>
  fs.writeFileSync(path.join(root, p), JSON.stringify(data, null, indent) + '\n')

// --- #72: Slakoth on Hoenn Route 102 -----------------------------------------
const hoenn = read('public/data/encounter-data/hoenn.json')
const route102 = hoenn['hoenn-route-102']
if (!route102.encounters.some((entry) => entry.speciesKey === 'slakoth')) {
  route102.encounters.push({ speciesKey: 'slakoth', weight: 3, minLevel: 7, maxLevel: 9 })
  console.log('added slakoth to hoenn-route-102')
}
write('public/data/encounter-data/hoenn.json', hoenn, 1)

// --- #59: Galarian birds are legendaries -------------------------------------
const birds = ['g-articuno', 'g-zapdos', 'g-moltres']
const species = read('public/data/pokemon-species.json')
for (const key of birds) {
  if (species[key] && species[key].legendary !== true) {
    species[key].legendary = true
    console.log(`flagged ${key} legendary`)
  }
}
write('public/data/pokemon-species.json', species, 2)

const regions = read('public/data/regions.json')
const galar = regions.find((region) => region.id === 'galar')
const before = galar.raidOrdinaryPool.length
galar.raidOrdinaryPool = galar.raidOrdinaryPool.filter(
  (entry) => !birds.includes(entry.speciesKey)
)
for (const key of birds) {
  if (!galar.raidPool.some((entry) => entry.speciesKey === key))
    galar.raidPool.push({ speciesKey: key, level: 75 })
}
console.log(`galar ordinary pool ${before} -> ${galar.raidOrdinaryPool.length}`)
write('public/data/regions.json', regions, 1)

const galarEncounters = read('public/data/encounter-data/galar.json')
const raid = galarEncounters['galar-raid']
for (const key of birds) {
  if (!raid.encounters.some((entry) => entry.speciesKey === key))
    raid.encounters.push({ speciesKey: key, weight: 1, minLevel: 75, maxLevel: 75 })
}
write('public/data/encounter-data/galar.json', galarEncounters, 1)
