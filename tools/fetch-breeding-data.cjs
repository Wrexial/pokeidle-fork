#!/usr/bin/env node
/**
 * Fetch breeding data (gender rate + egg groups) for every species.
 *
 * `pokemon-species.json` has no gender or egg-group info, so breeding couldn't
 * respect them. For each game species id we resolve its PokeAPI *species* (form
 * ids map to their base species) and record `genderRate` (-1 = genderless,
 * 0 = always male, 8 = always female, else eighths female), `eggGroups`, and an
 * `undiscovered` flag.
 *
 * Responses are cached under tools/cache/, so this is resumable and only hits
 * the network once per id. Writes public/data/breeding-data.json keyed by the
 * game's species keys.
 *
 * Usage: node tools/fetch-breeding-data.cjs
 */
const fs = require('fs')
const path = require('path')

const CACHE = path.join(__dirname, 'cache')
const DATA = path.join(__dirname, '../public/data')
const species = JSON.parse(fs.readFileSync(path.join(DATA, 'pokemon-species.json'), 'utf8'))
fs.mkdirSync(CACHE, { recursive: true })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** @param {string} url @param {string} file @returns {Promise<any | null>} */
async function cached(url, file) {
  const cachePath = path.join(CACHE, file)
  if (fs.existsSync(cachePath)) return JSON.parse(fs.readFileSync(cachePath, 'utf8'))
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'PokemonIdle-breeding/1.0' } })
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json = await response.json()
      fs.writeFileSync(cachePath, JSON.stringify(json))
      await sleep(60)
      return json
    } catch (error) {
      await sleep(500 * (attempt + 1))
    }
  }
  console.warn(`gave up on ${url}`)
  return null
}

const speciesIdFromUrl = (/** @type {string} */ url) => Number(url.match(/\/(\d+)\/?$/)?.[1])

/** @param {number} id */
async function breedingForId(id) {
  let speciesId = id
  if (id > 1025) {
    const pokemon = await cached(`https://pokeapi.co/api/v2/pokemon/${id}/`, `pokeapi-pokemon-${id}.json`)
    if (!pokemon?.species?.url) return null
    speciesId = speciesIdFromUrl(pokemon.species.url)
  }
  let entry = await cached(
    `https://pokeapi.co/api/v2/pokemon-species/${speciesId}/`,
    `pokeapi-species-${speciesId}.json`
  )
  if (!entry && id <= 1025) {
    // A national-dex id that isn't a species id — resolve through /pokemon.
    const pokemon = await cached(`https://pokeapi.co/api/v2/pokemon/${id}/`, `pokeapi-pokemon-${id}.json`)
    if (!pokemon?.species?.url) return null
    speciesId = speciesIdFromUrl(pokemon.species.url)
    entry = await cached(
      `https://pokeapi.co/api/v2/pokemon-species/${speciesId}/`,
      `pokeapi-species-${speciesId}.json`
    )
  }
  if (!entry) return null
  const eggGroups = (entry.egg_groups ?? []).map((/** @type {any} */ group) => group.name)
  return {
    genderRate: entry.gender_rate,
    eggGroups,
    // PokeAPI files the "cannot breed" group as `no-eggs`.
    undiscovered: eggGroups.includes('no-eggs'),
  }
}

;(async () => {
  const ids = [...new Set(Object.values(species).map((/** @type {any} */ entry) => entry.id))]
    .filter((/** @type {number} */ id) => id > 0)
    .sort((a, b) => a - b)
  /** @type {Record<number, any>} */
  const byId = {}
  let done = 0
  const queue = [...ids]

  async function worker() {
    while (queue.length) {
      const id = queue.shift()
      const data = await breedingForId(id)
      if (data) byId[id] = data
      else console.warn(`no breeding data for id ${id}`)
      if (++done % 100 === 0) console.log(`  ${done}/${ids.length}`)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))

  /** @type {Record<string, any>} */
  const byKey = {},
    // Ids with no PokeAPI pokemon entry (the Unown letters) keep their
    // hand-written rows (see add-unown-forms.cjs) instead of being dropped.
    breedingPath = path.join(DATA, 'breeding-data.json'),
    previous = fs.existsSync(breedingPath)
      ? JSON.parse(fs.readFileSync(breedingPath, 'utf8'))
      : {}
  for (const [key, entry] of Object.entries(species)) {
    if (byId[entry.id]) byKey[key] = byId[entry.id]
    else if (previous[key]) byKey[key] = previous[key]
  }
  fs.writeFileSync(breedingPath, JSON.stringify(byKey, null, 1) + '\n')
  console.log(`wrote breeding data for ${Object.keys(byKey).length} species (${ids.length} ids)`)
})().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})
