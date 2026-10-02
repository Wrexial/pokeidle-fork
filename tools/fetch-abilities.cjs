#!/usr/bin/env node
/**
 * Fetch per-species abilities from PokeAPI.
 *
 * `pokemon-species.json` has no ability data, so Pokemon couldn't have one.
 * For each game species id we read the PokeAPI `/pokemon/{id}` entry and record
 * its normal abilities plus its hidden ability (when it has one), keyed by the
 * game's species keys.
 *
 * Responses are cached under tools/cache/ (shared with fetch-breeding-data.cjs),
 * so this is resumable and only hits the network once per id. Writes
 * public/data/ability-data.json.
 *
 * Usage: node tools/fetch-abilities.cjs
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
      const response = await fetch(url, { headers: { 'User-Agent': 'PokemonIdle-abilities/1.0' } })
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

/** PokeAPI's kebab-case to the game's camelCase keys. @param {string} name */
const toCamel = (name) => name.replace(/-([a-z])/g, (_, char) => char.toUpperCase())

/** @param {number} id */
async function abilitiesForId(id) {
  const pokemon = await cached(
    `https://pokeapi.co/api/v2/pokemon/${id}/`,
    `pokeapi-pokemon-${id}.json`
  )
  if (!pokemon?.abilities) return null
  const abilities = [],
    hidden = []
  for (const entry of pokemon.abilities) {
    const key = toCamel(entry.ability.name)
    ;(entry.is_hidden ? hidden : abilities).push(key)
  }
  return { abilities, hidden: hidden[0] ?? null }
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
      const data = await abilitiesForId(id)
      if (data && data.abilities.length > 0) byId[id] = data
      else console.warn(`no abilities for id ${id}`)
      if (++done % 100 === 0) console.log(`  ${done}/${ids.length}`)
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker))

  /** @type {Record<string, any>} */
  const byKey = {},
    // Ids with no PokeAPI pokemon entry (the Unown letters/!/?, which PokeAPI
    // models as *forms* of 201) are owned by add-unown-forms.cjs; keep their
    // hand-written rows instead of dropping them.
    abilityPath = path.join(DATA, 'ability-data.json'),
    previous = fs.existsSync(abilityPath)
      ? JSON.parse(fs.readFileSync(abilityPath, 'utf8'))
      : {}
  for (const [key, entry] of Object.entries(species)) {
    if (byId[entry.id]) byKey[key] = byId[entry.id]
    else if (previous[key]) byKey[key] = previous[key]
  }
  fs.writeFileSync(abilityPath, JSON.stringify(byKey, null, 2) + '\n')
  console.log(`wrote abilities for ${Object.keys(byKey).length} species (${ids.length} ids)`)
})().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})
