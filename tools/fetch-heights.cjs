#!/usr/bin/env node
/**
 * Adds each species' height (in metres) from PokeAPI to
 * public/data/pokemon-species.json, so the size system can scale an
 * individual's rolled size by its species' baseline (see
 * src/game/pokemon/sizes.js).
 *
 * `fetch-weights.cjs` reads the PokeAPI responses cached by fetch-abilities.cjs;
 * this pass caches its own `/pokemon/{id}` responses under tools/cache/ too, so
 * it is resumable, only hits the network once per id, and can be run on its own.
 *
 * Usage: node tools/fetch-heights.cjs
 */
const fs = require('fs')
const path = require('path')

const CACHE = path.join(__dirname, 'cache')
const SPECIES = path.join(__dirname, '..', 'public', 'data', 'pokemon-species.json')

const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

fs.mkdirSync(CACHE, { recursive: true })

/** @param {string} url @param {string} file @returns {Promise<any | null>} */
async function cached(url, file) {
  const cachePath = path.join(CACHE, file)
  if (fs.existsSync(cachePath)) return readJSON(cachePath)
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'PokemonIdle-heights/1.0' } })
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json = await response.json()
      fs.writeFileSync(cachePath, JSON.stringify(json))
      await sleep(60)
      return json
    } catch {
      await sleep(500 * (attempt + 1))
    }
  }
  console.warn(`gave up on ${url}`)
  return null
}

;(async () => {
  const species = readJSON(SPECIES),
    ids = [...new Set(Object.values(species).map((/** @type {any} */ entry) => entry.id))]
      .filter((/** @type {number} */ id) => id > 0)
      .sort((a, b) => a - b)
  /** @type {Map<number, number>} */
  const heightById = new Map()
  let done = 0
  const queue = [...ids]

  async function worker() {
    while (queue.length) {
      const id = queue.shift()
      const pokemon = await cached(
        `https://pokeapi.co/api/v2/pokemon/${id}/`,
        `pokeapi-pokemon-${id}.json`
      )
      // PokeAPI reports decimetres; the game stores metres.
      if (typeof pokemon?.height === 'number') heightById.set(id, pokemon.height / 10)
      else console.warn(`no height for id ${id}`)
      if (++done % 100 === 0) console.log(`  ${done}/${ids.length}`)
    }
  }
  await Promise.all(Array.from({ length: 8 }, () => worker()))

  let updated = 0,
    missing = 0
  // Forms PokeAPI models only as forms of another Pokemon (the Unown letters)
  // carry a synthetic id and no direct entry, so fall back to the base species'
  // height (the part before the form affix).
  const baseHeight = (/** @type {string} */ key) => {
    const dash = key.indexOf('-')
    const base = dash > 0 ? species[key.slice(0, dash)] : null
    return typeof base?.height === 'number' ? base.height : null
  }
  for (const [key, entry] of /** @type {[string, any][]} */ (Object.entries(species))) {
    let height = heightById.get(entry.id)
    if (!Number.isFinite(height)) height = baseHeight(key)
    if (!Number.isFinite(height)) {
      missing++
      continue
    }
    if (entry.height !== height) {
      entry.height = height
      updated++
    }
  }
  fs.writeFileSync(SPECIES, JSON.stringify(species, null, 2) + '\n')
  console.log(`pokemon-species: updated ${updated} height(s) (${missing} without a PokeAPI response)`)
})().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})
