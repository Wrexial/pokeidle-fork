// Adds each species' weight (in kg) from the cached PokeAPI `/pokemon/{id}`
// responses to public/data/pokemon-species.json. Weight drives Heat Crash,
// Heavy Slam, Low Kick and Grass Knot. Idempotent; safe to re-run after adding
// species/form ids (run fetch-abilities.cjs first to populate the cache).
//
//   node tools/fetch-weights.cjs
const fs = require('fs')
const path = require('path')

const CACHE = path.join(__dirname, 'cache')
const SPECIES = path.join(__dirname, '..', 'public', 'data', 'pokemon-species.json')

const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

const species = readJSON(SPECIES)
let updated = 0,
  missing = 0
for (const entry of Object.values(species)) {
  const cachePath = path.join(CACHE, `pokeapi-pokemon-${entry.id}.json`)
  if (!fs.existsSync(cachePath)) {
    missing++
    continue
  }
  const raw = readJSON(cachePath).weight
  if (typeof raw !== 'number') continue
  // PokeAPI reports hectograms; the engine compares kilograms.
  const kg = raw / 10
  if (entry.weight !== kg) {
    entry.weight = kg
    updated++
  }
}
fs.writeFileSync(SPECIES, JSON.stringify(species, null, 2) + '\n')
console.log(`pokemon-species: updated ${updated} weight(s) (${missing} without a cached response)`)
