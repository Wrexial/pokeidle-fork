// One-off data patch: every Pokemon should be catchable in the wild, not just
// handed out by a minigame. A handful of species (Wimpod/Golisopod,
// Rellor/Rabsca and Slither Wing) were only reachable through Johto's
// Bug-Catching Contest, because their generation's routes never listed them.
// Give each line a native, thematically fitting route home instead; the finals
// then evolve from the route catch, so the chain stays repeatable.
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

// Where each bug-contest-only line belongs:
//  - Wimpod scuttles along Alola's beaches (Ula'ula Beach).
//  - Rellor is the Paldean desert beetle (the Asado Desert is West Province Area Two).
//  - Slither Wing is an ancient Paradox Pokemon from Area Zero, with the other
//    Scarlet paradoxes at Research Station 4.
/** @type {Record<string, Record<string, [string, number][]>>} */
const HABITATS = {
  alola: {
    'alola-ulaula-beach': [['wimpod', 12]],
  },
  paldea: {
    'paldea-west-province-area-two': [['rellor', 12]],
    'paldea-area-zero-station-four': [['slither wing', 12]],
  },
}

let added = 0
for (const [regionId, routes] of Object.entries(HABITATS)) {
  const file = path.join('encounter-data', `${regionId}.json`)
  const encounterData = read(file)
  for (const [routeKey, species] of Object.entries(routes)) {
    const bucket = encounterData[routeKey]
    if (!bucket) {
      console.warn(`apply-minigame-habitats: no encounter bucket for ${routeKey}`)
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

console.log(`apply-minigame-habitats: ${DRY ? 'would add' : 'added'} ${added} encounter(s)`)
